/// <reference types="@capacitor/core" />

const config = {
  appId: "com.aethermailer.app",
  appName: "Aether Mailer",
  webDir: "app/out",
  bundledWebRuntime: false,

  server: {
    url: process.env.CAPACITOR_SERVER_URL || "http://localhost:3000",
    cleartext: true,
  },

  ios: {
    scheme: "AetherMailer",
    webContentsDebuggingEnabled: process.env.NODE_ENV === "development",
    backgroundColor: "#1a1a1a",
    allowInlineMediaPlayback: true,
    preloadWebView: true,
    allowsBackForwardNavigationGestures: false,
    universalLinks: [
      {
        host: "aether-mailer.com",
        path: "/mail/*",
      },
    ],
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV === "development",
    backgroundColor: "#1a1a1a",
    hardwareAccelerated: true,
    allowFileAccessFromFileURLs: false,
    allowUniversalAccessFromFileURLs: false,
    inputType: "adjustResize",
    appendUserAgent: "AetherMailer/1.0.0",
    permissions: [
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "WAKE_LOCK",
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "WRITE_EXTERNAL_STORAGE",
      "READ_EXTERNAL_STORAGE",
    ],
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1a1a1a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      iOSLaunchStoryboardFile: "LaunchScreen",
      launchStoryboardName: "LaunchScreen",
    },

    StatusBar: {
      style: "DARK",
      backgroundColor: "#1a1a1a",
      overlaysWebView: false,
    },

    App: {
      appendUserAgent: "AetherMailer/1.0.0",
      handleApplicationEvents: true,
      handleApplicationNotifications: true,
    },

    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },

    Network: {
      handleNetworkChanges: true,
      backgroundSync: true,
    },

    Preferences: {
      group: "com.aethermailer.shared",
      encrypt: true,
      sync: true,
    },

    Haptics: {
      enableHaptics: true,
    },

    PushNotifications: {
      handleNotificationActions: true,
      handleBackgroundNotifications: true,
      sound: "default",
      badge: true,
      vibrate: true,
    },

    Filesystem: {
      enableFileAccess: true,
      cacheDirectory: "aether-mailer-cache",
      documentsDirectory: "aether-mailer-docs",
    },

    Camera: {
      enableCamera: true,
      enablePhotoLibrary: true,
      quality: 80,
      maxWidth: 1024,
      maxHeight: 1024,
    },

    Geolocation: {
      enableGeolocation: false,
      desiredAccuracy: "high",
      maximumAge: 300000,
    },

    Device: {
      enableDevice: true,
      collectMetrics: process.env.NODE_ENV === "development",
    },

    LocalAuthentication: {
      enableBiometric: true,
      enablePasscode: true,
      timeout: 30000,
      maxAttempts: 3,
    },

    Share: {
      enableShare: true,
      methods: ["email", "link", "file"],
    },

    SpeechRecognition: {
      enableSpeech: true,
      language: "en-US",
      continuous: false,
      interimResults: true,
    },

    TextToSpeech: {
      enableTTS: true,
      voice: "default",
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    },
  },

  deepLinking: {
    urlScheme: "aethermailer",
  },

  loggingBehavior:
    process.env.NODE_ENV === "development" ? "debug" : "production",

  performance: {
    enableMonitoring: true,
    memoryManagement: true,
    cpuOptimization: true,
  },

  security: {
    enableCSP: true,
    preventClickjacking: true,
    httpsOnly: process.env.NODE_ENV === "production",
  },

  cors: {
    enabled: true,
    allowedOrigins: [
      "http://localhost:3000",
      "https://aether-mailer.com",
      "https://app.aether-mailer.com",
    ],
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  },

  build: {
    platforms: ["ios", "android", "electron", "web"],
    optimization: true,
    sourceMap: process.env.NODE_ENV === "development",
    minify: process.env.NODE_ENV === "production",
  },

  development: {
    enableDevTools: process.env.NODE_ENV === "development",
    hotReload: true,
    liveReload: true,
    debug: process.env.NODE_ENV === "development",
  },

  production: {
    enableOptimizations: true,
    cache: true,
    compression: true,
    securityHeaders: true,
  },
};

export default config;
