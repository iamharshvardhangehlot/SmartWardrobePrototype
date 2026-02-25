import { motion } from 'motion/react';
import { ArrowLeft, Package, Heart, MapPin, Phone, Mail } from 'lucide-react';
import { Screen } from '../App';
import { ParticleBackground } from './ParticleBackground';

interface DonationProps {
  onNavigate: (screen: Screen) => void;
}

const donationCenters = [
  {
    id: 1,
    name: 'Green Fashion Initiative',
    address: '123 Eco Street, Sustainability City',
    phone: '+1 (555) 123-4567',
    email: 'donate@greenfashion.org',
    accepted: ['Clothes', 'Shoes', 'Accessories'],
  },
  {
    id: 2,
    name: 'Second Life Clothing',
    address: '456 Recycle Avenue, Green Town',
    phone: '+1 (555) 234-5678',
    email: 'info@secondlife.org',
    accepted: ['All Textiles', 'Accessories'],
  },
  {
    id: 3,
    name: 'Charity Wardrobe',
    address: '789 Donation Road, Care City',
    phone: '+1 (555) 345-6789',
    email: 'help@charitywardrobe.org',
    accepted: ['Clothes', 'Shoes'],
  },
];

const decompositionSteps = [
  { step: 1, title: 'Sort Items', description: 'Separate by material type' },
  { step: 2, title: 'Remove Hardware', description: 'Buttons, zippers, etc.' },
  { step: 3, title: 'Shred Fabric', description: 'Prepare for recycling' },
  { step: 4, title: 'Eco Processing', description: 'Transform into new materials' },
];

export function Donation({ onNavigate }: DonationProps) {
  return (
    <div className="relative min-h-screen">
      <ParticleBackground />
      
      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => onNavigate('sustainability')}
            className="p-3 rounded-xl bg-white/5 border border-green-400/30 hover:bg-green-400/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-green-400" />
          </button>
          <div>
            <h1 className="text-4xl bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              Donate & Recycle
            </h1>
            <p className="text-green-400/60 text-sm mt-1">Give your clothes a second chance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Decomposition Process */}
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-green-400/30 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Package className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl">Decomposition Process</h3>
                </div>

                <div className="space-y-6">
                  {decompositionSteps.map((step, index) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      <div className="flex items-start gap-4">
                        {/* Step number */}
                        <div className="relative flex-shrink-0">
                          <motion.div
                            animate={{
                              boxShadow: [
                                '0 0 20px rgba(34, 197, 94, 0.3)',
                                '0 0 30px rgba(34, 197, 94, 0.5)',
                                '0 0 20px rgba(34, 197, 94, 0.3)',
                              ],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/30 to-cyan-500/30 border border-green-400/50 flex items-center justify-center"
                          >
                            <span className="text-lg text-green-400">{step.step}</span>
                          </motion.div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-2">
                          <h4 className="mb-1">{step.title}</h4>
                          <p className="text-sm text-green-400/60">{step.description}</p>
                        </div>
                      </div>

                      {/* Arrow connector */}
                      {index < decompositionSteps.length - 1 && (
                        <motion.div
                          animate={{ opacity: [0.3, 0.7, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                          className="absolute left-6 top-12 w-0.5 h-8 bg-gradient-to-b from-green-400/50 to-transparent"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-cyan-500 text-white relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                  <span className="relative">Start Decomposition</span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Donation Centers */}
          <div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-xl">Donation Centers</h3>
                </div>

                <div className="space-y-4">
                  {donationCenters.map((center, index) => (
                    <motion.div
                      key={center.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="relative group cursor-pointer"
                    >
                      {/* Holographic effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
                      
                      <div className="relative p-6 rounded-xl bg-slate-900/50 border border-cyan-400/20 group-hover:border-cyan-400/40 transition-all">
                        <h4 className="text-lg mb-3 text-cyan-400">{center.name}</h4>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-start gap-3 text-sm">
                            <MapPin className="w-4 h-4 text-cyan-400/60 mt-0.5 flex-shrink-0" />
                            <span className="text-white/70">{center.address}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Phone className="w-4 h-4 text-cyan-400/60 flex-shrink-0" />
                            <span className="text-white/70">{center.phone}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Mail className="w-4 h-4 text-cyan-400/60 flex-shrink-0" />
                            <span className="text-white/70">{center.email}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-cyan-400/60 mb-2">ACCEPTED ITEMS</div>
                          <div className="flex gap-2 flex-wrap">
                            {center.accepted.map((item) => (
                              <span
                                key={item}
                                className="px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-xs text-cyan-400"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full mt-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 hover:border-cyan-400/50 text-sm transition-all"
                        >
                          Schedule Pickup
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50" />
          <div className="relative bg-slate-950/50 backdrop-blur-xl rounded-2xl border border-green-400/30 p-8">
            <h3 className="text-xl mb-6 text-center">Your Donation Impact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Items Donated', value: '42', color: 'green' },
                { label: 'Lives Impacted', value: '128', color: 'cyan' },
                { label: 'CO₂ Prevented', value: '18kg', color: 'purple' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="text-center p-6 rounded-xl bg-white/5 border border-green-400/20"
                >
                  <div className={`text-4xl mb-2 bg-gradient-to-r from-${stat.color}-400 to-cyan-400 bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-green-400/60">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
