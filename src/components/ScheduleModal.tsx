import { useState } from "react";
import Modal from "./Modal";
import type { WSAlert } from "../interface/Notification"; // Interface import karein

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: WSAlert | null; // any ki jagah interface use karein
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
    isOpen,
    onClose,
    data,
}) => {
    const [activeTab, setActiveTab] = useState<"Details" | "Schedule">("Details");

    if (!data) return null;

    // Alert type ko readable banane ke liye logic
    const displayTitle = data.alert_type 
        ? data.alert_type.replace(/_/g, " ").toUpperCase() 
        : "Alert Details";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={displayTitle}
            // description={`Timestamp: ${new Date(data.timestamp).toLocaleString()}`}
            description={`Barn: ${data.barn_name || 'N/A'} | Time: ${new Date(data.timestamp).toLocaleString()}`}
            maxWidth="max-w-xl"
        >
            {/* Tabs */}
            <div className="flex bg-[#ECECF0] p-1 rounded-[14px] mb-6">
                <button
                    onClick={() => setActiveTab("Details")}
                    className={`flex-1 py-2 text-sm font-medium rounded-[14px] transition-all cursor-pointer
                    ${activeTab === "Details" ? "bg-white shadow-sm" : "text-[#4A5565]"}`}
                >
                    Alert Details
                </button>

                <button
                    onClick={() => setActiveTab("Schedule")}
                    className={`flex-1 py-2 text-sm font-medium rounded-[14px] transition-all cursor-pointer
                    ${activeTab === "Schedule" ? "bg-white shadow-sm" : "text-[#4A5565]"}`}
                >
                    Take Action
                </button>
            </div>

            {/* Content */}
            {activeTab === "Details" ? (
                <div className="space-y-4">
                    <div className="bg-[#F9FAFB] p-5 rounded-[14px] border border-gray-100">
                        {/* Status Header */}
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                            <span className="text-gray-600 text-sm">Severity Status</span>
                            <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold
                                ${data.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                  data.severity === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {data.severity}
                            </span>
                        </div>

                        {/* Main Message */}
                        <div className="mb-6">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Alert Message</h4>
                            <p className="text-gray-900 font-medium text-lg leading-snug">{data.message}</p>
                        </div>

                        {/* Grid Metrics - Dynamically show based on alert type */}
                        <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                            {/* Low Feed Related Data */}
                            {data.current_level !== undefined && (
                                <MetricBox label="Current Level" value={`${data.current_level}%`} />
                            )}
                            {data.threshold !== undefined && (
                                <MetricBox label="Threshold" value={`${data.threshold}%`} />
                            )}
                            {data.consumption_rate !== undefined && (
                                <MetricBox label="Consumption Rate" value={`${data.consumption_rate}%/hr`} />
                            )}
                            {data.hours_remaining !== undefined && (
                                <MetricBox label="Est. Time Left" value={`${data.hours_remaining} hrs`} />
                            )}

                            {/* Heat Stress Related Data */}
                            {data.current_thi !== undefined && (
                                <MetricBox label="Current THI" value={data.current_thi.toString()} />
                            )}
                            {data.threshold_thi !== undefined && (
                                <MetricBox label="THI Threshold" value={data.threshold_thi.toString()} />
                            )}
                            {data.feed_drop_percentage !== undefined && (
                                <MetricBox label="Feed Drop" value={`${data.feed_drop_percentage}%`} />
                            )}
                            {data.temperature !== undefined && (
                                <MetricBox label="Temperature" value={`${data.temperature}°C`} />
                            )}
                            {data.humidity !== undefined && (
                                <MetricBox label="Humidity" value={`${data.humidity}%`} />
                            )}
                        </div>

                        {/* Affected Locations */}
                        {data.affected_locations && data.affected_locations.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Affected Areas</h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.affected_locations.map((loc, i) => (
                                        <span key={i} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs italic">
                                            {loc}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recommended Actions Section */}
                    {data.recommended_actions && data.recommended_actions.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <h4 className="font-semibold text-green-800 text-sm mb-2 flex items-center gap-2">
                                Recommended Next Steps
                            </h4>
                            <ul className="space-y-2">
                                {data.recommended_actions.map((action, i) => (
                                    <li key={i} className="text-sm text-green-700 flex gap-2">
                                        <span className="text-green-400">•</span> {action}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-8 text-center bg-gray-50 rounded-[14px] border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-4">Would you like to schedule an automated task or notify the supervisor?</p>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Create Schedule
                    </button>
                </div>
            )}
        </Modal>
    );
};

// Helper component for cleaner UI
const MetricBox = ({ label, value }: { label: string; value: string }) => (
    <div>
        <span className="block text-xs text-gray-500 mb-1">{label}</span>
        <span className="text-base font-semibold text-gray-900">{value}</span>
    </div>
);

export default ScheduleModal;