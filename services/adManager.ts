import { AD_UNIT_IDS } from '../constants/ads';

// Safe dynamic import — native module may not be available in dev/simulator builds
let InterstitialAdClass: typeof import('react-native-google-mobile-ads').InterstitialAd | null = null;
let AdEventTypeValue: typeof import('react-native-google-mobile-ads').AdEventType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
  InterstitialAdClass = m.InterstitialAd;
  AdEventTypeValue = m.AdEventType;
} catch {}

let sessionCount = 0;
let interstitial: import('react-native-google-mobile-ads').InterstitialAd | null = null;
let isLoaded = false;

function loadAd() {
  if (!InterstitialAdClass || !AdEventTypeValue) return;
  interstitial = InterstitialAdClass.createForAdRequest(AD_UNIT_IDS.interstitial, {
    requestNonPersonalizedAdsOnly: true,
  });
  interstitial.addAdEventListener(AdEventTypeValue.LOADED, () => { isLoaded = true; });
  interstitial.addAdEventListener(AdEventTypeValue.CLOSED, () => { isLoaded = false; loadAd(); });
  interstitial.addAdEventListener(AdEventTypeValue.ERROR, () => { isLoaded = false; });
  interstitial.load();
}

export function initAds() {
  loadAd();
}

export async function showInterstitialIfReady(): Promise<void> {
  sessionCount += 1;
  if (sessionCount % 2 !== 0) return;
  if (!interstitial || !isLoaded) return;
  await interstitial.show();
}
