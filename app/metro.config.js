const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Cache transforms per project; the machine-wide Metro cache can serve stale transforms from other projects.
config.cacheStores = ({ FileStore }) => [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
]

// Web export only: the native crypto/base64/buffer modules have no web build (they crash on
// TurboModuleRegistry). The browser already provides crypto and base64, so point them at web-safe code.
const WEB_ONLY = {
  'react-native-quick-crypto': path.join(__dirname, 'web-shims', 'quick-crypto.js'),
  'react-native-quick-base64': require.resolve('base64-js'),
  '@craftzdog/react-native-buffer': require.resolve('buffer/'),
}
const baseResolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_ONLY[moduleName]) return { type: 'sourceFile', filePath: WEB_ONLY[moduleName] }
  return (baseResolve || context.resolveRequest)(context, moduleName, platform)
}

module.exports = config
