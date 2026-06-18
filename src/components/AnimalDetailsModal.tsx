import { useState, useEffect } from "react";
import type { IAnimal } from "../interface/MooHero";
import { getAnimalDetails, updateAnimal, getStoredMooHeroEvents } from "../api/moohero";
import { getFarms, getBarnsByFarm, getLocationByBarn } from "../api/barns";
import { useBarn } from "../context/BarnContext";
import toast from "react-hot-toast";
import { FiX, FiActivity, FiThermometer } from "react-icons/fi";

interface Props {
  animal: IAnimal;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: (updatedData?: any) => void;
  windowDays?: number;
}

export default function AnimalDetailsModal({ animal, isOpen, onClose, onRefresh, windowDays = 7 }: Props) {
  const [loading, setLoading] = useState(true);
  const { selectedFarmId } = useBarn();
  const [, setDetails] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [farms, setFarms] = useState<any[]>([]);
  const [barns, setBarns] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [selectedFarm, setSelectedFarm] = useState(selectedFarmId || "");

  const [formData, setFormData] = useState({
    animal_name: animal.animal_name || "",
    animal_type: animal.animal_type || "",
    moohero_collar_unique_id: animal.moohero_collar_unique_id || "",
    barn_id: animal.barn_id || "",
    feeding_location_id: animal.feeding_location_id || "",
  });

  useEffect(() => {
    getFarms().then(setFarms).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      getBarnsByFarm(selectedFarm).then(res => setBarns(res.barns || [])).catch(console.error);
    } else {
      setBarns([]);
    }
  }, [selectedFarm]);

  useEffect(() => {
    if (formData.barn_id) {
      getLocationByBarn(formData.barn_id).then(res => setLocations(res.feeding_locations || [])).catch(console.error);
    } else {
      setLocations([]);
    }
  }, [formData.barn_id]);

  useEffect(() => {
    if (isOpen) {
      loadDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, windowDays]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await getAnimalDetails(animal.id, windowDays);
      setDetails(data);

      const storedRes = await getStoredMooHeroEvents(windowDays);
      // API returns { events, count }; tolerate an array or a `data` field too.
      const allEvents = Array.isArray(storedRes) ? storedRes : (storedRes?.events || storedRes?.data || []);
      const myEvents = allEvents.filter((e: any) => e.moohero_collar_unique_id === animal?.moohero_collar_unique_id);
      setEvents(myEvents);
    } catch (err) {
      console.error("Failed to load details or events:", err);
      toast.error("Failed to load animal details or events");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAnimal(animal.id, formData);
      toast.success("Animal updated successfully");

      const updatedData = {
        id: animal.id,
        ...formData,
        barn_name: barns.find(b => b.barn_id === formData.barn_id)?.barn_name,
        feeding_location_name: locations.find(l => l.feeding_location_id === formData.feeding_location_id)?.name
      };
      onRefresh(updatedData);
      onClose();
    } catch (err) {
      toast.error("Failed to update animal");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[20px] shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-gray-50/50">
          <div>
            <h2 className="text-[18px] font-semibold text-[#101828]">
              {animal.animal_name || "Animal Details"}
            </h2>
            <p className="text-[13px] text-[#667085] mt-0.5">
              Collar: <span className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{animal.moohero_collar_unique_id || "None"}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <FiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Edit Form */}
            <div>
              <h3 className="text-[14px] font-semibold text-[#344054] mb-4 uppercase tracking-wide">Edit Details</h3>
              <form id="editAnimalForm" onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#344054] mb-1.5">Name</label>
                  <input
                    type="text"
                    value={formData.animal_name}
                    onChange={(e) => setFormData({ ...formData, animal_name: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#D1D5DC] bg-white text-[14px] outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#344054] mb-1.5">Type (e.g., Cow, Bull)</label>
                  <input
                    type="text"
                    value={formData.animal_type}
                    onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#D1D5DC] bg-white text-[14px] outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#344054] mb-1.5">Collar Unique ID</label>
                  <input
                    type="text"
                    value={formData.moohero_collar_unique_id}
                    onChange={(e) => setFormData({ ...formData, moohero_collar_unique_id: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#D1D5DC] bg-white text-[14px] outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E] transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#344054] mb-1.5">Farm</label>
                  <select
                    value={selectedFarm}
                    onChange={(e) => {
                      setSelectedFarm(e.target.value);
                      setFormData({ ...formData, barn_id: "", feeding_location_id: "" });
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-[#D1D5DC] bg-white text-[14px] outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E] transition-all"
                  >
                    <option value="">Select Farm</option>
                    {farms.map((f) => (
                      <option key={f.farm_id} value={f.farm_id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#344054] mb-1.5">Barn</label>
                  <select
                    value={formData.barn_id}
                    onChange={(e) => setFormData({ ...formData, barn_id: e.target.value, feeding_location_id: "" })}
                    disabled={!selectedFarm}
                    className="w-full h-10 px-3 rounded-lg border border-[#D1D5DC] bg-white text-[14px] outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E] transition-all disabled:opacity-50"
                  >
                    <option value="">Select Barn</option>
                    {barns.map((b) => (
                      <option key={b.barn_id} value={b.barn_id}>{b.barn_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#344054] mb-1.5">Feeding Location</label>
                  <select
                    value={formData.feeding_location_id}
                    onChange={(e) => setFormData({ ...formData, feeding_location_id: e.target.value })}
                    disabled={!formData.barn_id}
                    className="w-full h-10 px-3 rounded-lg border border-[#D1D5DC] bg-white text-[14px] outline-none focus:ring-2 focus:ring-[#00A63E]/20 focus:border-[#00A63E] transition-all disabled:opacity-50"
                  >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                      <option key={loc.feeding_location_id} value={loc.feeding_location_id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>

            {/* Event History */}
            <div className="flex flex-col h-full">
              <h3 className="text-[14px] font-semibold text-[#344054] mb-4 uppercase tracking-wide flex items-center gap-2">
                Recent Events <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full normal-case tracking-normal">Last {windowDays} days</span>
              </h3>

              <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00A63E]"></div>
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="space-y-3">
                    {events.map((evt: any, i: number) => {
                      const isHealth = (evt.event_type || '').toLowerCase().includes('health');
                      const label = isHealth ? 'Health case' : 'Heat event';
                      const when = evt.event_time || evt.details?.started_at;
                      const started = evt.details?.started_at;
                      const ended = evt.details?.ended_at;
                      return (
                        <div key={evt.id || i} className="flex gap-3 items-start p-3 rounded-xl border border-gray-100 bg-gray-50">
                          <div className={`p-2 rounded-lg mt-0.5 ${isHealth ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {isHealth ? <FiActivity size={14} /> : <FiThermometer size={14} />}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-gray-900">{label}</p>
                            <p className="text-[12px] text-gray-500 mt-0.5">{when ? new Date(when).toLocaleString() : '—'}</p>
                            {started && ended && (
                              <p className="text-[12.5px] text-gray-700 mt-1">
                                {new Date(started).toLocaleString()} → {new Date(ended).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 h-full flex items-center justify-center">
                    <p className="text-[13px] text-gray-500">No events recorded in the last {windowDays} days.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Static Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg text-[14px] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            form="editAnimalForm"
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-[#00A63E] hover:bg-[#009136] text-white rounded-lg text-[14px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}
