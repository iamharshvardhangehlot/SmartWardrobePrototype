import { Home, Sparkles, Shirt, BarChart3, Settings } from 'lucide-react';
import { Screen } from '../App';

interface BottomNavProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

const items: { icon: any; label: string; screen: Screen }[] = [
  { icon: Home, label: 'Home', screen: 'home' },
  { icon: Sparkles, label: 'AI Style', screen: 'ai-outfit' },
  { icon: Shirt, label: 'Closet', screen: 'wardrobe' },
  { icon: BarChart3, label: 'Impact', screen: 'sustainability' },
  { icon: Settings, label: 'Settings', screen: 'settings' },
];

export function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-sand px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {items.map((item) => {
          const active = current === item.screen;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.screen)}
              className="flex flex-col items-center gap-1"
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  active ? 'bg-sage/15 text-sage' : 'text-charcoal/70'
                }`}
              >
                <item.icon className="w-5 h-5" />
              </span>
              <span className={`microtext ${active ? 'text-sage' : 'text-charcoal/60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
