type SWFeatureFlags = {
  customLensSelection?: boolean;
  demoMode?: boolean;
};

export function isDemoModeEnabled() {
  const windowFlags = (window as Window & { __SW_FEATURES__?: SWFeatureFlags }).__SW_FEATURES__;
  if (typeof windowFlags?.demoMode === 'boolean') {
    return windowFlags.demoMode;
  }

  return String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';
}
