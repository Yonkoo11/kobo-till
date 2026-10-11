// Serves /.well-known/assetlinks.json (rewritten here) with Content-Type exactly "application/json".
// The wallet's Digital Asset Links verifier (solana-mobile digital-asset-links-android, URISourceVerifier)
// compares the header with string equality, and Vercel appends "; charset=utf-8" to static .json files,
// so the document is not a static file. Fingerprint = the release signing certificate of com.kobotill.app.
const links = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.kobotill.app',
      sha256_cert_fingerprints: ['B8:80:C2:09:DC:1E:4C:EE:CC:DC:F7:6B:B5:97:68:80:7B:E4:7C:9C:7D:61:92:58:87:1B:44:EF:40:31:D4:2D'],
    },
  },
]
module.exports = (req, res) => {
  // writeHead + end: Vercel's res.send helper appends a charset to string bodies.
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' })
  res.end(JSON.stringify(links))
}
