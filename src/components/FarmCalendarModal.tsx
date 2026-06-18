import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FarmModalProps, FeedingSchedule } from "../interface/feedManagement";
import toast from "react-hot-toast";
import { addSchedule, updateSchedule, getFarmActivityTypes } from "../api/feed";

import { useEffect } from "react";
import type { ActivityType } from "../interface/feedManagement";

function FarmCalendarModal({ isOpen, onClose, onSuccess, initialData, selectedBarnId, selectedLocationId }: FarmModalProps) {
    const { t } = useTranslation();

    const [step, setStep] = useState(1);
    const [selectedActivity, setSelectedActivity] = useState<string>(""); // Stores selected activity type ID
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form data state for feeding schedule registration
    const [formData, setFormData] = useState<FeedingSchedule>({
        barn_id: "",
        feeding_location_id: "",
        schedule_name: "",
        days_of_week: [],
        start_datetime: "",
        end_datetime: "",
        time_start: "",
        time_end: "",
        quantity_kg: 0,
        notes: ""
    });
    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData
            });
            setSelectedActivity(initialData.activity_type_id || "");
            setStep(2); // Directly go to step 2 for editing
        } else {
            setFormData({
                barn_id: "",
                feeding_location_id: "",
                schedule_name: "",
                days_of_week: [],
                start_datetime: "",
                end_datetime: "",
                time_start: "",
                time_end: "",
                quantity_kg: 0,
                notes: ""
            });
            setSelectedActivity("");
            setStep(1);
        }
    }, [initialData, isOpen]);

    // Fetch dynamic activity types when modal opens
    useEffect(() => {
        const fetchActivityTypes = async () => {
            try {
                const data = await getFarmActivityTypes();
                // Assuming the API returns an array like the response body provided
                // The provided response body was object-like: {"activity_type_id": "...", "name": "..."}
                // But typically list APIs return arrays. If it's a single object or wrapped, we handle it.
                if (Array.isArray(data)) {
                    setActivityTypes(data);
                } else if (data && typeof data === 'object') {
                    // Fallback for single object response if that's what the API does
                    setActivityTypes([data]);
                }
            } catch (err) {
                console.error("Failed to fetch activity types:", err);
            }
        };

        if (isOpen) {
            fetchActivityTypes();
        }
    }, [isOpen]);

    // No need for useEffect to fetch barns here as they are managed by Navbar/Context

    if (!isOpen) return null;

    /**
     * Helper to get the name of the currently selected activity type
     */
    const getSelectedActivityName = () => {
        const activity = activityTypes.find(a => a.activity_type_id === selectedActivity);
        return activity ? activity.name : "";
    };

    /**
     * Handles selection of activity type in Step 1
     */
    const handleSelectActivity = (value: string) => {
        setSelectedActivity(value);
        const activity = activityTypes.find(a => a.activity_type_id === value);
        if (activity) {
            setFormData(prev => ({
                ...prev,
                name: activity.name,
                activity_type_id: activity.activity_type_id
            }));
        }
        setError("");
    };

    /**
     * Generic handler for input changes in form fields
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Transition from Step 1 to Step 2
     */
    const handleNext = () => {
        if (!selectedActivity) {
            toast.error(t("farmActivity.selectError"));
            setError(t("farmActivity.selectError"));
            return;
        }

        if (!selectedBarnId || !selectedLocationId) {
            toast.error("Please select a barn and location first.");
            return;
        }

        toast.success("Activity selection confirmed");
        setFormData(prev => ({
            ...prev,
            barn_id: selectedBarnId,
            feeding_location_id: selectedLocationId
        }));
        setError("");
        setStep(2);
    };

    /**
     * Reset state and close modal
     */
    const handleClose = () => {
        setStep(1);
        setSelectedActivity("");
        setFormData({
            barn_id: "",
            feeding_location_id: "",
            schedule_name: "",
            days_of_week: [],
            start_datetime: "",
            end_datetime: "",
            time_start: "",
            time_end: "",
            quantity_kg: 0,
            notes: ""
        });
        setError("");
        onClose();
    };

    /**
     * Submit form to register the feeding schedule
     */
    const handleSubmit = async () => {
        // Validation check for required fields
        if (!formData.schedule_name) {
            toast.error("Schedule Name is required");
            return;
        }

        if (formData.days_of_week.length === 0) {
            toast.error("Please select at least one day of the week");
            return;
        }

        if (!formData.time_start || !formData.time_end) {
            toast.error("Feeding window start and end times are required");
            return;
        }

        if (formData.quantity_kg <= 0) {
            toast.error("Quantity must be greater than 0");
            return;
        }

        setLoading(true);
        try {
            let response;
            if (isEditMode && formData.id) {
                response = await updateSchedule(formData.id, formData);
            } else {
                response = await addSchedule(formData);
            }
            toast.success(response?.message || `Feeding schedule ${isEditMode ? 'updated' : 'registered'} successfully!`);
            if (onSuccess) onSuccess();
            handleClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'register'} schedule`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-5">
            <div className="relative z-50 w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">

                {/* --- Header Section --- */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                    <h2 className="text-green-700 font-semibold text-lg">
                        {step === 1
                            ? t("farmActivity.heading")
                            : isEditMode 
                                ? "Update Feeding Schedule"
                                : t("farmActivity.registerHeading", {
                                    activity: getSelectedActivityName(),
                                })
                        }
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-900 text-2xl cursor-pointer">&times;</button>
                </div>

                {/* --- Main Content Body --- */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* --- STEP 1: Activity Type Selection --- */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("farmActivity.selectHeading")}*
                            </label>

                            <select
                                className={`w-full p-2.5 border rounded-md outline-none appearance-none ${error ? 'border-red-500' : 'border-blue-300'} bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-13%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2013l131.3%20131.3c3.6%203.6%207.9%205.4%2013%205.4s9.3-1.8%2013-5.4L292.4%2095.2c3.6-3.6%205.4-7.9%205.4-13%200-5-1.8-9.3-5.4-13z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-no-repeat bg-[right_1rem_center]`}
                                value={selectedActivity}
                                onChange={(e) => handleSelectActivity(e.target.value)}
                            >
                                <option value="" disabled>{t("farmActivity.selectLabel")}</option>
                                {activityTypes.map((type) => (
                                    <option key={type.activity_type_id} value={type.activity_type_id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>

                            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                        </div>
                    )}

                    {/* --- STEP 2: Feeding Schedule Form --- */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 gap-4 animate-slide-in text-sm">
                            {/* Schedule Name */}
                            <div>
                                <label className="block text-gray-600 mb-1">Schedule Name*</label>
                                <input
                                    type="text"
                                    name="schedule_name"
                                    value={formData.schedule_name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Morning Feeding"
                                />
                            </div>

                            {/* Feeding Window */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-600 mb-1">Window Start*</label>
                                    <input
                                        type="time"
                                        name="time_start"
                                        value={formData.time_start}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-600 mb-1">Window End*</label>
                                    <input
                                        type="time"
                                        name="time_end"
                                        value={formData.time_end}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded"
                                    />
                                </div>
                                <p className="col-span-2 text-xs text-gray-400 -mt-2">
                                    The window when you expect to feed. Used to detect missed or unexpected feedings.
                                </p>
                            </div>

                            {/* Days of Week */}
                            <div>
                                <label className="block text-gray-600 mb-1">Days of Week*</label>
                                <div className="flex flex-wrap gap-2">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                                        <label key={day} className="flex items-center gap-1 cursor-pointer bg-gray-50 px-3 py-1.5 rounded border border-gray-200 hover:bg-green-50 hover:border-green-200 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.days_of_week.includes(index)}
                                                onChange={(e) => {
                                                    const days = e.target.checked
                                                        ? [...formData.days_of_week, index]
                                                        : formData.days_of_week.filter(d => d !== index);
                                                    setFormData(prev => ({ ...prev, days_of_week: days.sort() }));
                                                }}
                                                className="w-4 h-4 cursor-pointer accent-green-600"
                                            />
                                            <span className="text-gray-700 font-medium">{day}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity (kg) */}
                            <div>
                                <label className="block text-gray-600 mb-1">Quantity (kg)*</label>
                                <input
                                    type="number"
                                    name="quantity_kg"
                                    value={formData.quantity_kg || ""}
                                    onChange={(e) => setFormData(prev => ({ ...prev, quantity_kg: Number(e.target.value) }))}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="50"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-gray-600 mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Add any specific instructions"
                                />
                            </div>




                        </div>
                    )}
                </div>

                {/* --- Footer Buttons Navigation --- */}
                <div className="px-6 py-4 flex justify-end gap-3">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {t("farmActivity.btn_1")}
                        </button>
                    )}
                    {step === 1 ? (
                        <button
                            onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors cursor-pointer"
                        >
                            {t("farmActivity.btn_2")}
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                        >
                            {
                                loading
                                    ? t("farmActivity.btnLoad") + "..."
                                    : isEditMode ? "Update Schedule" : t("farmActivity.btn_3")
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* Modal Backdrop with Blur Effect */}
            <div className="absolute inset-0 z-30 bg-gray-200 blur-2xl opacity-80"></div>
        </div>
    );
}

export default FarmCalendarModal;
