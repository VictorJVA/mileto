// Meta Voice Transcribe only takes WAV mono 16-bit PCM at 16 or 24 kHz. iPhones often record at the
// hardware rate (44.1 or 48 kHz) whatever the app asks for, so every upload is normalized here first.

const TARGET_RATE = 16000;

interface Fmt {
  format: number;
  channels: number;
  rate: number;
  bits: number;
}

export class WavError extends Error {}

/** Reads the fmt and data chunks, skipping any others (iOS adds an "FLLR" padding chunk). */
function parse(buf: Buffer): { fmt: Fmt; data: Buffer } {
  if (buf.length < 12 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new WavError("not a WAV file");
  }
  let fmt: Fmt | null = null;
  let data: Buffer | null = null;
  let off = 12;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    const body = buf.subarray(off + 8, Math.min(buf.length, off + 8 + size));
    if (id === "fmt ") {
      let format = body.readUInt16LE(0);
      // WAVE_FORMAT_EXTENSIBLE keeps the real format in the sub-format GUID.
      if (format === 0xfffe && body.length >= 26) format = body.readUInt16LE(24);
      fmt = { format, channels: body.readUInt16LE(2), rate: body.readUInt32LE(4), bits: body.readUInt16LE(14) };
    } else if (id === "data") {
      data = body;
    }
    off += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new WavError("WAV is missing fmt or data");
  return { fmt, data };
}

/** Decodes samples to mono floats in [-1, 1]. */
function toMono(fmt: Fmt, data: Buffer): Float32Array {
  const bytes = fmt.bits / 8;
  const frame = bytes * fmt.channels;
  const frames = Math.floor(data.length / frame);
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < fmt.channels; c++) {
      const o = i * frame + c * bytes;
      if (fmt.format === 3 && fmt.bits === 32) sum += data.readFloatLE(o);
      else if (fmt.format === 1 && fmt.bits === 16) sum += data.readInt16LE(o) / 32768;
      else if (fmt.format === 1 && fmt.bits === 24) sum += data.readIntLE(o, 3) / 8388608;
      else if (fmt.format === 1 && fmt.bits === 32) sum += data.readInt32LE(o) / 2147483648;
      else if (fmt.format === 1 && fmt.bits === 8) sum += (data.readUInt8(o) - 128) / 128;
      else throw new WavError(`unsupported WAV encoding (format ${fmt.format}, ${fmt.bits} bits)`);
    }
    out[i] = sum / fmt.channels;
  }
  return out;
}

/** Linear-interpolation resampler; plenty for speech recognition. */
function resample(samples: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return samples;
  const length = Math.floor((samples.length * to) / from);
  const out = new Float32Array(length);
  const ratio = from / to;
  for (let i = 0; i < length; i++) {
    const pos = i * ratio;
    const j = Math.floor(pos);
    const frac = pos - j;
    out[i] = samples[j] * (1 - frac) + (samples[Math.min(j + 1, samples.length - 1)] ?? 0) * frac;
  }
  return out;
}

function encode(samples: Float32Array, rate: number): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** Returns a WAV that Meta accepts: mono, 16-bit PCM, 16 kHz (or 24 kHz if it already was). */
export function normalizeWav(buf: Buffer): Buffer {
  const { fmt, data } = parse(buf);
  const ready = fmt.format === 1 && fmt.bits === 16 && fmt.channels === 1 && (fmt.rate === 16000 || fmt.rate === 24000);
  if (ready) return encode(toMono(fmt, data), fmt.rate);
  return encode(resample(toMono(fmt, data), fmt.rate, TARGET_RATE), TARGET_RATE);
}
