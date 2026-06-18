import { useState, lazy } from 'react';
import { useTranslation } from "react-i18next";

// import components
const EdgeDevice = lazy(() => import('../components/SetupForms/EdgeDevice'));
const AnchorTime = lazy(() => import('../components/SetupForms/AnchorTime'));
const MooHero = lazy(() => import('../components/SetupForms/MooHero'));
const AlertRules = lazy(() => import('../components/SetupForms/AlertRules'));

// import icons
import { PiHardDrivesLight } from "react-icons/pi";
import { TbBellCog } from "react-icons/tb";
import { MdAccessTime } from "react-icons/md";
import { IoLinkOutline } from "react-icons/io5";



function Setup() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('sync');

  const tabs = [
    { id: 'sync', label: t('setupPage.link_2'), icon: PiHardDrivesLight },
    { id: 'moohero', label: t('setupPage.link_1', 'MooHero'), icon: IoLinkOutline },
    { id: 'alert_rules', label: t('setupPage.link_alerts', 'Alerts'), icon: TbBellCog },
    { id: 'anchor', label: 'Anchor Time', icon: MdAccessTime },
  ];

  return (
    <div className='mt-5 min-h-screen'>
      <div className="flex flex-col md:flex-row gap-6">

        {/* Left Sidebar */}
        <div className="w-full md:w-[25%] bg-white border border-[#E5E7EB] rounded-[14px] p-4">
          <h5 className="text-[#101828] font-normal text-base mb-4 px-2">{t('setupPage.left_heading')}</h5>
          <nav className="space-y-1" >
            {
              tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-[10px] text-base font-normal transition-all cursor-pointer ${isActive
                      ? 'bg-[#DCFCE7] text-[#008236]'
                      : 'text-[#4A5565] hover:bg-[#4A5565]/10'
                      }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })
            }
          </nav>
        </div>

        {/* Right Content */}
        <div className="w-full md:w-[75%]">
          {activeTab === 'moohero' && <MooHero />}
          {activeTab === 'sync' && <EdgeDevice />}
          {activeTab === 'alert_rules' && <AlertRules />}
          {activeTab === 'anchor' && <AnchorTime />}
        </div>

      </div>
    </div>
  );
}

export default Setup;