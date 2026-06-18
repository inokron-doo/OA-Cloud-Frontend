import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Barn } from "../interface/feedManagement";

interface BarnContextType {
    selectedBarn: Barn | null;
    setSelectedBarn: (barn: Barn | null) => void;
    selectedLocationId: string | null;
    setSelectedLocationId: (locationId: string | null) => void;
    selectedFarmId: string | null;
    setSelectedFarmId: (farm_id: string | null) => void;
    selectedMooheroId: string | null;
    setSelectedMooheroId: (moohero_id: string | null) => void;
    isLoading: boolean;
}

const BarnContext = createContext<BarnContextType | undefined>(undefined);

export const BarnProvider = ({ children }: { children: ReactNode }) => {
    const [selectedBarn, setSelectedBarnState] = useState<Barn | null>(null);
    const [selectedLocationId, setSelectedLocationIdState] = useState<string | null>(localStorage.getItem("selected_location_id"));
    const [selectedFarmId, setSelectedFarmIdState] = useState<string | null>(localStorage.getItem("selected_farm_id"));
    const [selectedMooheroId, setSelectedMooheroIdState] = useState<string | null>(localStorage.getItem("selected_moohero_id"));
    const [isLoading, setIsLoading] = useState(true);

    // Initial load from localStorage
    useEffect(() => {
        // We rely on Navbar to restore the full Barn object from the API list based on localStorage key
        // So here we just finish loading.

        setIsLoading(false);
    }, []);

    const setSelectedBarn = (barn: Barn | null) => {
        setSelectedBarnState(barn);
        if (barn) {
            localStorage.setItem("barn_name", barn.barn_name);
            if (barn.latitude && barn.longitude) {
                localStorage.setItem("lat", barn.latitude.toString());
                localStorage.setItem("lon", barn.longitude.toString());
            } else {
                localStorage.setItem("lat", "0");
                localStorage.setItem("lon", "0");
            }
            localStorage.setItem("selected_barn_id", barn.barn_id);
        } else {
            localStorage.removeItem("barn_name");
            localStorage.removeItem("lat");
            localStorage.removeItem("lon");
            localStorage.removeItem("selected_barn_id");
            localStorage.removeItem("selected_location_id");
            setSelectedLocationIdState(null);
        }
    };

    const setSelectedLocationId = (locationId: string | null) => {
        setSelectedLocationIdState(locationId);
        if (locationId) {
            localStorage.setItem("selected_location_id", locationId);
        } else {
            localStorage.removeItem("selected_location_id");
        }
    };

    const setSelectedFarmId = (farm_id: string | null) => {
        setSelectedFarmIdState(farm_id);
        if (farm_id) {
            localStorage.setItem("selected_farm_id", farm_id);
        } else {
            localStorage.removeItem("selected_farm_id");
        }
    };

    const setSelectedMooheroId = (moohero_id: string | null) => {
        setSelectedMooheroIdState(moohero_id);
        if (moohero_id) {
            localStorage.setItem("selected_moohero_id", moohero_id);
        } else {
            localStorage.removeItem("selected_moohero_id");
        }
    };

    return (
        <BarnContext.Provider value={{ selectedBarn, setSelectedBarn, selectedLocationId, setSelectedLocationId, selectedFarmId, setSelectedFarmId, selectedMooheroId, setSelectedMooheroId, isLoading }}>
            {children}
        </BarnContext.Provider>
    );
};

export const useBarn = () => {
    const context = useContext(BarnContext);
    if (context === undefined) {
        throw new Error("useBarn must be used within a BarnProvider");
    }
    return context;
};
