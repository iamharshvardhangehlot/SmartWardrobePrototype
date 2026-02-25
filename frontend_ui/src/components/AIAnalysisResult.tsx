import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Screen } from '../App';
import { useState, useEffect } from 'react';

interface AIAnalysisResultProps {
  onNavigate: (screen: Screen) => void;
}

type ProfileData = {
  season?: string;
  skin_undertone?: string;
  palette?: string[];
  selfie_url?: string | null;
};

export function AIAnalysisResult({ onNavigate }: AIAnalysisResultProps) {
  const [analyzing, setAnalyzing] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch('/api/profile/', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.status === 'success') {
          setProfile(payload.profile || null);
        }
      })
      .catch(() => null);

    setTimeout(() => {
      setAnalyzing(false);
      setTimeout(() => setRevealed(true), 300);
    }, 1500);
  }, []);

  const season = profile?.season || 'Warm Autumn';
  const undertone = profile?.skin_undertone || 'Warm';
  const selfieUrl = profile?.selfie_url || null;
  const palette = profile?.palette && profile.palette.length > 0
    ? profile.palette
    : ['#D4A574', '#C96A4A', '#7A8450', '#C19A6B', '#EADFC8', '#B8624F', '#7BAE8E', '#6B4423'];

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      {analyzing ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-4 border-sand border-t-sage mb-8"
          />
          <h2 className="mb-2">Analyzing Your Profile</h2>
          <p className="caption text-charcoal/60 text-center">
            AI is processing your photos...
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col"
        >
          {/* Header */}
          <div className="px-6 pt-12 pb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-sage/20 to-terracotta/20 flex items-center justify-center"
            >
              <Sparkles className="w-10 h-10 text-sage" />
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-2"
            >
              You're a {season}
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="caption text-charcoal/60"
            >
              Your best tones align with your season and undertone.
            </motion.p>
          </div>

          {/* Avatar Preview */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="px-6 mb-6"
          >
            <div className="relative">
              <div className="aspect-square max-w-xs mx-auto rounded-3xl bg-gradient-to-br from-sand to-sand/50 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center">
                {selfieUrl ? (
                  <img
                    src={selfieUrl}
                    alt="User selfie"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl">Face</div>
                  </div>
                )}
                {revealed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="absolute inset-0 bg-gradient-to-br from-terracotta/20 to-sage/20"
                  />
                )}
              </div>
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-sage text-white font-semibold shadow-lg"
              >
                {season}
              </motion.div>
            </div>
          </motion.div>

          {/* Skin Undertone Result */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="px-6 mb-6 mt-6"
          >
            <div className="p-5 rounded-2xl bg-white border border-sand">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Skin Undertone</span>
                <span className="caption px-3 py-1 rounded-full bg-terracotta/10 text-terracotta">
                  {undertone}
                </span>
              </div>
              <p className="caption text-charcoal/60">
                Your undertone helps pick colors that look natural and balanced.
              </p>
            </div>
          </motion.div>

          {/* Color Palette */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="px-6 mb-6"
          >
            <h3 className="mb-4">Your Perfect Colors</h3>
            <div className="grid grid-cols-4 gap-3">
              {palette.map((color, i) => (
                <motion.div
                  key={color + i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.9 + i * 0.05, type: 'spring' }}
                  className="aspect-square rounded-2xl shadow-md overflow-hidden group cursor-pointer"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <div className="px-6 pb-8 mt-auto">
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                localStorage.setItem('theme', 'light');
                document.cookie = 'sw_onboarded=1; path=/; max-age=31536000';
                onNavigate('home');
              }}
              className="w-full py-4 rounded-2xl bg-sage text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sage/20"
            >
              Continue to Home
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
