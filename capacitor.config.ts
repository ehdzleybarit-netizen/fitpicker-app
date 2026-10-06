import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitpicker.app',
  appName: 'FitPicker',
  webDir: 'build',
  server: {
    cleartext: true,        // <-- ITO ANG IMPORTANTE
    androidScheme: 'https'
  }
};

export default config;