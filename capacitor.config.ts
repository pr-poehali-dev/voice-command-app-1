import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.poehali.voiceassistant',
  appName: 'Голосовой помощник',
  webDir: 'dist',
  android: {
    backgroundColor: '#F7F7F5',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
