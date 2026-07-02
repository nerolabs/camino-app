import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Camino',
  slug: 'camino',
  owner: 'nerolabs-team',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'caminoapp',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.nerolabs.camino',
    infoPlist: {
      // App uses only standard HTTPS (exempt encryption) — avoids the manual export-compliance step.
      ITSAppUsesNonExemptEncryption: false,
      // A linked system framework (expo-file-system) references the Photos API, so Apple's static
      // check (ITMS-90683) requires this string even though Camino does not access your photos.
      // TODO(public-release): revisit — drop this if we confirm no photo API path ships.
      NSPhotoLibraryUsageDescription:
        'Camino does not access your photo library; this entry is only required by a system framework the app links against.',
    },
  },
  android: {
    package: 'com.nerolabs.camino',
    adaptiveIcon: {
      backgroundColor: '#2B5AA3',
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
    // sitemap:false removes the auto-injected /_sitemap route index (which otherwise lists every
    // route, including the unlisted /how-i-was-built blog). Expo Router has no per-route exclusion.
    ['expo-router', { sitemap: false }],
    ['expo-splash-screen', {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FBFAF7',
    }],
    'expo-font',
    ['expo-speech-recognition', {
      microphonePermission: 'Allow Camino to use the microphone so you can dictate your answers.',
      speechRecognitionPermission: 'Allow Camino to use speech recognition to transcribe your spoken answers.',
    }],
    // expo-speech-recognition requires iOS 16.4+; pin the deployment target so the pod builds.
    ['expo-build-properties', { ios: { deploymentTarget: '16.4' } }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: '5714f767-d3dc-4284-8235-33e6d7e6f381' },
    // Note: the Anthropic key is intentionally NOT exposed here. It lives only on the
    // server (process.env.ANTHROPIC_API_KEY) and is used by app/api/lola+api.ts.
  },
};

export default config;
