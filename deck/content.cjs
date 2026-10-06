// Every string the pitch deck shows. One place, read by build.cjs (HTML, PDF, PNG) and make-pptx.cjs.
// Facts come from README.md, company/THESIS.md and CLAUDE.md Verified Facts. Nothing here is a claim
// the app has not earned; "Where it stands" is updated after each test that changes a line.

const T = {
  ground: '#ECEEEB', slip: '#FFFFFF', ink: '#151714', muted: 'rgba(21,23,20,0.62)', accent: '#00774A',
  rule: 'rgba(21,23,20,0.12)',
}

const slides = [
  {
    id: 'cover', kind: 'cover',
    kicker: 'Clock In · Solana Mobile × Radiants',
    title: 'Kobo',
    headline: 'Get paid in digital dollars.',
    sub: 'A till on an Android phone for Nigerian shops: type the price in naira, show one QR, see Paid.',
    image: 'assets/paid.png',
  },
  {
    id: 'problem', kind: 'lines',
    kicker: 'The problem',
    lines: [
      { text: 'Shops in Nigeria that want dollars take them the hard way today:', muted: true },
      { text: 'a wallet address pasted into WhatsApp.' },
      { text: 'No amount. No confirmation. No receipt.' },
    ],
    note: 'A screenshot can be faked. Checking a wallet by hand for every sale does not work behind a counter.',
  },
  {
    id: 'loop', kind: 'steps',
    kicker: 'What Kobo is',
    title: 'Type the price. Show the QR. See Paid. Close the day.',
    steps: [
      { n: '1', head: 'Type the price in naira', body: 'Kobo pulls the naira rate from two public sources and works out the USDC itself, rounded up to the cent.' },
      { n: '2', head: 'Show one QR', body: 'A Solana Pay link with the amount, the USDC coin and a fresh one-time reference for this sale. The rate is locked the moment the QR appears. A customer on WhatsApp gets the same request as a link.' },
      { n: '3', head: 'See Paid', body: 'Kobo watches Solana for that reference, or for that exact amount when the wallet drops it, reads how much USDC the shop actually gained, and prints the receipt: Paid, Underpaid or Overpaid.' },
      { n: '4', head: 'Close the day', body: 'Every sale on one roll. At close, customers who paid from a Seeker phone are lined up for an SKR reward in one batch.' },
    ],
    images: ['assets/till.png', 'assets/waiting.png'],
  },
  {
    id: 'receipt', kind: 'feature',
    kicker: 'The receipt is the proof',
    title: 'Kobo never touches the money.',
    bullets: [
      'USDC goes straight to the shop\'s own wallet. Kobo holds nothing and converts nothing.',
      'Every receipt links to the payment on Solscan. Share it to WhatsApp; anyone can check it.',
      'The rate line shows the source and the time it was locked, so nobody argues about it later.',
    ],
    images: ['assets/paid.png', 'assets/solscan.png'],
  },
  {
    id: 'mobile', kind: 'feature',
    kicker: 'Built on Solana Mobile',
    title: 'The shop\'s own wallet signs everything.',
    bullets: [
      'Mobile Wallet Adapter: the shop connects its wallet once; the till stores no private key. Refunds and the daily reward batch go out as one approval.',
      'Seeker Genesis Token: a payer from a Seeker phone is spotted on chain and lined up for SKR back at the daily close. One reward per Genesis Token per shop per day.',
      'Solana Pay: one fresh reference key per sale, matched on chain, never by screenshot. If a wallet drops it, Kobo matches the exact amount and says so on the receipt.',
    ],
    images: ['assets/today.png', 'assets/phantom-usdc.png'],
  },
  {
    id: 'who', kind: 'feature',
    kicker: 'Who asked for this',
    title: 'Solana Mobile posted the request. Shops have the need.',
    bullets: [
      'Solana Mobile asked for an Android-first crypto point of sale and for Scan and Pay for merchants on superteam.fun (both posted 2025-10-14).',
      'First shops: phone, electronics and fashion sellers who already pay overseas suppliers in USDT or USDC, and vendors at Superteam Nigeria events.',
      'Stablecoins were 43% of Sub-Saharan Africa\'s crypto volume (Chainalysis, October 2024). How many shops want dollars at the counter is the open question; ten in-person conversations are being logged.',
      'Nobody sells this yet: Solana\'s own point-of-sale example was retired in March 2026, and the Nigerian options that exist (StableFlow, Quidax) hold the money and settle naira to a bank. Kobo holds nothing.',
    ],
    images: ['assets/welcome.png'],
  },
  {
    id: 'stands', kind: 'table',
    kicker: 'Where it stands',
    title: 'What is real today, and what is not yet.',
    rows: [
      ['Naira price to a USDC Solana Pay QR', 'Real. Unit tests; the QR on the phone decodes to the expected link.'],
      ['Paid detection', 'Real on mainnet: the receipt printed within seconds of the payment\'s block. Underpaid and part payments ran on a local network.'],
      ['Reading real mainnet payments', 'Real. The app\'s code read a real USDC transfer on mainnet, including a version 1 transaction.'],
      ['Seeker phone check', 'Real on mainnet against the Solana Mobile docs\' example owner.'],
      ['A real wallet paying a Kobo QR on mainnet', 'Done twice with Phantom (2026-10-05): ₦150 = 0.12 USDC each, Paid within seconds. Phantom dropped the coin and reference from the link; Kobo matched by amount.'],
      ['Refund and SKR reward signed by a real wallet', 'Not yet. The maths ran on the local network; signing needs the wallet test.'],
      ['A physical Android phone', 'Not yet. Every run so far is on Android emulators with Google Play.'],
      ['Tap to pay (NFC)', 'Not built.'],
      ['A customer with USDC on Solana', 'Not assumed. MiniPay, Africa\'s biggest stablecoin wallet, is on Celo. Kobo needs Phantom, Solflare or the Seeker wallet.'],
    ],
  },
  {
    id: 'after', kind: 'dates',
    kicker: 'After the deadline',
    title: 'The till keeps running whether or not it places.',
    dates: [
      ['2026-10-05', 'First real USDC payment into Kobo on mainnet, paid from Phantom, recorded for the demo'],
      ['2026-10-12', 'Ten in-person shop conversations logged, phone and electronics sellers first'],
      ['2026-10-19', 'First shop that is not the founder takes a real payment on Kobo'],
      ['2026-10-31', 'Decide: keep going toward a Play Store listing, or write the post-mortem'],
    ],
    kill: 'Kill test: if fewer than 3 of the first 10 shops would rather receive USDC than naira, Kobo rescopes to crypto-event vendors only.',
  },
  {
    id: 'close', kind: 'close',
    title: 'Kobo',
    headline: 'Get paid in digital dollars.',
    lines: ['Open source. Built for Clock In.', 'github.com/Yonkoo11/kobo-till'],
    image: 'assets/welcome.png',
  },
]

module.exports = { T, slides }
