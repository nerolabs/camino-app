import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Camino',
  slug: 'camino-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'caminoapp',
  userInterfaceStyle: 'automatic',
  ios: { supportsTablet: true, bundleIdentifier: 'com.nerolabs.camino' },
  android: {
    package: 'com.nerolabs.camino',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'server', // 'server' enables Expo Router API routes (app/api/*+api.ts) on EAS Hosting
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    ['expo-splash-screen', {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FBFAF7',
    }],
    'expo-font',
  ],
  experiments: { typedRoutes: true },
  // Note: the Anthropic key is intentionally NOT exposed here. It lives only on the
  // server (process.env.ANTHROPIC_API_KEY) and is used by app/api/lola+api.ts.
};

export default config;
