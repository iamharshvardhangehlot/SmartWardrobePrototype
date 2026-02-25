import { motion } from 'motion/react';
import { ArrowLeft, Lock, Unlock, RefreshCw, Sparkles, Info, X } from 'lucide-react';
import { Screen, OutfitSelection, GarmentSummary } from '../App';
import { useEffect, useRef, useState } from 'react';
import { apiPost } from '../lib/api';
import { BottomNav } from './BottomNav';

interface AIOutfitRecommendationProps {
  onNavigate: (screen: Screen) => void;
  outfitSelection: OutfitSelection;
  onUpdateSelection: (selection: OutfitSelection) => void;
}

const occasions = ['Casual', 'Work', 'Party', 'Date', 'Sport', 'Formal'];

const moodMap: Record<string, string> = {
  Work: 'Formal',
  Date: 'Party',
  Sport: 'Sport',
  Casual: 'Casual',
  Party: 'Party',
  Formal: 'Formal',
};

type ProfilePayload = {
  advanced_stylist_enabled?: boolean;
};

export function AIOutfitRecommendation({
  onNavigate,
  outfitSelection,
  onUpdateSelection,
}: AIOutfitRecommendationProps) {
  const [selectedOccasion, setSelectedOccasion] = useState(outfitSelection.mood || 'Work');
  const [topLocked, setTopLocked] = useState(!!outfitSelection.lock_top);
  const [bottomLocked, setBottomLocked] = useState(!!outfitSelection.lock_bottom);
  const [top, setTop] = useState<GarmentSummary | null>(outfitSelection.top || null);
  const [bottom, setBottom] = useState<GarmentSummary | null>(outfitSelection.bottom || null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [topOptions, setTopOptions] = useState<GarmentSummary[]>([]);
  const [bottomOptions, setBottomOptions] = useState<GarmentSummary[]>([]);
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);
  const [picker, setPicker] = useState<'top' | 'bottom' | null>(null);
  const [topFilter, setTopFilter] = useState('all');
  const [bottomFilter, setBottomFilter] = useState('all');
  const [wearStatus, setWearStatus] = useState('');
  const [wearing, setWearing] = useState(false);
  const infoRef = useRef<HTMLDivElement | null>(null);

  const loadOutfit = (overrideMood?: string) => {
    const mood = moodMap[overrideMood || selectedOccasion] || 'Casual';
    const params = new URLSearchParams();
    params.set('mood', mood);
    if (topLocked && top?.id) {
      params.set('freeze_top', '1');
      params.set('top_id', String(top.id));
    }
    if (bottomLocked && bottom?.id) {
      params.set('freeze_bottom', '1');
      params.set('bottom_id', String(bottom.id));
    }

    setIsShuffling(true);
    fetch(`/api/outfit/?${params.toString()}`, { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.status === 'success') {
          setTop(payload.top || null);
          setBottom(payload.bottom || null);
          onUpdateSelection({
            mood: overrideMood || selectedOccasion,
            top: payload.top || null,
            bottom: payload.bottom || null,
            image_url: outfitSelection.image_url || null,
            lock_top: topLocked,
            lock_bottom: bottomLocked,
          });
        }
      })
      .catch(() => null)
      .finally(() => setIsShuffling(false));
  };

  useEffect(() => {
    loadOutfit(selectedOccasion);
  }, [selectedOccasion]);

  useEffect(() => {
    if (!outfitSelection.top) {
      setTopLocked(false);
    }
    if (!outfitSelection.bottom) {
      setBottomLocked(false);
    }
    if (typeof outfitSelection.lock_top === 'boolean') {
      setTopLocked(outfitSelection.lock_top);
    }
    if (typeof outfitSelection.lock_bottom === 'boolean') {
      setBottomLocked(outfitSelection.lock_bottom);
    }
    setTop(outfitSelection.top || null);
    setBottom(outfitSelection.bottom || null);
  }, [outfitSelection.top?.id, outfitSelection.bottom?.id, outfitSelection.lock_top, outfitSelection.lock_bottom]);

  useEffect(() => {
    fetch('/api/profile/', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.status === 'success') {
          const profile: ProfilePayload = payload.profile || {};
          setAdvancedEnabled(!!profile.advanced_stylist_enabled);
        }
      })
      .catch(() => null);

    fetch('/api/wardrobe/?filter=tops', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.status === 'success') {
          setTopOptions(payload.garments || []);
        }
      })
      .catch(() => null);

    fetch('/api/wardrobe/?category=Bottom', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.status === 'success') {
          setBottomOptions(payload.garments || []);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!showAdvancedInfo) return;
    const handler = (event: MouseEvent) => {
      if (!infoRef.current) return;
      if (!infoRef.current.contains(event.target as Node)) {
        setShowAdvancedInfo(false);
      }
    };
    const closeOnScroll = () => setShowAdvancedInfo(false);
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [showAdvancedInfo]);

  const handleShuffle = () => {
    if (!outfitSelection.lock_top && !outfitSelection.lock_bottom) {
      setTopLocked(false);
      setBottomLocked(false);
    }
    loadOutfit();
  };

  const toggleAdvanced = async () => {
    const next = !advancedEnabled;
    setAdvancedEnabled(next);
    const form = new FormData();
    form.append('enabled', next ? 'true' : 'false');
    await apiPost('/update-advanced-stylist/', form);
    loadOutfit();
  };

  const handleWearThis = async () => {
    if (!top && !bottom) return;
    setWearStatus('');
    setWearing(true);
    const form = new FormData();
    if (top?.id) form.append('top_id', String(top.id));
    if (bottom?.id) form.append('bottom_id', String(bottom.id));
    try {
      const response = await apiPost('/confirm-wear/', form);
      const payload = await response.json();
      if (response.ok && payload.status === 'success') {
        setWearStatus(payload.message || 'Marked as worn.');
      } else {
        setWearStatus(payload.message || 'Unable to confirm wear.');
      }
    } catch {
      setWearStatus('Unable to confirm wear.');
    } finally {
      setWearing(false);
    }
  };

  const filterItems = (
    items: GarmentSummary[],
    filterKey: string,
    type: 'top' | 'bottom'
  ) => {
    if (filterKey === 'all') return items;
    const label = filterKey.toLowerCase();
    const text = (item: GarmentSummary) =>
      `${item.name || ''} ${item.category || ''}`.toLowerCase();

    if (label === 'graphic') return items.filter((item) => /graphic|logo/.test(text(item)));
    if (label === 'solid') return items.filter((item) => /solid/.test(text(item)));
    if (type === 'top') {
      if (label === 'shirt') return items.filter((item) => /shirt|top|tee|t-shirt/.test(text(item)));
      if (label === 'jacket') return items.filter((item) => /jacket|blazer|layer/.test(text(item)));
    }
    if (type === 'bottom') {
      if (label === 'pants') return items.filter((item) => /pant|trouser/.test(text(item)));
      if (label === 'shorts') return items.filter((item) => /short/.test(text(item)));
      if (label === 'jeans') return items.filter((item) => /jean/.test(text(item)));
    }
    return items;
  };

  const handleCustomPick = (item: GarmentSummary, type: 'top' | 'bottom') => {
    if (type === 'top') {
      setTop(item);
      setTopLocked(true);
      onUpdateSelection({
        ...outfitSelection,
        top: item,
        lock_top: true,
      });
    } else {
      setBottom(item);
      setBottomLocked(true);
      onUpdateSelection({
        ...outfitSelection,
        bottom: item,
        lock_bottom: true,
      });
    }
    setPicker(null);
  };

  return (
    <div className="min-h-screen bg-ivory pb-20">
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => onNavigate('home')} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-charcoal" />
          </button>
          <button onClick={handleShuffle} disabled={isShuffling} className="p-2 -mr-2">
            <RefreshCw className={`w-6 h-6 text-sage ${isShuffling ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="flex items-center gap-2 mr-auto">
            <Sparkles className="w-6 h-6 text-sage" />
            <h1>AI Outfit</h1>
          </div>
          {/*
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={advancedEnabled}
                onChange={toggleAdvanced}
                className="sr-only peer"
                aria-label="Toggle advanced stylist"
              />
              <div className="relative w-10 h-6 bg-sand rounded-full border border-sand peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sage/20 peer-checked:bg-sage after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-sand after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
              <span className="select-none ms-2 text-xs font-semibold text-charcoal/70">Advanced</span>
            </label>
            <div className="relative" ref={infoRef}>
              <button
                type="button"
                onClick={() => setShowAdvancedInfo(!showAdvancedInfo)}
                className="w-8 h-8 rounded-full bg-white border border-sand flex items-center justify-center"
                aria-label="Advanced stylist info"
              >
                <Info className="w-4 h-4 text-charcoal/70" />
              </button>
              {showAdvancedInfo && (
                <div className="absolute right-0 top-11 w-72 p-3 rounded-2xl bg-white border border-sand shadow-lg text-xs leading-snug text-charcoal/70 z-20">
                  Uses weather, cost-per-wear, and freshness rules to refine AI picks.
                </div>
              )}
            </div>
          </div>
          */}
        </div>
        <p className="subheading text-charcoal/60">Styled just for you</p>
      </div>

      <div className="px-6 mb-6">
        <label className="microtext text-charcoal/60 mb-3 block">SELECT OCCASION</label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {occasions.map((occasion) => (
            <button
              key={occasion}
              onClick={() => setSelectedOccasion(occasion)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedOccasion === occasion
                  ? 'bg-sage text-white'
                  : 'bg-white border-2 border-sand text-charcoal/70'
              }`}
            >
              {occasion}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="p-6 rounded-3xl bg-sand">
          <div className="aspect-[3/4] rounded-2xl bg-white flex flex-col items-center justify-center gap-4">
            {top?.image_url ? (
              <img src={top.image_url} alt={top.name} className="h-48 object-contain" />
            ) : (
              <div className="text-5xl text-charcoal/30">?</div>
            )}
            {bottom?.image_url ? (
              <img src={bottom.image_url} alt={bottom.name} className="h-48 object-contain" />
            ) : (
              <div className="text-5xl text-charcoal/30">?</div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShuffle}
          className="w-full py-3 rounded-2xl bg-sage text-white font-semibold shadow-md"
        >
          Generate Outfit
        </motion.button>
      </div>

      <div className="px-6 mb-6 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3>Outfit Details</h3>
          <span className="caption text-charcoal/60">Tap to freeze - Tap card to change</span>
        </div>

        {[
          { key: 'top', item: top, locked: topLocked, setLocked: setTopLocked },
          { key: 'bottom', item: bottom, locked: bottomLocked, setLocked: setBottomLocked },
        ].map(({ key, item, locked, setLocked }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setPicker(key as 'top' | 'bottom')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              locked ? 'bg-sage/5 border-sage' : 'bg-white border-sand'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-sand flex items-center justify-center overflow-hidden">
                {item?.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-charcoal/40">-</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-0.5">{item?.name || 'Loading'}</h4>
                <p className="caption text-charcoal/60">{item?.category || key}</p>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  const next = !locked;
                  setLocked(next);
                  onUpdateSelection({
                    ...outfitSelection,
                    lock_top: key === 'top' ? next : outfitSelection.lock_top,
                    lock_bottom: key === 'bottom' ? next : outfitSelection.lock_bottom,
                  });
                }}
                className={`p-2.5 rounded-xl transition-all ${
                  locked ? 'bg-sage text-white' : 'bg-sand text-charcoal/60'
                }`}
              >
                {locked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="px-6 space-y-3 pb-8">
        {wearStatus && (
          <div className="p-3 rounded-2xl bg-white border border-sand text-charcoal/70 caption">
            {wearStatus}
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleWearThis}
          disabled={wearing}
          className="w-full py-4 rounded-2xl bg-sage text-white font-semibold shadow-md disabled:opacity-70"
        >
          {wearing ? 'Saving...' : 'Wear This'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('try-on')}
          className="w-full py-4 rounded-2xl bg-sage text-white font-semibold shadow-md"
        >
          Try Outfit
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('calendar')}
          className="w-full py-4 rounded-2xl bg-white border-2 border-sand text-charcoal font-semibold"
        >
          Save Look
        </motion.button>
      </div>

      {picker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setPicker(null)}
        >
          <div
            className="w-[92vw] max-w-md rounded-3xl bg-ivory p-4 shadow-xl flex flex-col overflow-hidden"
            style={{ height: '70vh', minHeight: '70vh', maxHeight: '70vh' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">
                {picker === 'top' ? 'Choose Top' : 'Choose Bottom'}
              </h3>
              <button onClick={() => setPicker(null)} className="p-2 rounded-full bg-white border border-sand">
                <X className="w-4 h-4 text-charcoal/70" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {(picker === 'top'
                ? [
                    { label: 'All', value: 'all' },
                    { label: 'Graphic', value: 'graphic' },
                    { label: 'Solid', value: 'solid' },
                    { label: 'Shirts', value: 'shirt' },
                    { label: 'Jackets', value: 'jacket' },
                  ]
                : [
                    { label: 'All', value: 'all' },
                    { label: 'Pants', value: 'pants' },
                    { label: 'Shorts', value: 'shorts' },
                    { label: 'Jeans', value: 'jeans' },
                    { label: 'Solid', value: 'solid' },
                  ]
              ).map((filter) => {
                const active = picker === 'top' ? topFilter === filter.value : bottomFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    onClick={() =>
                      picker === 'top' ? setTopFilter(filter.value) : setBottomFilter(filter.value)
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      active ? 'bg-sage text-white' : 'bg-white border border-sand text-charcoal/70'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto">
              {filterItems(
                picker === 'top' ? topOptions : bottomOptions,
                picker === 'top' ? topFilter : bottomFilter,
                picker
              ).length === 0 && (
                <div className="p-3 rounded-2xl bg-white border border-sand text-center caption text-charcoal/60">
                  No items found. Add more items to your wardrobe.
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {filterItems(
                  picker === 'top' ? topOptions : bottomOptions,
                  picker === 'top' ? topFilter : bottomFilter,
                  picker
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCustomPick(item, picker as 'top' | 'bottom')}
                    className="rounded-2xl bg-white border border-sand overflow-hidden text-left"
                  >
                    <div className="aspect-square bg-sand/70 flex items-center justify-center p-2">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-charcoal/40">?</span>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="text-[10px] font-semibold leading-tight line-clamp-2 min-h-[28px]">
                        {item.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav current="ai-outfit" onNavigate={onNavigate} />
    </div>
  );
}
