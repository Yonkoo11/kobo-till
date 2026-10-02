#!/bin/bash
# Builds app/android/app/build/outputs/apk/release/app-release.apk
set -e
export PATH=/opt/homebrew/opt/node@26/bin:$PATH
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
cd "$(dirname "$0")/app"
npx expo prebuild -p android --no-install
cd android && ./gradlew assembleRelease --no-daemon -q -PreactNativeArchitectures=arm64-v8a
ls -la app/build/outputs/apk/release/
