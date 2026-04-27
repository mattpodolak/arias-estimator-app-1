import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ariasinterior.estimator",
  appName: "ARIAS Estimator",
  webDir: "out",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
