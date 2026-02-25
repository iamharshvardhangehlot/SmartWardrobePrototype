import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Lock, Unlock, RefreshCw } from 'lucide-react';
import { Screen } from '../App';
import { useState } from 'react';
import { ParticleBackground } from './ParticleBackground';

interface AIOutfitProps {
  onNavigate: (screen: Screen) => void;
}

const occasions = ['Casual', 'Business', 'Party', 'Sport', 'Date Night', 'Formal'];

const outfitPieces = [
  { id: 1, name: 'White Shirt', type: 'top', locked: false },
  { id: 2, name: 'Black Blazer', type: 'outerwear', locked: false },
  { id: 3, name: 'Blue Jeans', type: 'bottom', locked: false },
  { id: 4, name: 'White Sneakers', type: 'shoes', locked: false },
];

export function AIOutfit({ onNavigate }: AIOutfitProps) {
  const [selectedOccasion, setSelectedOccasion] = useState('Business');
  const [pieces, setPieces] = useState(outfitPieces);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleLock = (id: number) => {
    setPieces(pieces.map(piece => 
      piece.id === id ? { ...piece, locked: !piece.locked } : piece
    ));
  };

  const generateOutfit = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="p-3 rounded-xl bg-white/5 border border-cyan-400/30 hover:bg-cyan-400/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-cyan-400" />
            </button>
            <div>
              <h1 className="text-4xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Stylist
              </h1>
              <p className="text-purple-400/60 text-sm mt-1">Neural outfit generator</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateOutfit}
            disabled={isGenerating}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white relative overflow-hidden group disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform" />
            <span className="relative flex items-center gap-2">
              <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </span>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Occasions */}
          <div className="space-y-6">
            <div>
              <label className="text-sm text-purple-400/60 mb-3 block tracking-wide">SELECT OCCASION</label>
              <div className="space-y-2">
                {occasions.map(occasion => (
                  <motion.button
                    key={occasion}
                    whileHover={{ x: 5 }}
                    onClick={() => setSelectedOccasion(occasion)}
                    className={`w-full px-5 py-3 rounded-xl text-left transition-all ${
                      selectedOccasion === occasion
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 shadow-[0_0_20px_rgba(192,132,252,0.3)]'
                        : 'bg-white/5 border border-purple-400/20 hover:border-purple-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={selectedOccasion === occasion ? 'text-purple-300' : 'text-purple-400/60'}>
                        {occasion}
                      </span>
                      {selectedOccasion === occasion && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-purple-400"
                        />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Weather Context */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl" />
              <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-cyan-400/20 p-6">
                <h3 className="text-sm text-cyan-400/60 mb-4 tracking-wide">CONTEXT</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-cyan-400/70">Weather</span>
                    <span className="text-white">22°C Sunny</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyan-400/70">Season</span>
                    <span className="text-white">Spring</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyan-400/70">Time</span>
                    <span className="text-white">Afternoon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel - Outfit Display */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-2xl" />
              <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-purple-400/30 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl">Suggested Outfit</h3>
                  <div className="flex items-center gap-2 text-sm text-purple-400/60">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Generated</span>
                  </div>
                </div>

                {/* Outfit Pieces */}
                <div className="space-y-4 mb-6">
                  {pieces.map((piece, index) => (
                    <motion.div
                      key={piece.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${
                        piece.locked ? 'from-cyan-500/20 to-purple-500/20' : 'from-purple-500/10 to-pink-500/10'
                      } rounded-xl blur-lg transition-opacity ${
                        piece.locked ? 'opacity-50' : 'opacity-0 group-hover:opacity-30'
                      }`} />
                      
                      <div className={`relative bg-slate-900/50 rounded-xl border ${
                        piece.locked ? 'border-cyan-400/50' : 'border-purple-400/20'
                      } p-6 transition-all`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 border border-purple-400/30" />
                            <div className="flex-1">
                              <h4 className="mb-1">{piece.name}</h4>
                              <p className="text-sm text-purple-400/50 capitalize">{piece.type}</p>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleLock(piece.id)}
                            className={`p-3 rounded-lg transition-all ${
                              piece.locked
                                ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-400/50'
                                : 'bg-white/5 border border-purple-400/20'
                            }`}
                          >
                            {piece.locked ? (
                              <>
                                <Lock className="w-5 h-5 text-cyan-400" />
                                {/* Shimmer effect when locked */}
                                <motion.div
                                  animate={{
                                    x: [-20, 100],
                                    opacity: [0, 1, 0],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
                                  style={{ width: '20px' }}
                                />
                              </>
                            ) : (
                              <Unlock className="w-5 h-5 text-purple-400/50" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('try-on')}
                    className="py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                    <span className="relative">Virtual Try-On</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="py-3 rounded-xl bg-white/5 border border-purple-400/30 hover:bg-purple-400/10 transition-colors"
                  >
                    Save Outfit
                  </motion.button>
                </div>

                {/* Suggestions Carousel */}
                <div className="mt-8">
                  <h4 className="text-sm text-purple-400/60 mb-3 tracking-wide">ALTERNATIVE SUGGESTIONS</h4>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-400/20">
                    {[1, 2, 3, 4].map((item) => (
                      <motion.div
                        key={item}
                        whileHover={{ y: -5, scale: 1.05 }}
                        className="flex-shrink-0 w-32 cursor-pointer"
                      >
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
                          <div className="relative aspect-square bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-purple-400/20 group-hover:border-purple-400/50 transition-all" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
