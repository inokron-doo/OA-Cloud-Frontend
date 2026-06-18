import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  Thermometer, TrendingDown, Trash2, ClipboardX, AlertTriangle, CalendarX, HeartPulse, RefreshCw, Settings2,
} from "lucide-react";
import { getAlertSettings, updateAlertSettings, getGlobalThresholds, updateThresholds } from "../../api/alert";
import type { AlertSettings, RuleConfig, ThresholdsData } from "../../interface/alerts";

type Sev = "critical" | "warning" | "info";
const SEVERITIES: Sev[] = ["critical", "warning", "info"];

// Each rule, the thresholds that define it, and whether it can be forecast.
const RULES: Array<{ key: string; icon: React.ComponentType<{ size?: number }>; predictive: boolean; thresholds: string[] }> = [
  { key: "low_feed", icon: TrendingDown, predictive: true, thresholds: ["low_feed_percent", "low_feed_critical_percent", "feed_stale_minutes", "feed_stale_change_percent", "feeding_suggestion_min_kg"] },
  { key: "low_feed_recurring", icon: RefreshCw, predictive: false, thresholds: ["low_feed_recurrence_count", "low_feed_recurrence_days"] },
  { key: "heat_stress", icon: Thermometer, predictive: true, thresholds: ["heat_stress_thi_threshold", "severe_heat_thi_threshold", "heat_stress_duration_minutes", "severe_heat_duration_minutes"] },
  { key: "spoilage_risk", icon: Trash2, predictive: true, thresholds: ["spoilage_feed_percent", "spoilage_stale_hours", "spoilage_temp_c"] },
  { key: "missed_feeding", icon: ClipboardX, predictive: false, thresholds: ["feed_rise_percent", "feed_rise_lookback_minutes"] },
  { key: "unexpected_feeding", icon: AlertTriangle, predictive: false, thresholds: ["unexpected_feed_cooldown_minutes"] },
  { key: "cancel_feeding_suggestion", icon: CalendarX, predictive: false, thresholds: ["cancel_feed_high_percent", "cancel_feed_lookahead_hours"] },
  { key: "health_spike", icon: HeartPulse, predictive: false, thresholds: ["health_spike_count", "health_spike_hours", "health_spike_thi_window_hours", "health_spike_thi_delta", "health_spike_feed_alert_hours", "moohero_alert_cooldown_hours"] },
];
const GENERAL_THRESHOLDS = ["alert_cooldown_hours"];

const unitFor = (key: string): string => {
  if (key.includes("percent") || key.includes("pct")) return "%";
  if (key.includes("kg")) return "kg";
  if (key.includes("minutes")) return "min";
  if (key.includes("hours") || key.endsWith("_hrs")) return "h";
  if (key.includes("days")) return "d";
  if (key.includes("temp") || key.endsWith("_c")) return "°C";
  if (key.includes("delta")) return "ΔTHI";
  if (key.includes("thi")) return "THI";
  if (key.includes("count") || key.includes("recurrence")) return "events";
  return "";
};

// Normalize routing (bool, or legacy "email"/"both"/"display") into email-on bools.
const toEmailBools = (routing: AlertSettings["notification_routing"]): Record<string, boolean> => {
  const out: Record<string, boolean> = { critical: true, warning: true, info: false };
  for (const sev of SEVERITIES) {
    const v = routing?.[sev] as unknown;
    if (typeof v === "boolean") out[sev] = v;
    else if (typeof v === "string") out[sev] = v === "email" || v === "both";
  }
  return out;
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${checked ? "bg-[#00A63E]" : "bg-gray-300"}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
  </button>
);

function AlertRules() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<Record<string, RuleConfig>>({});
  const [emailFor, setEmailFor] = useState<Record<string, boolean>>({ critical: true, warning: true, info: false });
  const [debounce, setDebounce] = useState<number>(3);
  const [thresholds, setThresholds] = useState<Record<string, number | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [settings, gt] = await Promise.all([getAlertSettings("global"), getGlobalThresholds()]);
        setRules(settings.rules || {});
        setEmailFor(toEmailBools(settings.notification_routing));
        setDebounce(settings.debounce_cycles ?? 3);
        setThresholds({ ...(gt.thresholds as unknown as Record<string, number>) });
      } catch (e) {
        console.error("Failed to load alert settings", e);
        toast.error(t("alertRules.load_fail", "Failed to load alert settings"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const tLabel = (key: string) => t(`thresholdLabels.${key}`, key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  const setRule = (key: string, patch: Partial<RuleConfig>) =>
    setRules((r) => ({ ...r, [key]: { ...r[key], ...patch } }));
  const setThreshold = (key: string, value: number | undefined) => setThresholds((s) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send real numbers; fields left blank are omitted so they keep their
      // current value rather than being written as 0.
      const cleanThresholds = Object.fromEntries(
        Object.entries(thresholds).filter(([, v]) => typeof v === "number" && !Number.isNaN(v)),
      );
      await Promise.all([
        updateAlertSettings({
          scope_type: "global",
          rules,
          notification_routing: emailFor,
          debounce_cycles: debounce,
        }),
        updateThresholds(cleanThresholds as unknown as ThresholdsData),
      ]);
      toast.success(t("alertRules.save_success", "Alert settings saved"));
    } catch (e) {
      console.error("Failed to save alert settings", e);
      toast.error(t("alertRules.save_fail", "Failed to save alert settings"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A63E]" />
      </div>
    );
  }

  // Thresholds not mapped to any rule or the general list -> catch-all so none are hidden.
  const mapped = new Set([...RULES.flatMap((r) => r.thresholds), ...GENERAL_THRESHOLDS]);
  const leftover = Object.keys(thresholds).filter((k) => !mapped.has(k));

  const numberField = (key: string) => (
    <div key={key} className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-[#667085]">{tLabel(key)}</label>
      <div className="flex items-center gap-1 border border-[#D0D5DD] rounded-md px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#00A63E]/30">
        <input
          type="number"
          step="any"
          value={thresholds[key] ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            // Empty/invalid -> undefined (omitted on save, keeps current value) so
            // clearing a field to retype never silently persists 0.
            setThreshold(key, raw === "" || Number.isNaN(Number(raw)) ? undefined : Number(raw));
          }}
          className="w-full text-sm text-[#101828] bg-transparent outline-none"
        />
        {unitFor(key) && <span className="text-xs text-[#98A2B3]">{unitFor(key)}</span>}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-[#101828] text-lg font-semibold">{t("alertRules.heading", "Alerts")}</h5>
          <p className="text-[#6A7282] text-sm mt-0.5">{t("alertRules.subheading", "Configure each alert and how you're notified. All alerts always show on the dashboard.")}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#00A63E] hover:bg-[#008236] text-white text-sm font-medium px-5 py-2 rounded-[10px] transition-colors disabled:opacity-60 cursor-pointer"
        >
          {saving ? t("alertRules.saving", "Saving…") : t("alertRules.save", "Save")}
        </button>
      </div>

      {/* Notifications */}
      <section className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 flex flex-col gap-4">
        <div>
          <h6 className="text-sm font-semibold text-[#101828]">{t("alertRules.notifications", "Notifications")}</h6>
          <p className="text-xs text-[#6A7282] mt-0.5">{t("alertRules.email_help", "Pick which severities also send an email. Everything still appears on the dashboard.")}</p>
        </div>
        <div className="flex flex-wrap gap-6">
          {SEVERITIES.map((sev) => (
            <label key={sev} className="flex items-center gap-2.5">
              <Toggle checked={!!emailFor[sev]} onChange={(v) => setEmailFor((e) => ({ ...e, [sev]: v }))} />
              <span className="text-sm capitalize text-[#344054]">{t(`alertRules.sev_${sev}`, sev)}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-[#475467]">{t("alertRules.debounce", "Wait before emailing a forecast (cycles)")}</label>
          <input
            type="number"
            min={1}
            value={debounce}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== "" && !Number.isNaN(Number(v))) setDebounce(Number(v));
            }}
            className="w-20 border border-[#D0D5DD] rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A63E]/30"
          />
        </div>
      </section>

      {/* One card per rule */}
      {RULES.map(({ key, icon: Icon, predictive, thresholds: keys }) => {
        const cfg: RuleConfig = rules[key] || { enabled: true };
        const enabled = cfg.enabled ?? true;
        return (
          <section key={key} className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Icon size={18} />
                <span className="text-sm font-semibold text-[#101828]">{t(`alertRules.rule_${key}`, key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}</span>
              </div>
              <label className="flex items-center gap-2">
                <span className="text-xs text-[#667085]">{enabled ? t("alertRules.enabled", "Enabled") : t("alertRules.disabled", "Disabled")}</span>
                <Toggle checked={enabled} onChange={(v) => setRule(key, { enabled: v })} />
              </label>
            </div>

            <div className={`flex flex-col gap-4 ${enabled ? "" : "opacity-40 pointer-events-none"}`}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {keys.map((k) => numberField(k))}
              </div>

              {predictive && (
                <div className="border-t border-[#F2F4F7] pt-3 flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-[#475467]">
                    <Toggle checked={cfg.prediction_enabled ?? true} onChange={(v) => setRule(key, { prediction_enabled: v })} />
                    {t("alertRules.predict", "Forecast this")}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#475467]">
                    {t("alertRules.horizon", "Look ahead (h)")}
                    <input
                      type="number"
                      min={1}
                      value={cfg.prediction_horizon_hours ?? (key === "heat_stress" ? 48 : 24)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v !== "" && !Number.isNaN(Number(v))) setRule(key, { prediction_horizon_hours: Number(v) });
                      }}
                      className="w-16 border border-[#D0D5DD] rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A63E]/30"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#475467]">
                    <Toggle checked={cfg.notify_on_predict ?? key === "heat_stress"} onChange={(v) => setRule(key, { notify_on_predict: v })} />
                    {t("alertRules.notify_predict", "Email forecasts")}
                  </label>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* General / shared */}
      <section className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <Settings2 size={18} />
          <span className="text-sm font-semibold text-[#101828]">{t("alertRules.general", "General")}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...GENERAL_THRESHOLDS, ...leftover].filter((k) => k in thresholds).map((k) => numberField(k))}
        </div>
      </section>
    </div>
  );
}

export default AlertRules;
