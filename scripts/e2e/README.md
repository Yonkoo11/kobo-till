# Emulator scenarios (test app only)

One script per scenario, each prints a few lines. Needs the emulator (`ANDROID_SERIAL`, default
`emulator-5554`), the test app `com.kobotill.app.test` (devnet build) connected to fakewallet,
`zbarimg`, and node 26. Every script refuses to run for any other package.

| Script | What it does | Prints |
| --- | --- | --- |
| `sale.sh <naira>` | opens a sale on the test app | the `solana:` URL |
| `pay.sh <url>` | simulates the customer paying on devnet (retries 3x), waits for the paid screen | `Paid ₦N` |
| `refund.sh '₦300'` | Today, newest paid sale with that label, Refund, REFUND, drives fakewallet | `Refunded ...` |
| `closed-alert.sh <naira>` | sale, Home, kill app, pay, force the background job | `notification: Paid ₦N` |

Example: `u=$(./sale.sh 300 | tail -1) && ./pay.sh "$u" && ./refund.sh '₦300'`

Notes
- `refund.sh` disables Phantom and enables fakewallet while it runs, and always restores both on exit
  (trap). Never run a flow against `com.kobotill.app` (mainnet, real Phantom).
- The refund is paid from the fakewallet account, which needs a little devnet SOL (about 0.003).
  "needs a little SOL" on screen means it ran dry; send devnet SOL to the merchant address in the sale URL.
- `ensure_net` toggles wifi if the emulator has no default network. If that fails, `adb reboot`.
- `KOBO_RATE` (default 1500) is typed only if the till asks for a rate.
