import { motion } from 'motion/react';
import { ArrowLeft, Filter, Shirt, Grid3x3 } from 'lucide-react';
import { Screen } from '../App';
import { useState } from 'react';
import { ParticleBackground } from './ParticleBackground';

interface WardrobeProps {
  onNavigate: (screen: Screen) => void;
}

const categories = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories'];
const colors = ['All', 'Black', 'White', 'Blue', 'Red', 'Green'];

const wardrobeItems = [
  { id: 1, name: 'Black Blazer', category: 'Outerwear', color: 'Black', season: 'All' },
  { id: 2, name: 'White Shirt', category: 'Tops', color: 'White', season: 'Summer' },
  { id: 3, name: 'Blue Jeans', category: 'Bottoms', color: 'Blue', season: 'All' },
  { id: 4, name: 'Red Dress', category: 'Dresses', color: 'Red', season: 'Spring' },
  { id: 5, name: 'Green Sweater', category: 'Tops', color: 'Green', season: 'Winter' },
  { id: 6, name: 'Black Trousers', category: 'Bottoms', color: 'Black', season: 'All' },
  { id: 7, name: 'White Sneakers', category: 'Accessories', color: 'White', season: 'All' },
  { id: 8, name: 'Blue Coat', category: 'Outerwear', color: 'Blue', season: 'Winter' },
  { id: 9, name: 'Summer Dress', category: 'Dresses', color: 'White', season: 'Summer' },
];

export function Wardrobe({ onNavigate }: WardrobeProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedColor, setSelectedColor] = useState('All');
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const filteredItems = wardrobeItems.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (selectedColor !== 'All' && item.color !== selectedColor) return false;
    return true;
  });

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
              <h1 className="text-4xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Digital Wardrobe
              </h1>
              <p className="text-cyan-400/60 text-sm mt-1">{filteredItems.length} items in collection</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-3 rounded-xl bg-white/5 border border-cyan-400/30 hover:bg-cyan-400/10 transition-colors">
              <Grid3x3 className="w-5 h-5 text-cyan-400" />
            </button>
            <button className="p-3 rounded-xl bg-white/5 border border-purple-400/30 hover:bg-purple-400/10 transition-colors">
              <Filter className="w-5 h-5 text-purple-400" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm text-cyan-400/60 mb-2 block tracking-wide">CATEGORY</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-full text-sm transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                      : 'bg-white/5 border border-cyan-400/20 text-cyan-400/60 hover:border-cyan-400/40'
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div>
            <label className="text-sm text-cyan-400/60 mb-2 block tracking-wide">COLOR</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(color => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedColor(color)}
                  className={`px-5 py-2 rounded-full text-sm transition-all ${
                    selectedColor === color
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(192,132,252,0.5)]'
                      : 'bg-white/5 border border-purple-400/20 text-purple-400/60 hover:border-purple-400/40'
                  }`}
                >
                  {color}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Wardrobe Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onHoverStart={() => setHoveredItem(item.id)}
              onHoverEnd={() => setHoveredItem(null)}
              className="relative group cursor-pointer"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl transition-opacity duration-300 ${
                hoveredItem === item.id ? 'opacity-60' : 'opacity-0'
              }`} />
              
              <div className={`relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border transition-all duration-300 overflow-hidden ${
                hoveredItem === item.id 
                  ? 'border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3)]' 
                  : 'border-cyan-400/20'
              }`}>
                {/* Item Image */}
                <div className="aspect-square bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shirt className="w-20 h-20 text-cyan-400/30" />
                  </div>
                  
                  {/* Hover overlay */}
                  {hoveredItem === item.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-sm text-white"
                      >
                        View Details
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Floating depth indicator */}
                  <motion.div
                    animate={{ y: hoveredItem === item.id ? -5 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-400/20 border border-cyan-400/30 flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  </motion.div>
                </div>

                {/* Item Info */}
                <div className="p-4">
                  <h3 className="text-sm mb-1 truncate">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-cyan-400/50">{item.category}</span>
                    <span className="text-xs text-purple-400/50">{item.season}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
