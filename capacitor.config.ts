import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myapp',
  appName: 'myapp',
  webDir: 'build',
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;