import { motion } from 'motion/react';
import { ArrowLeft, Recycle, Package, Heart, MapPin, ArrowRight } from 'lucide-react';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { apiPost } from '../lib/api';

interface EndOfLifeProps {
  onNavigate: (screen: Screen) => void;
  garmentId: number | null;
}

const options = [
  {
    id: 'recycle',
    icon: Recycle,
    title: 'Recycle',
    description: 'Transform into new materials',
    recommended: true,
    impact: 'High eco-impact',
  },
  {
    id: 'decompose',
    icon: Package,
    title: 'Decompose',
    description: 'Natural biodegradation process',
    recommended: false,
    impact: 'Medium eco-impact',
  },
  {
    id: 'donate',
    icon: Heart,
    title: 'Donate',
    description: 'Give to someone in need',
    recommended: true,
    impact: 'High social impact',
  },
];

const donationCenters = [
  {
    name: 'Green Fashion Hub',
    distance: '0.8 mi',
    accepts: 'All textiles',
  },
  {
    name: 'Second Chance Closet',
    distance: '1.2 mi',
    accepts: 'Clothing & accessories',
  },
  {
    name: 'Eco Recycle Center',
    distance: '2.1 mi',
    accepts: 'All materials',
  },
];

type GarmentDetail = {
  id: number;
  name: string;
  fabric_type?: string | null;
  image_url?: string;
};

export function EndOfLife({ onNavigate, garmentId }: EndOfLifeProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [garment, setGarment] = useState<GarmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [garmentId]);

  const handleConfirm = async () => {
    if (!selectedOption || !garmentId) return;
    const methodMap: Record<string, string> = {
      recycle: 'Recycle',
      donate: 'Donate',
      decompose: 'Resell',
    };
    setSaving(true);
    try {
      const response = await apiPost('/api/discard/', {
        garment_id: garmentId,
        method: methodMap[selectedOption],
      });
      const payload = await response.json();
      if (payload.status === 'success') {
        onNavigate('sustainability');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <button
          onClick={() => onNavigate('garment-details')}
          className="mb-6 p-2 -ml-2"
        >
          <ArrowLeft className="w-6 h-6 text-charcoal" />
        </button>

        <h1 className="mb-2">End of Life</h1>
        <p className="caption text-charcoal/60">
          Give this garment a better ending
        </p>
      </div>

      {loading && (
        <div className="px-6 text-center caption text-charcoal/60">Loading garment...</div>
      )}

      {!loading && garment && (
        <>
          {/* Garment Info */}
          <div className="px-6 mb-6">
            <div className="p-5 rounded-3xl bg-sand flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                {garment.image_url ? (
                  <img
                    src={garment.image_url}
                    alt={garment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl">✚</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="mb-1">{garment.name}</h3>
                <p className="caption text-charcoal/60 mb-2">{garment.fabric_type || 'Unknown'}</p>
                <div className="caption px-3 py-1 rounded-full bg-sage/20 text-sage inline-block">
                  High recyclability
                </div>
              </div>
            </div>
          </div>

          {/* Disposal Options */}
          <div className="px-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-sage" />
              <h3>Best disposal method for this fabric</h3>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedOption(option.id)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedOption === option.id
                      ? 'bg-sage/5 border-sage'
                      : 'bg-white border-sand hover:border-sage/30'
                  }`}
                >
                  {option.recommended && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-terracotta/10 text-terracotta microtext font-semibold">
                      Recommended
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      selectedOption === option.id
                        ? 'bg-sage text-white'
                        : 'bg-sand text-charcoal'
                    }`}>
                      <option.icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{option.title}</h4>
                      <p className="caption text-charcoal/60 mb-2">{option.description}</p>
                      <div className="caption text-sage font-medium">{option.impact}</div>
                    </div>

                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedOption === option.id
                        ? 'bg-sage border-sage'
                        : 'bg-white border-sand'
                    }`}>
                      {selectedOption === option.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Donation Centers */}
          {selectedOption === 'donate' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-sage" />
                <h3>Nearby Donation Centers</h3>
              </div>

              <div className="space-y-3">
                {donationCenters.map((center, index) => (
                  <motion.div
                    key={center.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-2xl bg-white border border-sand hover:border-sage/30 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{center.name}</h4>
                      <span className="caption text-sage">{center.distance}</span>
                    </div>
                    <p className="caption text-charcoal/60">{center.accepts}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Process Steps */}
          {(selectedOption === 'recycle' || selectedOption === 'decompose') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 mb-6"
            >
              <h3 className="mb-4">Process Steps</h3>
              <div className="space-y-3">
                {[
                  { step: 1, text: 'Sort by material type', icon: '📦' },
                  { step: 2, text: 'Remove hardware & accessories', icon: '✂️' },
                  { step: 3, text: 'Prepare for processing', icon: '♻️' },
                  { step: 4, text: 'Transform into new materials', icon: '✨' },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white border border-sand"
                  >
                    <div className="w-8 h-8 rounded-full bg-sage/10 flex items-center justify-center caption font-semibold text-sage">
                      {item.step}
                    </div>
                    <div className="flex-1 caption">{item.text}</div>
                    <div className="text-2xl">{item.icon}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <div className="px-6 pb-8 space-y-3">
            {selectedOption && (
              <>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={saving}
                  className="w-full py-4 rounded-2xl bg-sage text-white font-semibold flex items-center justify-center gap-2 shadow-md"
                >
                  {saving ? 'Saving...' : selectedOption === 'donate' ? 'Schedule Pickup' : 
                   selectedOption === 'recycle' ? 'Start Recycling' : 
                   'Begin Process'}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate('garment-details')}
                  className="w-full py-4 rounded-2xl bg-white border-2 border-sand text-charcoal font-semibold"
                >
                  Keep Item
                </motion.button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
