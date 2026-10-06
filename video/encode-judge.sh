#!/bin/bash
# Judge cut: one pre-composited clip per scene from the real mainnet recordings of 2026-10-05 (run 3).
# recA = shop phone (Kobo), recB = customer phone (Phantom). 1080x2400 -> phone at x 240, y 40, 450x1000 on the
# app's ground; nothing is stretched. Each clip ends on a held last frame so it outlasts its narration.
set -e
cd "$(dirname "$0")/public/video"
G=0xECEEEB
P="scale=450:1000:flags=lanczos,pad=1920:1080:240:40:color=$G,fps=30,format=yuv420p"
HOLD="tpad=stop_mode=clone:stop_duration=4"
cut() { ffmpeg -hide_banner -loglevel error -y -ss "$2" -i "$1" -vf "fps=30,trim=duration=$3,setpts=PTS-STARTPTS,$4$P,$HOLD" -c:v libx264 -crf 18 -an "$5"; }
cut recA.mp4 370.5 7.5 "" j-hook.mp4            # Waiting, the flip to Paid at 374.0, the receipt
cut recA.mp4 56 29.5 "setpts=PTS/3.3," j-till.mp4  # ₦15 -> ₦150 -> Charge, sped up 3.3x
cut recA.mp4 88 8 "" j-waiting.mp4               # the QR, ₦150 · 0.12 USDC, rate locked at 19:37, checks ticking
cut recA.mp4 384 9 "" j-paid.mp4                 # the receipt at rest, "Paid (matched by amount)"
cut recA.mp4 2 13 "" j-closeday.mp4              # Today: ₦150 today, the first mainnet sale, Close the day
# customer phone: five moments of a 90 s payment, joined in order
S=""; i=0
for seg in "257 2.0" "273 1.8" "318 1.5" "328.5 0.8" "349.8 3.0"; do
  set -- $seg
  ffmpeg -hide_banner -loglevel error -y -ss $1 -i recB.mp4 -vf "fps=30,trim=duration=$2,setpts=PTS-STARTPTS,$P" -c:v libx264 -crf 18 -an pay-$i.mp4
  S="$S file 'pay-$i.mp4'"$'\n'; i=$((i+1))
done
printf "%s" "$S" > pay-list.txt
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i pay-list.txt -vf "$HOLD" -c:v libx264 -crf 18 -an j-pay.mp4
rm -f pay-*.mp4 pay-list.txt
# stills: the Solscan page of the recorded payment, and the Paid receipt for the close
SP="${KOBO_REC_DIR:-$(cd ../../.. && pwd)/recordings}"  # raw captures, gitignored (solscan-top.png)
ffmpeg -hide_banner -loglevel error -y -i $SP/solscan-top.png -vf "scale=450:1000:flags=lanczos,pad=1920:1080:240:40:color=$G" ../assets/solscan.png
ffmpeg -hide_banner -loglevel error -y -ss 390 -i recA.mp4 -frames:v 1 -vf "$P" ../assets/paid-end.png
for f in j-*.mp4; do echo "$f $(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)"; done
# vertical clip source: typing ₦150, the QR, the flip to Paid; joined at 0 s, 3.6 s and 7.0 s
V="fps=30,scale=864:1920:flags=lanczos,pad=1080:1920:108:0:color=$G,format=yuv420p"
ffmpeg -hide_banner -loglevel error -y -ss 71.0 -i recA.mp4 -vf "fps=30,trim=duration=3.6,setpts=PTS-STARTPTS,$V" -c:v libx264 -crf 18 -an s-0.mp4
ffmpeg -hide_banner -loglevel error -y -ss 90 -i recA.mp4 -vf "fps=30,trim=duration=3.4,setpts=PTS-STARTPTS,$V" -c:v libx264 -crf 18 -an s-1.mp4
ffmpeg -hide_banner -loglevel error -y -ss 372.6 -i recA.mp4 -vf "fps=30,trim=duration=4.6,setpts=PTS-STARTPTS,$V" -c:v libx264 -crf 18 -an s-2.mp4
printf "file 's-0.mp4'\nfile 's-1.mp4'\nfile 's-2.mp4'\n" > s-list.txt
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i s-list.txt -c copy j-social.mp4 && rm -f s-*.mp4 s-list.txt
echo "j-social.mp4 $(ffprobe -v error -show_entries format=duration -of csv=p=0 j-social.mp4)"
