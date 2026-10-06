// Signs release builds with the owner's key when ~/.kobo-keys/signing.properties exists (or the file named by
// KOBO_SIGNING). The key and its passwords never enter the repo. Without the file the build falls back to the debug
// key, so anyone can still build and run Kobo from source.
const { withAppBuildGradle } = require('@expo/config-plugins')

const BLOCK = `
// kobo-release-signing (added by plugins/with-release-signing.js)
def koboSigningFile = new File(System.getenv("KOBO_SIGNING") ?: "\${System.getProperty('user.home')}/.kobo-keys/signing.properties")
if (koboSigningFile.exists()) {
    def koboSigning = new Properties()
    koboSigningFile.withInputStream { koboSigning.load(it) }
    android {
        signingConfigs {
            koboRelease {
                storeFile file(koboSigning['storeFile'])
                storePassword koboSigning['storePassword']
                keyAlias koboSigning['keyAlias']
                keyPassword koboSigning['keyPassword']
            }
        }
        buildTypes { release { signingConfig signingConfigs.koboRelease } }
    }
}
`

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes('kobo-release-signing')) c.modResults.contents += BLOCK
    return c
  })
}
