import { GoClock } from "react-icons/go";
import { HiOutlineTrash } from "react-icons/hi";
import { FiEdit } from "react-icons/fi";
import type { FeedingSchedule } from "../interface/feedManagement";
import toast from "react-hot-toast";
import { delSchedule } from "../api/feed";
import { useTranslation } from "react-i18next";
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface FeedScheduleProps {
    activities?: FeedingSchedule[];
    onDeleteSuccess?: () => void;
    onEdit?: (schedule: FeedingSchedule) => void;
    isLoading?: boolean;
}

const FeedScheduleSkeleton = () => (
    <div className="flex flex-col gap-3 w-full">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-[10px] bg-gray-50/50 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-gray-200 rounded-[10px]" />
                    <div className="flex flex-col gap-2">
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                        <div className="h-3 w-48 bg-gray-200 rounded" />
                    </div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded" />
            </div>
        ))}
    </div>
);

const FeedSchedule = ({ activities = [], onDeleteSuccess, onEdit, isLoading }: FeedScheduleProps) => {
    const { t } = useTranslation();

    const handleDelete = async (id: string | undefined) => {
        if (!id) return;
        const loadingToast = toast.loading("Deleting schedule...");
        try {
            const response = await delSchedule(id);
            toast.success(response?.message || "Schedule deleted successfully", { id: loadingToast });
            if (onDeleteSuccess) onDeleteSuccess();
        } catch (error: any) {
            // console.error("Delete Error:", error);
            toast.error(error?.response?.data?.message || "Failed to delete schedule", { id: loadingToast });
        }
    };

    if (isLoading) return <FeedScheduleSkeleton />;

    return (
        <div className="flex flex-col gap-3 w-full">
            {/* Real Farm Activities */}
            {Array.isArray(activities) && activities.length > 0 ? (
                activities.map((item, index) => (
                    <div
                        key={item.id || `activity-${index}`}
                        className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-[10px] bg-green-50/30"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-9 h-9 bg-[#DCFCE7] rounded-[10px]">
                                <GoClock className="text-[#00A63E] w-5 h-5" />
                            </div>

                            <div className="flex flex-col">
                                <h3 className="text-base font-semibold text-[#101828]">
                                    {item.schedule_name}
                                </h3>
                                <p className="text-sm font-normal text-[#4A5565] flex items-center flex-wrap gap-1">
                                    <span className="font-medium text-green-700">{item.time_start}–{item.time_end}</span>
                                    <span>|</span>
                                    <span>{item.days_of_week.map(d => DAY_LABELS[d]).join(", ")}</span>
                                    <span>|</span>
                                    <span>{item.quantity_kg} kg</span>
                                </p>
                                {item.notes && (
                                    <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">{item.notes}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onEdit?.(item)}
                                className="text-blue-400 hover:text-blue-600 transition-all p-1 hover:bg-blue-50 rounded-md cursor-pointer"
                            >
                                <FiEdit size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-400 hover:text-red-600 transition-all p-1 hover:bg-red-50 rounded-md cursor-pointer"
                            >
                                <HiOutlineTrash size={20} />
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-10 border border-[#E5E7EB] rounded-[10px] bg-gray-50/20">
                    <p className="text-gray-400">{t("feedingPage.no_activities_found")}</p>
                </div>
            )}
        </div>
    );
};

export default FeedSchedule;
