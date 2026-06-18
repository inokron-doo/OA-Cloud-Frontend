import { useState, useEffect, useMemo } from 'react';
import { useBarn } from '../context/BarnContext';
import { createAnimal, getFeedLocations, getFarmAnimals, type CreateAnimalPayload } from '../api/moohero';
import type { FeedingLocationAPI } from '../interface/feedManagement';
import { toast } from 'react-hot-toast';
import { useTranslation } from "react-i18next";

interface AddAnimalsProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    // Animal types the farm already uses — offered as datalist suggestions so common
    // types are one click instead of re-typing.
    knownTypes?: string[];
}

// A single row in the bulk-link table.
interface BulkRow {
    unique_id: string;      // MooHero collar id (empty = can't be linked)
    housing_id: string;
    idNum: string;          // MooHero official id (e.g. SI65419548), shown for context
    selected: boolean;
    name: string;
    status: 'idle' | 'ok' | 'error';
    error?: string;
}

type Mode = 'quick' | 'bulk';

// MooHero exposes a short animal name (ear-tag, e.g. "442") and an official id_num,
// nested under animal_assignment.animal. Use the name as the default local name.
const mooName = (a: any): string => a?.animal_assignment?.animal?.name != null ? String(a.animal_assignment.animal.name) : '';
const mooIdNum = (a: any): string => a?.animal_assignment?.animal?.id_num != null ? String(a.animal_assignment.animal.id_num) : '';

function AddAnimals({ isOpen, onClose, onSuccess, knownTypes = [] }: AddAnimalsProps) {
    const { t } = useTranslation();
    const { selectedMooheroId, selectedFarmId } = useBarn();

    const [mode, setMode] = useState<Mode>('quick');

    const [formData, setFormData] = useState<CreateAnimalPayload>({
        animal_name: '',
        barn_id: '',
        moohero_collar_unique_id: '',
        feeding_location_id: '',
        animal_type: ''
    });
    const [addAnother, setAddAnother] = useState(true);

    const [allLocations, setAllLocations] = useState<FeedingLocationAPI[]>([]);
    const [farmAnimals, setFarmAnimals] = useState<any[]>([]);
    const [selectedHousingId, setSelectedHousingId] = useState<string | number>('');
    const [loading, setLoading] = useState(false);

    // Bulk state
    const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
    const [bulkLocationId, setBulkLocationId] = useState('');
    const [bulkType, setBulkType] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAllFeedingLocations();
            if (selectedMooheroId) {
                fetchFarmAnimals();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selectedMooheroId, selectedFarmId]);

    // Seed the bulk table whenever the MooHero animal list changes.
    useEffect(() => {
        setBulkRows(farmAnimals.map(a => {
            const housing = a.housing_id != null ? String(a.housing_id) : '';
            return {
                unique_id: a.unique_id || '',
                housing_id: housing,
                idNum: mooIdNum(a),
                selected: false,
                // Default to the MooHero name, then housing id, then collar.
                name: mooName(a) || housing || (a.unique_id || ''),
                status: 'idle' as const,
            };
        }));
    }, [farmAnimals]);

    const fetchFarmAnimals = async () => {
        try {
            const data = await getFarmAnimals(selectedMooheroId!);
            setFarmAnimals(data.animals || []);
        } catch (error) {
            console.error("Failed to fetch farm animals", error);
        }
    };

    const fetchAllFeedingLocations = async () => {
        try {
            const data = await getFeedLocations();
            setAllLocations(data.feeding_locations || []);
        } catch (error) {
            console.error("Failed to fetch feeding locations", error);
            toast.error(t("addAnimals.err_loc_load"));
        }
    };

    // Locations are the single place to set placement — the barn is derived from the
    // chosen location, removing the redundant barn field.
    const barnIdForLocation = (locationId: string) =>
        allLocations.find(loc => loc.feeding_location_id === locationId)?.barn_id || '';

    const locationLabel = (loc: FeedingLocationAPI) =>
        loc.barn_name ? `${loc.barn_name} — ${loc.location_name}` : loc.location_name;

    // ---- Quick mode ----

    const handleQuickChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'feeding_location_id') {
            setFormData(prev => ({ ...prev, feeding_location_id: value, barn_id: barnIdForLocation(value) }));
        } else if (name === 'moohero_collar_unique_id') {
            const selectedAnimal = farmAnimals.find(animal => animal.unique_id === value);
            const housing = selectedAnimal?.housing_id != null ? String(selectedAnimal.housing_id) : '';
            setSelectedHousingId(housing);
            setFormData(prev => ({
                ...prev,
                moohero_collar_unique_id: value,
                // Pre-fill the name: MooHero's animal name first, then housing id.
                animal_name: prev.animal_name || mooName(selectedAnimal) || housing,
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleQuickSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.moohero_collar_unique_id) {
            toast.error(t("addAnimals.no_collar"));
            return;
        }
        setLoading(true);
        try {
            const payload: CreateAnimalPayload = {
                ...formData,
                barn_id: formData.barn_id || barnIdForLocation(formData.feeding_location_id),
                animal_name: formData.animal_name || String(selectedHousingId) || formData.moohero_collar_unique_id,
            };
            const res = await createAnimal(payload);
            toast.success(res.message || t("addAnimals.success_create"));
            onSuccess();
            if (addAnother) {
                // Keep placement + type so the next animal is just collar + name.
                setFormData(prev => ({
                    ...prev,
                    animal_name: '',
                    moohero_collar_unique_id: '',
                }));
                setSelectedHousingId('');
            } else {
                onClose();
            }
        } catch (error: any) {
            console.error("Failed to create animal", error);
            toast.error(error?.response?.data?.error || t("addAnimals.err_create"));
        } finally {
            setLoading(false);
        }
    };

    // ---- Bulk mode ----

    const selectedCount = useMemo(() => bulkRows.filter(r => r.selected).length, [bulkRows]);
    const allSelectable = bulkRows.filter(r => r.unique_id && r.status !== 'ok');
    const allSelected = allSelectable.length > 0 && allSelectable.every(r => r.selected);

    const toggleAll = () => {
        const next = !allSelected;
        setBulkRows(rows => rows.map(r => (r.unique_id && r.status !== 'ok') ? { ...r, selected: next } : r));
    };

    const updateRow = (idx: number, patch: Partial<BulkRow>) => {
        setBulkRows(rows => rows.map((r, i) => i === idx ? { ...r, ...patch } : r));
    };

    const handleBulkSubmit = async () => {
        if (!bulkLocationId) {
            toast.error(t("addAnimals.bulk_need_location"));
            return;
        }
        const targets = bulkRows
            .map((row, idx) => ({ row, idx }))
            .filter(({ row }) => row.selected && row.status !== 'ok');
        if (targets.length === 0) {
            toast.error(t("addAnimals.bulk_none"));
            return;
        }

        setLoading(true);
        const barn_id = barnIdForLocation(bulkLocationId);

        // Create each animal independently so one failure never blocks the rest.
        const results = await Promise.allSettled(targets.map(({ row }) => {
            if (!row.unique_id) {
                // Backup plan: a row with no collar can't be linked — surface it, don't call the API.
                return Promise.reject(new Error(t("addAnimals.bulk_no_collar")));
            }
            const payload: CreateAnimalPayload = {
                animal_name: row.name || row.housing_id || row.unique_id,
                moohero_collar_unique_id: row.unique_id,
                feeding_location_id: bulkLocationId,
                barn_id,
                animal_type: bulkType,
            };
            return createAnimal(payload);
        }));

        let ok = 0, fail = 0;
        setBulkRows(rows => {
            const next = [...rows];
            results.forEach((res, i) => {
                const { idx } = targets[i];
                if (res.status === 'fulfilled') {
                    ok++;
                    next[idx] = { ...next[idx], status: 'ok', selected: false, error: undefined };
                } else {
                    fail++;
                    const reason = (res.reason as any)?.response?.data?.error
                        || (res.reason as any)?.message
                        || t("addAnimals.err_create");
                    next[idx] = { ...next[idx], status: 'error', error: reason };
                }
            });
            return next;
        });

        setLoading(false);

        // Refresh the table so successes appear immediately, regardless of any failures.
        if (ok > 0) onSuccess();

        if (fail === 0) {
            toast.success(t("addAnimals.bulk_summary_ok", { ok }));
            onClose();
        } else {
            // Keep the modal open with failed rows flagged so the user can fix & retry.
            toast.error(t("addAnimals.bulk_summary_partial", { ok, fail }));
        }
    };

    const resetAndClose = () => {
        setFormData({ animal_name: '', barn_id: '', moohero_collar_unique_id: '', feeding_location_id: '', animal_type: '' });
        setSelectedHousingId('');
        setBulkLocationId('');
        setBulkType('');
        onClose();
    };

    if (!isOpen) return null;

    // Collars already linked in this session's bulk pass are hidden from the quick picker
    // to avoid obvious duplicates; the rest still rely on per-submit error handling.
    const linkedThisSession = new Set(bulkRows.filter(r => r.status === 'ok').map(r => r.unique_id));
    const quickCollarOptions = farmAnimals.filter(a => !linkedThisSession.has(a.unique_id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* Static Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0 relative">
                    <button
                        onClick={resetAndClose}
                        className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">{t("addAnimals.title")}</h2>

                    {/* Mode tabs */}
                    <div className="mt-4 inline-flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
                        <button
                            onClick={() => setMode('quick')}
                            className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${mode === 'quick' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t("addAnimals.mode_quick")}
                        </button>
                        <button
                            onClick={() => setMode('bulk')}
                            className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${mode === 'bulk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t("addAnimals.mode_bulk")}
                        </button>
                    </div>
                </div>

                {/* Shared animal type datalist */}
                <datalist id="animal-type-list">
                    {knownTypes.map(ty => <option key={ty} value={ty} />)}
                </datalist>

                {mode === 'quick' ? (
                    <>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="addAnimalForm" onSubmit={handleQuickSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("addAnimals.moohero_animal")}</label>
                                    <select
                                        name="moohero_collar_unique_id"
                                        value={formData.moohero_collar_unique_id}
                                        onChange={handleQuickChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">{t("addAnimals.select_moohero_animal")}</option>
                                        {quickCollarOptions.map(animal => (
                                            <option key={animal.id} value={animal.unique_id}>
                                                {mooName(animal) ? `${mooName(animal)} — ` : ''}{animal.unique_id} (housing_id: {animal.housing_id})
                                            </option>
                                        ))}
                                    </select>
                                    {!selectedMooheroId && (
                                        <p className="mt-1 text-xs text-amber-600">{t("addAnimals.no_moohero_animals")}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("addAnimals.animal_name")}</label>
                                    <input
                                        type="text"
                                        name="animal_name"
                                        value={formData.animal_name}
                                        onChange={handleQuickChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder={t("addAnimals.animal_name_placeholder")}
                                    />
                                    {selectedHousingId !== '' && (
                                        <p className="mt-1 text-xs text-gray-400">{t("addAnimals.housing_id")}: {selectedHousingId}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("addAnimals.feeding_location")}</label>
                                    <select
                                        name="feeding_location_id"
                                        value={formData.feeding_location_id}
                                        onChange={handleQuickChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">{t("addAnimals.select_feeding_location")}</option>
                                        {allLocations.map(loc => (
                                            <option key={loc.feeding_location_id} value={loc.feeding_location_id}>
                                                {locationLabel(loc)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("addAnimals.animal_type")}</label>
                                    <input
                                        type="text"
                                        name="animal_type"
                                        list="animal-type-list"
                                        value={formData.animal_type}
                                        onChange={handleQuickChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder={t("addAnimals.animal_type_placeholder")}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Static Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 flex items-center justify-between gap-3 rounded-b-xl">
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={addAnother}
                                    onChange={(e) => setAddAnother(e.target.checked)}
                                    className="rounded border-gray-300 text-[#00A63E] focus:ring-[#00A63E]/30"
                                />
                                {t("addAnimals.add_another_hint")}
                            </label>
                            <button
                                form="addAnimalForm"
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-[#00A63E] text-white rounded-lg hover:bg-[#00A63E]/90 transition-colors disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    addAnother ? t("addAnimals.save_add_another") : t("addAnimals.btn_create")
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                            <p className="text-sm text-gray-500">{t("addAnimals.bulk_intro")}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("addAnimals.feeding_location")}</label>
                                    <select
                                        value={bulkLocationId}
                                        onChange={(e) => setBulkLocationId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="">{t("addAnimals.select_feeding_location")}</option>
                                        {allLocations.map(loc => (
                                            <option key={loc.feeding_location_id} value={loc.feeding_location_id}>
                                                {locationLabel(loc)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("addAnimals.animal_type")}</label>
                                    <input
                                        type="text"
                                        list="animal-type-list"
                                        value={bulkType}
                                        onChange={(e) => setBulkType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder={t("addAnimals.animal_type_placeholder")}
                                    />
                                </div>
                            </div>

                            {bulkRows.length === 0 ? (
                                <div className="py-10 text-center text-sm text-gray-400">{t("addAnimals.no_moohero_animals")}</div>
                            ) : (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleAll}
                                            className="rounded border-gray-300 text-[#00A63E] focus:ring-[#00A63E]/30"
                                        />
                                        <span className="flex-1">{t("addAnimals.bulk_select_all")}</span>
                                        <span>{t("addAnimals.bulk_selected_count", { count: selectedCount })}</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-gray-100">
                                        {bulkRows.map((row, idx) => (
                                            <div key={`${row.unique_id || 'norow'}-${idx}`} className="flex items-center gap-3 px-3 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={row.selected}
                                                    disabled={!row.unique_id || row.status === 'ok'}
                                                    onChange={(e) => updateRow(idx, { selected: e.target.checked })}
                                                    className="rounded border-gray-300 text-[#00A63E] focus:ring-[#00A63E]/30 disabled:opacity-40"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <input
                                                        type="text"
                                                        value={row.name}
                                                        onChange={(e) => updateRow(idx, { name: e.target.value })}
                                                        disabled={!row.unique_id || row.status === 'ok'}
                                                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                                        placeholder={row.housing_id || row.unique_id}
                                                    />
                                                    <div className="mt-0.5 text-[11px] text-gray-400 truncate">
                                                        {row.unique_id
                                                            ? `${row.unique_id}${row.housing_id ? ` · housing ${row.housing_id}` : ''}${row.idNum ? ` · ${row.idNum}` : ''}`
                                                            : t("addAnimals.bulk_no_collar")}
                                                    </div>
                                                    {row.status === 'error' && row.error && (
                                                        <div className="mt-0.5 text-[11px] text-rose-600 truncate">{row.error}</div>
                                                    )}
                                                </div>
                                                {row.status === 'ok' && (
                                                    <span className="text-[11px] font-semibold text-emerald-600">{t("addAnimals.bulk_status_ok")}</span>
                                                )}
                                                {row.status === 'error' && (
                                                    <span className="text-[11px] font-semibold text-rose-600">!</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Static Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 flex items-center justify-end gap-3 rounded-b-xl">
                            <button
                                onClick={resetAndClose}
                                type="button"
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                            >
                                {t("addAnimals.btn_done")}
                            </button>
                            <button
                                onClick={handleBulkSubmit}
                                type="button"
                                disabled={loading || selectedCount === 0}
                                className="px-4 py-2 bg-[#00A63E] text-white rounded-lg hover:bg-[#00A63E]/90 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    t("addAnimals.bulk_link_btn", { count: selectedCount })
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AddAnimals;
