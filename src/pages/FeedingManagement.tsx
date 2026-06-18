import { useState, useEffect, useCallback, lazy } from "react";
import { useTranslation } from "react-i18next";
import Button from "../components/Button";
import { GoPlus } from "react-icons/go";

// import components
const FeedSchedule = lazy(() => import("../components/FeedSchedule"));
const FarmCalendarModal = lazy(() => import('../components/FarmCalendarModal'));
const OneTimeActivity = lazy(() => import("../components/OneTimeActivity"));

// import apis & interface
import { getSchedule } from "../api/feed";
import { getLocationByBarn } from "../api/barns";
import type { FeedingLocation } from "../interface/feedManagement";
import type { FeedingSchedule } from "../interface/feedManagement";
import { useBarn } from "../context/BarnContext";

function FeedingManagement() {
  const { t } = useTranslation();
  const token = localStorage.getItem("access_token");

  // (Removed a client-side `document.cookie = access_token=...; Secure` write:
  // the site runs over plain HTTP, where browsers reject Secure cookies, so it
  // was a no-op. The backend's httponly access_token cookie is authoritative.)

  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [isOneTimeModalOpen, setIsOneTimeModalOpen] = useState(false);
  const [farmActivities, setFarmActivities] = useState<FeedingSchedule[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FeedingSchedule | null>(null);

  const { selectedBarn } = useBarn();
  const barnId = selectedBarn?.barn_id || null;

  const [schedLocationId, setSchedLocationId] = useState<string | null>(localStorage.getItem("sched_location_id"));
  const [schedLocations, setSchedLocations] = useState<FeedingLocation[]>([]);
  const [isLoadingSchedLocs, setIsLoadingSchedLocs] = useState(false);

  // Feeding locations to schedule against (discovery-only; managed in Setup).
  useEffect(() => {
    const fetchSLocs = async () => {
      if (!barnId) {
        setSchedLocations([]);
        setSchedLocationId(null);
        return;
      }
      try {
        setIsLoadingSchedLocs(true);
        const data = await getLocationByBarn(barnId);
        setSchedLocations(data.feeding_locations || []);

        setSchedLocationId(prev => {
          if (prev && !data.feeding_locations?.find((loc: any) => loc.feeding_location_id === prev)) {
            localStorage.removeItem("sched_location_id");
            return null;
          }
          return prev;
        });
      } catch (error) { setSchedLocations([]); }
      finally { setIsLoadingSchedLocs(false); }
    };
    fetchSLocs();
  }, [barnId]);

  const handleSchedLocationChange = (val: string) => {
    setSchedLocationId(val || null);
    if (val) localStorage.setItem("sched_location_id", val);
    else localStorage.removeItem("sched_location_id");
  };

  const fetchActivities = useCallback(async () => {
    if (!schedLocationId) {
      setFarmActivities([]);
      return;
    }
    setIsLoadingActivities(true);
    try {
      const data = await getSchedule(schedLocationId);
      let activitiesToSet = [];
      if (Array.isArray(data)) {
        activitiesToSet = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.schedules)) {
        activitiesToSet = data.schedules;
      }
      setFarmActivities(activitiesToSet);
    } catch (err) {
      // Catch error
    } finally {
      setIsLoadingActivities(false);
    }
  }, [schedLocationId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleEditSchedule = (schedule: FeedingSchedule) => {
    setEditingSchedule(schedule);
    if (schedule.days_of_week && schedule.days_of_week.length > 0) {
      setIsFarmModalOpen(true);
    } else {
      setIsOneTimeModalOpen(true);
    }
  };

  if (!token) {
    return <div className="p-10 text-center">Authentication required.</div>;
  }

  return (
    <div className="mt-5">
      <div className="rounded-[14px] border border-[#E5E7EB] py-5">
        <div className="px-5">
          {/* Location picker + add-schedule */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-[#101828]">{t('feedingPage.right_title')}</h2>
              <select
                value={schedLocationId || ""}
                onChange={(e) => handleSchedLocationChange(e.target.value)}
                disabled={!barnId || isLoadingSchedLocs}
                className="px-3 py-1.5 text-sm rounded-lg border border-[#D1D5DC] bg-[#F9FAFB] text-[#101828] outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="">{isLoadingSchedLocs ? t("navbar.loading_location") + "..." : t("feedingPage.select_location", "Select Location")}</option>
                {schedLocations.map((loc) => (
                  <option key={loc.feeding_location_id} value={loc.feeding_location_id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => setIsFarmModalOpen(true)} variant="success" size="lg" disabled={!schedLocationId}>
              <GoPlus size={18} /> {t('feedingPage.btn_3')}
            </Button>
          </div>

          {!barnId ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-400">{t("feedingPage.select_farm_barn_to_see")}</p>
            </div>
          ) : schedLocations.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-400">{t("feedingPage.no_locations_setup", "No feeding locations yet. They appear automatically once a device reports data — set up and name them under Setup → Edge Device.")}</p>
            </div>
          ) : (
            <FeedSchedule
              activities={farmActivities}
              onDeleteSuccess={fetchActivities}
              onEdit={handleEditSchedule}
              isLoading={isLoadingActivities}
            />
          )}
        </div>
      </div>

      <FarmCalendarModal
        isOpen={isFarmModalOpen}
        onClose={() => {
          setIsFarmModalOpen(false);
          setEditingSchedule(null);
        }}
        onSuccess={fetchActivities}
        initialData={editingSchedule}
        selectedBarnId={barnId}
        selectedLocationId={schedLocationId}
      />

      <OneTimeActivity
        isOpen={isOneTimeModalOpen}
        onClose={() => {
          setIsOneTimeModalOpen(false);
          setEditingSchedule(null);
        }}
        onSuccess={fetchActivities}
        initialData={editingSchedule}
        selectedBarnId={barnId}
        selectedLocationId={schedLocationId}
      />
    </div>
  );
}

export default FeedingManagement;
