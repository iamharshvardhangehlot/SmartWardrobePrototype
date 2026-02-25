import { motion } from 'motion/react';
import { ArrowLeft, Leaf, Droplet, Zap, TrendingUp } from 'lucide-react';
import { Screen } from '../App';
import { ParticleBackground } from './ParticleBackground';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface SustainabilityProps {
  onNavigate: (screen: Screen) => void;
}

const carbonData = [
  { name: 'Saved', value: 75 },
  { name: 'Remaining', value: 25 },
];

const monthlyData = [
  { month: 'Jan', carbon: 20, water: 50 },
  { month: 'Feb', carbon: 35, water: 65 },
  { month: 'Mar', carbon: 45, water: 80 },
  { month: 'Apr', carbon: 60, water: 95 },
  { month: 'May', carbon: 75, water: 110 },
];

const COLORS = ['#22D3EE', '#1E293B'];

export function Sustainability({ onNavigate }: SustainabilityProps) {
  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="p-3 rounded-xl bg-white/5 border border-green-400/30 hover:bg-green-400/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-green-400" />
          </button>
          <div>
            <h1 className="text-4xl bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              Sustainability
            </h1>
            <p className="text-green-400/60 text-sm mt-1">Track your environmental impact</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Leaf, label: 'Carbon Saved', value: '75kg', color: 'green', bg: 'from-green-500/20 to-cyan-500/20' },
            { icon: Droplet, label: 'Water Saved', value: '1,200L', color: 'cyan', bg: 'from-cyan-500/20 to-blue-500/20' },
            { icon: Zap, label: 'Energy Saved', value: '450kWh', color: 'yellow', bg: 'from-yellow-500/20 to-orange-500/20' },
            { icon: TrendingUp, label: 'Eco Score', value: '94%', color: 'purple', bg: 'from-purple-500/20 to-pink-500/20' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity`} />
              <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-green-400/20 p-6">
                <stat.icon className={`w-8 h-8 text-${stat.color}-400 mb-3`} />
                <div className="text-3xl mb-1">{stat.value}</div>
                <div className="text-sm text-green-400/60">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Carbon Saved Ring Chart */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-green-400/30 p-8">
              <h3 className="text-xl mb-6">Carbon Impact</h3>
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={carbonData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {carbonData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center value */}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-4xl bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                    75kg
                  </div>
                  <div className="text-sm text-green-400/60">CO₂ Saved</div>
                </div>

                {/* Rotating data nodes */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="absolute top-0 left-1/2 w-3 h-3 bg-green-400 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                </motion.div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-green-400/20">
                  <div className="text-sm text-green-400/60 mb-1">This Month</div>
                  <div className="text-2xl text-green-400">+15kg</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-cyan-400/20">
                  <div className="text-sm text-cyan-400/60 mb-1">Goal</div>
                  <div className="text-2xl text-cyan-400">100kg</div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-8">
              <h3 className="text-xl mb-6">Monthly Trends</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(34, 211, 238, 0.3)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="carbon" 
                    stroke="#22D3EE" 
                    strokeWidth={3}
                    dot={{ fill: '#22D3EE', r: 5 }}
                    activeDot={{ r: 7, fill: '#22D3EE' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="water" 
                    stroke="#A855F7" 
                    strokeWidth={3}
                    dot={{ fill: '#A855F7', r: 5 }}
                    activeDot={{ r: 7, fill: '#A855F7' }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span className="text-sm text-cyan-400/70">Carbon (kg)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                  <span className="text-sm text-purple-400/70">Water (L)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => onNavigate('donation')}
            className="relative group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-green-400/30 p-8 hover:border-green-400/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl mb-2">Donate Items</h3>
                  <p className="text-green-400/60">Give clothes a second life</p>
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-green-400 text-2xl"
                >
                  →
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-8 hover:border-cyan-400/50 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl mb-2">Eco Tips</h3>
                  <p className="text-cyan-400/60">Learn sustainable fashion</p>
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-cyan-400 text-2xl"
                >
                  →
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
