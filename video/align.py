#!/usr/bin/env python3
"""Map NARRATION.txt paragraphs (scenes) onto Whisper word timestamps and slice the audio per scene.

Alignment is a word-sequence diff (difflib) between the text we sent to the model and what Whisper
heard, so a misheard word ("$30,000" for "thirty thousand naira") shifts nothing. Writes timing.json:
per scene {file, cut, dur} and per sentence caption {text, start, end} in scene-local seconds.
"""
import difflib, json, re, subprocess

SCENES = ["hook", "problem", "till", "waiting", "paid", "detail", "closeday", "mwa", "end"]
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())

paras = [p.strip() for p in open("NARRATION.txt").read().split("\n\n") if p.strip()]
assert len(paras) == len(SCENES), (len(paras), len(SCENES))
heard = [w for seg in json.load(open("public/audio/narration.json"))["segments"] for w in seg["words"]]
H = [norm(w["word"]) for w in heard]

# text words with (scene, sentence) ownership
T, owner = [], []
sentences = {}
for key, para in zip(SCENES, paras):
    parts = [s.strip() for s in re.split(r"(?<=[.!?:])\s+", para) if s.strip()]
    merged = []
    for s in parts:  # a fragment ending in ':' joins the next sentence as one caption
        if merged and merged[-1].endswith(":"): merged[-1] += " " + s
        else: merged.append(s)
    sentences[key] = merged
    for si, s in enumerate(merged):
        for w in s.split():
            T.append(norm(w)); owner.append((key, si))

# map every text word index to a heard word index
tmap = [None] * len(T)
for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, T, H, autojunk=False).get_opcodes():
    for k in range(i1, i2):
        if tag == "equal": tmap[k] = j1 + (k - i1)
        elif j2 > j1: tmap[k] = min(j2 - 1, j1 + round((k - i1) * (j2 - j1) / max(1, i2 - i1)))
        else: tmap[k] = max(0, min(len(H) - 1, j1 - 1))
for k in range(len(T)):  # deletions: borrow the neighbour
    if tmap[k] is None: tmap[k] = tmap[k - 1] if k else 0

out = {"scenes": {}, "captions": {}}
for key in SCENES:
    caps = []
    for si, s in enumerate(sentences[key]):
        idx = [tmap[k] for k in range(len(T)) if owner[k] == (key, si)]
        caps.append({"text": s, "start": heard[min(idx)]["start"], "end": heard[max(idx)]["end"]})
    out["captions"][key] = caps
    out["scenes"][key] = {"start": caps[0]["start"], "end": caps[-1]["end"]}

for i, k in enumerate(SCENES):  # cut in the middle of the silence between scenes
    s = out["scenes"][k]
    a = s["start"] - 0.15 if i == 0 else (out["scenes"][SCENES[i - 1]]["end"] + s["start"]) / 2
    b = (s["end"] + out["scenes"][SCENES[i + 1]]["start"]) / 2 if i < len(SCENES) - 1 else s["end"] + 0.3
    f = f"public/audio/{k}.wav"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", "public/audio/narration.wav",
                    "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-c:a", "pcm_s16le", f], check=True)
    s.update(file=f"audio/{k}.wav", cut=[round(a, 3), round(b, 3)], dur=round(b - a, 3))
    for c in out["captions"][k]:
        c["start"] = round(c["start"] - a, 2); c["end"] = round(c["end"] - a, 2)

json.dump(out, open("timing.json", "w"), indent=1)
for k in SCENES:
    print(k, out["scenes"][k]["dur"], [(c["start"], c["end"]) for c in out["captions"][k]])
