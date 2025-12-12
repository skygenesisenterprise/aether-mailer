import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aethermailer.mobile',
  appName: 'Aether Mailer',
  webDir: 'apps/web/out',
  server: {
    // In development, connect to local Next.js dev server
    url: process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000',
    cleartext: true,
    // For production, this will be overridden to point to built web app
  },
  ios: {
    scheme: 'AetherMailer',
    // Enable web inspector for debugging in development
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },
  android: {
    // Android-specific configuration
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
  },
  plugins: {
    // SplashScreen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // StatusBar configuration
    StatusBar: {
      style: 'LIGHT', // Light content for dark status bar
      backgroundColor: '#1a1a1a',
    },
    // App configuration
    App: {
      // Handle app URL schemes for deep linking
      appendUserAgent: 'AetherMailer/1.0.0',
    },
    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    // Network monitoring
    Network: {
      // Enable network status monitoring
      // Useful for offline/online status in the app
    },
    // Storage configuration
    Preferences: {
      // Configure storage group for data sharing
      group: 'com.aethermailer.shared',
    },
    // Haptic feedback
    Haptics: {
      // Enable haptic feedback for better UX
    },
  },
  // Deep linking configuration handled in server.url above
  // Logging configuration
  loggingBehavior: process.env.NODE_ENV === 'development' ? 'debug' : 'production' as any,
  // Performance optimizations handled in individual plugin configs
  // Security settings handled in individual platform configs
  // CORS configuration handled in platform-specific configs
};

export default config;