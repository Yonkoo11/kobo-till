import './polyfill'
// Defines the background payment check before anything else. When Android wakes a closed Kobo for this check, no
// screen is rendered, so a task defined only from a screen file is never registered ("No task registered").
import './hooks/background-check'
import 'expo-router/entry'
