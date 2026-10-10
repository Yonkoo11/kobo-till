#!/usr/bin/env bash
# pay.sh <solana: url> : simulate the customer paying on devnet, then wait for "Paid ₦N" on the test app
. "$(dirname "$0")/lib.sh"
URL="${1:?usage: pay.sh <solana: url>}"
ensure_net
node_env
cd "$REPO"
for try in 1 2 3; do
  KOBO_TEST_RPC=https://api.devnet.solana.com app/node_modules/.bin/tsx probe/pay.ts --url "$URL" --no-ref >/tmp/kobo-pay.log 2>&1 && break
  [ $try = 3 ] && { tail -2 /tmp/kobo-pay.log; die "payment script failed 3 times"; }
done
[ -n "$NO_WAIT" ] && { echo "paid (not waiting for screen)"; exit 0; }
wait_text "Paid ₦" 30 && exit 0
if grep -q 'No internet' "$UI"; then bounce_wifi; fi   # app stuck in offline mode
wait_text "Paid ₦" 70 || die "no 'Paid' screen within 100 s"
