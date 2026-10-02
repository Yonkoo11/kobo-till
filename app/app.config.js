// Test builds (EXPO_PUBLIC_KOBO_TEST_RPC set) talk to a local validator over http, so only they allow
// cleartext traffic. Real builds never do.
module.exports = ({ config }) => {
  if (!process.env.EXPO_PUBLIC_KOBO_TEST_RPC) return config
  return {
    ...config,
    name: 'Kobo TEST',
    android: { ...config.android, package: 'com.kobotill.app.test' },
    plugins: [...config.plugins, ['expo-build-properties', { android: { usesCleartextTraffic: true } }]],
  }
}
