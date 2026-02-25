import { motion } from 'motion/react';
import { ArrowLeft, Upload, User, Palette, Sparkles } from 'lucide-react';
import { Screen } from '../App';
import { useState } from 'react';
import { ParticleBackground } from './ParticleBackground';

interface UserProfilingProps {
  onNavigate: (screen: Screen) => void;
}

export function UserProfiling({ onNavigate }: UserProfilingProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 3000);
  };

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      
      <div className="relative z-10 p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => onNavigate('home')}
            className="p-3 rounded-xl bg-white/5 border border-cyan-400/30 hover:bg-cyan-400/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
          </button>
          <div>
            <h1 className="text-4xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              AI Analysis
            </h1>
            <p className="text-cyan-400/60 text-sm mt-1">Neural style profiling</p>
          </div>
        </div>

        {!analyzed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Upload Section */}
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-12">
                  <div className="border-2 border-dashed border-cyan-400/30 rounded-xl p-12 text-center hover:border-cyan-400/60 transition-colors cursor-pointer">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="inline-block mb-4"
                    >
                      <Upload className="w-16 h-16 text-cyan-400" />
                    </motion.div>
                    <h3 className="text-xl mb-2">Upload Your Photo</h3>
                    <p className="text-cyan-400/50 text-sm">
                      Drop your image or click to browse
                    </p>
                  </div>
                </div>
              </div>

              {/* Holographic Frame Preview */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-purple-400/30 p-6">
                  <div className="aspect-square bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl relative overflow-hidden">
                    <div className="absolute inset-0 border-2 border-cyan-400/30">
                      {/* Corner accents */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <User className="w-24 h-24 text-cyan-400/30" />
                    </div>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white relative overflow-hidden group disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {analyzing ? 'Analyzing...' : 'Start AI Analysis'}
                </span>
              </motion.button>
            </div>

            {/* Analysis Preview */}
            <div className="space-y-6">
              {analyzing ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl" />
                  <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-12">
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-32 h-32 rounded-full border-4 border-transparent border-t-cyan-400 border-r-purple-400 mb-6"
                      />
                      <h3 className="text-xl mb-2">Processing Image</h3>
                      <p className="text-cyan-400/60 text-sm text-center">
                        Neural network analyzing your style profile...
                      </p>
                      
                      <div className="mt-8 w-full space-y-3">
                        {['Face Detection', 'Color Analysis', 'Body Type', 'Style Preference'].map((step, i) => (
                          <motion.div
                            key={step}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.5 }}
                            className="flex items-center gap-3"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1, delay: i * 0.5 }}
                              className="w-2 h-2 rounded-full bg-cyan-400"
                            />
                            <span className="text-sm text-cyan-400/80">{step}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl" />
                  <div className="relative bg-slate-950/30 backdrop-blur-xl rounded-2xl border border-cyan-400/20 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Palette className="w-6 h-6 text-purple-400" />
                      <h3 className="text-xl">AI Features</h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        'Season Color Analysis',
                        'Body Shape Detection',
                        'Style Personality',
                        'Skin Tone Matching',
                        'Occasion Preferences'
                      ].map((feature, i) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-cyan-400/10"
                        >
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" />
                          <span className="text-sm text-cyan-400/70">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* 3D Avatar Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-2xl blur-2xl" />
              <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Avatar */}
                  <div className="lg:col-span-1">
                    <div className="aspect-square bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl relative overflow-hidden border-2 border-cyan-400/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-400/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <User className="w-32 h-32 text-cyan-400/50" />
                      </div>
                      {/* Neon edge glow */}
                      <div className="absolute inset-0 shadow-[0_0_30px_rgba(34,211,238,0.5)]" />
                    </div>
                  </div>

                  {/* Analysis Results */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-2xl mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Analysis Complete
                      </h3>
                      
                      {/* Season Type */}
                      <div className="mb-6">
                        <label className="text-sm text-cyan-400/60 mb-2 block">Season Type</label>
                        <div className="flex gap-3">
                          {['Spring', 'Summer', 'Autumn', 'Winter'].map((season) => (
                            <div
                              key={season}
                              className={`px-4 py-2 rounded-lg border ${
                                season === 'Autumn'
                                  ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-400/50 shadow-[0_0_20px_rgba(251,146,60,0.3)]'
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <span className={season === 'Autumn' ? 'text-orange-400' : 'text-white/40'}>
                                {season}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Color Palette */}
                      <div>
                        <label className="text-sm text-cyan-400/60 mb-2 block">Recommended Colors</label>
                        <div className="flex gap-2">
                          {['#D4A574', '#8B4513', '#2F4F4F', '#8FBC8F', '#DEB887'].map((color, i) => (
                            <motion.div
                              key={color}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="relative group"
                            >
                              <div
                                className="w-12 h-12 rounded-lg border border-white/20 cursor-pointer"
                                style={{ backgroundColor: color }}
                              />
                              <motion.div
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                className="absolute inset-0 rounded-lg"
                                style={{ boxShadow: `0 0 20px ${color}` }}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-cyan-400/20">
                        <div className="text-sm text-cyan-400/60 mb-1">Body Type</div>
                        <div className="text-xl text-cyan-400">Hourglass</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-purple-400/20">
                        <div className="text-sm text-purple-400/60 mb-1">Style Match</div>
                        <div className="text-xl text-purple-400">96%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('ai-outfit')}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              <span className="relative flex items-center justify-center gap-2">
                Continue to AI Outfit
                <Sparkles className="w-5 h-5" />
              </span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
