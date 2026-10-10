#!/usr/bin/env bash
# sale.sh <naira> : open a sale on the test app and print its solana: URL
. "$(dirname "$0")/lib.sh"
N="${1:?usage: sale.sh <naira>}"
ensure_net
adb_ shell am force-stop "$PKG"   # always start from the till
launch
sleep 1; dump; grep -q 'text="Cancel"' "$UI" && tap_text Cancel   # leave a pending sale screen
tap_when Charge 25 >/dev/null || die "till screen not found"
type_amount "$N"
dump
if grep -q "Type today's rate" "$UI"; then
  adb_ shell input tap 620 705; adb_ shell input keyevent KEYCODE_MOVE_END; for i in 1 2 3 4 5 6 7 8; do adb_ shell input keyevent KEYCODE_DEL; done; adb_ shell input text "${KOBO_RATE:-1500}"; adb_ shell input keyevent 4
fi
tap_when Charge 10 >/dev/null || die "Charge not tappable"
qr 25 || die "no QR appeared"
