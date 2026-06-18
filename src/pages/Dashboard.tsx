import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";

// import components 
const FeedingChart = lazy(() => import("../components/FeedLevel"));
const FarmLocationCard = lazy(() => import("../components/FarmLocationCard"));
// const PredictFeedStatus = lazy(() => import("../components/PredictFeedStatus"));

// Modularized Sections
const ClimateNow = lazy(() => import("../components/dashboard/ClimateNow"));
const ClimateSection = lazy(() => import("../components/dashboard/ClimateSection"));
const AlertsSection = lazy(() => import("../components/dashboard/AlertsSection"));

import { useBarn } from "../context/BarnContext";

function Dashboard() {
    const { t } = useTranslation();

    useBarn();

    return (
        <div className="mt-5">
            <div className="flex flex-col gap-5">
                {/* Current climate conditions — at-a-glance context for the barn, on top */}
                <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded-[14px]"></div>}>
                    <ClimateNow />
                </Suspense>

                {/* Farm Location Header */}
                <div>
                    <Suspense fallback={<div className="h-20 bg-gray-100 animate-pulse rounded-[14px]"></div>}>
                        <FarmLocationCard />
                    </Suspense>
                </div>

                {/* Feed Level Chart */}
                <div className="w-full bg-white border-gray-200 border p-4 sm:p-5 rounded-[14px]">
                    <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-[14px]"></div>}>
                        <FeedingChart />
                    </Suspense>

                    {/* Dynamic Legend Section */}
                    <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex flex-wrap gap-x-5 gap-y-2 text-sm sm:text-base text-[#4A5565]">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#00A63E]"></span>
                                <span>{t('dashboardPage.feed_level')}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-8 border-t-2 border-[#E7000B]"></div>
                                <span>{t('dashboardPage.low_threshold_dynamic')}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-8 border-t-2 border-[#00A63E]"></div>
                                <span>{t('dashboardPage.predicted')}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-0.5 h-4 bg-[#00A63E]"></div>
                                <span>{t('dashboardPage.feeding')}</span>
                            </div>
                    </div>
                </div>

                {/* Climate & Environment Section */}
                <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-[14px]"></div>}>
                    <ClimateSection />
                </Suspense>
            </div>

            {/* Predict Feed Status */}
            {/* <div className="mt-5">
                <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-[14px]"></div>}>
                    <PredictFeedStatus />
                </Suspense>
            </div> */}

            {/* Alerts & Notifications Section */}
            <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-[14px]"></div>}>
                <AlertsSection />
            </Suspense>
        </div>
    );
}

export default Dashboard;