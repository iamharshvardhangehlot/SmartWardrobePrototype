import { motion } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Bell } from 'lucide-react';
import { Screen, OutfitSelection } from '../App';
import { useEffect, useMemo, useState } from 'react';
import { apiPost } from '../lib/api';
import { BottomNav } from './BottomNav';

interface OutfitCalendarProps {
  onNavigate: (screen: Screen) => void;
  outfitSelection: OutfitSelection;
  onUpdateSelection: (selection: OutfitSelection) => void;
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ScheduleItem = {
  id: number;
  scheduled_date: string;
  source?: string;
  notify_on_day?: boolean;
  top_id?: number | null;
  bottom_id?: number | null;
  top?: string | null;
  bottom?: string | null;
  top_image_url?: string | null;
  bottom_image_url?: string | null;
  image_url?: string | null;
};

export function OutfitCalendar({ onNavigate, outfitSelection, onUpdateSelection }: OutfitCalendarProps) {
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifyOnSave, setNotifyOnSave] = useState(true);

  const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar/?month=${monthKey}`, { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.status === 'success') {
          setItems(payload.items || []);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [monthKey]);

  const daysInMonth = useMemo(() => {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const total = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [monthStart]);

  const schedulesByDay = useMemo(() => {
    const map: Record<number, ScheduleItem[]> = {};
    items.forEach((item) => {
      const date = new Date(item.scheduled_date);
      const day = date.getDate();
      if (!map[day]) map[day] = [];
      map[day].push(item);
    });
    return map;
  }, [items]);

  const selectedItems = selectedDay ? schedulesByDay[selectedDay] || [] : [];
  const selectedSchedule = selectedItems[0];
  const selectedDate = selectedDay
    ? new Date(monthStart.getFullYear(), monthStart.getMonth(), selectedDay)
    : null;
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  if (selectedDate) selectedDate.setHours(0, 0, 0, 0);
  const isFutureSelected = !!selectedDate && selectedDate > todayDate;
  const canSchedule = !!outfitSelection.top || !!outfitSelection.bottom;
  const formatDate = (year: number, monthIndex: number, day: number) =>
    `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  useEffect(() => {
    if (selectedDay) {
      setNotifyOnSave(true);
    }
  }, [selectedDay]);

  const handleSchedule = async () => {
    if (!selectedDay) return;
    if (!outfitSelection.top && !outfitSelection.bottom) return;

    const dateString = formatDate(monthStart.getFullYear(), monthStart.getMonth(), selectedDay);
    const form = new FormData();
    form.append('scheduled_date', dateString);
    if (outfitSelection.top?.id) form.append('top_id', String(outfitSelection.top.id));
    if (outfitSelection.bottom?.id) form.append('bottom_id', String(outfitSelection.bottom.id));
    if (outfitSelection.image_url) form.append('image_url', outfitSelection.image_url);
    form.append('source', 'custom');
    form.append('notify_on_day', notifyOnSave ? 'true' : 'false');

    setSaving(true);
    try {
      await apiPost('/schedule-outfit/', form);
      const res = await fetch(`/api/calendar/?month=${monthKey}`, { credentials: 'same-origin' });
      const payload = await res.json();
      if (payload && payload.status === 'success') {
        setItems(payload.items || []);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scheduleId: number) => {
    await apiPost(`/api/schedules/${scheduleId}/delete/`, new FormData());
    const res = await fetch(`/api/calendar/?month=${monthKey}`, { credentials: 'same-origin' });
    const payload = await res.json();
    if (payload && payload.status === 'success') {
      setItems(payload.items || []);
      setSelectedDay(null);
    }
  };

  const handleNotifyToggle = async (scheduleId: number, enabled: boolean) => {
    const form = new FormData();
    form.append('enabled', enabled ? 'true' : 'false');
    await apiPost(`/api/schedules/${scheduleId}/notify/`, form);
    const res = await fetch(`/api/calendar/?month=${monthKey}`, { credentials: 'same-origin' });
    const payload = await res.json();
    if (payload && payload.status === 'success') {
      setItems(payload.items || []);
    }
  };

  return (
    <div className="min-h-screen bg-ivory pb-20">
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => onNavigate('home')} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-charcoal" />
          </button>
          <button className="p-2 -mr-2" onClick={() => setSelectedDay(new Date().getDate())}>
            <Plus className="w-6 h-6 text-sage" />
          </button>
        </div>

        <h1 className="mb-2">Outfit Planner</h1>
        <p className="caption text-charcoal/60">Schedule your looks ahead</p>

        <div className="flex items-center justify-between mt-6">
          <button
            className="p-2"
            onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))}
          >
            <ChevronLeft className="w-6 h-6 text-charcoal" />
          </button>
          <h2>{monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <button
            className="p-2"
            onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
          >
            <ChevronRight className="w-6 h-6 text-charcoal" />
          </button>
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center microtext text-charcoal/60 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const dayItems = schedulesByDay[day] || [];
            const hasOutfit = dayItems.length > 0;
            const isSelected = selectedDay === day;
            const today = new Date();
            const isToday =
              day === today.getDate() &&
              monthStart.getMonth() === today.getMonth() &&
              monthStart.getFullYear() === today.getFullYear();
            const preview = dayItems[0];
            const previewImage =
              preview?.image_url || preview?.top_image_url || preview?.bottom_image_url || null;

            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-sage text-white shadow-lg'
                    : isToday
                    ? 'bg-sage/20 text-charcoal'
                    : hasOutfit
                    ? 'bg-sand text-charcoal'
                    : 'bg-white border border-sand text-charcoal/60'
                }`}
              >
                <div className="text-sm font-medium mb-1">{day}</div>
                {hasOutfit && (
                  <div className="mt-1 flex items-center justify-center">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Outfit"
                        className="w-6 h-6 rounded-full border border-sage object-cover"
                      />
                    ) : (
                      <div className="text-xs">*</div>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {!loading && items.length === 0 && (
        <div className="px-6 mb-6">
          <div className="p-5 rounded-3xl bg-white border border-sand text-center">
            <div className="font-semibold mb-2">No outfits scheduled</div>
            <p className="caption text-charcoal/60">Pick a look and save it to your calendar.</p>
          </div>
        </div>
      )}

      {selectedDay && selectedSchedule && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 mb-6"
        >
          <div className="p-6 rounded-3xl bg-sand">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold mb-1">
                  {monthStart.toLocaleString('en-US', { month: 'long' })} {selectedDay}
                </div>
                <p className="caption text-charcoal/60">Scheduled Outfit</p>
              </div>
              <button
                className={`p-2 rounded-xl ${selectedSchedule.notify_on_day ? 'bg-sage text-white' : 'bg-white'}`}
                onClick={() => handleNotifyToggle(selectedSchedule.id, !selectedSchedule.notify_on_day)}
              >
                <Bell className={`w-5 h-5 ${selectedSchedule.notify_on_day ? 'text-white' : 'text-sage'}`} />
              </button>
            </div>

            {selectedSchedule.image_url ? (
              <img
                src={selectedSchedule.image_url || ''}
                alt="Scheduled outfit"
                className="w-full aspect-[3/4] rounded-2xl bg-white object-contain mb-4"
              />
            ) : (
              <div className="aspect-[3/4] rounded-2xl bg-white p-4 mb-4 flex flex-col items-center justify-center gap-3">
                {selectedSchedule.top_image_url ? (
                  <img
                    src={selectedSchedule.top_image_url}
                    alt={selectedSchedule.top || 'Top'}
                    className="h-24 object-contain"
                  />
                ) : (
                  <div className="text-3xl text-charcoal/40">-</div>
                )}
                {selectedSchedule.bottom_image_url ? (
                  <img
                    src={selectedSchedule.bottom_image_url}
                    alt={selectedSchedule.bottom || 'Bottom'}
                    className="h-24 object-contain"
                  />
                ) : (
                  <div className="text-3xl text-charcoal/40">-</div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onUpdateSelection({
                    mood: outfitSelection.mood || 'Casual',
                    top: selectedSchedule.top_id
                      ? { id: selectedSchedule.top_id, name: selectedSchedule.top || 'Top' }
                      : null,
                    bottom: selectedSchedule.bottom_id
                      ? { id: selectedSchedule.bottom_id, name: selectedSchedule.bottom || 'Bottom' }
                      : null,
                    image_url: selectedSchedule.image_url || null,
                    lock_top: !!selectedSchedule.top_id,
                    lock_bottom: !!selectedSchedule.bottom_id,
                  });
                  onNavigate('ai-outfit');
                }}
                className="flex-1 py-3 rounded-xl bg-sage text-white font-semibold caption"
              >
                View Outfit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDelete(selectedSchedule.id)}
                className="flex-1 py-3 rounded-xl bg-white border border-terracotta/40 text-terracotta font-semibold caption"
              >
                Remove
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {selectedDay && !selectedSchedule && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 mb-6"
        >
          <div className="p-6 rounded-3xl bg-white border border-sand">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold mb-1">
                  {monthStart.toLocaleString('en-US', { month: 'long' })} {selectedDay}
                </div>
                <p className="caption text-charcoal/60">
                  {isFutureSelected ? 'Ready to save this look?' : 'Pick a future date to save a look.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyOnSave((prev) => !prev)}
                className={`p-2 rounded-xl border transition-all ${
                  notifyOnSave ? 'bg-sage text-white border-sage' : 'bg-white text-sage border-sand'
                }`}
                aria-label="Toggle notification"
              >
                <Bell className={`w-5 h-5 ${notifyOnSave ? 'text-white' : 'text-sage'}`} />
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSchedule}
              disabled={!isFutureSelected || !canSchedule || saving}
              className="w-full py-4 rounded-2xl bg-sage text-white font-semibold shadow-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Outfit'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {!selectedDay && (
        <div className="px-6 space-y-3 pb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSchedule}
            className="w-full py-4 rounded-2xl bg-white border-2 border-sand text-charcoal font-semibold flex items-center justify-center gap-2"
          >
            {saving ? 'Scheduling...' : 'Plan New Outfit'}
          </motion.button>
        </div>
      )}

      <BottomNav current="calendar" onNavigate={onNavigate} />
    </div>
  );
}
