#!/usr/bin/env bash
# refund.sh <naira-label, e.g. ₦300> : refund the newest matching sale from Today, driving fakewallet.
# Phantom (real wallet) is switched off while this runs and ALWAYS switched back on at exit.
. "$(dirname "$0")/lib.sh"
LABEL="${1:?usage: refund.sh '₦300'}"
restore() { adb_ shell pm enable "$PHANTOM" >/dev/null 2>&1; adb_ shell pm disable-user "$FW" >/dev/null 2>&1; rm -f "$UI" "$UI.png"; }
trap restore EXIT
adb_ shell pm disable-user "$PHANTOM" >/dev/null || die "could not disable phantom"
adb_ shell pm enable "$FW" >/dev/null || die "could not enable fakewallet"
ensure_net
adb_ shell am force-stop "$PKG"   # start from the till, not a leftover detail screen
launch
tap_when Today 25 >/dev/null || die "Today tab not found"
sleep 1
tap_when "New sale" 2 >/dev/null && { tap_when Today 10 >/dev/null; }   # was on a receipt screen
sleep 1
row=""; end=$((SECONDS + 15))
while [ -z "$row" ] && [ $SECONDS -lt $end ]; do
  dump
  row=$(grep -o "content-desc=\"[0-9:]*, $LABEL · [^\"]*, Paid[^\"]*\"" "$UI" | head -1 | sed -E 's/^content-desc="//; s/"$//')
done
[ -n "$row" ] || die "no sale row for $LABEL"
tap_text "$row" || die "row not tappable"
tap_when Refund 15 >/dev/null || die "Refund button not found"
tap_when REFUND 15 >/dev/null || die "confirm dialog not found"
end=$((SECONDS + 120))
while [ $SECONDS -lt $end ]; do
  dump; [ -n "$E2E_TRACE" ] && echo "$((SECONDS)) $(adb_ shell dumpsys window | grep -m1 mCurrentFocus | grep -o 'u0 [^ }]*') $(grep -c . "$UI")" >&2
  m=$(grep -o -E '(text|content-desc)="Refunded[^"]*"' "$UI" | head -1 | sed -E 's/^[a-z-]+="//; s/"$//')
  [ -n "$m" ] && { echo "$m"; exit 0; }
  if grep -q 'text="Wait"' "$UI"; then tap_text Wait
  elif grep -q 'text="Refund not sent' "$UI" && [ "${retries:-0}" -lt 2 ]; then retries=$((${retries:-0}+1)); bounce_wifi; tap_when Refund 5 >/dev/null; tap_when REFUND 10 >/dev/null
  elif grep -q 'text="AUTHORIZE"' "$UI"; then tap_text AUTHORIZE
  elif grep -q 'text="SEND TRANSACTION TO CLUSTER"' "$UI"; then tap_text "SEND TRANSACTION TO CLUSTER"; fi
done
echo "last screen:"; adb_ shell dumpsys window | grep -m1 mCurrentFocus | cut -c1-140 >&2; read_texts | tail -6 >&2
die "no 'Refunded' text within 120 s"
