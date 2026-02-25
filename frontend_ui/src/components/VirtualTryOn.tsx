import { motion } from 'motion/react';
import { ArrowLeft, User, RotateCw, ZoomIn, Download } from 'lucide-react';
import { Screen } from '../App';
import { ParticleBackground } from './ParticleBackground';

interface VirtualTryOnProps {
  onNavigate: (screen: Screen) => void;
}

const outfitLayers = [
  { id: 1, name: 'Base Layer', color: 'cyan' },
  { id: 2, name: 'Mid Layer', color: 'purple' },
  { id: 3, name: 'Outer Layer', color: 'blue' },
];

export function VirtualTryOn({ onNavigate }: VirtualTryOnProps) {
  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('ai-outfit')}
              className="p-3 rounded-xl bg-white/5 border border-cyan-400/30 hover:bg-cyan-400/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-cyan-400" />
            </button>
            <div>
              <h1 className="text-4xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Virtual Try-On
              </h1>
              <p className="text-cyan-400/60 text-sm mt-1">3D visualization system</p>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-xl bg-white/5 border border-cyan-400/30 hover:bg-cyan-400/10 transition-colors"
            >
              <RotateCw className="w-5 h-5 text-cyan-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-xl bg-white/5 border border-purple-400/30 hover:bg-purple-400/10 transition-colors"
            >
              <ZoomIn className="w-5 h-5 text-purple-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
            >
              <Download className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main 3D View */}
          <div className="lg:col-span-3">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-2xl blur-3xl" />
              
              <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-cyan-400/30 overflow-hidden">
                {/* 3D Avatar Area */}
                <div className="aspect-[3/4] relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  {/* Grid background */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="h-full w-full" style={{
                      backgroundImage: `
                        linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '30px 30px'
                    }} />
                  </div>

                  {/* Neon frames around avatar */}
                  <div className="absolute inset-8 border-2 border-cyan-400/40">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-cyan-400" />
                    <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-cyan-400" />
                    <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-cyan-400" />
                    <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-cyan-400" />

                    {/* Scanning lines */}
                    <motion.div
                      animate={{
                        y: ['0%', '100%'],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    />
                  </div>

                  {/* 3D Avatar Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <motion.div
                        animate={{
                          scale: [1, 1.02, 1],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <User className="w-64 h-64 text-cyan-400/30" />
                      </motion.div>
                      
                      {/* Reflection effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/10 via-transparent to-transparent" />
                      
                      {/* Glow around avatar */}
                      <div className="absolute inset-0 blur-3xl bg-cyan-400/20" />
                    </div>
                  </div>

                  {/* Outfit layers indicator */}
                  <div className="absolute bottom-6 left-6 flex gap-2">
                    {outfitLayers.map((layer, index) => (
                      <motion.div
                        key={layer.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.2 }}
                        className={`px-4 py-2 rounded-lg bg-slate-900/80 backdrop-blur-sm border ${
                          layer.color === 'cyan' ? 'border-cyan-400/50' :
                          layer.color === 'purple' ? 'border-purple-400/50' :
                          'border-blue-400/50'
                        }`}
                      >
                        <div className="text-xs text-white/70">{layer.name}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Info overlay */}
                  <div className="absolute top-6 right-6 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-cyan-400/30 p-4">
                    <div className="text-xs text-cyan-400/60 mb-1">RENDERING</div>
                    <div className="text-2xl tabular-nums text-cyan-400">4K</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="space-y-6">
            {/* Outfit Layers */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl" />
              <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-cyan-400/20 p-6">
                <h3 className="text-sm text-cyan-400/60 mb-4 tracking-wide">OUTFIT LAYERS</h3>
                <div className="space-y-3">
                  {outfitLayers.map((layer, index) => (
                    <motion.div
                      key={layer.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="p-4 rounded-lg bg-white/5 border border-cyan-400/20 hover:border-cyan-400/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            layer.color === 'cyan' ? 'bg-cyan-400' :
                            layer.color === 'purple' ? 'bg-purple-400' :
                            'bg-blue-400'
                          }`} />
                          <span className="text-sm">{layer.name}</span>
                        </div>
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-green-400"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* View Controls */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl" />
              <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-purple-400/20 p-6">
                <h3 className="text-sm text-purple-400/60 mb-4 tracking-wide">VIEW ANGLE</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Front', 'Back', 'Left', 'Right'].map((view) => (
                    <motion.button
                      key={view}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`py-3 rounded-lg text-sm transition-all ${
                        view === 'Front'
                          ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50'
                          : 'bg-white/5 border border-purple-400/20 hover:border-purple-400/40'
                      }`}
                    >
                      {view}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('wardrobe')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative">Change Outfit</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl bg-white/5 border border-cyan-400/30 hover:bg-cyan-400/10 transition-colors"
              >
                Share Look
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
