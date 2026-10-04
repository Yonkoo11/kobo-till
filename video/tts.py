#!/usr/bin/env python3
"""Generate the Call It narration with Gemini TTS. Never prints the credential."""
import base64, json, os, struct, sys, urllib.request, urllib.error

MODEL = "gemini-2.5-flash-preview-tts"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
VOICE = "Charon"


def synth(text: str, out_wav: str) -> float:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        print("NO_KEY")
        return -1.0
    body = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}
            },
        },
    }
    req = urllib.request.Request(
        URL,
        data=json.dumps(body).encode(),
        headers={"content-type": "application/json", "x-goog-api-key": key},
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            d = json.load(r)
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:300]
        for bad in (key,):
            detail = detail.replace(bad, "<redacted>")
        print(f"HTTP {e.code}: {detail}")
        return -1.0
    part = d["candidates"][0]["content"]["parts"][0]["inlineData"]
    pcm = base64.b64decode(part["data"])
    rate = 24000
    mime = part.get("mimeType", "")
    if "rate=" in mime:
        try:
            rate = int(mime.split("rate=")[1].split(";")[0])
        except ValueError:
            pass
    header = b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " + struct.pack(
        "<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16
    ) + b"data" + struct.pack("<I", len(pcm))
    with open(out_wav, "wb") as f:
        f.write(header + pcm)
    return len(pcm) / (rate * 2)


if __name__ == "__main__":
    text = sys.stdin.read().strip()
    secs = synth(text, sys.argv[1])
    print(f"wrote {sys.argv[1]} {secs:.2f}s" if secs > 0 else "failed")
