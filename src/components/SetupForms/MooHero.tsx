import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { IoLinkOutline } from "react-icons/io5";
import { TbRefresh } from "react-icons/tb";
import { toast } from 'react-hot-toast';
import { getMooheroFarms, linkMooheroFarm, unlinkMooheroFarm } from '../../api/moohero';
import { getFarms } from '../../api/barns';
import type { Farm } from '../../interface/feedManagement';

interface MooheroFarm {
    moohero_id: number;
    farm_id: string | null;
    name: string;
}

function MooHero() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [notConfigured, setNotConfigured] = useState(false);
    const [mooheroFarms, setMooheroFarms] = useState<MooheroFarm[]>([]);
    const [localFarms, setLocalFarms] = useState<Farm[]>([]);
    const [selectedLocalFarm, setSelectedLocalFarm] = useState<Record<number, string>>({});
    const [busyId, setBusyId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const localFarmsData = await getFarms().catch(() => [] as Farm[]);
            const mooheroData = await getMooheroFarms();
            setLocalFarms(localFarmsData);
            setMooheroFarms(mooheroData);
            setNotConfigured(false);
        } catch (error) {
            console.error('Error loading MooHero farms:', error);
            setNotConfigured(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLink = async (farm: MooheroFarm) => {
        // Default to the only local farm when there is exactly one.
        const target = selectedLocalFarm[farm.moohero_id] || (localFarms.length === 1 ? localFarms[0].farm_id : "");
        if (!target) {
            toast.error(t("mooHeroLink.err_pick_farm", "Pick a local farm to link to"));
            return;
        }
        setBusyId(farm.moohero_id);
        try {
            await linkMooheroFarm(farm.moohero_id, target, farm.name);
            toast.success(t("mooHeroLink.success_link", "MooHero farm linked"));
            await fetchData();
        } catch (error: any) {
            console.error('Error linking MooHero farm:', error);
            toast.error(error.response?.data?.error || error.message || t("mooHeroLink.err_link", "Failed to link MooHero farm"));
        } finally {
            setBusyId(null);
        }
    };

    const handleUnlink = async (farm: MooheroFarm) => {
        setBusyId(farm.moohero_id);
        try {
            await unlinkMooheroFarm(farm.moohero_id);
            toast.success(t("mooHeroLink.success_unlink", "MooHero farm unlinked"));
            await fetchData();
        } catch (error: any) {
            console.error('Error unlinking MooHero farm:', error);
            toast.error(error.response?.data?.error || error.message || t("mooHeroLink.err_unlink", "Failed to unlink"));
        } finally {
            setBusyId(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A63E]"></div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h3 className="text-lg font-semibold text-[#101828]">{t('mooHeroLink.title', 'MooHero integration')}</h3>
                    <p className="text-sm text-[#4A5565] mt-1">{t('mooHeroLink.desc', 'Link a MooHero farm to your farm to pull in its animals and events.')}</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 text-[#4A5565] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Refresh"
                >
                    <TbRefresh size={20} />
                </button>
            </div>

            {notConfigured ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-4">
                    <p className="text-[#667085]">{t('mooHeroLink.not_configured', 'MooHero is not configured, or its credentials were rejected. Set MOOHERO_CLIENT_ID and MOOHERO_CLIENT_SECRET to enable it.')}</p>
                </div>
            ) : mooheroFarms.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-4">
                    <p className="text-[#667085]">{t('mooHeroLink.no_farms', 'No farms found in the MooHero account.')}</p>
                </div>
            ) : (
                <div className="space-y-3 mt-4">
                    {mooheroFarms.map((farm) => {
                        const linked = !!farm.farm_id;
                        const linkedName = localFarms.find(f => f.farm_id === farm.farm_id)?.name;
                        return (
                            <div key={farm.moohero_id} className="p-4 border border-[#EAECF0] rounded-xl flex flex-col md:flex-row md:items-center gap-3 justify-between">
                                <div>
                                    <p className="font-semibold text-[#101828]">{farm.name}</p>
                                    <p className="text-xs text-[#667085]">MooHero ID: {farm.moohero_id}</p>
                                </div>

                                {linked ? (
                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                                            {t('mooHeroLink.linked_to', 'Linked to')} {linkedName || t('mooHeroLink.your_farm', 'your farm')}
                                        </span>
                                        <button
                                            onClick={() => handleUnlink(farm)}
                                            disabled={busyId === farm.moohero_id}
                                            className="px-3 py-1.5 text-xs font-medium text-[#B42318] border border-[#FECDCA] rounded-lg hover:bg-[#FEF3F2] disabled:opacity-40 transition-colors cursor-pointer"
                                        >
                                            {t('mooHeroLink.unlink', 'Unlink')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {localFarms.length > 1 && (
                                            <select
                                                value={selectedLocalFarm[farm.moohero_id] || ""}
                                                onChange={(e) => setSelectedLocalFarm(prev => ({ ...prev, [farm.moohero_id]: e.target.value }))}
                                                className="py-2 px-3 bg-white border border-[#D0D5DD] text-[#344054] text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E]"
                                            >
                                                <option value="" disabled>{t('mooHeroLink.choose_farm', 'Choose farm')}</option>
                                                {localFarms.map(f => (
                                                    <option key={f.farm_id} value={f.farm_id}>{f.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        <button
                                            onClick={() => handleLink(farm)}
                                            disabled={busyId === farm.moohero_id || localFarms.length === 0}
                                            className="px-3 py-1.5 text-xs font-medium text-white bg-[#00A63E] rounded-lg hover:bg-[#008236] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <IoLinkOutline size={14} />
                                            {t('mooHeroLink.link', 'Link')}
                                            {localFarms.length === 1 ? ` → ${localFarms[0].name}` : ''}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {localFarms.length === 0 && (
                        <p className="text-xs text-[#98A2B3] italic">{t('mooHeroLink.no_local_farm', 'Create your farm in Farm Calendar first, then link a MooHero farm to it here.')}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default MooHero;
