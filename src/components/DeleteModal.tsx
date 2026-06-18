import React from 'react';
import Modal from './Modal';
import { Loader2 } from 'lucide-react';
import { useTranslation } from "react-i18next";

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false,
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={message}
            maxWidth="max-w-md"
        >
            <div className="flex justify-end gap-3 mt-4">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    {t('deleteModal.cancel')}
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 min-w-20 cursor-pointer"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('deleteModal.ok')}
                </button>
            </div>
        </Modal>
    );
};

export default DeleteModal;
