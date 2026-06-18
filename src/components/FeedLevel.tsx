import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

import { getLocationByBarn } from "../api/barns";
import type { FeedLevelsResponse } from "../interface/FeedLevels";
import { feedingHistory, getFeedLevels } from "../api/feed";
import { predictFeedLevel } from "../api/alert";
import type {
  GetFeedingLocation,
} from "../interface/feedManagement";
import SkeletonChart from "./SkeletonChart";
import { useBarn } from "../context/BarnContext";
import { getAnchorTime } from "../api/anchorTime";

type FeedingEventMarker = {
  time: number; // window start (or point time for detected refills)
  endTime: number | null; // window end; null => render as a single-point marker
  quantityKg: number | null;
};

// The chart strips timezone offsets from reading timestamps to plot the stored
// clock time directly ("nominal time symmetry"). Marker timestamps must be parsed
// the same way so they line up with the feed-level line.
const toNominalTime = (raw: any): number => {
  if (typeof raw === "string") {
    raw = raw.replace(/(Z|[+-]\d{2}:\d{2})$/, "");
  }
  return new Date(raw).getTime();
};

const normalizeFeedingEvents = (
  history: any,
  predictions: any,
): FeedingEventMarker[] => {
  // Planned/scheduled feeding events come from the history endpoint and carry an
  // explicit [start_datetime, end_datetime] window.
  const eventsFromHistory = Array.isArray(history?.feeding_events)
    ? history.feeding_events
    : [];

  // Detected actual refills from the prediction service are single points in time.
  const eventsFromPredictions = Array.isArray(predictions?.result?.applied_refills)
    ? predictions.result.applied_refills
    : [];

  const normalized: FeedingEventMarker[] = [
    ...eventsFromHistory.map((event: any): FeedingEventMarker => {
      const start = toNominalTime(
        event?.start_datetime || event?.timestamp || event?.time,
      );
      const rawEnd = event?.end_datetime ?? null;
      const end = rawEnd ? toNominalTime(rawEnd) : null;
      const quantity =
        event?.feeding_activity?.quantity_kg ??
        event?.quantity_kg ??
        event?.quantityKg ??
        null;

      return {
        time: start,
        endTime: end !== null && Number.isFinite(end) && end > start ? end : null,
        quantityKg: typeof quantity === "number" ? quantity : null,
      };
    }),

    ...eventsFromPredictions.map((event: any): FeedingEventMarker => {
      const start = toNominalTime(
        event?.time || event?.timestamp || event?.start_datetime,
      );
      const quantity =
        event?.quantity_kg ??
        event?.quantityKg ??
        event?.feeding_activity?.quantity_kg ??
        null;

      return {
        time: start,
        endTime: null,
        quantityKg: typeof quantity === "number" ? quantity : null,
      };
    }),
  ].filter((event) => Number.isFinite(event.time));

  normalized.sort((a, b) => a.time - b.time);

  const bands = normalized.filter((e) => e.endTime !== null);

  // A detected/predicted refill that lands inside a planned window is the same
  // feeding — absorb it into the band instead of drawing a second marker.
  const points = normalized
    .filter((e) => e.endTime === null)
    .filter(
      (p) => !bands.some((b) => p.time >= b.time && p.time <= (b.endTime as number)),
    );

  const merged = [...bands, ...points].sort((a, b) => a.time - b.time);

  const deduped: FeedingEventMarker[] = [];

  merged.forEach((event) => {
    const duplicate = deduped.find(
      (e) => Math.abs(e.time - event.time) < 15 * 60 * 1000,
    );

    if (!duplicate) {
      deduped.push(event);
    } else {
      if (duplicate.quantityKg === null && event.quantityKg !== null) {
        duplicate.quantityKg = event.quantityKg;
      }
      // Prefer a real window over a bare point if one of the duplicates has it.
      if (duplicate.endTime === null && event.endTime !== null) {
        duplicate.endTime = event.endTime;
      }
    }
  });

  return deduped;
};

const FeedingChart: React.FC = () => {
  const { t } = useTranslation();

  const { selectedBarn } = useBarn();
  const localBarnId = selectedBarn?.barn_id || null;

  const [localLocationId, setLocalLocationId] = useState<string | null>(
    localStorage.getItem("feed_chart_location_id"),
  );

  const [range] = useState<number>(24); // fixed at 24 h (driven by anchor time)

  const [anchorDomain, setAnchorDomain] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const loadAnchor = async () => {
      try {
        const { anchor_time } = await getAnchorTime(); // e.g. "05:00:00"
        const [hStr, mStr, sStr] = anchor_time.split(":");
        const h = parseInt(hStr ?? "0", 10);
        const m = parseInt(mStr ?? "0", 10);
        const s = parseInt(sStr ?? "0", 10);

        const now = new Date();
        const anchor = new Date(now);
        anchor.setHours(h, m, s, 0);

        if (anchor.getTime() > now.getTime()) {
          anchor.setDate(anchor.getDate() - 1);
        }

        const start = anchor.getTime();
        const end = start + 24 * 3600 * 1000;
        setAnchorDomain([start, end]);
      } catch {
        const now = Date.now();
        setAnchorDomain([now - 24 * 3600 * 1000, now]);
      }
    };
    loadAnchor();

    window.addEventListener("anchorTimeUpdated", loadAnchor);
    return () => window.removeEventListener("anchorTimeUpdated", loadAnchor);
  }, []);

  const domainMin = anchorDomain[0];
  const domainMax = anchorDomain[1];
  const nowMs = Date.now(); // UTC ms — used for the NOW reference line


  const [locations, setLocations] = useState<GetFeedingLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);

  // --- Chart States ---
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(20);
  const [refills, setRefills] = useState<FeedingEventMarker[]>([]);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  const [chartTitle, setChartTitle] = useState<string>("");

  // --- Fetch Locations ---
  useEffect(() => {
    const fetchLocations = async () => {
      if (!localBarnId) {
        setLocations([]);
        setLocalLocationId(null);
        localStorage.removeItem("feed_chart_location_id");
        return;
      }

      try {
        setIsLoadingLocations(true);
        const data = await getLocationByBarn(localBarnId);
        const newLocations = data.feeding_locations || [];
        setLocations(newLocations);

        // If current localLocationId is not in the new locations, clear it
        setLocalLocationId(prev => {
          if (prev && !newLocations.find((loc: GetFeedingLocation) => loc.feeding_location_id === prev)) {
            localStorage.removeItem("feed_chart_location_id");
            return null;
          }
          return prev;
        });
      } catch (error) {
        console.error("Locations load error:", error);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [localBarnId]);

  // --- Fetch Chart Data ---
  useEffect(() => {
    const fetchFeedingData = async () => {
      if (!localLocationId || !localBarnId || anchorDomain[0] === 0) {
        setChartData([]);
        setRefills([]);
        return;
      }

      setIsChartLoading(true);

      try {
        const toNominalUTC = (ms: number) => {
          const d = new Date(ms);
          const pad = (n: number) => n.toString().padStart(2, '0');
          // Must use UTC methods: anchorDomain is in real UTC ms, and the backend
          // queries DB timestamps in UTC. Using local getHours() would shift the
          // query window by the timezone offset, causing a gap at the start.
          return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+00:00`;
        };

        const [history, liveLevelsResponse, predictions]: [
          any,
          FeedLevelsResponse,
          any,
        ] = await Promise.all([
          feedingHistory(localLocationId, undefined, toNominalUTC(anchorDomain[0]), toNominalUTC(anchorDomain[1])),
          getFeedLevels(),
          predictFeedLevel({
            barn_id: localBarnId,
            feeding_location_id: localLocationId,
            horizon_hours: range,
          }),
        ]);

        if (history?.readings) {
          // --- History ---
          const historyData: any[] = history.readings
            .filter(
              (reading: any) =>
                reading.reading_kind === "feed_level_percentage" &&
                reading.numeric_value !== null,
            )
            .map((reading: any) => {
              let ts = reading.time;
              // Strip timezone offsets (e.g., +00:00, Z) to enforce nominal time symmetry
              if (ts) {
                ts = ts.replace(/(Z|[+-]\d{2}:\d{2})$/, "");
              }
              return {
                time: new Date(ts).getTime(),
                level: parseFloat(reading.numeric_value.toFixed(2)),
                predicted: null,
              };
            })
            .reverse();

          let mergedData = [...historyData];

          // --- Predictions ---
          const predictionList: {
            timestamp: string;
            level: number;
          }[] = (() => {
            if (!predictions) return [];

            if (predictions.result?.forecast) {
              const points = predictions.result.forecast.map((p: any) => {
                let ts = p.time;
                if (ts) {
                  ts = ts.replace(/(Z|[+-]\d{2}:\d{2})$/, "");
                }
                return {
                  timestamp: ts,
                  level: p.level_percent,
                };
              });

              if (
                predictions.result.current_level_percent !== undefined &&
                predictions.result.current_time
              ) {
                let ts = predictions.result.current_time;
                if (ts) {
                  ts = ts.replace(/(Z|[+-]\d{2}:\d{2})$/, "");
                }
                return [
                  {
                    timestamp: ts,
                    level: predictions.result.current_level_percent,
                  },
                  ...points,
                ];
              }

              return points;
            }

            if (Array.isArray(predictions.predictions)) {
              return predictions.predictions.map((p: any) => {
                let ts = p.timestamp;
                if (ts) {
                  ts = ts.replace(/(Z|[+-]\d{2}:\d{2})$/, "");
                }
                return {
                  timestamp: ts,
                  level:
                    p.predicted_feed_level_percentage ??
                    p.predicted_level ??
                    p.feed_level ??
                    0,
                };
              });
            }

            return [];
          })();

          if (predictionList.length > 0) {
            const predictionMap = new Map(
              predictionList.map((p) => [
                new Date(p.timestamp).getTime(),
                parseFloat(p.level.toFixed(2)),
              ]),
            );

            mergedData = historyData.map((point) => ({
              ...point,
              predicted: predictionMap.get(point.time) || null,
            }));

            predictionList.forEach((p) => {
              const predTime = new Date(p.timestamp).getTime();

              const histTime = historyData.find((h) => h.time === predTime);

              if (!histTime) {
                mergedData.push({
                  time: predTime,
                  level: null,
                  predicted: parseFloat(p.level.toFixed(2)),
                });
              }
            });

            mergedData.sort((a, b) => a.time - b.time);
          }

          const selectedLoc = locations.find(
            (l) => l.feeding_location_id === localLocationId,
          );

          const liveLevel = liveLevelsResponse.levels?.find(
            (l: any) => l.feeding_location_id === localLocationId,
          );

          setChartTitle(selectedLoc?.name || t("dashboardPage.feed_level"));

          // Strictly limit the data to exactly the 24-hour anchor window
          const filteredData = mergedData.filter(
            (item) => item.time >= anchorDomain[0] && item.time <= anchorDomain[1]
          );

          setChartData(filteredData);

          setRefills(normalizeFeedingEvents(history, predictions));

          const finalCurrentLevel = liveLevel
            ? liveLevel.feed_level
            : historyData.length > 0
              ? historyData[historyData.length - 1].level
              : 0;

          setCurrentLevel(finalCurrentLevel);

          setThreshold(
            history?.low_threshold ?? selectedLoc?.low_feed_threshold,
          );
        }
      } catch (err) {
        console.error("Chart data error:", err);
        setRefills([]);
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchFeedingData();
  }, [localLocationId, localBarnId, range, locations, t, anchorDomain]);

  const handleLocationChange = (val: string) => {
    setLocalLocationId(val || null);
    if (val) localStorage.setItem("feed_chart_location_id", val);
    else localStorage.removeItem("feed_chart_location_id");
  };

  const formatTime = (timestamp: any) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const formatDateTime = (timestamp: any) => {
    try {
      return new Date(timestamp).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return new Date(timestamp).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-gray-900 text-base font-bold">Feeding History & Predictions</h1>
          <h3 className="text-gray-900 text-base font-normal">
            {chartTitle || t("dashboardPage.feed_level")}
          </h3>

          {localLocationId && (
            <p className="text-[#4A5565] text-base">
              {t("dashboardPage.current_level")}{" "}
              <span className="text-[#00A63E]">{currentLevel}%</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">

          {/* Location */}
          <select
            value={localLocationId || ""}
            onChange={(e) => handleLocationChange(e.target.value)}
            disabled={!localBarnId || isLoadingLocations}
            className="px-3 py-1.5 text-sm rounded-[8px] border border-[#D1D5DC] bg-[#F9FAFB] outline-none cursor-pointer">
            <option value="">
              {isLoadingLocations ? "..." : t("navbar.select_location")}
            </option>

            {locations.map((loc) => (
              <option
                key={loc.feeding_location_id}
                value={loc.feeding_location_id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full h-52 relative border border-gray-200 rounded-lg overflow-hidden">
        {isChartLoading ? (
          <SkeletonChart height="200px" showTitle={false} />
        ) : localLocationId ? (
          // On mobile the chart renders at a fixed wider width and scrolls
          // horizontally so detail isn't squished; on sm+ it fills the card.
          <div className="h-full w-full overflow-x-auto">
          <div className="h-full min-w-[600px] sm:min-w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 0,
                right: 0,
                left: -30,
                bottom: 0,
              }}>
              <CartesianGrid strokeDasharray="3 3" vertical stroke="#F0F0F0" />

              {(() => {
                const xTicks = [];
                for (let t = domainMin; t <= domainMax; t += 4 * 3600 * 1000) {
                  xTicks.push(t);
                }
                return (
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={[domainMin, domainMax]}
                    ticks={xTicks}
                    tickFormatter={(t) => {
                      if (range > 24) {
                        try {
                          const options: Intl.DateTimeFormatOptions = {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                          };

                          return new Date(t).toLocaleDateString([], options);
                        } catch {
                          return new Date(t).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                          });
                        }
                      }

                      return formatTime(t);
                    }}
                    tick={{
                      fill: "#666",
                      fontSize: 11,
                    }}
                  />
                );
              })()}

              <YAxis
                domain={[0, 100]}
                tick={{
                  fill: "#666",
                  fontSize: 11,
                }}
              />

              <Tooltip
                labelFormatter={(l) => formatDateTime(l)}
                formatter={(v: any, name?: string) => [
                  `${v}%`,
                  name === "predicted"
                    ? t("predictFeed.tooltip_predicted")
                    : t("dashboardPage.feed_level"),
                ]}
              />


              {/* Threshold */}
              <ReferenceLine
                y={threshold}
                stroke="#ef4444"
                strokeDasharray="4 4"
              />

              {/* Current Time */}
              <ReferenceLine
                x={nowMs}
                stroke="#ef4444"
                strokeWidth={1.5}
                label={{
                  value: "NOW",
                  position: "insideTopRight",
                  fill: "#ef4444",
                  fontSize: 12,
                  fontWeight: "bold",
                  offset: 10,
                }}
              />

              {/* Feeding Events */}
              {refills.map((refill: FeedingEventMarker, idx: number) => {
                const label =
                  refill.quantityKg !== null
                    ? `+${Math.round(refill.quantityKg)}kg`
                    : "Feeding";

                // Windowed (scheduled) event -> shaded band across [start, end].
                if (refill.endTime !== null) {
                  // Skip only if the window lies entirely outside the visible domain.
                  if (refill.endTime < domainMin || refill.time > domainMax) {
                    return null;
                  }
                  const x1 = Math.max(refill.time, domainMin);
                  const x2 = Math.min(refill.endTime, domainMax);

                  return (
                    <ReferenceArea
                      key={`refill-${idx}`}
                      x1={x1}
                      x2={x2}
                      stroke="none"
                      fill="#10b981"
                      fillOpacity={0.08}
                      label={{
                        value: label,
                        position: "insideTop",
                        fill: "#059669",
                        fontSize: 10,
                        fontWeight: "normal",
                      }}
                    />
                  );
                }

                // Point event (detected refill) -> single dashed line.
                if (refill.time < domainMin || refill.time > domainMax) {
                  return null;
                }

                return (
                  <ReferenceLine
                    key={`refill-${idx}`}
                    x={refill.time}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: label,
                      position: "insideTopLeft",
                      fill: "#047857",
                      fontSize: 10,
                      fontWeight: "normal",
                    }}
                  />
                );
              })}

              {/* History */}
              <Line
                type="monotone"
                dataKey="level"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />

              {/* Prediction */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#22c55e"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
            <p className="text-[15px] font-medium">
              {t("dashboardPage.no_location_selected")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedingChart;
