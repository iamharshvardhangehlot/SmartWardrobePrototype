import { motion } from 'motion/react';
import { ArrowLeft, RotateCw, ZoomIn, Download, Box } from 'lucide-react';
import { Screen, OutfitSelection } from '../App';
import { useEffect, useRef, useState } from 'react';
import { apiPost } from '../lib/api';

interface VirtualTryOnScreenProps {
  onNavigate: (screen: Screen) => void;
  outfitSelection: OutfitSelection;
  onUpdateSelection: (selection: OutfitSelection) => void;
}

const angleMap: Record<string, string> = {
  Front: '0deg 75deg 2.5m',
  Back: '180deg 75deg 2.5m',
  Left: '-90deg 75deg 2.5m',
  Right: '90deg 75deg 2.5m',
};

export function VirtualTryOnScreen({       
  onNavigate,
  outfitSelection,
  onUpdateSelection,
}: VirtualTryOnScreenProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(outfitSelection.image_url || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [show3d, setShow3d] = useState(false);
  const [activeAngle, setActiveAngle] = useState('Front');
  const [jobId, setJobId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const particles = [
    { x: '20%', y: '30%', dx: '-12px', dy: '-28px', size: 6, delay: '0s', duration: '2.6s' },
    { x: '55%', y: '20%', dx: '14px', dy: '-20px', size: 4, delay: '0.3s', duration: '2.2s' },
    { x: '70%', y: '45%', dx: '18px', dy: '8px', size: 5, delay: '0.6s', duration: '2.8s' },
    { x: '35%', y: '60%', dx: '-10px', dy: '18px', size: 4, delay: '0.9s', duration: '2.4s' },
    { x: '50%', y: '75%', dx: '6px', dy: '24px', size: 6, delay: '1.1s', duration: '3s' },
    { x: '80%', y: '70%', dx: '16px', dy: '16px', size: 4, delay: '1.3s', duration: '2.5s' },
    { x: '25%', y: '75%', dx: '-14px', dy: '10px', size: 5, delay: '1.6s', duration: '2.7s' },
    { x: '45%', y: '40%', dx: '-6px', dy: '-18px', size: 4, delay: '1.9s', duration: '2.3s' },
  ];

  useEffect(() => {
    const topId = outfitSelection.top?.id;
    const bottomId = outfitSelection.bottom?.id;
    if (!topId && !bottomId) return;
    if (imageUrl) return;

    const form = new FormData();
    if (topId) form.append('top_id', String(topId));
    if (bottomId) form.append('bottom_id', String(bottomId));

    setLoading(true);
    setError(null);
    apiPost('/try-on/', form)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload) return;
        if (payload.status === 'success') {
          setImageUrl(payload.image_url);
          onUpdateSelection({
            ...outfitSelection,
            image_url: payload.image_url,
          });
          setLoading(false);
          return;
        }
        if (payload.status === 'processing' && payload.job_id) {
          setJobId(payload.job_id);
          setLoading(true);
          return;
        }
        if (payload.status === 'error') {
          setError(payload.message || 'Try-on failed.');
          setLoading(false);
        }
      })
      .catch(() => null);
  }, [outfitSelection.top?.id, outfitSelection.bottom?.id]);

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    const interval = setInterval(() => {
      fetch(`/api/tryon/${jobId}/`, { credentials: 'same-origin' })
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          if (!active || !payload) return;
          if (payload.status === 'success' && payload.image_url) {
            setImageUrl(payload.image_url);
            onUpdateSelection({
              ...outfitSelection,
              image_url: payload.image_url,
            });
            setLoading(false);
            setJobId(null);
          } else if (payload.status === 'failed') {
            setError(payload.error || 'Try-on failed.');
            setLoading(false);
            setJobId(null);
          }
        })
        .catch(() => null);
    }, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [jobId]);

  useEffect(() => {
    if (!show3d || !viewerRef.current) return;
    viewerRef.current.setAttribute('camera-orbit', angleMap[activeAngle]);
  }, [show3d, activeAngle]);

  const handleSave = async () => {
    if (!imageUrl) return;
    setSaving(true);
    try {
      onUpdateSelection({
        ...outfitSelection,
        image_url: imageUrl,
      });
      onNavigate('calendar');
    } finally {
      setSaving(false);
    }
  };

  const applyAngle = (angle: string) => {
    if (!viewerRef.current) return;
    viewerRef.current.setAttribute('camera-orbit', angleMap[angle]);
    (viewerRef.current as any).cameraOrbit = angleMap[angle];
  };

  const handleAngle = (angle: string) => {
    setActiveAngle(angle);
    if (!show3d) {
      setShow3d(true);
    }
    requestAnimationFrame(() => applyAngle(angle));
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Main Try-On View */}
      <div className="relative">
        <div className="aspect-[3/4] bg-gradient-to-br from-sand to-sand/50 flex items-center justify-center">
          {show3d ? (
            <model-viewer
              ref={viewerRef as any}
              src="/media/avatars/woman-3d-character-model.glb"
              camera-controls
              camera-orbit={angleMap[activeAngle]}
              disable-zoom={false}
              shadow-intensity="1"
              exposure="1.05"
              style={{ width: '100%', height: '100%', background: 'transparent' }}
            />
          ) : (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-36 h-36">
                    {particles.map((particle, index) => (
                      <span
                        key={index}
                        className="particle"
                        style={{
                          left: particle.x,
                          top: particle.y,
                          width: `${particle.size}px`,
                          height: `${particle.size}px`,
                          ['--dx' as any]: particle.dx,
                          ['--dy' as any]: particle.dy,
                          animationDelay: particle.delay,
                          animationDuration: particle.duration,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {error && <div className="caption text-terracotta">{error}</div>}
              {!loading && imageUrl && (
                <img src={imageUrl} alt="Try-on result" className="w-full h-full object-contain" />
              )}
              {!loading && !imageUrl && (
                <div className="caption text-charcoal/60">No try-on image yet.</div>
              )}
            </>
          )}

          {loading && !show3d && (
            <motion.div
              animate={{ y: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sage to-transparent"
            />
          )}
        </div>

        {/* Top Controls */}
        <div className="absolute top-6 left-0 right-0 px-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('ai-outfit')}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 text-charcoal" />
          </button>

          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
              <RotateCw className="w-5 h-5 text-charcoal" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
              <ZoomIn className="w-5 h-5 text-charcoal" />
            </button>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold mb-1">Virtual Try-On</div>
                <p className="caption text-charcoal/60">Rotate & zoom to explore</p>
              </div>
              <button
                type="button"
                onClick={() => setShow3d(!show3d)}
                className={`px-3 py-1 rounded-full caption font-semibold flex items-center gap-1 transition-colors ${
                  show3d ? 'bg-sage text-white' : 'bg-sage/10 text-sage'
                }`}
              >
                <Box className="w-4 h-4" />
                {show3d ? '2D View' : '3D View'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="px-6 py-6 space-y-6">
        {/* View Angles */}
        <div>
          <label className="microtext text-charcoal/60 mb-3 block">VIEW ANGLE</label>
          <div className="grid grid-cols-4 gap-2">
            {['Front', 'Back', 'Left', 'Right'].map((view) => (
              <button
                key={view}
                onClick={() => handleAngle(view)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  view === activeAngle && show3d
                    ? 'bg-sage text-white'
                    : 'bg-white border-2 border-sand text-charcoal/70'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        {/* Outfit Layers */}
        <div>
          <label className="microtext text-charcoal/60 mb-3 block">OUTFIT LAYERS</label>
          <div className="space-y-2">
            {['Top', 'Bottom'].map((layer) => (
              <div
                key={layer}
                className="flex items-center justify-between p-4 rounded-xl bg-white border border-sand"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-sage" />
                  <span className="caption font-medium">{layer}</span>
                </div>
                <div className="caption text-charcoal/60">Visible</div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-sage text-white font-semibold flex items-center justify-center gap-2 shadow-md"
          >
            <Download className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Outfit'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('wardrobe')}
            className="w-full py-4 rounded-2xl bg-white border-2 border-sand text-charcoal font-semibold"
          >
            Change Outfit
          </motion.button>
        </div>
      </div>
    </div>
  );
}
