// Pill toggles to show/hide individual metric lines on the analysis chart.

export interface MetricDef {
    key: string;
    label: string;
    color: string;
}

interface MetricTogglesProps {
    metrics: MetricDef[];
    visible: Set<string>;
    onToggle: (key: string) => void;
}

function MetricToggles({ metrics, visible, onToggle }: MetricTogglesProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {metrics.map((m) => {
                const isOn = visible.has(m.key);
                return (
                    <button
                        key={m.key}
                        onClick={() => onToggle(m.key)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-all ${
                            isOn
                                ? "bg-white border-[#D1D5DC] text-[#101828]"
                                : "bg-gray-50 border-gray-100 text-[#98A2B3]"
                        }`}
                    >
                        <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: isOn ? m.color : "#D1D5DC" }}
                        />
                        {m.label}
                    </button>
                );
            })}
        </div>
    );
}

export default MetricToggles;
