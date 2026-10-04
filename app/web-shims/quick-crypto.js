// Web build only (see metro.config.js): browsers already provide crypto.getRandomValues and crypto.subtle,
// so the native crypto module has nothing to install. Metro points react-native-quick-crypto here on web.
export function install() {}
export default { install }
