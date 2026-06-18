import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { TbRefresh, TbServer } from "react-icons/tb";
import { toast } from 'react-hot-toast';
import { getFeedDevices, linkDevice, getLocationMapping, getBarnMapping, incomingBarnName, barnMapping } from '../../api/alert';
import { getFarms, getBarnsByFarm } from '../../api/barns';
import { getFeedLocation, updateFeedLocation, setFeedLocationVisibility, delFeedLocation } from '../../api/feed';
import type { FeedDevice, LocationMapping, BarnMapping, IncomingBarnName } from '../../interface/alerts';
import type { Farm, Barn, GetFeedingLocation } from '../../interface/feedManagement';

function EdgeDevice() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<FeedDevice[]>([]);
    const [farms, setFarms] = useState<Farm[]>([]);
    const [barns, setBarns] = useState<Barn[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<string>('');
    const [loadingBarns, setLoadingBarns] = useState(false);

    // New states for nested selections
    const [deviceSelections, setDeviceSelections] = useState<Record<string, {
        selectedBarnId?: string;
    }>>({});

    const [allMappings, setAllMappings] = useState<LocationMapping[]>([]);
    const [allBarnMappings, setAllBarnMappings] = useState<BarnMapping[]>([]);
    const [incomingNamesMap, setIncomingNamesMap] = useState<Record<string, IncomingBarnName[]>>({});
    const [selectedIncomingName, setSelectedIncomingName] = useState<Record<string, string>>({});

    // Auto-discovered feeding locations, keyed by barn_id. The ingest creates a
    // feeding location per device-sent key; here the user can rename them
    // (name is display-only, identity is the device key).
    const [locationsByBarn, setLocationsByBarn] = useState<Record<string, GetFeedingLocation[]>>({});
    const [locationNameDrafts, setLocationNameDrafts] = useState<Record<string, string>>({});
    const [savingLocationId, setSavingLocationId] = useState<string | null>(null);

    const loadLocationsForBarn = useCallback(async (barn_id: string) => {
        if (!barn_id) return;
        try {
            // include hidden so they can be managed (unhidden) here
            const data = await getFeedLocation(barn_id, true);
            const locations: GetFeedingLocation[] = data?.feeding_locations || [];
            setLocationsByBarn(prev => ({ ...prev, [barn_id]: locations }));
            setLocationNameDrafts(prev => {
                const next = { ...prev };
                for (const loc of locations) {
                    if (next[loc.feeding_location_id] === undefined) {
                        next[loc.feeding_location_id] = loc.name;
                    }
                }
                return next;
            });
        } catch (error) {
            console.error('Error loading feeding locations:', error);
        }
    }, []);

    const handleSaveLocationName = useCallback(async (location: GetFeedingLocation) => {
        const draft = (locationNameDrafts[location.feeding_location_id] ?? location.name).trim();
        if (!draft || draft === location.name) return;
        setSavingLocationId(location.feeding_location_id);
        try {
            await updateFeedLocation(location.feeding_location_id, draft);
            toast.success(t("edgeDevice.success_rename_location", "Feeding location renamed"));
            await loadLocationsForBarn(location.barn_id);
        } catch (error: any) {
            console.error('Error renaming feeding location:', error);
            toast.error(error.response?.data?.message || error.message || t("edgeDevice.err_rename_location", "Failed to rename feeding location"));
        } finally {
            setSavingLocationId(null);
        }
    }, [locationNameDrafts, loadLocationsForBarn, t]);

    const handleToggleLocationHidden = useCallback(async (location: GetFeedingLocation) => {
        setSavingLocationId(location.feeding_location_id);
        try {
            await setFeedLocationVisibility(location.feeding_location_id, !location.is_hidden);
            await loadLocationsForBarn(location.barn_id);
        } catch (error: any) {
            console.error('Error toggling feeding location visibility:', error);
            toast.error(error.response?.data?.error || error.message || t("edgeDevice.err_visibility", "Failed to update visibility"));
        } finally {
            setSavingLocationId(null);
        }
    }, [loadLocationsForBarn, t]);

    const handleDeleteLocation = useCallback(async (location: GetFeedingLocation) => {
        setSavingLocationId(location.feeding_location_id);
        try {
            await delFeedLocation(location.feeding_location_id);
            toast.success(t("edgeDevice.success_delete_location", "Feeding location deleted"));
            await loadLocationsForBarn(location.barn_id);
        } catch (error: any) {
            // 409 => has telemetry; tell the user to hide instead
            const detail = error.response?.data?.error;
            toast.error(detail || error.message || t("edgeDevice.err_delete_location", "Failed to delete feeding location"));
        } finally {
            setSavingLocationId(null);
        }
    }, [loadLocationsForBarn, t]);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [devicesData, farmsData, mappingsData, barnMappingsData] = await Promise.all([
                getFeedDevices(),
                getFarms(),
                getLocationMapping(),
                getBarnMapping()
            ]);
            setDevices(devicesData.devices);
            if (farmsData) {
                setFarms(farmsData);
                // One deployment = one organisation, so there is normally a
                // single farm. Auto-select it and skip the redundant picker.
                if (farmsData.length === 1) {
                    setSelectedFarmId(farmsData[0].farm_id);
                }
            }
            if (mappingsData && mappingsData.mappings) {
                setAllMappings(mappingsData.mappings);
            }
            if (barnMappingsData && barnMappingsData.mappings) {
                setAllBarnMappings(barnMappingsData.mappings);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            if (!silent) toast.error(t("edgeDevice.err_load_data"));
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const fetchBarns = useCallback(async (farm_id: string) => {
        if (!farm_id) return;
        setLoadingBarns(true);
        try {
            const data = await getBarnsByFarm(farm_id);
            if (data && data.barns) {
                setBarns(data.barns);
            }
        } catch (error) {
            console.error('Error fetching barns:', error);
            toast.error(t("edgeDevice.err_load_barns"));
        } finally {
            setLoadingBarns(false);
        }
    }, []);

    useEffect(() => {
        if (selectedFarmId) {
            fetchBarns(selectedFarmId);
        }
    }, [selectedFarmId, fetchBarns]);

    const onBarnSelect = useCallback(async (device: FeedDevice, barn_id: string) => {
        // Update selection state
        setDeviceSelections(prev => ({
            ...prev,
            [device.device_eui]: {
                ...prev[device.device_eui],
                selectedBarnId: barn_id,
            }
        }));

        // Link device to barn
        try {
            const linkResponse = await linkDevice({
                device_eui: device.device_eui,
                barn_id,
                display_name: device.display_name
            });
            toast.success(linkResponse?.message || t("edgeDevice.success_link"));

            // Get incoming barn names
            const incomingData = await incomingBarnName({
                device_eui: device.device_eui,
                barn_id,
                hours: 24
            });

            if (incomingData.incoming_barn_names) {
                setIncomingNamesMap(prev => ({
                    ...prev,
                    [device.device_eui]: incomingData.incoming_barn_names
                }));
            }

            // Show the feeding locations auto-discovered in this barn so the
            // user can rename them.
            loadLocationsForBarn(barn_id);

        } catch (error: any) {
            console.error('Error in barn selection flow:', error);
            toast.error(error.response?.data?.message || error.message || t("edgeDevice.err_link"));
        }
    }, [incomingBarnName, linkDevice, loadLocationsForBarn, t]);

    const handleIncomingBarnChange = async (device: FeedDevice, incoming_barn_name: string) => {
        if (!incoming_barn_name) return;

        const barn_id = deviceSelections[device.device_eui]?.selectedBarnId || device.barn_id;
        if (!barn_id) {
            toast.error(t("edgeDevice.err_select_barn_first"));
            return;
        }

        setSelectedIncomingName(prev => ({
            ...prev,
            [device.device_eui]: incoming_barn_name
        }));

        try {
            const response = await barnMapping({
                device_eui: device.device_eui,
                incoming_barn_name,
                barn_id
            });
            toast.success(response?.message || t("edgeDevice.success_mapping"));
            
            // Refresh data to show new mappings
            fetchData(true);
        } catch (error: any) {
            console.error('Error in barn mapping:', error);
            toast.error(error.response?.data?.message || error.message || t("edgeDevice.err_mapping"));
        }
    };


    const handleBarnChange = async (device: FeedDevice, barn_id: string) => {
        onBarnSelect(device, barn_id);
    };

    useEffect(() => {
        if (devices.length > 0) {
            devices.forEach(device => {
                if (device.barn_id && !deviceSelections[device.device_eui]) {
                    onBarnSelect(device, device.barn_id);
                }
            });
        }
    }, [devices, onBarnSelect, deviceSelections]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-12 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A63E]"></div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6">

            {/* Setup order guidance: Farm Calendar is the system of record;
                Inokron adds feeding monitoring on top. */}
            <div className="mb-6 p-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#075985]">
                <p className="font-semibold mb-1 text-sm">{t("edgeDevice.setup_guide_title", "Setting up feeding monitoring")}</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[13px]">
                    <li>{t("edgeDevice.setup_guide_1", "Create your farm and barns in Farm Calendar.")}</li>
                    <li>{t("edgeDevice.setup_guide_2", "Devices appear here automatically once they start sending data.")}</li>
                    <li>{t("edgeDevice.setup_guide_3", "Assign each device to a barn — feeding locations are then auto-discovered and you can rename them below.")}</li>
                </ol>
            </div>

            <div className="mb-6 pb-6 border-b border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {farms.length === 1 ? t("edgeDevice.farm", "Farm") : t("edgeDevice.select_farm")}
                </label>
                {farms.length === 0 ? (
                    <p className="text-sm text-[#667085]">{t("edgeDevice.no_farms", "No farm found. Create your farm and barns in Farm Calendar first, then return here to assign devices.")}</p>
                ) : farms.length === 1 ? (
                    <p className="text-base font-medium text-[#101828]">{farms[0].name}</p>
                ) : (
                    <select
                        value={selectedFarmId}
                        onChange={(e) => setSelectedFarmId(e.target.value)}
                        className="w-full md:w-1/2 py-2.5 px-4 bg-white border border-[#D0D5DD] text-[#344054] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E] transition-all cursor-pointer shadow-sm"
                    >
                        <option value="" disabled>{t("edgeDevice.choose_farm")}</option>
                        {farms.map((farm) => (
                            <option key={farm.farm_id} value={farm.farm_id}>
                                {farm.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-[#101828]">{t("edgeDevice.title")}</h3>
                    <p className="text-sm text-[#4A5565] mt-1">{t("edgeDevice.desc")}</p>
                </div>
                <button
                    onClick={() => fetchData()}
                    className="p-2 text-[#4A5565] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Refresh"
                >
                    <TbRefresh size={20} />
                </button>
            </div>

            {devices.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-[#667085]">{t("edgeDevice.no_devices")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {devices.map((device) => {
                        const currentMapping = allMappings.find(m => m.device_eui.toLowerCase() === device.device_eui.toLowerCase());
                        const currentBarnMapping = allBarnMappings.find(m => m.device_eui.toLowerCase() === device.device_eui.toLowerCase());
                        const barnIdForDevice = deviceSelections[device.device_eui]?.selectedBarnId || device.barn_id || "";
                        const discoveredLocations = barnIdForDevice ? (locationsByBarn[barnIdForDevice] || []) : [];

                        return (
                            <div key={device.device_id} className="p-4 border border-[#EAECF0] rounded-xl bg-white hover:shadow-md transition-shadow group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-[#ECFDF3] rounded-lg text-[#027A48]">
                                            <TbServer size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-[#101828]">{device.display_name}</h4>
                                            <p className="text-xs text-[#667085] font-mono">{device.device_eui}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                                            {t("edgeDevice.active")}
                                        </span>
                                        {(currentMapping || currentBarnMapping) && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                                                {t("edgeDevice.mapped")}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Current Mapping Info */}
                                {(currentMapping || currentBarnMapping) && (
                                    <div className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50 space-y-3">
                                        <h5 className="text-[10px] font-bold text-blue-700 uppercase tracking-tight mb-2">{t("edgeDevice.current_mapping")}</h5>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            {currentBarnMapping && (
                                                <div>
                                                    <p className="text-[9px] text-blue-500 uppercase font-semibold">{t("edgeDevice.barn")}</p>
                                                    <p className="text-xs font-medium text-blue-900">{currentBarnMapping.barn_name}</p>
                                                </div>
                                            )}
                                            {currentMapping && (
                                                <div>
                                                    <p className="text-[9px] text-blue-500 uppercase font-semibold">{t("edgeDevice.location")}</p>
                                                    <p className="text-xs font-medium text-blue-900">{currentMapping.feeding_location_name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 pt-3 border-t border-[#F2F4F7]">
                                    <p className="text-xs italic text-[#98A2B3]">{t("edgeDevice.select_barn_desc")}</p>
                                </div>

                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{t("edgeDevice.barn")}</label>
                                        <select
                                            className="w-full py-2 px-4 bg-white border border-[#D0D5DD] text-[#344054] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E] transition-all cursor-pointer"
                                            value={deviceSelections[device.device_eui]?.selectedBarnId || device.barn_id || ""}
                                            onChange={(e) => handleBarnChange(device, e.target.value)}
                                            disabled={loadingBarns}
                                            onMouseDown={() => {
                                                if (!selectedFarmId) {
                                                    toast(t("edgeDevice.err_select_farm"));
                                                }
                                            }}
                                        >
                                            <option value="" disabled>{loadingBarns ? t("edgeDevice.loading_barns") : t("edgeDevice.connect_barn")}</option>
                                            {barns.map((barn) => (
                                                <option key={barn.barn_id} value={barn.barn_id}>
                                                    {barn.barn_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Incoming Barn Name Select */}
                                    {incomingNamesMap[device.device_eui] && incomingNamesMap[device.device_eui].length > 0 && (
                                        <div className="mt-4">
                                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                {t("edgeDevice.incoming_barn_name")}
                                            </label>
                                            <select
                                                className="w-full py-2 px-4 bg-white border border-[#D0D5DD] text-[#344054] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E] transition-all cursor-pointer"
                                                value={selectedIncomingName[device.device_eui] || ""}
                                                onChange={(e) => handleIncomingBarnChange(device, e.target.value)}
                                            >
                                                <option value="" disabled>{t("edgeDevice.select_incoming_barn")}</option>
                                                {incomingNamesMap[device.device_eui].map((item, idx) => (
                                                    <option key={idx} value={item.incoming_barn_name}>
                                                        {item.incoming_barn_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Auto-discovered feeding locations in this barn. Name is a
                                        display label the user can edit; the device key is the identity. */}
                                    {barnIdForDevice && discoveredLocations.length > 0 && (
                                        <div className="mt-4">
                                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                                {t("edgeDevice.discovered_locations", "Feeding locations seen here")}
                                            </label>
                                            <div className="space-y-2">
                                                {discoveredLocations.map((loc) => {
                                                    const draft = locationNameDrafts[loc.feeding_location_id] ?? loc.name;
                                                    const unchanged = draft.trim() === loc.name || draft.trim() === "";
                                                    const busy = savingLocationId === loc.feeding_location_id;
                                                    return (
                                                        <div key={loc.feeding_location_id} className={`flex items-center gap-2 ${loc.is_hidden ? 'opacity-50' : ''}`}>
                                                            <input
                                                                type="text"
                                                                value={draft}
                                                                onChange={(e) => setLocationNameDrafts(prev => ({ ...prev, [loc.feeding_location_id]: e.target.value }))}
                                                                className="flex-1 py-1.5 px-3 bg-white border border-[#D0D5DD] text-[#344054] text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E] transition-all"
                                                            />
                                                            {loc.external_id && (
                                                                <span className="text-[10px] text-[#98A2B3] font-mono whitespace-nowrap" title={t("edgeDevice.device_key", "Device key")}>{loc.external_id}</span>
                                                            )}
                                                            {loc.is_hidden && (
                                                                <span className="text-[9px] font-bold uppercase tracking-wider text-[#98A2B3] whitespace-nowrap">{t("edgeDevice.hidden", "Hidden")}</span>
                                                            )}
                                                            <button
                                                                onClick={() => handleSaveLocationName(loc)}
                                                                disabled={busy || unchanged}
                                                                className="px-3 py-1.5 text-xs font-medium text-white bg-[#00A63E] rounded-lg hover:bg-[#008236] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                            >
                                                                {busy ? t("edgeDevice.saving", "Saving...") : t("edgeDevice.save", "Save")}
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleLocationHidden(loc)}
                                                                disabled={busy}
                                                                className="px-3 py-1.5 text-xs font-medium text-[#344054] border border-[#D0D5DD] rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap"
                                                            >
                                                                {loc.is_hidden ? t("edgeDevice.unhide", "Show") : t("edgeDevice.hide", "Hide")}
                                                            </button>
                                                            {/* Delete only when there is no telemetry history; otherwise hide. */}
                                                            {!loc.has_telemetry && (
                                                                <button
                                                                    onClick={() => handleDeleteLocation(loc)}
                                                                    disabled={busy}
                                                                    title={t("edgeDevice.delete", "Delete")}
                                                                    className="px-3 py-1.5 text-xs font-medium text-[#B42318] border border-[#FECDCA] rounded-lg hover:bg-[#FEF3F2] disabled:opacity-40 transition-colors cursor-pointer"
                                                                >
                                                                    {t("edgeDevice.delete", "Delete")}
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-[10px] text-[#98A2B3] mt-1 italic">{t("edgeDevice.discovered_locations_hint", "Auto-discovered from device data. The name is just a display label; the device key stays the identity. Locations with history can be hidden; empty ones can be deleted.")}</p>
                                        </div>
                                    )}

                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default EdgeDevice;