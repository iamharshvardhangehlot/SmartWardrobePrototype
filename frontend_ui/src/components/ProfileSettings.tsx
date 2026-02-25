import { motion } from 'motion/react';
import { ArrowLeft, User, Camera, Upload, Sparkles, MapPin, Ruler, Droplet } from 'lucide-react';
import { Screen } from '../App';
import { useEffect, useRef, useState } from 'react';
import { apiPost } from '../lib/api';
import { BottomNav } from './BottomNav';

interface ProfileSettingsProps {
  onNavigate: (screen: Screen) => void;
}

type ProfilePayload = {
  season?: string | null;
  skin_undertone?: string | null;
  contrast_level?: string | null;
  city?: string | null;
  timezone?: string | null;
  height_cm?: number | string | null;
  weight_kg?: number | string | null;
  selfie_url?: string | null;
  full_body_url?: string | null;
};

const undertones = [
  { label: 'Warm (Green Veins)', value: 'Warm' },
  { label: 'Cool (Blue Veins)', value: 'Cool' },
  { label: 'Neutral (Mix)', value: 'Neutral' },
];

export function ProfileSettings({ onNavigate }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const selfieRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/profile/', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.status === 'success') {
          setProfile(payload.profile || null);
        }
      })
      .catch(() => null);
  }, []);

  const updateField = (key: keyof ProfilePayload, value: string) => {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setStatus('');
    const form = new FormData();
    form.append('height_cm', String(profile.height_cm || ''));
    form.append('weight_kg', String(profile.weight_kg || ''));
    form.append('skin_undertone', profile.skin_undertone || 'Neutral');
    if (profile.city) form.append('city', profile.city);
    if (profile.timezone) form.append('timezone', profile.timezone);

    const selfieFile = selfieRef.current?.files?.[0];
    if (selfieFile) form.append('selfie', selfieFile);
    const bodyFile = bodyRef.current?.files?.[0];
    if (bodyFile) form.append('full_body_image', bodyFile);

    try {
      const response = await apiPost('/api/profile/', form);
      const payload = await response.json();
      if (response.ok && payload.status === 'success') {
        setProfile(payload.profile || profile);
        setStatus('Profile updated.');
      } else {
        setStatus('Unable to update profile.');
      }
    } catch {
      setStatus('Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory pb-20">
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => onNavigate('home')} className="p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-charcoal" />
          </button>
        </div>

        <h1 className="mb-1">Profile Settings</h1>
        <p className="subheading text-charcoal/60 mb-4">Update your photos, sizing, and styling details.</p>
      </div>

      <div className="px-6 space-y-6">
        <div className="rounded-3xl border border-sand bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Style Profile</div>
              <div className="subheading text-charcoal/60">Based on your analysis.</div>
            </div>
            <Sparkles className="w-5 h-5 text-sage" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-sand bg-ivory/70 px-4 py-3">
              <div className="microtext text-charcoal/60">Season</div>
              <div className="font-semibold text-sm text-charcoal">
                {profile?.season || 'Not set'}
              </div>
            </div>
            <div className="rounded-2xl border border-sand bg-ivory/70 px-4 py-3">
              <div className="microtext text-charcoal/60">Undertone</div>
              <div className="font-semibold text-sm text-charcoal">
                {profile?.skin_undertone || 'Neutral'}
              </div>
            </div>
            <div className="rounded-2xl border border-sand bg-ivory/70 px-4 py-3 col-span-2">
              <div className="microtext text-charcoal/60">Contrast Level</div>
              <div className="font-semibold text-sm text-charcoal">
                {profile?.contrast_level || 'Not set'}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-sand bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Profile Photos</div>
              <div className="subheading text-charcoal/60">Update your selfie and full-body photo.</div>
            </div>
            <Camera className="w-5 h-5 text-sage" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-sand bg-ivory/60 p-3 flex flex-col">
              <div className="text-sm font-semibold text-charcoal">Selfie</div>
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-40 h-40 rounded-full bg-sand/40 overflow-hidden flex items-center justify-center">
                  {profile?.selfie_url ? (
                    <img src={profile.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-charcoal/40" />
                  )}
                </div>
              </div>
              <button
                onClick={() => selfieRef.current?.click()}
                className="w-full py-2 rounded-xl bg-sage text-white text-sm font-semibold shadow mt-auto"
              >
                Update Selfie
              </button>
              <input
                ref={selfieRef}
                type="file"
                accept="image/*"
                className="hidden"
                style={{ display: 'none' }}
              />
            </div>
            <div className="rounded-2xl border border-sand bg-ivory/60 p-3 flex flex-col">
              <div className="text-sm font-semibold text-charcoal">Full Body</div>
              <div className="relative aspect-[3/4] rounded-2xl bg-sand/40 overflow-hidden flex items-center justify-center mt-3">
                {profile?.full_body_url ? (
                  <img src={profile.full_body_url} alt="Full body" className="w-full h-full object-contain" />
                ) : (
                  <User className="w-10 h-10 text-charcoal/40" />
                )}
              </div>
              <div className="flex-1" />
              <button
                onClick={() => bodyRef.current?.click()}
                className="w-full py-2 rounded-xl bg-sage text-white text-sm font-semibold shadow mt-3"
              >
                Update Full Body
              </button>
              <input
                ref={bodyRef}
                type="file"
                accept="image/*"
                className="hidden"
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-sand bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold">Body Details</div>
              <div className="subheading text-charcoal/60">Used for fit and sizing.</div>
            </div>
            <Ruler className="w-5 h-5 text-sage" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="microtext text-charcoal/60" htmlFor="height-input">
                Height (cm)
              </label>
              <input
                id="height-input"
                type="number"
                value={profile?.height_cm || ''}
                onChange={(e) => updateField('height_cm', e.target.value)}
                className="w-full rounded-xl border border-sand bg-ivory px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/40"
              />
            </div>
            <div className="space-y-2">
              <label className="microtext text-charcoal/60" htmlFor="weight-input">
                Weight (kg)
              </label>
              <input
                id="weight-input"
                type="number"
                value={profile?.weight_kg || ''}
                onChange={(e) => updateField('weight_kg', e.target.value)}
                className="w-full rounded-xl border border-sand bg-ivory px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/40"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-sand bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Location</div>
              <div className="subheading text-charcoal/60">Used for weather-aware outfits.</div>
            </div>
            <MapPin className="w-5 h-5 text-sage" />
          </div>
          <div className="space-y-2">
            <label className="microtext text-charcoal/60" htmlFor="city-input">
              City
            </label>
            <input
              id="city-input"
              value={profile?.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
              className="w-full rounded-xl border border-sand bg-ivory px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/40"
              placeholder="Your city"
            />
          </div>
          <div className="space-y-2">
            <label className="microtext text-charcoal/60" htmlFor="timezone-input">
              Timezone
            </label>
            <input
              id="timezone-input"
              value={profile?.timezone || ''}
              onChange={(e) => updateField('timezone', e.target.value)}
              className="w-full rounded-xl border border-sand bg-ivory px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/40"
              placeholder="e.g. Asia/Kolkata"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-sand bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Skin Undertone</div>
              <div className="caption text-charcoal/60">Helps match color palettes.</div>
            </div>
            <Droplet className="w-5 h-5 text-sage" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {undertones.map((tone) => (
              <button
                key={tone.value}
                onClick={() => updateField('skin_undertone', tone.value)}
                className={`w-full px-4 py-3 rounded-2xl border flex items-center justify-between ${
                  profile?.skin_undertone === tone.value
                    ? 'bg-sage/10 border-sage text-charcoal'
                    : 'bg-ivory border-sand text-charcoal/70'
                }`}
              >
                <span className="font-semibold text-sm">{tone.label}</span>
                <span className="caption">{tone.value}</span>
              </button>
            ))}
          </div>
        </div>

        {status && (
          <div className="p-4 rounded-2xl bg-white border border-sand text-charcoal/70 caption">
            {status}
          </div>
        )}
      </div>

      <div className="px-6 pb-10 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-sage text-white font-semibold shadow-lg shadow-sage/20 flex items-center justify-center gap-2"
        >
          {saving ? 'Saving...' : 'Save Changes'}
          <Upload className="w-5 h-5" />
        </motion.button>
      </div>

      <BottomNav current="settings" onNavigate={onNavigate} />
    </div>
  );
}
