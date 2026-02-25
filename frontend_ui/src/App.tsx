import { useEffect, useState } from 'react';
import { Onboarding } from './components/Onboarding';
import { PhotoUpload } from './components/PhotoUpload';
import { AIAnalysisResult } from './components/AIAnalysisResult';
import { HomeScreen } from './components/HomeScreen';
import { DigitalWardrobe } from './components/DigitalWardrobe';
import { GarmentDetails } from './components/GarmentDetails';
import { AIOutfitRecommendation } from './components/AIOutfitRecommendation';
import { VirtualTryOnScreen } from './components/VirtualTryOnScreen';
import { OutfitCalendar } from './components/OutfitCalendar';
import { SustainabilityDashboard } from './components/SustainabilityDashboard';
import { EndOfLife } from './components/EndOfLife';
import { ProfileSettings } from './components/ProfileSettings';
import { AddItemScreen } from './components/AddItemScreen';

export type Screen =
  | 'onboarding'
  | 'photo-upload'
  | 'ai-result'
  | 'home'
  | 'wardrobe'
  | 'garment-details'
  | 'ai-outfit'
  | 'try-on'
  | 'calendar'
  | 'sustainability'
  | 'end-of-life'
  | 'settings'
  | 'add-item';

export type GarmentSummary = {
  id: number;
  name: string;
  category?: string;
  image_url?: string;
  wear_count?: number;
  cost_per_wear?: number;
  fabric_type?: string | null;
};

export type OutfitSelection = {
  mood?: string;
  top?: GarmentSummary | null;
  bottom?: GarmentSummary | null;
  image_url?: string | null;
  lock_top?: boolean;
  lock_bottom?: boolean;
};

export default function App() {
  const hasOnboardedCookie = document.cookie.includes('sw_onboarded=1');
  const [currentScreen, setCurrentScreen] = useState<Screen>(
    hasOnboardedCookie ? 'home' : 'onboarding'
  );
  const [selectedGarmentId, setSelectedGarmentId] = useState<number | null>(null);
  const [outfitSelection, setOutfitSelection] = useState<OutfitSelection>({
    lock_top: false,
    lock_bottom: false,
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return false;
  });
  const [flash, setFlash] = useState(false);
  const [flashOrigin, setFlashOrigin] = useState({ x: '80%', y: '10%' });

  useEffect(() => {
    const forceLight = ['onboarding', 'photo-upload', 'ai-result'].includes(currentScreen);
    if (forceLight) {
      document.body.classList.remove('theme-dark');
    } else {
      document.body.classList.toggle('theme-dark', darkMode);
    }
    document.body.classList.add('theme-animate');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    return () => {
      document.body.classList.remove('theme-animate');
    };
  }, [darkMode, currentScreen]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') setDarkMode(false);
    if (saved === 'dark') setDarkMode(true);
  }, [currentScreen]);

  const handleToggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setFlashOrigin({
      x: `${rect.left + rect.width / 2}px`,
      y: `${rect.top + rect.height / 2}px`,
    });
    setFlash(true);
    setDarkMode((prev) => !prev);
    setTimeout(() => setFlash(false), 700);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <Onboarding onNavigate={setCurrentScreen} />;
      case 'photo-upload':
        return <PhotoUpload onNavigate={setCurrentScreen} />;
      case 'ai-result':
        return <AIAnalysisResult onNavigate={setCurrentScreen} />;
      case 'home':
        return (
          <HomeScreen
            onNavigate={setCurrentScreen}
            onToggleTheme={handleToggleTheme}
            darkMode={darkMode}
            onViewScheduledOutfit={(schedule) => {
              setOutfitSelection({
                mood: outfitSelection.mood || 'Casual',
                top: schedule.top_id
                  ? { id: schedule.top_id, name: schedule.top_name || 'Top' }
                  : null,
                bottom: schedule.bottom_id
                  ? { id: schedule.bottom_id, name: schedule.bottom_name || 'Bottom' }
                  : null,
                image_url: schedule.image_url || null,
                lock_top: !!schedule.top_id,
                lock_bottom: !!schedule.bottom_id,
              });
              setCurrentScreen('ai-outfit');
            }}
          />
        );
      case 'wardrobe':
        return (
          <DigitalWardrobe
            onNavigate={setCurrentScreen}
            onSelectGarment={setSelectedGarmentId}
          />
        );
      case 'garment-details':
        return (
          <GarmentDetails
            onNavigate={setCurrentScreen}
            garmentId={selectedGarmentId}
            onStyleItem={(garment) => {
              const category = (garment.category || '').toLowerCase();
              const isBottom = /bottom|trouser|pant|jean|short|skirt/.test(category);
              const isTop = /top|shirt|t-shirt|blazer|jacket|layer/.test(category);
              setOutfitSelection({
                mood: outfitSelection.mood || 'Casual',
                top: isBottom ? outfitSelection.top || null : garment,
                bottom: isBottom ? garment : outfitSelection.bottom || (isTop ? null : null),
                image_url: null,
                lock_top: !isBottom,
                lock_bottom: isBottom,
              });
            }}
          />
        );
      case 'ai-outfit':
        return (
          <AIOutfitRecommendation
            onNavigate={setCurrentScreen}
            outfitSelection={outfitSelection}
            onUpdateSelection={setOutfitSelection}
          />
        );
      case 'try-on':
        return (
          <VirtualTryOnScreen
            onNavigate={setCurrentScreen}
            outfitSelection={outfitSelection}
            onUpdateSelection={setOutfitSelection}
          />
        );
      case 'calendar':
        return (
          <OutfitCalendar
            onNavigate={setCurrentScreen}
            outfitSelection={outfitSelection}
            onUpdateSelection={setOutfitSelection}
          />
        );
      case 'sustainability':
        return (
          <SustainabilityDashboard
            onNavigate={setCurrentScreen}
            onSelectGarment={setSelectedGarmentId}
          />
        );
      case 'end-of-life':
        return (
          <EndOfLife
            onNavigate={setCurrentScreen}
            garmentId={selectedGarmentId}
          />
        );
      case 'settings':
        return <ProfileSettings onNavigate={setCurrentScreen} />;
      case 'add-item':
        return <AddItemScreen onNavigate={setCurrentScreen} />;
      default:
        return <Onboarding onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      {renderScreen()}
      {flash && (
        <div
          className="theme-flash"
          style={{
            ['--fx' as any]: flashOrigin.x,
            ['--fy' as any]: flashOrigin.y,
          }}
        />
      )}
    </div>
  );
}
