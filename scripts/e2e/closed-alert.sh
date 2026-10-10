#!/usr/bin/env bash
# closed-alert.sh <naira> : sale, close the app, customer pays, force the background job, print the notification title
. "$(dirname "$0")/lib.sh"
N="${1:?usage: closed-alert.sh <naira>}"
adb_ shell am force-stop "$PKG"          # also clears this app's old notifications
URL=$("$E2E_DIR/sale.sh" "$N" | tail -1); [ -n "$URL" ] || die "no sale URL"
adb_ shell input keyevent KEYCODE_HOME; sleep 1
adb_ shell am kill "$PKG"
NO_WAIT=1 "$E2E_DIR/pay.sh" "$URL" >/dev/null || die "payment failed"
title=""
for attempt in 1 2 3 4 5 6; do
  id=$(adb_ shell dumpsys jobscheduler | grep -oE "JOB #u0a[0-9]+/[0-9]+ .*$PKG|JOB #u0a[0-9]+/[0-9]+: [a-z0-9]+ $PKG" | grep -oE '/[0-9]+' | head -1 | tr -d /)
  [ -n "$id" ] && adb_ shell cmd jobscheduler run -f "$PKG" "$id" >/dev/null 2>&1
  for i in 1 2 3 4 5 6; do
    title=$(adb_ shell dumpsys notification --noredact | grep -A0 "android.title=" | grep -F "Paid" | head -1 | sed -E 's/.*android.title=//; s/^String \((.*)\)$/\1/')
    [ -n "$title" ] && break 2
    sleep 2
  done
done
[ -n "$title" ] || die "no notification after forcing the job"
echo "notification: $title"
