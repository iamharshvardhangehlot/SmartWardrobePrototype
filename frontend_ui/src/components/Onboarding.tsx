import { motion } from 'motion/react';
import { Camera, Image, MapPin, Bell } from 'lucide-react';
import { Screen } from '../App';
import { useState } from 'react';
import { apiPost } from '../lib/api';

interface OnboardingProps {
  onNavigate: (screen: Screen) => void;
}

const permissions = [
  {
    icon: Camera,
    title: 'Camera Access',
    description: 'Scan garments and take photos',
    granted: false,
  },
  {
    icon: Image,
    title: 'Photo Library',
    description: 'Upload wardrobe photos',
    granted: false,
  },
  {
    icon: MapPin,
    title: 'Location',
    description: 'Weather-based outfit suggestions',
    granted: false,
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Outfit reminders and tips',
    granted: false,
  },
];

const undertones = [
  { label: 'Green veins', value: 'Warm' },
  { label: 'Blue veins', value: 'Cool' },
  { label: 'Both mixed', value: 'Neutral' },
];

export function Onboarding({ onNavigate }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [permissionStates, setPermissionStates] = useState(permissions);
  const [undertone, setUndertone] = useState('Neutral');
  const [saving, setSaving] = useState(false);

  const totalSteps = 3;

  const togglePermission = (index: number) => {
    setPermissionStates(prev => 
      prev.map((p, i) => i === index ? { ...p, granted: !p.granted } : p)
    );
  };

  const handleContinue = async () => {
    if (currentStep === 1) {
      setSaving(true);
      try {
        await apiPost('/api/profile/', { skin_undertone: undertone });
      } finally {
        setSaving(false);
      }
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onNavigate('photo-upload');
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <div className="px-6 pt-12 pb-6">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                i <= currentStep ? 'bg-sage' : 'bg-sand'
              }`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-sage/20 to-sand flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M20 5L12 15H28L20 5Z"
                fill="currentColor"
                className="text-sage"
              />
              <rect x="15" y="15" width="10" height="20" rx="2" fill="currentColor" className="text-sage" />
            </svg>
          </div>
          <h1 className="mb-2">Welcome</h1>
          {/* <p className="caption text-charcoal/60">Let's personalize your wardrobe</p> */}
        </motion.div>
      </div>

      <div className="flex-1 px-6 pb-6">
        {currentStep === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-48 h-48 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-sage/10 to-sand/50 flex items-center justify-center"
              >
                <img
                  src="/media/logo/image-removebg-preview.png"
                  alt="Kapaat"
                  className="max-h-20 w-auto object-contain"
                />
              </motion.div>
              <h2 className="mb-3">Your Digital Closet</h2>
              <p className="text-charcoal/60">
                Organize, style, and make sustainable fashion choices with AI
              </p>
            </div>

            <div className="space-y-3">
              {['Smart outfit recommendations', 'Virtual try-on', 'Sustainability tracking'].map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-sand/30"
                >
                  <div className="w-6 h-6 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 7L5.5 10.5L12 4"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-charcoal/80">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div className="mb-6">
              <h2 className="mb-2">Skin Undertone</h2>
              <p className="text-charcoal/60 caption">
                Select the closest match for your wrist vein color
              </p>
            </div>

            <div className="space-y-3">
              {undertones.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => setUndertone(tone.value)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    undertone === tone.value
                      ? 'bg-sage/10 border-sage text-charcoal'
                      : 'bg-white border-sand text-charcoal/70'
                  }`}
                >
                  <span className="font-semibold">{tone.label}</span>
                  <span className="caption">{tone.value}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="mb-6">
              <h2 className="mb-2">Grant Permissions</h2>
              <p className="text-charcoal/60 caption">
                We need this to give better recommendations
              </p>
            </div>

            {permissionStates.map((permission, index) => (
              <motion.div
                key={permission.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => togglePermission(index)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  permission.granted
                    ? 'bg-sage/10 border-sage'
                    : 'bg-white border-sand'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    permission.granted ? 'bg-sage text-white' : 'bg-sand text-charcoal/60'
                  }`}>
                    <permission.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 text-[16px]">{permission.title}</h3>
                    <p className="caption text-charcoal/60">{permission.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    permission.granted
                      ? 'bg-sage border-sage'
                      : 'bg-white border-grey'
                  }`}>
                    {permission.granted && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2 7L5.5 10.5L12 4"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <div className="px-6 pb-8 pt-4 bg-gradient-to-t from-ivory via-ivory to-transparent">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-sage text-white font-semibold shadow-lg shadow-sage/20"
        >
          {currentStep < totalSteps - 1 ? 'Continue' : 'Get Started'}
        </motion.button>
        
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            className="w-full py-3 mt-3 text-charcoal/60 caption"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
