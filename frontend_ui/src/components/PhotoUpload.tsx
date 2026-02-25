import { motion } from 'motion/react';
import { Camera, Upload, Info, Check } from 'lucide-react';
import { Screen } from '../App';
import { useRef, useState } from 'react';
import { apiPost } from '../lib/api';

interface PhotoUploadProps {
  onNavigate: (screen: Screen) => void;
}

const steps = [
  {
    id: 1,
    title: 'Close-up Photo',
    description: 'Clear face photo for color analysis',
    tips: ['Good lighting', 'No makeup', 'Neutral background'],
    completed: false,
    field: 'selfie',
  },
  {
    id: 2,
    title: 'Full-length Photo',
    description: 'Body proportions for better fit',
    tips: ['Stand straight', 'Well-lit area', 'Full body visible'],
    completed: false,
    field: 'full_body_image',
  },
];

export function PhotoUpload({ onNavigate }: PhotoUploadProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStates, setStepStates] = useState(steps);
  const [showTips, setShowTips] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    const step = stepStates[currentStep];
    if (!step.field) {
      return;
    }

    const form = new FormData();
    form.append(step.field, file);

    setUploading(true);
    try {
      const response = await apiPost('/api/profile/', form);
      if (response.ok) {
        const updatedSteps = [...stepStates];
        updatedSteps[currentStep].completed = true;
        setStepStates(updatedSteps);

        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setTimeout(() => onNavigate('ai-result'), 500);
        }
      }
    } finally {
      setUploading(false);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  const handleUpload = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  };

  const currentStepData = stepStates[currentStep];

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <div className="px-6 pt-12 pb-6">
        <button
          onClick={() => onNavigate('onboarding')}
          className="mb-6 text-charcoal/60 caption"
        >
          Back
        </button>

        <h1 className="mb-2">Profile Setup</h1>
        <p className="caption text-charcoal/60">
          Step {currentStep + 1} of {steps.length}
        </p>

        <div className="flex gap-3 mt-6">
          {stepStates.map((step, index) => (
            <div
              key={step.id}
              className="flex-1 flex flex-col items-center"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                step.completed
                  ? 'bg-sage text-white'
                  : index === currentStep
                  ? 'bg-sage/20 text-sage border-2 border-sage'
                  : 'bg-sand text-charcoal/40'
              }`}>
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <div className={`microtext text-center ${
                index === currentStep ? 'text-charcoal' : 'text-charcoal/40'
              }`}>
                {step.title.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="relative">
            <div className="aspect-[3/4] rounded-3xl bg-sand/50 border-2 border-dashed border-sage/30 flex flex-col items-center justify-center p-8 text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Camera className="w-16 h-16 text-sage/60 mb-4" />
              </motion.div>
              <h3 className="mb-2">{currentStepData.title}</h3>
              <p className="caption text-charcoal/60 mb-6">
                {currentStepData.description}
              </p>

              <div className="w-32 h-32 mx-auto rounded-2xl bg-white/50 flex items-center justify-center mb-4">
                <div className="text-4xl opacity-30">
                  {currentStep === 0 ? 'Face' : 'Body'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowTips(!showTips)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
            >
              <Info className="w-4 h-4 text-sage" />
            </button>
          </div>

          {showTips && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-sage/5 border border-sage/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-sage" />
                <span className="font-semibold text-sm">Tips for better accuracy</span>
              </div>
              <ul className="space-y-2">
                {currentStepData.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 caption text-charcoal/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-sage mt-1.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-4 rounded-2xl bg-sage text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sage/20"
            >
              <Camera className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Take Photo'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-4 rounded-2xl bg-white border-2 border-sand text-charcoal font-semibold flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload from Library
            </motion.button>
          </div>
        </motion.div>
      </div>

      <div className="px-6 pb-8">
        <div className="flex items-center justify-between microtext text-charcoal/60">
          <span>{stepStates.filter(s => s.completed).length} of {steps.length} completed</span>
        </div>
      </div>
    </div>
  );
}
