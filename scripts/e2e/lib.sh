#!/usr/bin/env bash
# Shared helpers for the emulator scenarios. Source this file; do not run it.
# Everything targets the TEST app (devnet, "Test network: not real money") only.
ADB_BIN="${ADB_BIN:-$(command -v adb || echo "$HOME/Library/Android/sdk/platform-tools/adb")}"
export ANDROID_SERIAL="${ANDROID_SERIAL:-emulator-5554}"
PKG="${KOBO_PKG:-com.kobotill.app.test}"
FW=com.solana.mobilewalletadapter.fakewallet
PHANTOM=app.phantom
E2E_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$E2E_DIR/../.." && pwd)"
UI=$(mktemp -t koboui.XXXXXX)
trap_cleanup_ui() { rm -f "$UI" "$UI.png"; }

adb_() { "$ADB_BIN" "$@"; }
die() { echo "FAIL: $*" >&2; exit 1; }

# Refuse to touch anything but the test package (the real app talks to a real wallet).
[ "$PKG" = "com.kobotill.app.test" ] || die "refusing to run: target package is $PKG, not com.kobotill.app.test"
adb_ get-state >/dev/null 2>&1 || die "no emulator $ANDROID_SERIAL"
adb_ shell pm list packages "$PKG" | grep -q "package:$PKG\$" || die "$PKG not installed"

# dump the screen into $UI as one element per line
dump() {
  adb_ shell uiautomator dump /sdcard/e2e-ui.xml >/dev/null 2>&1
  adb_ shell cat /sdcard/e2e-ui.xml 2>/dev/null | tr '>' '\n' > "$UI"
}
# text/content-desc of everything on screen, one per line
read_texts() { dump; grep -o -E '(text|content-desc)="[^"]+"' "$UI" | sed -E 's/^[a-z-]+="//; s/"$//'; }
# bounds of first exact match -> "x1 y1 x2 y2" (reads the last dump)
bounds_of() {
  grep -F -e "text=\"$1\"" -e "content-desc=\"$1\"" "$UI" | head -1 \
    | grep -o 'bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' | grep -o '[0-9]*' | tr '\n' ' '
}
# tap by exact text; return 1 if absent
tap_text() {
  dump; local b; b=$(bounds_of "$1"); [ -z "$b" ] && return 1
  set -- $b; adb_ shell input tap $(( ($1+$3)/2 )) $(( ($2+$4)/2 ))
}
# wait up to $2 s (default 20) for a tap target and tap it; also clears the "isn't responding" popup
tap_when() {
  local want="$1" end=$((SECONDS + ${2:-20})) b
  while [ $SECONDS -lt $end ]; do
    dump
    b=$(bounds_of "$want")
    if [ -n "$b" ]; then set -- $b; adb_ shell input tap $(( ($1+$3)/2 )) $(( ($2+$4)/2 )); return 0; fi
    wait_popup
  done
  return 1
}
wait_popup() { grep -q 'text="Wait"' "$UI" && tap_text Wait; return 0; }
# wait for text matching regex ($1, grep -E on the whole dump line) up to $2 s; prints the match
wait_text() {
  local end=$((SECONDS + ${2:-20})); local m
  while [ $SECONDS -lt $end ]; do
    dump
    m=$(grep -o -E "(text|content-desc)=\"$1[^\"]*\"" "$UI" | head -1 | sed -E 's/^[a-z-]+="//; s/"$//')
    [ -n "$m" ] && { echo "$m"; return 0; }
    wait_popup
  done
  return 1
}
# decode the QR on screen; waits up to $1 s; prints the solana: URL
qr() {
  local end=$((SECONDS + ${1:-20})); local u
  while [ $SECONDS -lt $end ]; do
    adb_ exec-out screencap -p > "$UI.png"
    u=$(zbarimg -q --raw "$UI.png" 2>/dev/null | grep -m1 '^solana:')
    [ -n "$u" ] && { echo "$u"; return 0; }
  done
  return 1
}
launch() { adb_ shell pm grant "$PKG" android.permission.POST_NOTIFICATIONS 2>/dev/null; adb_ shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; }
# type a naira amount on the keypad
type_amount() { local i; for ((i=0;i<${#1};i++)); do tap_when "${1:$i:1}" 10 >/dev/null || die "keypad key ${1:$i:1} missing"; done; }
node_env() { export PATH=/opt/homebrew/opt/node@26/bin:$PATH; }

# tap the first element whose text/content-desc contains $1 (used for list rows)
tap_contains() {
  dump
  local b; b=$(grep -F -e "text=\"$1" -e "content-desc=\"$1" "$UI" | grep -F -e "$1" | head -1 \
    | grep -o 'bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' | grep -o '[0-9]*' | tr '\n' ' ')
  [ -z "$b" ] && return 1
  set -- $b; adb_ shell input tap $(( ($1+$3)/2 )) $(( ($2+$4)/2 ))
}
# the emulator sometimes boots with wifi up but no route; toggle it once if so
ensure_net() {
  # the emulator sometimes boots with wifi up but no default network; toggling wifi fixes it
  net_up() { ! adb_ shell dumpsys connectivity | grep -q 'Active default network: none'; }
  net_up && return 0
  adb_ shell svc wifi disable; sleep 3; adb_ shell svc wifi enable
  local end=$((SECONDS + 45))
  while [ $SECONDS -lt $end ]; do sleep 2; net_up && return 0; done
  die "emulator has no network (wifi has no carrier; run: adb reboot)"
}

# The app can start up believing it is offline ("No internet" with a working network) and then never
# re-checks. A wifi bounce makes it look again.
bounce_wifi() { adb_ shell svc wifi disable; sleep 3; adb_ shell svc wifi enable; sleep 6; }
