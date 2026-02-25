import { motion } from 'motion/react';
import { ReactNode, useState } from 'react';

interface GlowCardProps {
  children: ReactNode;
  onClick?: () => void;
  delay?: number;
  gradient?: 'cyan' | 'purple' | 'blue' | 'green';
}

export function GlowCard({ children, onClick, delay = 0, gradient = 'cyan' }: GlowCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const gradientColors = {
    cyan: 'from-cyan-500/20 to-blue-500/20',
    purple: 'from-purple-500/20 to-pink-500/20',
    blue: 'from-blue-500/20 to-cyan-500/20',
    green: 'from-green-500/20 to-cyan-500/20',
  };

  const borderColors = {
    cyan: 'border-cyan-400/30',
    purple: 'border-purple-400/30',
    blue: 'border-blue-400/30',
    green: 'border-green-400/30',
  };

  const glowColors = {
    cyan: 'shadow-cyan-500/50',
    purple: 'shadow-purple-500/50',
    blue: 'shadow-blue-500/50',
    green: 'shadow-green-500/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="relative group cursor-pointer"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[gradient]} rounded-2xl blur-xl transition-opacity duration-300 ${isHovered ? 'opacity-60' : 'opacity-30'}`} />
      
      <div className={`relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border ${borderColors[gradient]} transition-all duration-300 ${isHovered ? `shadow-2xl ${glowColors[gradient]}` : ''} overflow-hidden`}>
        {/* Animated border on hover */}
        {isHovered && (
          <motion.div
            className={`absolute inset-0 rounded-2xl`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: `linear-gradient(90deg, transparent, ${gradient === 'cyan' ? 'rgba(34, 211, 238, 0.3)' : gradient === 'purple' ? 'rgba(192, 132, 252, 0.3)' : gradient === 'blue' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(34, 197, 94, 0.3)'}, transparent)`,
              backgroundSize: '200% 100%',
            }}
          />
        )}
        
        {children}
      </div>
    </motion.div>
  );
}
