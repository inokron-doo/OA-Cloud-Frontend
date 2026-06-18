import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { MdAccessTime } from "react-icons/md";
import { getAnchorTime, setAnchorTime } from "../../api/anchorTime";

/**
 * Given an "HH:MM:SS" anchor time string, return a human-readable
 * description of the 24-hour window it represents.
 * e.g. "05:00:00" → "05:00 AM  →  05:00 AM (next day)"
 */
function buildWindowLabel(anchorHHMM: string): string {
  const [hStr, mStr] = anchorHHMM.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (hour: number, min: number) => {
    const period = hour < 12 ? "AM" : "PM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${pad(h12)}:${pad(min)} ${period}`;
  };

  const endH = (h + 24) % 24; // same time next day
  return `${fmt(h, m)}  →  ${fmt(endH, m)} (next day)`;
}

export default function AnchorTime() {
  const [anchorTime, setAnchorTimeState] = useState("05:00"); // HH:MM for <input type="time">
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAnchorTime();
        // API returns "HH:MM:SS", input[type=time] needs "HH:MM"
        setAnchorTimeState(data.anchor_time.substring(0, 5));
      } catch {
        toast.error("Failed to load anchor time");
      } finally {
        setIsFetching(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = `${anchorTime}:00`; // convert HH:MM → HH:MM:SS
      await setAnchorTime({ anchor_time: payload });
      toast.success("Anchor time updated successfully");
      window.dispatchEvent(new Event("anchorTimeUpdated"));
    } catch {
      toast.error("Failed to update anchor time");
    } finally {
      setIsSaving(false);
    }
  };

  const windowLabel = buildWindowLabel(`${anchorTime}:00`);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
          <MdAccessTime size={22} />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-[#101828]">
            Chart Anchor Time
          </h2>
          <p className="text-[13px] text-[#667085] mt-0.5">
            All charts display a 24-hour window starting from this time each
            day.
          </p>
        </div>
      </div>

      {isFetching ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-40 bg-gray-100 rounded" />
          <div className="h-11 w-56 bg-gray-100 rounded-xl" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
        </div>
      ) : (
        <div className="space-y-5 max-w-sm">
          {/* Time Picker */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#344054]">
              Anchor Start Time
            </label>
            <input
              type="time"
              value={anchorTime}
              onChange={(e) => setAnchorTimeState(e.target.value)}
              className="h-11 px-4 rounded-xl border border-[#D1D5DC] bg-white text-[14.5px] text-[#101828]
                         focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500
                         transition-shadow w-full cursor-pointer"
            />
          </div>

          {/* 24-hour Window Preview */}
          <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-center gap-3">
            <MdAccessTime className="text-green-600 shrink-0" size={18} />
            <div>
              <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wide mb-0.5">
                24-Hour Window
              </p>
              <p className="text-[13px] font-medium text-green-900">
                {windowLabel}
              </p>
            </div>
          </div>

          {/* Helper text */}
          <p className="text-[12px] text-[#667085]">
            Feed level charts, history charts, and predictions will all align to
            this daily anchor window.
          </p>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 px-6 rounded-[10px] bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-60
                       text-white text-[14px] font-medium transition-all flex items-center gap-2
                       disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Saving…
              </>
            ) : (
              "Save Anchor Time"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
