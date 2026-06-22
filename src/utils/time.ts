// Centralised timestamp parsing.
//
// The backend emits every real observation/forecast/prediction as a TRUE UTC
// instant — weather/feed history, forecast, current weather and the prediction
// service all carry an explicit offset (and naive strings from those sources are
// UTC). Parse them with `parseUtc` and let the chart render them in the viewer's
// local (farm) timezone.
//
// The single exception is Farm-Calendar feeding *events*, which are still stored
// as farm-local wall-clock mislabelled "+00:00". Those go through
// `parseLocalWallClock`, which reads the wall-clock numbers as local time so the
// event lands on the same absolute timeline as everything else.

/** Parse a true-UTC timestamp to epoch ms. Respects an explicit offset; a
 *  zone-less string is treated as UTC. Numbers pass through as-is. */
export const parseUtc = (ts?: string | number | null): number => {
  if (ts == null || ts === "") return 0;
  if (typeof ts === "number") return ts;
  const hasTz = /(Z|[+-]\d{2}:\d{2})$/.test(ts);
  return new Date(hasTz ? ts : `${ts}Z`).getTime();
};

/** Parse a farm-local wall-clock timestamp (mislabelled or naive) to epoch ms by
 *  interpreting the wall-clock numbers in the viewer's local timezone. Used only
 *  for legacy Farm-Calendar feeding events. */
export const parseLocalWallClock = (ts?: string | number | null): number => {
  if (ts == null || ts === "") return 0;
  if (typeof ts === "number") return ts;
  const clean = String(ts).replace(/(Z|[+-]\d{2}:\d{2})$/, "");
  return new Date(clean).getTime();
};
