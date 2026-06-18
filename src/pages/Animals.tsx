import { useEffect, useState, lazy } from 'react';
import { FiSearch } from "react-icons/fi";
import { useTranslation } from "react-i18next";

// import components
const MooheroEvents = lazy(() => import('../components/MooheroEvents'));
const AddAnimals = lazy(() => import('../components/AddAnimals'));
const AnimalTable = lazy(() => import('../components/AnimalTable'));
const AnimalStats = lazy(() => import('../components/AnimalStats'));

// import apis & interface
import { getAnimals } from '../api/moohero';
import type { IAnimal } from '../interface/MooHero';
import { getLocationByBarn } from '../api/barns';
import { useBarn } from '../context/BarnContext';


function Animals() {
  const { t } = useTranslation();
  const [animals, setAnimals] = useState<IAnimal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Global Filter States
  const { selectedMooheroId, selectedBarn } = useBarn();
  const mooheroId = selectedMooheroId ? parseInt(selectedMooheroId, 10) : null;
  const barnId = selectedBarn?.barn_id || null;

  const [locations, setLocations] = useState<any[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'all' | 'with_events'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  // Single source of truth for the event window — drives the table counts, the
  // events feed, and the per-animal detail view so they can't disagree.
  const [windowDays, setWindowDays] = useState(7);

  const [isLoadingLocs, setIsLoadingLocs] = useState(false);

  useEffect(() => {
    const fetchLocs = async () => {
      if (!barnId) {
        setLocations([]);
        setLocationId(null);
        return;
      }
      try {
        setIsLoadingLocs(true);
        const data = await getLocationByBarn(barnId);
        setLocations(data.feeding_locations || []);

        // Clear selected location if not in new barn
        setLocationId(prev => {
          if (prev && !data.feeding_locations?.find((loc: any) => loc.feeding_location_id === prev)) {
            return null;
          }
          return prev;
        });
      } catch (error) {
        setLocations([]);
      } finally {
        setIsLoadingLocs(false);
      }
    };
    fetchLocs();
  }, [barnId]);

  useEffect(() => {
    fetchAnimalsFiltered(barnId, locationId);
  }, [barnId, locationId, windowDays]);

  const fetchAnimalsFiltered = async (bid: string | null, lid: string | null, isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const data = await getAnimals(bid || undefined, lid || undefined, true, windowDays);
      setAnimals(data.animals || []);
    } catch (error) {
      console.error("Failed to fetch filtered animals", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleSuccess = () => {
    // Standard foreground refresh to show loader
    fetchAnimalsFiltered(barnId, locationId, false);
  };

  const filteredAnimals = animals.filter(animal => {
    if (eventFilter === 'with_events') {
      if ((animal.health_events || 0) === 0 && (animal.heat_events || 0) === 0) return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = animal.animal_name?.toLowerCase().includes(q);
      const matchCollar = animal.moohero_collar_unique_id?.toLowerCase().includes(q);
      if (!matchName && !matchCollar) return false;
    }
    return true;
  });

  return (
    <>
      <div className="mt-5">

        {/* Top Stats Overview */}
        <AnimalStats animals={filteredAnimals} windowDays={windowDays} />

        {/* Filters and Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="flex items-center gap-3">
            <select
              value={locationId || ""}
              onChange={(e) => setLocationId(e.target.value)}
              disabled={!barnId || isLoadingLocs}
              className="px-4 py-2 text-sm rounded-lg border border-[#D1D5DC] bg-white text-[#101828] outline-none cursor-pointer focus:ring-2 focus:ring-[#00A63E]/20"
            >
              <option value="">{isLoadingLocs ? "..." : t("navbar.select_location")}</option>
              {locations.map(loc => (
                <option key={loc.feeding_location_id} value={loc.feeding_location_id}>{loc.name}</option>
              ))}
            </select>

            {/* Event window — drives the counts, the feed, and the detail view together. */}
            <select
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
              className="px-4 py-2 text-sm rounded-lg border border-[#D1D5DC] bg-white text-[#101828] outline-none cursor-pointer focus:ring-2 focus:ring-[#00A63E]/20"
              title={t("animalsPage.window_label")}
            >
              {[7, 14, 30, 90].map(d => (
                <option key={d} value={d}>{t("animalsPage.window_option", { days: d })}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className='inline-flex items-center gap-2 rounded-[10px] font-medium transition-all focus:outline-none cursor-pointer bg-[#00A63E] text-white hover:bg-[#00A63E]/90 px-5 py-2 text-[14px]'
          >
            {t("animalsPage.create_animal_btn")}
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">

          {/* Left Section: Animal Table */}
          <div className="w-full xl:w-[65%] flex flex-col">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="text-xl font-bold text-gray-800">All Animals</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search name or collar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-4 py-1.5 w-48 text-[13px] rounded-[8px] border border-gray-200 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-[#00A63E]/20 transition-all shadow-sm placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Filter:</span>
                  <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value as 'all' | 'with_events')}
                    className="px-3 py-1.5 text-[13px] font-medium rounded-[8px] border border-gray-200 bg-white text-gray-700 outline-none cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-[#00A63E]/20 transition-all shadow-sm"
                  >
                    <option value="all">Show All</option>
                    <option value="with_events">Animals With Events</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <AnimalTable
                animals={filteredAnimals}
                loading={loading}
                onRefresh={handleSuccess}
                windowDays={windowDays}
              />
            </div>
          </div>

          {/* Right Section: MooHero Events Feed.
              Self-contained, scrollable height (sticky) so the events feed no longer
              stretches to match the animal table's height. */}
          <div className="w-full xl:w-[35%] xl:sticky xl:top-5">
            <div className="rounded-[14px] border border-[#E5E7EB] py-5 bg-[#F9FAFB] flex flex-col max-h-[calc(100vh-7rem)] xl:h-[calc(100vh-7rem)]">
              <div className="flex-1 overflow-y-auto px-5 custom-scrollbar min-h-0">
                <MooheroEvents
                  passedMooheroId={mooheroId}
                  collarIds={filteredAnimals.map(a => a.moohero_collar_unique_id).filter(id => !!id)}
                  animals={filteredAnimals}
                  windowDays={windowDays}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      <AddAnimals
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        knownTypes={Array.from(new Set(animals.map(a => a.animal_type).filter(Boolean)))}
      />
    </>
  );
}

export default Animals;
