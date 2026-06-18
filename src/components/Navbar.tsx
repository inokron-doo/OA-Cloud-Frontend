import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TbWaveSawTool } from "react-icons/tb";
import { GoArrowRight } from "react-icons/go";
import { IoMdArrowDropdownCircle, IoMdArrowDropupCircle } from "react-icons/io";
import { getFarms, getBarnsByFarm } from "../api/barns";
import type { Farm, Barn } from "../interface/feedManagement";
import { useBarn } from "../context/BarnContext";
import LanguageSelector from "./LanguageSelector";

function Navbar() {

    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [farms, setFarms] = useState<Farm[]>([]);
    const [barns, setBarns] = useState<Barn[]>([]);
    const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(false);
    const [isLoadingBarns, setIsLoadingBarns] = useState<boolean>(false);

    // Context from your BarnContext
    const { selectedBarn, setSelectedBarn, selectedFarmId, setSelectedFarmId, setSelectedMooheroId } = useBarn();

    // 1. Initial Load: Farms fetch
    useEffect(() => {
        const fetchInitialFarms = async () => {
            try {
                setIsLoadingFarms(true);
                const data = await getFarms();
                setFarms(data);
            } catch (error) {
                console.error("Farms load error:", error);
            } finally {
                setIsLoadingFarms(false);
            }
        };
        fetchInitialFarms();
    }, []);

    // 2. Fetch Barns when Farm changes
    useEffect(() => {
        const fetchBarns = async () => {
            if (!selectedFarmId) {
                setBarns([]);
                return;
            }
            try {
                setIsLoadingBarns(true);
                const data = await getBarnsByFarm(selectedFarmId);
                const fetchedBarns = data.barns || [];
                setBarns(fetchedBarns);
                if (!selectedBarn) {
                    const savedBarnId = localStorage.getItem("selected_barn_id");
                    if (savedBarnId) {
                        const found = fetchedBarns.find((b: Barn) => b.barn_id === savedBarnId);
                        if (found) setSelectedBarn(found);
                    }
                }
            } catch (error) {
                console.error("Barns load error:", error);
                setBarns([]);
            } finally {
                setIsLoadingBarns(false);
            }
        };
        fetchBarns();
    }, [selectedFarmId]);

    // HANDLERS
    const handleFarmChange = (farmId: string) => {
        const farmObj = farms.find(f => f.farm_id === farmId);
        setSelectedFarmId(farmId);
        // moohero_id is only present when the farm is linked to a MooHero farm
        // (linked in Setup). Without a link, MooHero events simply don't load.
        if (farmObj && farmObj.moohero_id != null) {
            setSelectedMooheroId(farmObj.moohero_id.toString());
        } else {
            setSelectedMooheroId(null);
        }
        setSelectedBarn(null); // Barn clear karein
    };

    const handleBarnChange = (barnId: string) => {
        const barnObj = barns.find(b => b.barn_id === barnId) || null;
        setSelectedBarn(barnObj);
    };

    return (
        <nav className="w-full bg-white border-gray-200 border-b px-5 z-50 sticky top-0">
            <div className="flex items-center justify-between h-14 lg:h-19 w-full gap-5">

                <div className="text-green-700 flex items-center gap-2 lg:w-60">
                    <TbWaveSawTool size={40} className="text-green-500" />
                    <p className="text-xl font-bold hidden !text-green-500 sm:block">Inokron</p>
                </div>

                {/* --- Desktop View: Selectors --- */}
                <div className="hidden lg:flex flex-row items-center gap-2 flex-1 justify-start">
                    <select
                        value={selectedFarmId || ""}
                        onChange={(e) => handleFarmChange(e.target.value)}
                        disabled={isLoadingFarms}
                        className="px-4 py-2.5 text-base text-[#101828] rounded-[10px] bg-[#F9FAFB] border border-[#D1D5DC] outline-none cursor-pointer disabled:opacity-50"
                    >
                        <option value="">{isLoadingFarms ? t("navbar.loading_farm", "Loading Farm...") : t("navbar.select_Farm", "Select Farm")}</option>
                        {farms.map((farm) => (
                            <option key={farm.farm_id} value={farm.farm_id}>{farm.name}</option>
                        ))}
                    </select>

                    <span className="text-[#99A1AF]"><GoArrowRight size={22} /></span>

                    <div className="min-w-48">
                        {isLoadingBarns ? (
                            <div className="px-4 py-2.5 text-base border border-[#D1D5DC] bg-[#F9FAFB] rounded-[10px] animate-pulse w-full">{t("navbar.loading_barn", "Loading Barn...")}</div>
                        ) : (
                            <select
                                value={selectedBarn?.barn_id || ""}
                                onChange={(e) => handleBarnChange(e.target.value)}
                                disabled={!selectedFarmId}
                                className="w-full px-4 py-2.5 text-base rounded-[10px] border border-[#D1D5DC] bg-[#F9FAFB] text-[#101828] outline-none cursor-pointer disabled:opacity-50"
                            >
                                <option value="">{t("navbar.select_barn", "Select Barn")}</option>
                                {barns.map((b) => (
                                    <option key={b.barn_id} value={b.barn_id}>{b.barn_name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* --- Right Side: Selector pill (mobile) + Language --- */}
                <div className="flex items-center ml-auto lg:ml-0 mr-13 gap-2">
                    {/* Labeled pill: shows current barn, tap to expand farm/barn selectors */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden flex items-center gap-1 max-w-[150px] pl-3 pr-1.5 py-1.5 rounded-full bg-[#F9FAFB] border border-[#D1D5DC] text-[#101828] text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                        <span className="truncate">{selectedBarn?.barn_name || t("navbar.select_barn", "Select Barn")}</span>
                        {isMenuOpen
                            ? <IoMdArrowDropupCircle size={18} className="shrink-0 text-gray-500" />
                            : <IoMdArrowDropdownCircle size={18} className="shrink-0 text-gray-500" />}
                    </button>
                    <LanguageSelector />
                </div>
            </div>

            {/* --- Mobile Dropdown Menu --- */}
            <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}`}>
                <div className="flex flex-col gap-4 px-2">
                    <select
                        value={selectedFarmId || ""}
                        onChange={(e) => handleFarmChange(e.target.value)}
                        disabled={isLoadingFarms}
                        className="w-full px-4 py-3 text-sm text-[#101828] rounded-[10px] bg-[#F9FAFB] border border-[#D1D5DC] outline-none"
                    >
                        <option value="">{isLoadingFarms ? t("navbar.loading_farm", "Loading Farm...") : t("navbar.select_Farm", "Select Farm")}</option>
                        {farms.map((farm) => (
                            <option key={farm.farm_id} value={farm.farm_id}>{farm.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedBarn?.barn_id || ""}
                        onChange={(e) => handleBarnChange(e.target.value)}
                        disabled={!selectedFarmId}
                        className="w-full px-4 py-3 text-sm rounded-[10px] border border-[#D1D5DC] bg-[#F9FAFB] text-[#101828] outline-none"
                    >
                        <option value="">{isLoadingBarns ? t("navbar.loading_barn", "Loading Barn...") : t("navbar.select_barn", "Select Barn")}</option>
                        {barns.map((b) => (
                            <option key={b.barn_id} value={b.barn_id}>{b.barn_name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;