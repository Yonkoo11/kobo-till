#!/bin/bash
# Pre-composites the phone recordings (1080x2400, variable frame rate) into 1920x1080 30 fps clips with the
# phone at LAYOUT.phone (x 240, y 40, 450x1000) on the app's ground colour. Nothing is stretched.
set -e
S="${KOBO_REC_DIR:-$(pwd)/../recordings}"  # raw recordings, gitignored. Fallback (test-network) cut only.
G=0xECEEEB
P="scale=450:1000:flags=lanczos,pad=1920:1080:240:40:color=$G,fps=30,format=yuv420p"
ffmpeg -hide_banner -loglevel error -y -i $S/emuA3.mp4 -vf "$P" -c:v libx264 -crf 18 -an public/video/sale.mp4
ffmpeg -hide_banner -loglevel error -y -i $S/emuD.mp4  -vf "$P" -c:v libx264 -crf 18 -an public/video/after.mp4
# the Welcome screen still for the close (after.mp4 at 57 s)
ffmpeg -hide_banner -loglevel error -y -ss 57 -i public/video/after.mp4 -frames:v 1 public/assets/welcome.png
# vertical clip source: the sale recording scaled to 864x1920, centred on the ground colour
ffmpeg -hide_banner -loglevel error -y -i $S/emuA3.mp4 -vf "scale=864:1920:flags=lanczos,pad=1080:1920:108:0:color=$G,fps=30,format=yuv420p" -c:v libx264 -crf 18 -an public/video/social.mp4
for f in public/video/*.mp4; do echo "$f $(ffprobe -v error -show_entries stream=width,height,r_frame_rate:format=duration -of csv=p=0 $f | tr '\n' ' ')"; done
ls -la public/assets/welcome.png | awk '{print $5}'
