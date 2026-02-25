import { motion } from 'motion/react';
import { Cloud, Sun, Shirt, Sparkles, Scan, TrendingUp } from 'lucide-react';
import { Screen } from '../App';
import { ParticleBackground } from './ParticleBackground';
import { GlowCard } from './GlowCard';

interface HomeProps {
  onNavigate: (screen: Screen) => void;
}

export function Home({ onNavigate }: HomeProps) {
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header with Weather & Time */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start mb-12"
        >
          <div>
            <h1 className="text-5xl mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Wardrobe
            </h1>
            <p className="text-cyan-300/60 text-sm tracking-widest">NEURAL STYLE SYSTEM</p>
          </div>
          
          <div className="flex gap-8 items-center">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <Sun className="w-8 h-8 text-cyan-400" />
                <div className="absolute inset-0 blur-xl bg-cyan-400/50" />
              </div>
              <div>
                <div className="text-2xl font-light">22°C</div>
                <div className="text-xs text-cyan-400/60">Sunny</div>
              </div>
            </motion.div>
            
            <div className="text-right">
              <div className="text-3xl font-light tabular-nums tracking-wider">{currentTime}</div>
              <div className="text-xs text-purple-400/60">Monday, Feb 9</div>
            </div>
          </div>
        </motion.div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlowCard 
            onClick={() => onNavigate('wardrobe')}
            delay={0.1}
          >
            <div className="p-8 h-full flex flex-col justify-between min-h-[280px]">
              <div className="relative">
                <Shirt className="w-12 h-12 text-cyan-400 mb-4" />
                <div className="absolute top-0 left-0 w-12 h-12 bg-cyan-400/20 blur-xl" />
              </div>
              <div>
                <h3 className="text-2xl mb-2">View Wardrobe</h3>
                <p className="text-sm text-cyan-400/50">Browse your digital closet</p>
              </div>
              <div className="flex items-center gap-2 text-cyan-400 text-sm mt-4">
                <span>Explore</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </div>
            </div>
          </GlowCard>

          <GlowCard 
            onClick={() => onNavigate('ai-outfit')}
            delay={0.2}
            gradient="purple"
          >
            <div className="p-8 h-full flex flex-col justify-between min-h-[280px]">
              <div className="relative">
                <Sparkles className="w-12 h-12 text-purple-400 mb-4" />
                <div className="absolute top-0 left-0 w-12 h-12 bg-purple-400/20 blur-xl" />
              </div>
              <div>
                <h3 className="text-2xl mb-2">AI Outfit</h3>
                <p className="text-sm text-purple-400/50">Smart recommendations</p>
              </div>
              <div className="flex items-center gap-2 text-purple-400 text-sm mt-4">
                <span>Generate</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </div>
            </div>
          </GlowCard>

          <GlowCard 
            onClick={() => onNavigate('profile')}
            delay={0.3}
            gradient="blue"
          >
            <div className="p-8 h-full flex flex-col justify-between min-h-[280px]">
              <div className="relative">
                <Scan className="w-12 h-12 text-blue-400 mb-4" />
                <div className="absolute top-0 left-0 w-12 h-12 bg-blue-400/20 blur-xl" />
              </div>
              <div>
                <h3 className="text-2xl mb-2">Scan Garment</h3>
                <p className="text-sm text-blue-400/50">Add to collection</p>
              </div>
              <div className="flex items-center gap-2 text-blue-400 text-sm mt-4">
                <span>Start</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.div>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlowCard 
            onClick={() => onNavigate('try-on')}
            delay={0.4}
          >
            <div className="p-6 flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-400/30">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="absolute inset-0 blur-xl bg-cyan-400/30 rounded-full" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl mb-1">Virtual Try-On</h3>
                <p className="text-sm text-cyan-400/50">See how outfits look on you</p>
              </div>
              <div className="text-cyan-400">→</div>
            </div>
          </GlowCard>

          <GlowCard 
            onClick={() => onNavigate('sustainability')}
            delay={0.5}
            gradient="green"
          >
            <div className="p-6 flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-cyan-500/20 flex items-center justify-center border border-green-400/30">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <div className="absolute inset-0 blur-xl bg-green-400/30 rounded-full" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl mb-1">Sustainability</h3>
                <p className="text-sm text-green-400/50">Track your eco-impact</p>
              </div>
              <div className="text-green-400">→</div>
            </div>
          </GlowCard>
        </div>

        {/* Stats Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 grid grid-cols-3 gap-6"
        >
          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-cyan-400/10">
            <div className="text-3xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
              247
            </div>
            <div className="text-xs text-cyan-400/50 tracking-wide">ITEMS</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-purple-400/10">
            <div className="text-3xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
              1,428
            </div>
            <div className="text-xs text-purple-400/50 tracking-wide">OUTFITS</div>
          </div>
          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-green-400/10">
            <div className="text-3xl bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-1">
              94%
            </div>
            <div className="text-xs text-green-400/50 tracking-wide">ECO SCORE</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
