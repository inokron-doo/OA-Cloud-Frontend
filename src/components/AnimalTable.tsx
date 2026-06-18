import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { IAnimal } from "../interface/MooHero";
import { FiMapPin, FiEdit2 } from "react-icons/fi";
import AnimalDetailsModal from "./AnimalDetailsModal";

interface AnimalTableProps {
  animals: IAnimal[];
  loading: boolean;
  onRefresh: (updatedData?: any) => void;
  windowDays?: number;
}

export default function AnimalTable({ animals, loading, onRefresh, windowDays = 7 }: AnimalTableProps) {
  const { t } = useTranslation();
  const [selectedAnimal, setSelectedAnimal] = useState<IAnimal | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A63E]"></div>
      </div>
    );
  }

  if (!animals || animals.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 text-lg mb-2">{t("animalsPage.no_animals")}</p>
        <p className="text-gray-400 text-sm">{t("animalsPage.try_different")}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-[14px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-[13px] font-medium tracking-wide">
              <th className="px-6 py-4">Animal Details</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4 text-center">Collar ID</th>
              <th className="px-6 py-4 text-center">Health Events</th>
              <th className="px-6 py-4 text-center">Heat Events</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {animals.map((animal) => (
              <tr key={animal.id} className="hover:bg-emerald-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[#101828] font-semibold text-[14.5px]">
                      {animal.animal_name || "Unnamed"}
                    </span>
                    <span className="text-[#667085] text-[13px]">
                      {animal.animal_type || "Unknown Type"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[#475467] text-[13px]">
                    <FiMapPin className="text-[#9CA3AF]" size={15} />
                    <div className="flex flex-col">
                      <span>{animal.barn_name || "-"}</span>
                      <span className="text-[#9CA3AF] text-[12px]">{animal.feeding_location_name || "-"}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-700 text-[12.5px] font-mono">
                    {animal.moohero_collar_unique_id || "No Collar"}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-[13px] font-semibold border
                      ${(animal.health_events ?? 0) > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {animal.health_events ?? 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-[13px] font-semibold border
                      ${(animal.heat_events ?? 0) > 0 ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {animal.heat_events ?? 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setSelectedAnimal(animal)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="View Details & Edit"
                  >
                    <FiEdit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAnimal && (
        <AnimalDetailsModal
          animal={selectedAnimal}
          isOpen={!!selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
          onRefresh={onRefresh}
          windowDays={windowDays}
        />
      )}
    </div>
  );
}
