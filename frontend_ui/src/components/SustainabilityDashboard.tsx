import { motion } from 'motion/react';
import { ArrowLeft, Leaf, Droplet, Zap, TrendingUp, Award, ChevronLeft, ChevronRight, Lock, X } from 'lucide-react';
import { Screen } from '../App';
import { PieChart, Pie, Cell, ResponsiveContainer, Label, Sector } from 'recharts';
import { useEffect, useState } from 'react';
import { apiPost } from '../lib/api';
import { BottomNav } from './BottomNav';

interface SustainabilityDashboardProps {
  onNavigate: (screen: Screen) => void;
  onSelectGarment: (id: number) => void;
}

type ImpactSummary = {
  carbon_saved_kg?: number;
  water_saved_l?: number;
  energy_saved_kwh?: number;
  avg_wears?: number;
};

type FabricItem = {
  name: string;
  value: number;
  color: string;
};

type GarmentItem = {
  id: number;
  name: string;
  image_url?: string;
  fabric_type?: string | null;
  wear_count?: number;
};

type Achievement = {
  key: string;
  title: string;
  desc: string;
  earned: boolean;
  claimed: boolean;
  points: number;
};

export function SustainabilityDashboard({ onNavigate, onSelectGarment }: SustainabilityDashboardProps) {
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [fabricData, setFabricData] = useState<FabricItem[]>([]);
  const [items, setItems] = useState<GarmentItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFabric, setActiveFabric] = useState<string | null>(null);
  const [fabricModal, setFabricModal] = useState<string | null>(null);
  const [modalPage, setModalPage] = useState(0);
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sustainability/?month=${monthKey}`, { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.status === 'success') {
          setImpact(payload.impact || null);
          setFabricData(payload.fabric || []);
          setItems(payload.items || []);
          setAchievements(payload.achievements || []);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [monthKey]);

  useEffect(() => {
    const shouldLock = !!fabricModal || showBreakdown;
    if (shouldLock) {
      const body = document.body;
      const html = document.documentElement;
      const originalBodyOverflow = body.style.overflow;
      const originalHtmlOverflow = html.style.overflow;
      const originalBodyTouch = body.style.touchAction;
      const originalHtmlTouch = html.style.touchAction;
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
      body.style.touchAction = 'none';
      html.style.touchAction = 'none';
      return () => {
        body.style.overflow = originalBodyOverflow;
        html.style.overflow = originalHtmlOverflow;
        body.style.touchAction = originalBodyTouch;
        html.style.touchAction = originalHtmlTouch;
      };
    }
    return undefined;
  }, [fabricModal, showBreakdown]);

  const handleClaim = async (key: string) => {
    const form = new FormData();
    form.append('key', key);
    const response = await apiPost('/api/achievements/claim/', form);
    if (response.ok) {
      setAchievements((prev) =>
        prev.map((badge) => (badge.key === key ? { ...badge, claimed: true } : badge))
      );
    }
  };
  const handleFabricHighlight = (name: string) => {
    setActiveFabric(name);
  };
  const handleFabricOpen = (name: string) => {
    setActiveFabric(name);
    setFabricModal(name);
  };
  const handleFabricCellActivate = (name: string, event?: React.SyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    handleFabricOpen(name);
  };
  const itemsForFabric = fabricModal
    ? items.filter((item) => (item.fabric_type || 'Other') === fabricModal)
    : [];
  const itemsPerPage = 4;
  const pageCount = Math.max(1, Math.ceil(itemsForFabric.length / itemsPerPage));
  const pagedItems = itemsForFabric.slice(
    modalPage * itemsPerPage,
    modalPage * itemsPerPage + itemsPerPage
  );
  const activeIndex = activeFabric
    ? fabricData.findIndex((entry) => entry.name === activeFabric)
    : -1;

  useEffect(() => {
    if (fabricModal) {
      setModalPage(0);
    }
  }, [fabricModal]);

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-6 h-6 text-charcoal" />
          </button>
          <div className="flex items-center gap-2">
            <button
              className="p-2"
              onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))}
            >
              <ChevronLeft className="w-5 h-5 text-charcoal" />
            </button>
            <span className="caption text-charcoal/60">
              {monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              className="p-2"
              onClick={() => setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))}
            >
              <ChevronRight className="w-5 h-5 text-charcoal" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Leaf className="w-6 h-6 text-sage" />
          <h1>Your Impact</h1>
        </div>
        <p className="subheading text-charcoal/60">Track your eco-footprint</p>
      </div>

      {/* Hero Stat */}
      <div className="px-6 mb-6">
        <div className="py-12 px-8 rounded-3xl bg-sage text-white text-center shadow-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            <div className="text-5xl font-semibold mb-3">
              {loading ? '...' : `${impact?.carbon_saved_kg || 0} kg`}
            </div>
            <p className="text-sm text-white/90 tracking-wide mt-1">CO2 Saved This Month</p>
          </motion.div>
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-white/90">
            <TrendingUp className="w-4 h-4" />
            <span>Impact based on wardrobe usage</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 mb-6 grid grid-cols-3 gap-3">
        {loading && (
          <>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white border border-sand text-center animate-pulse">
                <div className="w-6 h-6 bg-sand/60 rounded-full mx-auto mb-2" />
                <div className="h-5 bg-sand/60 rounded w-12 mx-auto mb-2" />
                <div className="h-3 bg-sand/40 rounded w-16 mx-auto" />
              </div>
            ))}
          </>
        )}
        {!loading && (
          <div className="p-4 rounded-2xl bg-white border border-sand text-center">
            <Droplet className="w-6 h-6 text-sage mx-auto mb-2" />
            <div className="text-xl font-semibold mb-1">{impact?.water_saved_l || 0}L</div>
            <div className="microtext text-charcoal/60">Water Saved</div>
          </div>
        )}

        {!loading && (
          <div className="p-4 rounded-2xl bg-white border border-sand text-center">
            <Zap className="w-6 h-6 text-gold mx-auto mb-2" />
            <div className="text-xl font-semibold mb-1">{impact?.energy_saved_kwh || 0}kWh</div>
            <div className="microtext text-charcoal/60">Energy Saved</div>
          </div>
        )}

        {!loading && (
          <div className="p-4 rounded-2xl bg-white border border-sand text-center">
            <Award className="w-6 h-6 text-terracotta mx-auto mb-2" />
            <div className="text-xl font-semibold mb-1">{impact?.avg_wears || 0}</div>
            <div className="microtext text-charcoal/60">Avg Wears</div>
          </div>
        )}
      </div>

      {/* Fabric Composition */}
      <div className="px-6 mb-6">
        <div className="p-6 rounded-3xl bg-sand relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          </div>
          <h3 className="mb-4">Wardrobe Composition</h3>

          <div className="mb-6">
            {loading ? (
              <div className="h-[200px] rounded-2xl bg-white/60 animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={fabricData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={98}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={3}
                    cornerRadius={8}
                    isAnimationActive
                    animationBegin={120}
                    animationDuration={900}
                    activeIndex={activeIndex >= 0 ? activeIndex : undefined}
                    activeShape={(props) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props as any;
                      return (
                        <Sector
                          cx={cx}
                          cy={cy}
                          innerRadius={innerRadius}
                          outerRadius={outerRadius + 6}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          fill={fill}
                          stroke="rgba(255,255,255,0.9)"
                          strokeWidth={3}
                        />
                      );
                    }}
                    onClick={(data) => {
                      if (data && (data as any).name) {
                        handleFabricHighlight((data as any).name);
                      }
                    }}
                  >
                    {fabricData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth={activeFabric === entry.name ? 3 : 2}
                        onMouseEnter={() => setActiveFabric(entry.name)}
                        onClick={() => handleFabricHighlight(entry.name)}
                      />
                    ))}
                    <Label
                      value={activeFabric || `${fabricData.length} fabrics`}
                      position="center"
                      className="text-[11px] fill-charcoal"
                    />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
              {fabricData.map((fabric) => (
                <button
                  key={fabric.name}
                  type="button"
                  onClick={(event) => handleFabricCellActivate(fabric.name, event)}
                  onPointerUp={(event) => handleFabricCellActivate(fabric.name, event)}
                  onTouchEnd={(event) => handleFabricCellActivate(fabric.name, event)}
                  onTouchStart={(event) => handleFabricCellActivate(fabric.name, event)}
                  onMouseDown={(event) => handleFabricCellActivate(fabric.name, event)}
                  className={`flex items-center gap-2 p-3 rounded-xl bg-white border transition-all text-left ${
                    activeFabric === fabric.name ? 'border-sage bg-sage/5' : 'border-sand'
                  } cursor-pointer pointer-events-auto`}
                >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: fabric.color }}
                />
                <div className="flex-1 flex items-center justify-between gap-3">
                  <div className="text-base font-semibold">{fabric.name}</div>
                  <div className="text-base font-semibold text-charcoal/70">{fabric.value}%</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="px-6 mb-6">
        <h3 className="mb-4">Eco Achievements</h3>
        <div className="space-y-3">
          {achievements.map((badge, index) => (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-2xl border-2 ${
                badge.earned
                  ? 'bg-sage/5 border-sage'
                  : 'bg-white border-sand'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  badge.earned ? 'bg-sage/20 text-sage' : 'bg-sand text-charcoal/50'
                }`}>
                  {badge.earned ? <Award className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-0.5">{badge.title}</div>
                  <p className="caption text-charcoal/60">{badge.desc}</p>
                </div>
                {badge.earned && !badge.claimed && (
                  <button
                    onClick={() => handleClaim(badge.key)}
                    className="px-3 py-2 rounded-xl bg-sage text-white caption font-semibold"
                  >
                    Claim {badge.points}
                  </button>
                )}
                {badge.claimed && (
                  <span className="caption text-sage font-semibold">Claimed</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Removed breakdown toggle for prototype */}

      {fabricModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setFabricModal(null)}
          style={{ touchAction: 'none' }}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="w-[92%] max-w-md rounded-3xl bg-ivory p-6 h-[70vh] max-h-[70vh] overflow-hidden shadow-xl"
            onClick={(event) => event.stopPropagation()}
            style={{ touchAction: 'pan-y' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3>{fabricModal} Items</h3>
                <p className="caption text-charcoal/60">Filtered by fabric</p>
              </div>
              <button
                onClick={() => setFabricModal(null)}
                className="w-9 h-9 rounded-full bg-white border border-sand flex items-center justify-center"
              >
                <X className="w-4 h-4 text-charcoal/70" />
              </button>
            </div>
            <div className="h-[52vh] overflow-y-auto overscroll-contain pr-1">
              {itemsForFabric.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <div className="p-4 rounded-2xl bg-white border border-sand text-center caption text-charcoal/60">
                    No items found for this fabric yet.
                  </div>
                </div>
              )}
              {itemsForFabric.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {pagedItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectGarment(item.id);
                        setFabricModal(null);
                        onNavigate('garment-details');
                      }}
                      className="rounded-3xl bg-sand overflow-hidden text-left"
                    >
                      <div className="aspect-[3/4] bg-white flex items-center justify-center">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl text-charcoal/40">*</span>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-semibold">{item.name}</div>
                        <div className="microtext text-charcoal/60">
                          {item.fabric_type || 'Fabric'} - {item.wear_count || 0} wears
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {itemsForFabric.length > itemsPerPage && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setModalPage((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-full bg-white border border-sand text-sm font-semibold"
                >
                  Prev
                </button>
                <div className="caption text-charcoal/60">
                  {modalPage + 1} / {pageCount}
                </div>
                <button
                  type="button"
                  onClick={() => setModalPage((prev) => Math.min(pageCount - 1, prev + 1))}
                  className="px-4 py-2 rounded-full bg-white border border-sand text-sm font-semibold"
                >
                  Next
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <BottomNav current="sustainability" onNavigate={onNavigate} />
    </div>
  );
}
