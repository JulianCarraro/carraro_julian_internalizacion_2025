import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codigobendito.menugointernalizacion',
  appName: 'MenúGo-Internalización',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: "#0A192F",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: false,
      splashImmersive: false,
      layoutName: "launch_screen",
      useDialog: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    GoogleAuth: {
      clientId: '946956729132-s9udbeslev9e7ivbu4e76sqebdd74gom.apps.googleusercontent.com',
      scopes: ['profile','email'],
      androidClientId:'946956729132-q275iacl76mco4etfvgvpgfa0b2kps7b.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
