import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FarmModalProps, OneTimeActivity as OneTimeActivityInterface } from "../interface/feedManagement";
import toast from "react-hot-toast";
import { addOneTimeActivity } from "../api/feed";

import { useEffect } from "react";

function OneTimeActivity({ isOpen, onClose, onSuccess, initialData, selectedBarnId, selectedLocationId }: FarmModalProps) {
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);

    // Form data state for feeding schedule registration
    const [formData, setFormData] = useState<OneTimeActivityInterface>({
        barn_id: "",
        feeding_location_id: "",
        start_datetime: "",
        end_datetime: "",
        quantity_kg: 0,
        notes: "",
        title: "",
        activity_type_id: ""
    });
    const isEditMode = !!initialData;

    const formatDateForInput = (dateString: string | undefined) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        // Extract local components to avoid UTC shift if the source is already local-like
        // or to match what datetime-local expects: YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    useEffect(() => {
        if (initialData) {
            setFormData({
                barn_id: initialData.barn_id || "",
                feeding_location_id: initialData.feeding_location_id || "",
                start_datetime: formatDateForInput(initialData.start_datetime),
                end_datetime: formatDateForInput(initialData.end_datetime),
                quantity_kg: initialData.quantity_kg || 0,
                notes: initialData.notes || "",
                title: initialData.title || initialData.schedule_name || "",
                activity_type_id: initialData.activity_type_id || ""
            });
        } else {
            setFormData({
                barn_id: selectedBarnId || "",
                feeding_location_id: selectedLocationId || "",
                start_datetime: "",
                end_datetime: "",
                quantity_kg: 0,
                notes: "",
                title: "",
                activity_type_id: ""
            });
        }
    }, [initialData, isOpen, selectedBarnId, selectedLocationId]);

    if (!isOpen) return null;

    /**
     * Generic handler for input changes in form fields
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Reset state and close modal
     */
    const handleClose = () => {
        setFormData({
            barn_id: "",
            feeding_location_id: "",
            start_datetime: "",
            end_datetime: "",
            quantity_kg: 0,
            notes: "",
            title: "",
            activity_type_id: ""
        });
        onClose();
    };

    /**
     * Submit form to register the feeding schedule
     */
    const handleSubmit = async () => {
        // Validation check for required fields
        if (!formData.title) {
            toast.error(t("oneTimeActivity.err_title"));
            return;
        }

        if (!formData.start_datetime) {
            toast.error(t("oneTimeActivity.err_start"));
            return;
        }

        if (!formData.end_datetime) {
            toast.error(t("oneTimeActivity.err_end"));
            return;
        }

        if (formData.quantity_kg <= 0) {
            toast.error(t("oneTimeActivity.err_qty"));
            return;
        }

        setLoading(true);
        try {
            let response;
            if (isEditMode) {
                // If there's an edit function for one-time activity, use it here.
                // For now, focusing on addOneTimeActivity as requested.
                response = await addOneTimeActivity(formData);
            } else {
                response = await addOneTimeActivity(formData);
            }
            toast.success(response?.message || (isEditMode ? t("oneTimeActivity.success_update") : t("oneTimeActivity.success_add")));
            if (onSuccess) onSuccess();
            handleClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || (isEditMode ? t("oneTimeActivity.err_fail_update") : t("oneTimeActivity.err_fail_add")));
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
                        {isEditMode ? t("oneTimeActivity.heading_update") : t("oneTimeActivity.heading")}
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-900 text-2xl cursor-pointer">&times;</button>
                </div>

                {/* --- Main Content Body --- */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4 animate-slide-in text-sm">
                        {/* Title */}
                        <div>
                            <label className="block text-gray-600 mb-1">{t("oneTimeActivity.title")}</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder={t("oneTimeActivity.title_placeholder")}
                            />
                        </div>

                        {/* Start Date/Time */}
                        <div>
                            <label className="block text-gray-600 mb-1">{t("oneTimeActivity.start_datetime")}</label>
                            <input
                                type="datetime-local"
                                name="start_datetime"
                                value={formData.start_datetime}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>

                        {/* End Date/Time */}
                        <div>
                            <label className="block text-gray-600 mb-1">{t("oneTimeActivity.end_datetime")}</label>
                            <input
                                type="datetime-local"
                                name="end_datetime"
                                value={formData.end_datetime}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>

                        {/* Quantity (kg) */}
                        <div>
                            <label className="block text-gray-600 mb-1">{t("oneTimeActivity.quantity")}</label>
                            <input
                                type="number"
                                name="quantity_kg"
                                value={formData.quantity_kg || ""}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity_kg: Number(e.target.value) }))}
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder={t("oneTimeActivity.quantity_placeholder")}
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-gray-600 mb-1">{t("oneTimeActivity.notes")}</label>
                            <textarea
                                name="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded"
                                placeholder={t("oneTimeActivity.notes_placeholder")}
                            />
                        </div>
                    </div>
                </div>

                {/* --- Footer Buttons Navigation --- */}
                <div className="px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                        {
                            loading
                                ? t("farmActivity.btnLoad") + "..."
                                : isEditMode ? t("farmActivity.btn_3") : t("oneTimeActivity.btn_add")
                        }
                    </button>
                </div>
            </div>

            {/* Modal Backdrop with Blur Effect */}
            <div className="absolute inset-0 z-30 bg-gray-200 blur-2xl opacity-80"></div>
        </div>
    );
}

export default OneTimeActivity;
