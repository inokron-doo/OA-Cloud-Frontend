import { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";

import { getAnimals } from '../api/moohero';
import type { IAnimal } from '../interface/MooHero';

function AnimalHealthCard({ passedBarnId, passedLocationId, animals: propAnimals, loading: propLoading }: {
    passedBarnId?: string | null,
    passedLocationId?: string | null,
    animals?: IAnimal[],
    loading?: boolean
}) {
    const { t } = useTranslation();
    // const { selectedBarn, selectedLocationId } = useBarn();
    const [animals, setAnimals] = useState<IAnimal[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (propAnimals !== undefined) {
            setAnimals(propAnimals);
            return;
        }
        const fetchHealthData = async () => {
            if (!passedBarnId) {
                setAnimals([]);
                return;
            }
            try {
                setLoading(true);
                const data = await getAnimals(passedBarnId, passedLocationId || undefined);
                setAnimals(data.animals || []);
            } catch (error) {
                console.error("Failed to fetch animal health data", error);
                setAnimals([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHealthData();
    }, [passedBarnId, passedLocationId, propAnimals]);


    // Helper functions to determine colors based on health score
    // const getHealthColor = (score: number | null) => {
    //     if (score === null) return 'text-gray-400';
    //     if (score >= 80) return 'text-green-600';
    //     if (score >= 50) return 'text-yellow-600';
    //     return 'text-red-600';
    // };

    // Returns background and border classes based on health score
    // const getHealthBg = (score: number | null) => {
    //     if (score === null) return 'bg-gray-50 text-gray-400 border-gray-100';
    //     if (score >= 80) return 'bg-green-50 text-green-600 border-green-100';
    //     if (score >= 50) return 'bg-yellow-50 text-yellow-600 border-yellow-100';
    //     return 'bg-red-50 text-red-600 border-red-100';
    // };

    // Returns background color for the health bar based on score
    // const getBarColor = (score: number | null) => {
    //     if (score === null) return 'bg-gray-200';
    //     if (score >= 80) return 'bg-green-500';
    //     if (score >= 50) return 'bg-yellow-500';
    //     return 'bg-red-500';
    // };

    const isLoading = propLoading !== undefined ? propLoading : loading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (!passedBarnId) {
        return (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">{t("animalHealthCard.select_farm_barn")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* <div className="flex items-center gap-2 mb-2">
                <LuActivity className="text-green-600" size={24} />
                <h3 className="text-xl font-bold text-gray-800 uppercase tracking-wide">Health Cards</h3>
            </div> */}

            {animals.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {animals.map((animal) => (
                        <div key={animal.id} className="bg-white border border-[#E5E7EB] rounded-[14px] p-4 relative overflow-hidden">
                            {/* Top Right Health Score Badge */}
                            {/* <div className={`absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full border text-sm font-bold ${getHealthBg(animal.health_score)} `}>
                                {animal.health_score ?? '--'}
                            </div> */}

                            {/* Header Section */}
                            <div className="space-y-1 mb-4">
                                <h4 className="text-base font-bold text-gray-900">{t("animalHealthCard.animal_name")} <span className="text-gray-800 font-medium">{animal.animal_name}</span></h4>
                                <p className="text-sm text-gray-500 font-medium">{t("animalHealthCard.animal_type")} <span className="text-gray-500 font-medium">{animal.animal_type}</span></p>
                            </div>

                            {/* Info Section */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-green-600">
                                    {t("animalHealthCard.collar_id")}
                                    <span className="text-sm font-semibold">{animal.moohero_collar_unique_id}</span>
                                </div>

                            </div>

                            {/* Health Bar Section */}
                            {/* <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                    <LuActivity size={18} />
                                    <span className="text-sm font-bold">Health Trend</span>
                                </div>

                                <div className="space-y-3 mt-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                                            <span>Overall Health</span>
                                            <span>{animal.health_score ?? 0}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h - full transition - all duration - 1000 ${getBarColor(animal.health_score)} `}
                                                style={{ width: `${animal.health_score ?? 0}% ` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">{t("animalHealthCard.no_animals")}</p>
                </div>
            )}
        </div>
    );
}

export default AnimalHealthCard;