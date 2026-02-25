import { motion } from 'motion/react';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  CloudDrizzle,
  CloudSun,
  CloudMoon,
  CloudSunRain,
  Sparkles,
  Scan,
  BarChart3,
  Calendar,
  Moon,
  Sun,
  Leaf,
} from 'lucide-react';
import { Screen } from '../App';
import { useEffect, useState } from 'react';
import { BottomNav } from './BottomNav';
import { apiPost } from '../lib/api';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  onToggleTheme: (event: React.MouseEvent<HTMLButtonElement>) => void;
  darkMode: boolean;
  onViewScheduledOutfit: (schedule: ScheduledOutfitPayload) => void;
}

type HomePayload = {
  greeting?: string;
  user_name?: string;
  date?: string;
  time?: string;
  city?: string;
  green_points?: number;
  wardrobe_count?: number;
  weather?: {
    temp_c?: number | null;
    condition?: string | null;
    description?: string | null;
  };
  todays_outfit?: ScheduledOutfitPayload | null;
};

type ScheduledOutfitPayload = {
  id: number;
  top_id?: number | null;
  bottom_id?: number | null;
  top_name?: string | null;
  bottom_name?: string | null;
  image_url?: string | null;
};

export function HomeScreen({ onNavigate, onToggleTheme, darkMode, onViewScheduledOutfit }: HomeScreenProps) {
  const [data, setData] = useState<HomePayload | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchHome = () =>
      fetch('/api/home/', { credentials: 'same-origin' })
        .then((res) => (res.ok ? res.json() : null))
        .then((payload) => {
          if (!mounted) return;
          if (payload && payload.status === 'success') {
            setData(payload);
          }
        })
        .catch(() => null)
        .finally(() => {
          if (mounted) setLoaded(true);
        });

    fetchHome();

    const lastUpdate = Number(localStorage.getItem('sw_last_location') || 0);
    const shouldRefreshLocation = !lastUpdate || Date.now() - lastUpdate > 6 * 60 * 60 * 1000;

    if (shouldRefreshLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `/resolve-location/?lat=${latitude}&lon=${longitude}`,
              { credentials: 'same-origin' }
            );
            const payload = await response.json();
            if (payload?.status === 'success' && payload.city) {
              const form = new FormData();
              form.append('city', payload.city);
              form.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
              await apiPost('/update-location/', form);
              localStorage.setItem('sw_last_location', String(Date.now()));
              fetchHome();
            }
          } catch {
            // ignore location errors
          }
        },
        () => {
          // ignore denied/timeout
        },
        { maximumAge: 60 * 60 * 1000, timeout: 8000 }
      );
    }

    return () => {
      mounted = false;
    };
  }, []);

  const fallbackDate = new Date();
  const timeString =
    data?.time ||
    fallbackDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  const dateString =
    data?.date ||
    fallbackDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  const greeting = data?.greeting || 'Good Morning';
  const userName = data?.user_name ? data.user_name.trim() : '';
  const greetingText = userName ? `${greeting}, ${userName}` : greeting;
  const city = data?.city || 'Unknown';
  const tempText =
    data?.weather?.temp_c !== null && data?.weather?.temp_c !== undefined
      ? `${data.weather.temp_c}\u00B0C`
      : 'Weather';
  const condition = data?.weather?.condition || data?.weather?.description || 'Loading';
  const weatherText = (condition || '').toLowerCase();
  const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hour = fallbackDate.getHours();
  if (timeMatch) {
    const rawHour = parseInt(timeMatch[1], 10) % 12;
    const isPm = timeMatch[3].toUpperCase() === 'PM';
    hour = rawHour + (isPm ? 12 : 0);
  }
  const isNight = hour >= 19 || hour < 6;
  let WeatherIcon = Cloud;
  if (/thunder|storm|lightning/.test(weatherText)) {
    WeatherIcon = CloudLightning;
  } else if (/snow|sleet|ice|blizzard/.test(weatherText)) {
    WeatherIcon = CloudSnow;
  } else if (/rain|shower|drizzle/.test(weatherText)) {
    WeatherIcon = /sun/.test(weatherText) ? CloudSunRain : CloudRain;
  } else if (/fog|mist|haze|smoke/.test(weatherText)) {
    WeatherIcon = CloudFog;
  } else if (/clear|sun/.test(weatherText)) {
    WeatherIcon = isNight ? CloudMoon : CloudSun;
  } else if (/cloud/.test(weatherText)) {
    WeatherIcon = isNight ? CloudMoon : Cloud;
  } else if (/drizzle/.test(weatherText)) {
    WeatherIcon = CloudDrizzle;
  }
  const wardrobeCount =
    data?.wardrobe_count !== undefined ? `${data.wardrobe_count} items organized` : 'Your digital closet';
  const todaysOutfit = data?.todays_outfit || null;
  const pointsText =
    data?.green_points !== undefined && data?.green_points !== null
      ? `${data.green_points} Green Points`
      : '0 Green Points';

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Header - Weather & Time */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <img
              src="/media/logo/image-removebg-preview.png"
              alt="Smart Wardrobe"
              className="w-28 h-10 object-contain mb-2 "
            />
            <h1 className="mb-1">{greetingText}</h1>
            <p className="caption text-charcoal/60">{dateString}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <WeatherIcon className="w-5 h-5 text-sage" />
              <span className="text-[20px] font-semibold">{tempText}</span>
            </div>
            <p className="caption text-charcoal/60">{loaded ? condition : 'Loading'}</p>
          </div>
        </motion.div>

        {/* Time Display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[48px] font-semibold leading-none mb-2 text-sage"
        >
          {timeString}
        </motion.div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-charcoal/70">{city}</p>
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-toggle w-10 h-10 rounded-full flex items-center justify-center"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {todaysOutfit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 mb-6"
        >
          <div className="p-5 rounded-3xl bg-white border border-sand flex gap-4 items-center">
            <div className="w-20 h-24 rounded-2xl bg-sand overflow-hidden flex items-center justify-center">
              {todaysOutfit.image_url ? (
                <img
                  src={todaysOutfit.image_url}
                  alt="Scheduled outfit"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl text-charcoal/40">*</span>
              )}
            </div>
            <div className="flex-1">
              <div className="caption text-charcoal/60 mb-1">Today's Outfit</div>
              <div className="text-sm font-semibold text-charcoal">
                {(todaysOutfit.top_name || 'Top')}{todaysOutfit.bottom_name ? ` + ${todaysOutfit.bottom_name}` : ''}
              </div>
            </div>
            <button
              onClick={() => onViewScheduledOutfit(todaysOutfit)}
              className="px-4 py-2 rounded-xl bg-sage text-white caption font-semibold"
            >
              View
            </button>
          </div>
        </motion.div>
      )}

      {/* Action Cards */}
      <div className="px-6 space-y-4 mb-8">
        {!loaded && (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 rounded-3xl bg-sand/60" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 rounded-3xl bg-sand/60" />
              <div className="h-24 rounded-3xl bg-sand/60" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 rounded-3xl bg-sand/60" />
              <div className="h-24 rounded-3xl bg-sand/60" />
            </div>
          </div>
        )}
        {loaded && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-3xl bg-sage p-6 text-white shadow-md"
            >
              <div className="relative z-10">
                <Leaf className="w-8 h-8 mb-3 opacity-90" />
                <div className="text-3xl font-semibold tracking-tight text-white">{pointsText}</div>
                <p className="caption text-white/80 mt-2">{wardrobeCount}</p>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => onNavigate('ai-outfit')}
                className="relative overflow-hidden rounded-3xl bg-sand p-6 cursor-pointer"
              >
                <Sparkles className="w-8 h-8 text-sage mb-3" />
                <h3 className="mb-1">AI Outfit</h3>
                <p className="caption text-charcoal/60">Styled just for you</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => onNavigate('add-item')}
                className="relative overflow-hidden rounded-3xl bg-sand p-6 cursor-pointer"
              >
                <Scan className="w-8 h-8 text-sage mb-3" />
                <h3 className="mb-1">Scan Item</h3>
                <p className="caption text-charcoal/60">Add garments</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => onNavigate('sustainability')}
                className="relative overflow-hidden rounded-3xl bg-white border-2 border-sand p-6 cursor-pointer"
              >
                <BarChart3 className="w-8 h-8 text-sage mb-3" />
                <h3 className="mb-1">Eco Stats</h3>
                <p className="caption text-charcoal/60">Track impact</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                onClick={() => onNavigate('calendar')}
                className="relative overflow-hidden rounded-3xl bg-white border-2 border-sand p-6 cursor-pointer"
              >
                <Calendar className="w-8 h-8 text-sage mb-3" />
                <h3 className="mb-1">Planner</h3>
                <p className="caption text-charcoal/60">Schedule looks</p>
              </motion.div>
            </div>
          </>
        )}
      </div>

      {/* Today's Suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-6"
      >
        <div className="p-6 rounded-3xl bg-gradient-to-br from-terracotta/10 to-gold/10 border border-terracotta/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-terracotta" />
            <span className="font-semibold">Your Style Today</span>
          </div>
          <p className="caption text-charcoal/70 mb-4">
            Perfect weather for layering! Try your camel coat with a cream turtleneck.
          </p>
          <button
            onClick={() => onNavigate('ai-outfit')}
            className="px-4 py-2 rounded-xl bg-terracotta text-white caption font-semibold"
          >
            View Outfit
          </button>
        </div>
      </motion.div>

      <BottomNav current="home" onNavigate={onNavigate} />
    </div>
  );
}
