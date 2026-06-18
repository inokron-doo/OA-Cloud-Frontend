import { useEffect, useState } from "react"
import { getFeedLevels } from "../api/feed"
import type { feedLevels, FeedLevelsResponse } from "../interface/FeedLevels"
import { Database, MapPin, CalendarClock } from "lucide-react"

import OneTimeActivity from "./OneTimeActivity"

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react"
// Import Swiper styles
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
// Import Swiper modules
import { Navigation, Pagination, Autoplay } from "swiper/modules"

function FarmLocationCard() {
  const [feedData, setFeedData] = useState<feedLevels[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<feedLevels | null>(null)

  const fetchFeedLevels = async () => {
    setLoading(true)
    try {
      const response: FeedLevelsResponse = await getFeedLevels()
      setFeedData(response.levels || [])
    } catch (error) {
      console.error("Error fetching feed levels:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedLevels()
  }, [])

  const OPTIMAL = { text: "Optimal", bg: "bg-emerald-500", fg: "text-emerald-500" }
  const MODERATE = { text: "Moderate", bg: "bg-amber-500", fg: "text-amber-500" }
  const CRITICAL = { text: "Critical", bg: "bg-rose-500", fg: "text-rose-500" }

  // How many percentage points above the low-feed threshold still counts as "getting close".
  const NEAR_THRESHOLD_MARGIN = 20

  // Status is driven by the per-location low-feed alert threshold:
  //   at or below threshold        -> Critical (red)
  //   within 20 points above it    -> Moderate (amber)
  //   otherwise                    -> Optimal (green)
  // Falls back to fixed 70/30 bands when no threshold is configured.
  const getFeedStatus = (level: number, threshold: number | null) => {
    if (threshold == null) {
      if (level >= 70) return OPTIMAL
      if (level >= 30) return MODERATE
      return CRITICAL
    }
    if (level <= threshold) return CRITICAL
    if (level <= threshold + NEAR_THRESHOLD_MARGIN) return MODERATE
    return OPTIMAL
  }

  if (loading) {
    return (
      <div className="">
        <div className="flex gap-4 sm:gap-5 mb-4 pb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[139px] rounded-[14px] bg-gray-100 animate-pulse border border-gray-200 w-full"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full">
        <div className="mb-4 w-full farm_slider">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            breakpoints={{
              480: {
                slidesPerView: 2,
              },
              768: {
                slidesPerView: 3,
              },
              1024: {
                slidesPerView: 4,
              },
              1440: {
                slidesPerView: 5,
              }
            }}
            className="w-full pb-10"
          >
            {feedData.map((level) => {
              const status = getFeedStatus(level.feed_level, level.low_feed_threshold)
              return (
              <SwiperSlide key={level.feeding_location_id}>
                <div
                  className="group relative rounded-[14px] border border-gray-200 bg-white p-4 transition-all hover:shadow-md w-full"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-2xl ${status.bg} bg-opacity-10 text-white shadow-inner`}>
                        <Database size={10} className={status.fg} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{level.location_name || "Null"}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin size={14} /> {level.barn_name || "Null"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLocation(level)
                        setIsModalOpen(true)
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      <CalendarClock size={20} />
                    </button>
                  </div>

                  {/* Feed Level Indicator */}
                  <div className="mt-3">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Current Level</span>
                      <div className="text-right">
                        <span className="text-base font-bold text-gray-900">{level.feed_level}%</span>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${status.fg}`}>
                          {status.text}
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${status.bg} shadow-sm`}
                        style={{ width: `${level.feed_level}%` }}
                      />
                    </div>
                  </div>
                </div>
              </SwiperSlide>
              )
            })}
          </Swiper>

          {/* Quick Action Refresh Card if empty or just as a utility */}
          {feedData.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 rounded-[14px] border border-dashed border-gray-200 bg-gray-50/50">
              <p className="text-gray-500 mb-4">No feed level data found</p>
            </div>
          )}
        </div>

        <OneTimeActivity
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedLocation(null)
          }}
          onSuccess={() => {
            setIsModalOpen(false)
            setSelectedLocation(null)
            fetchFeedLevels()
          }}
          initialData={selectedLocation ? {
            barn_id: selectedLocation.barn_id,
            feeding_location_id: selectedLocation.feeding_location_id,
            schedule_name: selectedLocation.location_name
          } as any : undefined}
        />
      </div>
    </>
  )
}

export default FarmLocationCard

