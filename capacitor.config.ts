import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aethermailer.app',
  appName: 'Aether Mailer',
  webDir: 'app/out',
  bundledWebRuntime: false,
  server: {
    // Development server configuration
    url: process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000',
    cleartext: true,
    // For production, this will be overridden to point to built web app
  },
  
  // Platform-specific configurations
  ios: {
    scheme: 'AetherMailer',
    // Enable web inspector for debugging in development
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
    // iOS-specific settings
    handleApplicationNotifications: true,
    backgroundColor: '#1a1a1a',
    // Configure for mail server management
    allowInlineMediaPlayback: true,
    // Performance optimizations
    preloadWebView: true,
    // Security settings
    allowsBackForwardNavigationGestures: false,
    // Handle deep linking for mailto: links
    universalLinks: [
      {
        host: 'aether-mailer.com',
        path: '/mail/*'
      }
    ]
  },
  
  android: {
    // Android-specific configuration
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
    // Background processing for mail synchronization
    backgroundColor: '#1a1a1a',
    // Performance settings
    hardwareAccelerated: true,
    // Security settings
    allowFileAccessFromFileURLs: false,
    allowUniversalAccessFromFileURLs: false,
    // Android-specific optimizations
    inputType: 'adjustResize',
    // Handle application lifecycle
    captureInput: true,
    // Webview settings
    appendUserAgent: ' AetherMailer/1.0.0',
    // Permissions for mail functionality
    permissions: [
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'WAKE_LOCK',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
      'WRITE_EXTERNAL_STORAGE',
      'READ_EXTERNAL_STORAGE'
    ]
  },
  
  // Plugin configurations
  plugins: {
    // SplashScreen configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a1a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      iOSLaunchStoryboardFile: 'LaunchScreen',
      launchStoryboardName: 'LaunchScreen',
    },
    
    // StatusBar configuration
    StatusBar: {
      style: 'DARK', // Dark content for light status bar
      backgroundColor: '#1a1a1a',
      overlaysWebView: false,
    },
    
    // App configuration
    App: {
      // Handle app URL schemes for deep linking
      appendUserAgent: 'AetherMailer/1.0.0',
      // Handle app lifecycle events
      handleApplicationEvents: true,
      // Background processing for mail sync
      handleApplicationNotifications: true,
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
      // Useful for offline/online status in mail app
      handleNetworkChanges: true,
      // Background sync when network is available
      backgroundSync: true,
    },
    
    // Storage configuration
    Preferences: {
      // Configure storage group for data sharing
      group: 'com.aethermailer.shared',
      // Enable encrypted storage for sensitive data
      encrypt: true,
      // Sync preferences across platforms
      sync: true,
    },
    
    // Haptic feedback
    Haptics: {
      // Enable haptic feedback for better UX
      enableHaptics: true,
      // Haptic patterns for mail actions
      patterns: {
        mailSent: 'success',
        mailReceived: 'notification',
        error: 'warning',
        refresh: 'light'
      }
    },
    
    // Push notifications
    PushNotifications: {
      // Enable push notifications for new mail
      handleNotificationActions: true,
      // Handle background notifications
      handleBackgroundNotifications: true,
      // Sound configuration
      sound: 'default',
      // Badge configuration
      badge: true,
      // Vibration
      vibrate: true,
    },
    
    // File system access
    Filesystem: {
      // Enable file system access for attachments
      enableFileAccess: true,
      // Configure cache directory
      cacheDirectory: 'aether-mailer-cache',
      // Configure documents directory
      documentsDirectory: 'aether-mailer-docs',
    },
    
    // Camera and photo access (for profile pictures)
    Camera: {
      // Enable camera access for profile pictures
      enableCamera: true,
      // Photo library access
      enablePhotoLibrary: true,
      // Quality settings
      quality: 80,
      // Maximum dimensions
      maxWidth: 1024,
      maxHeight: 1024,
    },
    
    // Geolocation (for location-based features)
    Geolocation: {
      // Enable geolocation for location-based features
      enableGeolocation: false, // Disabled by default for privacy
      // Accuracy settings
      desiredAccuracy: 'high',
      // Update frequency
      maximumAge: 300000, // 5 minutes
    },
    
    // Device information
    Device: {
      // Enable device information for debugging
      enableDevice: true,
      // Collect device metrics
      collectMetrics: process.env.NODE_ENV === 'development',
    },
    
    // Local authentication
    LocalAuthentication: {
      // Enable biometric authentication
      enableBiometric: true,
      // Enable passcode authentication
      enablePasscode: true,
      // Authentication timeout
      timeout: 30000, // 30 seconds
      // Maximum failed attempts
      maxAttempts: 3,
    },
    
    // Share functionality
    Share: {
      // Enable sharing functionality
      enableShare: true,
      // Share methods
      methods: ['email', 'link', 'file'],
      // Share dialog configuration
      dialogTitle: 'Share with Aether Mailer',
    },
    
    // Speech recognition
    SpeechRecognition: {
      // Enable speech-to-text for email composition
      enableSpeech: true,
      // Language settings
      language: 'en-US',
      // Continuous recognition
      continuous: false,
      // Interim results
      interimResults: true,
    },
    
    // Text-to-speech
    TextToSpeech: {
      // Enable text-to-speech for email reading
      enableTTS: true,
      // Voice settings
      voice: 'default',
      // Speech rate
      rate: 1.0,
      // Pitch
      pitch: 1.0,
      // Volume
      volume: 1.0,
    },
  },
  
  // Deep linking configuration
  server: {
    // Handle mailto: links
    url: process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000',
    cleartext: true,
    // Handle custom URL schemes
    allowNavigation: ['mailto:*', 'aethermailer:*'],
  },
  
  // Logging configuration
  loggingBehavior: process.env.NODE_ENV === 'development' ? 'debug' : 'production' as any,
  
  // Performance optimizations
  performance: {
    // Enable performance monitoring
    enableMonitoring: true,
    // Memory management
    memoryManagement: true,
    // CPU optimization
    cpuOptimization: true,
  },
  
  // Security settings
  security: {
    // Enable content security policy
    enableCSP: true,
    // Prevent clickjacking
    preventClickjacking: true,
    // Enable HTTPS only in production
    httpsOnly: process.env.NODE_ENV === 'production',
  },
  
  // CORS configuration
  cors: {
    // Enable CORS for API calls
    enabled: true,
    // Allowed origins
    allowedOrigins: [
      'http://localhost:3000',
      'https://aether-mailer.com',
      'https://app.aether-mailer.com'
    ],
    // Allowed methods
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // Allowed headers
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  
  // Build configuration
  build: {
    // Platform-specific build settings
    platforms: ['ios', 'android', 'electron', 'web'],
    // Build optimization
    optimization: true,
    // Source maps
    sourceMap: process.env.NODE_ENV === 'development',
    // Minification
    minify: process.env.NODE_ENV === 'production',
  },
  
  // Development configuration
  development: {
    // Enable development tools
    enableDevTools: process.env.NODE_ENV === 'development',
    // Hot reload
    hotReload: true,
    // Live reload
    liveReload: true,
    // Debug mode
    debug: process.env.NODE_ENV === 'development',
  },
  
  // Production configuration
  production: {
    // Enable production optimizations
    enableOptimizations: true,
    // Cache settings
    cache: true,
    // Compression
    compression: true,
    // Security headers
    securityHeaders: true,
  },
};

export default config;