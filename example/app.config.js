const path = require('node:path');
const repository = path.resolve(__dirname, '../.local/maven');
module.exports = {
  expo: {
    name: 'Amazon Community Example',
    slug: 'openiap-provider-amazon-example',
    version: '0.1.0',
    scheme: 'amazon-provider-lab',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    android: {
      package: 'dev.openiap.provider.fireos.example',
      allowBackup: false,
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        '@hyodotdev/openiap-provider-amazon-example',
        {
          openIapRepository: repository,
          android: {
            amazon: {appstoreKey: process.env.AMAZON_APPSTORE_KEY},
          },
        },
      ],
      ['expo-build-properties', {android: {kotlinVersion: '2.1.20'}}],
    ],
    extra: {
      amazonRvsSandbox: process.env.EXPO_PUBLIC_AMAZON_RVS_SANDBOX ?? 'true',
      iapkitApiKey: process.env.EXPO_PUBLIC_IAPKIT_API_KEY,
      iapkitBaseUrl: process.env.EXPO_PUBLIC_IAPKIT_BASE_URL,
    },
  },
};
