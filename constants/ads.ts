import { Platform } from 'react-native';

const IS_TEST = __DEV__;

// Safe dynamic import for TestIds — native module may not be available in dev/simulator builds
let TestIds: { BANNER: string; INTERSTITIAL: string } = {
  BANNER: 'ca-app-pub-3940256099942544/2934735716',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/4411468910',
};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
  TestIds = m.TestIds as unknown as { BANNER: string; INTERSTITIAL: string };
} catch {}

const PROD_IDS = {
  ios: {
    banner: 'ca-app-pub-6220210021054377/4321721710',
    interstitial: 'ca-app-pub-6220210021054377/8853887303',
  },
  android: {
    banner: 'ca-app-pub-6220210021054377/6021816197',
    interstitial: 'ca-app-pub-6220210021054377/7540805636',
  },
};

const platform = Platform.OS === 'ios' ? 'ios' : 'android';

export const AD_UNIT_IDS = {
  banner: IS_TEST ? TestIds.BANNER : PROD_IDS[platform].banner,
  interstitial: IS_TEST ? TestIds.INTERSTITIAL : PROD_IDS[platform].interstitial,
};
