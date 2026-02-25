import { motion } from 'motion/react';
import { ArrowLeft, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { Screen } from '../App';
import { useRef, useState } from 'react';
import { apiPost } from '../lib/api';

interface AddItemScreenProps {
  onNavigate: (screen: Screen) => void;
}

const fabricOptions = [
  'Cotton',
  'Linen',
  'Wool',
  'Denim',
  'Silk',
  'Polyester',
  'Nylon',
  'Synthetic',
  'Leather',
  'Suede',
  'Other',
];

export function AddItemScreen({ onNavigate }: AddItemScreenProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [price, setPrice] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  const [fabricType, setFabricType] = useState('Cotton');
  const [bulkFabricType, setBulkFabricType] = useState('Cotton');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const singleRef = useRef<HTMLInputElement>(null);
  const bulkRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    setStatus('');
    const form = new FormData();
    form.append('mode', mode);

    if (mode === 'single') {
      if (!singleFile) {
        setStatus('Please select a photo.');
        return;
      }
      form.append('image', singleFile);
      form.append('purchase_price', price || '0');
      form.append('fabric_type', fabricType);
    } else {
      if (bulkFiles.length === 0) {
        setStatus('Please select photos for bulk upload.');
        return;
      }
      bulkFiles.forEach((file) => form.append('images', file));
      form.append('bulk_price', bulkPrice || '0');
      form.append('fabric_type', bulkFabricType);
    }

    setSaving(true);
    try {
      const response = await apiPost('/api/add-item/', form);
      const payload = await response.json();
      if (response.ok && payload.status === 'success') {
        setStatus(mode === 'single' ? 'Item added!' : `Added ${payload.count || 0} items!`);
        setSingleFile(null);
        setBulkFiles([]);
        setPrice('');
        setBulkPrice('');
      } else {
        setStatus(payload.message || 'Unable to save. Check your inputs.');
      }
    } catch {
      setStatus('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory pb-20">
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => onNavigate('home')} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-charcoal" />
          </button>
        </div>

        <h1 className="mb-2">Add New Items</h1>
        <p className="caption text-charcoal/60">Scan a single garment or upload in bulk.</p>
      </div>

      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'single', label: 'Single Item' },
            { key: 'bulk', label: 'Bulk Upload' },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setMode(option.key as 'single' | 'bulk')}
              className={`py-3 rounded-2xl text-sm font-semibold transition-all ${
                mode === option.key ? 'bg-sage text-white' : 'bg-white border-2 border-sand text-charcoal/70'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-6">
        {mode === 'single' ? (
          <>
            <div className="p-5 rounded-3xl bg-sand">
              <div className="aspect-[3/4] rounded-2xl bg-white flex flex-col items-center justify-center gap-4">
                {singleFile ? (
                  <img
                    src={URL.createObjectURL(singleFile)}
                    alt="Selected garment"
                    className="max-h-56 object-contain"
                  />
                ) : (
                  <ImageIcon className="w-16 h-16 text-charcoal/30" />
                )}
                <button
                  onClick={() => singleRef.current?.click()}
                  className="px-5 py-2 rounded-xl bg-sage text-white caption font-semibold"
                >
                  {singleFile ? 'Change Photo' : 'Upload Photo'}
                </button>
                <input
                  ref={singleRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSingleFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="microtext text-charcoal/60">Purchase Price (INR)</label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-charcoal"
                  placeholder="e.g. 1200"
                />
              </div>
              <div className="space-y-2">
                <label className="microtext text-charcoal/60">Fabric Type</label>
                <select
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                  className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-charcoal"
                >
                  {fabricOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-5 rounded-3xl bg-sand">
              <div className="rounded-2xl bg-white p-6 flex flex-col items-center gap-4">
                <Upload className="w-12 h-12 text-sage/60" />
                <p className="caption text-charcoal/60">
                  {bulkFiles.length > 0 ? `${bulkFiles.length} photos selected` : 'Upload multiple garment photos'}
                </p>
                <button
                  onClick={() => bulkRef.current?.click()}
                  className="px-5 py-2 rounded-xl bg-sage text-white caption font-semibold"
                >
                  {bulkFiles.length > 0 ? 'Change Photos' : 'Select Photos'}
                </button>
                <input
                  ref={bulkRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setBulkFiles(Array.from(e.target.files || []))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="microtext text-charcoal/60">Default Price (INR)</label>
                <input
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-charcoal"
                  placeholder="e.g. 500"
                />
              </div>
              <div className="space-y-2">
                <label className="microtext text-charcoal/60">Default Fabric Type</label>
                <select
                  value={bulkFabricType}
                  onChange={(e) => setBulkFabricType(e.target.value)}
                  className="w-full rounded-xl border border-sand bg-white px-4 py-3 text-charcoal"
                >
                  {fabricOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {status && (
          <div className="p-4 rounded-2xl bg-white border border-sand text-charcoal/70 caption">
            {status}
          </div>
        )}
      </div>

      <div className="px-6 pb-10 pt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-5 mt-4 rounded-2xl bg-sage text-white font-semibold shadow-lg shadow-sage/20 flex items-center justify-center gap-2"
        >
          {saving ? 'Processing...' : mode === 'single' ? 'Analyze Item' : 'Analyze Bulk Items'}
          <Camera className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
