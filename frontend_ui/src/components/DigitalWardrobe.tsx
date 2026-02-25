import { motion } from 'motion/react';
import { ArrowLeft, Filter, Search, Plus } from 'lucide-react';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { BottomNav } from './BottomNav';

interface DigitalWardrobeProps {
  onNavigate: (screen: Screen) => void;
  onSelectGarment: (id: number) => void;
}

const categories = [
  { label: 'All', value: 'All' },
  { label: 'Tops', value: 'Top' },
  { label: 'Bottoms', value: 'Bottom' },
  { label: 'Dresses', value: 'Dress' },
  { label: 'Outerwear', value: 'Layer' },
  { label: 'Shoes', value: 'Shoes' },
];
const colors = ['All', 'Neutral', 'Warm', 'Cool', 'Dark'];
const quickFilters = [
  { label: 'Shorts', value: 'shorts' },
  { label: 'Pants', value: 'pants' },
  { label: 'Tops', value: 'tops' },
  { label: 'Graphic Ts', value: 'graphic' },
  { label: 'Jeans', value: 'jeans' },
  { label: 'Solids', value: 'solids' },
];

type Garment = {
  id: number;
  name: string;
  category?: string;
  image_url?: string;
  wear_count?: number;
};

export function DigitalWardrobe({ onNavigate, onSelectGarment }: DigitalWardrobeProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedColor, setSelectedColor] = useState('All');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (selectedColor !== 'All') params.set('color', selectedColor);
    if (searchQuery) params.set('q', searchQuery);
    selectedFilters.forEach((filter) => params.append('filter', filter));

    setLoading(true);
    fetch(`/api/wardrobe/?${params.toString()}`, { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.status === 'success') {
          setGarments(payload.garments || []);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedColor, searchQuery, selectedFilters]);

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-6 h-6 text-charcoal" />
          </button>
          <button className="p-2 -mr-2">
            <Filter className="w-6 h-6 text-charcoal" />
          </button>
        </div>

        <h1 className="mb-2">Your Digital Closet</h1>
        <p className="caption text-charcoal/60">{garments.length} items</p>

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search garments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border-2 border-sand focus:border-sage outline-none transition-colors"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-6 mb-6 space-y-4">
        {/* Category Filter */}
        <div>
          <label className="microtext text-charcoal/60 mb-2 block">CATEGORY</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category.value
                    ? 'bg-sage text-white'
                    : 'bg-white border-2 border-sand text-charcoal/70'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color Filter */}
        <div>
          <label className="microtext text-charcoal/60 mb-2 block">COLOR</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedColor === color
                    ? 'bg-sage text-white'
                    : 'bg-white border-2 border-sand text-charcoal/70'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div>
          <label className="microtext text-charcoal/60 mb-2 block">FILTERS</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickFilters.map((filter) => {
              const active = selectedFilters.includes(filter.value);
              return (
                <button
                  key={filter.value}
                  onClick={() =>
                    setSelectedFilters((prev) =>
                      active ? prev.filter((item) => item !== filter.value) : [...prev, filter.value]
                    )
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-sage text-white'
                      : 'bg-white border-2 border-sand text-charcoal/70'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Garment Grid */}
      <div className="px-6 grid grid-cols-2 gap-4 mb-6">
        {loading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="aspect-[3/4] rounded-3xl bg-sand/60 mb-3" />
              <div className="h-3 bg-sand/60 rounded w-3/4 mb-2" />
              <div className="h-3 bg-sand/40 rounded w-1/2" />
            </div>
          ))}
        {!loading && garments.length === 0 && (
          <div className="col-span-2">
            <div className="p-6 rounded-3xl bg-white border border-sand text-center">
              <div className="text-lg font-semibold mb-2">No items yet</div>
              <p className="caption text-charcoal/60 mb-4">
                Add your first garment to start styling.
              </p>
              <button
                onClick={() => onNavigate('add-item')}
                className="px-4 py-2 rounded-xl bg-sage text-white caption font-semibold"
              >
                Add Items
              </button>
            </div>
          </div>
        )}
        {garments.map((garment, index) => (
          <motion.div
            key={garment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            onClick={() => {
              onSelectGarment(garment.id);
              onNavigate('garment-details');
            }}
            className="relative cursor-pointer group"
          >
            <div className="aspect-[3/4] rounded-3xl bg-sand overflow-hidden mb-3 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              {garment.image_url ? (
                <img
                  src={garment.image_url}
                  alt={garment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-5xl text-charcoal/40">OK</div>
              )}
              <div className="absolute inset-0 bg-sage/0 group-hover:bg-sage/10 transition-colors" />
            </div>
            <h3 className="mb-1 text-sm font-semibold">{garment.name}</h3>
            <div className="flex items-center justify-between caption text-charcoal/60">
              <span>{garment.category || 'Garment'}</span>
              <span>{garment.wear_count || 0} wears</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating Add Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onNavigate('add-item')}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-sage text-white shadow-lg shadow-sage/30 flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <BottomNav current="wardrobe" onNavigate={onNavigate} />
    </div>
  );
}
