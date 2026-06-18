import { FiActivity, FiThermometer, FiBox } from "react-icons/fi";

interface Props {
  animals: any[];
  windowDays?: number;
}

export default function AnimalStats({ animals, windowDays = 7 }: Props) {
  const total_animals = animals.length;
  const health_events = animals.reduce((sum, a) => sum + (a.health_events || 0), 0);
  const heat_events = animals.reduce((sum, a) => sum + (a.heat_events || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* Total Animals */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
        <div>
          <p className="text-[13px] font-medium text-[#667085] uppercase tracking-wide">Total Animals</p>
          <h3 className="text-3xl font-bold text-[#101828] mt-1">{total_animals}</h3>
        </div>
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <FiBox size={24} />
        </div>
      </div>

      {/* Health Events */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
        <div>
          <p className="text-[13px] font-medium text-[#667085] uppercase tracking-wide">Health Events ({windowDays}d)</p>
          <h3 className="text-3xl font-bold text-[#101828] mt-1">{health_events}</h3>
        </div>
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
          <FiActivity size={24} />
        </div>
      </div>

      {/* Heat Events */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
        <div>
          <p className="text-[13px] font-medium text-[#667085] uppercase tracking-wide">Heat Events ({windowDays}d)</p>
          <h3 className="text-3xl font-bold text-[#101828] mt-1">{heat_events}</h3>
        </div>
        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
          <FiThermometer size={24} />
        </div>
      </div>

    </div>
  );
}
