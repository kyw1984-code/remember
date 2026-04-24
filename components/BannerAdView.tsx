import React, { useState } from 'react';
import { View } from 'react-native';
import { AD_UNIT_IDS } from '../constants/ads';

// Safe dynamic import — native module may not be available in dev/simulator builds
let BannerAdComponent: React.ComponentType<any> | null = null;
let BannerAdSizeValue: Record<string, string> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
  BannerAdComponent = m.BannerAd as unknown as React.ComponentType<any>;
  BannerAdSizeValue = m.BannerAdSize as unknown as Record<string, string>;
} catch {}

export default function BannerAdView() {
  const [visible, setVisible] = useState(false);

  if (!BannerAdComponent || !BannerAdSizeValue) return null;

  return (
    <View style={{ alignItems: 'center', height: visible ? undefined : 0, overflow: 'hidden' }}>
      <BannerAdComponent
        unitId={AD_UNIT_IDS.banner}
        size={BannerAdSizeValue.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => setVisible(true)}
        onAdFailedToLoad={() => setVisible(false)}
      />
    </View>
  );
}
