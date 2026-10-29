# Evaluation samples

One folder per suite (`count`, `receipts`, `voice`, `limits`) with a `labels.json`. See `src/eval/run.ts` for the label format.

Photos and recordings are **not committed**: use objects, adult hands or sample data only, never real kids (see the safety rules in the main README). Only `limits/labels.json` is in the repo because it is plain text.

Voice samples must be WAV, mono, 16-bit PCM, 16 kHz:

```sh
ffmpeg -i note.m4a -ac 1 -ar 16000 -sample_fmt s16 note.wav
```
