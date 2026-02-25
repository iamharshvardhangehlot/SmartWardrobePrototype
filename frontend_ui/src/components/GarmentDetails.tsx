import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Leaf, TrendingUp, Trash2, Share2 } from 'lucide-react';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { apiPost } from '../lib/api';

interface GarmentDetailsProps {
  onNavigate: (screen: Screen) => void;
  garmentId: number | null;
  onStyleItem: (garment: GarmentDetail) => void;
}

type GarmentDetail = {
  id: number;
  name: string;
  category?: string;
  image_url?: string;
  purchase_price?: number;
  wear_count?: number;
  cost_per_wear?: number;
  fabric_type?: string | null;
  detected_material?: string;
  last_worn?: string | null;
  break_even_status?: number;
  eco_impact?: {
    carbon_kg?: number;
    water_l?: number;
    energy_kwh?: number;
  };
};

const fabricOptions = [
  'Cotton',
  'Linen',
  'Wool',
  'Denim',
  'Silk',
  'Polyester',
  'Nylon',
  'Synthetic',
  'Leather',
  'Suede',
  'Other',
];

export function GarmentDetails({ onNavigate, garmentId, onStyleItem }: GarmentDetailsProps) {
  const [garment, setGarment] = useState<GarmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingFabric, setEditingFabric] = useState(false);
  const [fabricValue, setFabricValue] = useState('Other');
  const [savingFabric, setSavingFabric] = useState(false);
  const [fabricStatus, setFabricStatus] = useState('');

  useEffect(() => {
    if (!garmentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/garments/${garmentId}/`, { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.status === 'success') {
          setGarment(payload.garment);
          if (payload.garment?.fabric_type) {
            setFabricValue(payload.garment.fabric_type);
          }
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [garmentId]);

  if (!garmentId) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center">
        <p className="caption text-charcoal/60">Select a garment first.</p>
        <button
          onClick={() => onNavigate('wardrobe')}
          className="mt-4 px-4 py-2 rounded-xl bg-sage text-white"
        >
          Back to Wardrobe
        </button>
      </div>
    );
  }

  if (loading || !garment) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <p className="caption text-charcoal/60">Loading details...</p>
      </div>
    );
  }

  const wearCount = garment.wear_count || 0;
  const costPerWear = garment.cost_per_wear || 0;
  const lifecycle = garment.break_even_status || 0;

  const handleFabricSave = async () => {
    if (!garment) return;
    setSavingFabric(true);
    setFabricStatus('');
    const form = new FormData();
    form.append('fabric_type', fabricValue);
    try {
      const response = await apiPost(`/api/garments/${garment.id}/`, form);
      const payload = await response.json();
      if (response.ok && payload.status === 'success') {
        setGarment({ ...garment, fabric_type: payload.fabric_type || fabricValue });
        setEditingFabric(false);
      } else {
        setFabricStatus('Unable to update fabric type.');
      }
    } catch {
      setFabricStatus('Unable to update fabric type.');
    } finally {
      setSavingFabric(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header with Image */}
      <div className="relative">
        <div className="aspect-[3/4] bg-sand flex items-center justify-center">
          {garment.image_url ? (
            <img
              src={garment.image_url}
              alt={garment.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-9xl">✚</div>
          )}
        </div>
        
        {/* Back Button */}
        <button
          onClick={() => onNavigate('wardrobe')}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-charcoal" />
        </button>

        {/* Share Button */}
        <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
          <Share2 className="w-5 h-5 text-charcoal" />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Title */}
        <div>
          <h1 className="mb-2">{garment.name}</h1>
          <div className="flex items-center gap-4 caption text-charcoal/60">
            <span>{garment.category || 'Garment'}</span>
            <span>•</span>
            <span>Fabric {garment.fabric_type || 'Unknown'}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-sand text-center">
            <div className="text-2xl font-semibold text-sage mb-1">{wearCount}</div>
            <div className="microtext text-charcoal/60">Times Worn</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-sand text-center">
            <div className="text-2xl font-semibold text-sage mb-1">₹{Math.round(costPerWear)}</div>
            <div className="microtext text-charcoal/60">Cost/Wear</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-sand text-center">
            <div className="text-2xl font-semibold text-sage mb-1">{lifecycle}%</div>
            <div className="microtext text-charcoal/60">Value Recovered</div>
          </div>
        </div>

        {/* Garment Info */}
        <div className="p-5 rounded-2xl bg-white border border-sand space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Fabric Type</span>
              {!editingFabric && (
                <button
                  onClick={() => setEditingFabric(true)}
                  className="caption px-3 py-1 rounded-full bg-sand text-charcoal"
                >
                  {garment.fabric_type || 'Unknown'}
                </button>
              )}
            </div>
            {editingFabric ? (
              <div className="space-y-3">
                <select
                  value={fabricValue}
                  onChange={(event) => setFabricValue(event.target.value)}
                  className="w-full rounded-xl border border-sand bg-ivory px-4 py-3 text-charcoal"
                >
                  {fabricOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFabricSave}
                    disabled={savingFabric}
                    className="flex-1 py-2 rounded-xl bg-sage text-white font-semibold text-sm"
                  >
                    {savingFabric ? 'Saving...' : 'Update'}
                  </button>
                  <button
                    onClick={() => setEditingFabric(false)}
                    className="flex-1 py-2 rounded-xl bg-white border border-sand text-charcoal text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
                {fabricStatus && (
                  <div className="caption text-terracotta">{fabricStatus}</div>
                )}
              </div>
            ) : (
              <p className="caption text-charcoal/60">
                {garment.detected_material || 'Material details unavailable.'}
              </p>
            )}
          </div>

          <div className="border-t border-sand pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Original Price</span>
              <span className="caption">₹{Math.round(garment.purchase_price || 0)}</span>
            </div>
          </div>
        </div>

        {/* Lifecycle Score */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-sage/10 to-sage/5 border border-sage/20">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-sage" />
            <span className="font-semibold">Lifecycle Health</span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="h-3 rounded-full bg-white/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${lifecycle}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-sage rounded-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between caption text-charcoal/70">
            <span>Lifecycle</span>
            <span className="font-semibold text-sage">{lifecycle}/100</span>
          </div>
        </div>

        {/* Sustainability Impact */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-terracotta/10 to-gold/10 border border-terracotta/20">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-terracotta" />
            <span className="font-semibold">Sustainability Impact</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="caption text-charcoal/70">Carbon Footprint</span>
              <span className="caption font-semibold">{garment.eco_impact?.carbon_kg ?? 0} kg CO₂</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="caption text-charcoal/70">Water Usage</span>
              <span className="caption font-semibold">{garment.eco_impact?.water_l ?? 0} L</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="caption text-charcoal/70">Energy Usage</span>
              <span className="caption font-semibold">{garment.eco_impact?.energy_kwh ?? 0} kWh</span>
            </div>
          </div>
        </div>

        {/* Last Worn */}
        <div className="p-5 rounded-2xl bg-white border border-sand">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-sage" />
            <span className="font-semibold">Last Worn</span>
          </div>
          <p className="caption text-charcoal/60">
            {garment.last_worn ? new Date(garment.last_worn).toDateString() : 'Not worn yet'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onStyleItem(garment);
              onNavigate('ai-outfit');
            }}
            className="w-full py-4 rounded-2xl bg-sage text-white font-semibold shadow-md"
          >
            Style This Item
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('end-of-life')}
            className="w-full py-4 rounded-2xl bg-white border-2 border-terracotta/30 text-terracotta font-semibold flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Remove from Closet
          </motion.button>
        </div>
      </div>
    </div>
  );
}
