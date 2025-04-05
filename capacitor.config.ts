
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.44dda8e9c5d249c3a8503c3e319bbfbc',
  appName: 'elevate360-skill-builder',
  webDir: 'dist',
  server: {
    url: "https://44dda8e9-c5d2-49c3-a850-3c3e319bbfbc.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1E3A8A",
      showSpinner: true,
      spinnerColor: "#ffffff",
    },
  },
};

export default config;
