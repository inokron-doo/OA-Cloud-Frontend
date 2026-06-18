import { useState } from "react";
import type { IAnimal } from "../interface/MooHero";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";

function AnimalCard({ animal }: { animal: IAnimal }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-white p-4 pb-0 relative transition-all duration-500 border border-[#E5E7EB] rounded-[10px]">
            {/* Header Section (Always Visible) */}
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-semibold text-black">House id</p>
                        <p className="text-sm">{animal.housing_id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-black">Serial no</p>
                        <p className="text-sm">{animal.serial_no}</p>
                    </div>
                </div>
                <div>
                    <p className="text-sm font-semibold text-black">Animal id</p>
                    <p className="text-sm">{animal.unique_id}</p>
                </div>
                <div className="mt-5">
                    <p className="text-sm text-black font-semibold">Notes</p>
                    <p className="text-gray-700 text-sm">{animal.notes || "-"}</p>
                </div>
            </div>

            {/* Expanded Section */}
            {expanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 grid grid-cols-2 gap-2">
                    <div>
                        <p className="font-medium text-black">Produced on</p>
                        <p>{animal.produced_on}</p>
                    </div>
                    <div>
                        <p className="font-medium text-black">Radio id</p>
                        <p>{animal.radio_id}</p>
                    </div>
                    <div>
                        <p className="font-medium text-black">Radio channel</p>
                        <p>{animal.radio_channel}</p>
                    </div>
                    <div>
                        <p className="font-medium text-black">Pcb version</p>
                        <p>{animal.pcb_version}</p>
                    </div>
                    <div>
                        <p className="font-medium text-black">Software version</p>
                        <p className="truncate" title={animal.software_version}>{animal.software_version}</p>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <div className="flex justify-end mt-4 mb-1">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center justify-center p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors cursor-pointer"
                >
                    {expanded ? <IoMdArrowDropup size={24} /> : <IoMdArrowDropdown size={24} />}
                </button>
            </div>
        </div>
    );
}

export default AnimalCard;