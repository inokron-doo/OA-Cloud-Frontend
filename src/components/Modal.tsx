import React from 'react';
import { IoCloseOutline } from "react-icons/io5";
import type { ModalProps } from '../interface/Modal';


const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    maxWidth = "max-w-lg",
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/50">
            <div className={`w-full ${maxWidth} rounded-[10px] bg-white p-6 shadow-xl relative`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                    <h2 className="text-lg font-semibold text-[#0A0A0A]">{title}</h2>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-[#0A0A0A] cursor-pointer"
                    >
                        <IoCloseOutline size={18} />
                    </button>
                </div>

                {description && (
                    <p className="text-sm text-[#717182] mb-6">{description}</p>
                )}

                {/* Body */}
                {children}
            </div>
        </div>
    );
};

export default Modal;