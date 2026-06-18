import React from 'react';
// import { AlertTriangle, Info, Calendar, X } from 'lucide-react';
import { GoAlert } from "react-icons/go";
import { FiInfo } from "react-icons/fi";
import { CiCalendar } from "react-icons/ci";
import { IoCloseOutline } from "react-icons/io5";
import type { NotificationData } from '../interface/Notification';
import Button from './Button';

interface NotificationCardProps {
    notification: NotificationData;
    onSchedule: (id: string) => void;
    onIgnore: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onSchedule, onIgnore }) => {
    const isWarning = notification.type === 'warning';

    return (
        <div className={`relative flex flex-col p-5 border rounded-xl transition-all ${isWarning ? 'bg-[#FEF2F2] border-[#FFC9C9]' : 'bg-[#EFF6FF] border-[#BEDBFF]'
            }`}>
            <button
                onClick={() => onIgnore(notification.id)}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 text-[#99A1AF] cursor-pointer"
            >
                <IoCloseOutline size={18} />
            </button>

            <div className="flex items-start gap-4">
                <div className={`mt-1 ${isWarning ? 'text-[#E7000B]' : 'text-[#155DFC]'}`}>
                    {isWarning ? <GoAlert size={20} /> : <FiInfo size={20} />}
                </div>

                <div className="flex-1">
                    <h3 className={`font-normal text-base ${isWarning ? 'text-[#82181A]' : 'text-[#1C398E]'}`}>
                        {notification.title}
                    </h3>
                    <p className={`text-base font-normal mt-1 ${isWarning ? 'text-[#C10007]' : 'text-[#1447E6]'}`}>
                        <span className="mr-1">›</span> {notification.isPredicted ? 'Consider scheduling feeding before this time' : `Suggested action: ${notification.suggestedAction}`}
                    </p>

                    <div className="flex gap-3 mt-2">
                        <Button
                            onClick={() => onSchedule(notification.id)}
                            variant={isWarning ? 'danger' : 'primary'}
                            icon={<CiCalendar size={16} />}
                            size='lg'
                        >
                            Schedule
                        </Button>
                        <Button
                            onClick={() => onIgnore(notification.id)}
                            variant='outline'
                            size='lg'
                        >
                            Ignore
                        </Button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationCard;