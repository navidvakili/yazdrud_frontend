// ============================================================
// audioEngine.ts — هستهٔ پردازش صدا (خالص، بدون وابستگی خارجی)
// شامل: بارگذاری/برش/چسباندن بافر، موج‌نما، محو، تقویت، نرمال‌سازی،
//       EQ/فشرده‌سازی (OfflineAudioContext)، حذف نویز (تفریق طیفی + FFT)،
//       و کدگذارهای WAV / FLAC / MP3 (lamejs) / M4A (MediaRecorder)
// ============================================================

// ---------- Buffer primitives ----------

/** کپی کامل یک AudioBuffer */
export function copyBuffer(ctx: BaseAudioContext, src: AudioBuffer): AudioBuffer {
  const out = ctx.createBuffer(src.numberOfChannels, src.length, src.sampleRate);
  for (let c = 0; c < src.numberOfChannels; c++) {
    out.copyToChannel(src.getChannelData(c), c);
  }
  return out;
}

/** ساخت بافر با همان مشخصات منبع (داده‌ها صفر) */
export function createLike(ctx: BaseAudioContext, src: AudioBuffer, length: number): AudioBuffer {
  return ctx.createBuffer(src.numberOfChannels, Math.max(1, length), src.sampleRate);
}

/** برش ناحیه [s0, s1) از بافر → بافر جدید */
/** برش از s0 تا s1 (شاخص‌های SAMPLE نه ثانیه!) → بافر جدید */
export function sliceBuffer(ctx: BaseAudioContext, src: AudioBuffer, s0: number, s1: number): AudioBuffer {
  const s = Math.max(0, Math.min(s0, s1));
  const e = Math.max(s0, Math.min(s1, src.length));
  const out = createLike(ctx, src, e - s);
  for (let c = 0; c < src.numberOfChannels; c++) {
    const d = out.getChannelData(c);
    const sub = src.getChannelData(c).subarray(s, e);
    d.set(sub);
  }
  return out;
}

/** چسباندن چند بافر (هم‌مشخصات) پشت سر هم */
export function concatBuffers(ctx: BaseAudioContext, parts: AudioBuffer[]): AudioBuffer {
  if (!parts.length) return ctx.createBuffer(2, 1, 44100);
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = createLike(ctx, parts[0], total);
  let off = 0;
  for (const p of parts) {
    for (let c = 0; c < out.numberOfChannels; c++) {
      out.getChannelData(c).set(p.getChannelData(c), off);
    }
    off += p.length;
  }
  return out;
}

/** حذف ناحیه [startSec, endSec) → بافر جدید */
export function removeRegion(ctx: BaseAudioContext, src: AudioBuffer, startSec: number, endSec: number): AudioBuffer {
  const sr = src.sampleRate;
  const s = Math.max(0, Math.round(startSec * sr));
  const e = Math.min(src.length, Math.round(endSec * sr));
  if (e - s <= 0) return copyBuffer(ctx, src);
  return concatBuffers(ctx, [sliceBuffer(ctx, src, 0, s), sliceBuffer(ctx, src, e, src.length)]);
}

/** درج یک بافر (clip) در موقعیت atSec → بافر جدید */
export function insertAt(ctx: BaseAudioContext, src: AudioBuffer, atSec: number, clip: AudioBuffer): AudioBuffer {
  const sr = src.sampleRate;
  const at = Math.max(0, Math.min(src.length, Math.round(atSec * sr)));
  return concatBuffers(ctx, [sliceBuffer(ctx, src, 0, at), clip, sliceBuffer(ctx, src, at, src.length)]);
}

// ---------- Load ----------

/** واکشی و دیکد فایل صوتی از آدرس استریم (CORS-safe) */
export async function fetchAudioBuffer(
  ctx: BaseAudioContext,
  url: string
): Promise<AudioBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`خطا در دریافت فایل (${res.status})`);
  const ab = await res.arrayBuffer();
  return await ctx.decodeAudioData(ab);
}

// ---------- Waveform ----------

export interface Peaks {
  mins: Float32Array;
  maxs: Float32Array;
}

/** محاسبه پیک/حداقل نمونه‌ها برای ترسیم موج‌نما (bins ستون) */
export function computePeaks(buf: AudioBuffer, bins: number): Peaks {
  const mins = new Float32Array(bins);
  const maxs = new Float32Array(bins);
  if (!buf || buf.length === 0) return { mins, maxs };
  const ch = buf.numberOfChannels;
  const step = Math.max(1, Math.floor(buf.length / bins));
  for (let b = 0; b < bins; b++) {
    const s = b * step;
    const e = Math.min(buf.length, s + step);
    let mn = 0;
    let mx = 0;
    for (let c = 0; c < ch; c++) {
      const d = buf.getChannelData(c);
      for (let i = s; i < e; i++) {
        const v = d[i];
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
    }
    mins[b] = mn;
    maxs[b] = mx;
  }
  return { mins, maxs };
}

// ---------- Level (gain / normalize) ----------

/** اعمال ضریب روی ناحیه (پیش‌فرض: کل فایل) — خروجی بافر جدید */
export function applyGainRegion(
  ctx: BaseAudioContext,
  src: AudioBuffer,
  factor: number,
  startSec = 0,
  endSec = src.duration
): AudioBuffer {
  const sr = src.sampleRate;
  const s = Math.max(0, Math.round(startSec * sr));
  const e = Math.min(src.length, Math.round(endSec * sr));
  const out = copyBuffer(ctx, src);
  for (let c = 0; c < out.numberOfChannels; c++) {
    const d = out.getChannelData(c);
    for (let i = s; i < e; i++) {
      d[i] = Math.max(-1, Math.min(1, d[i] * factor));
    }
  }
  return out;
}

/** اعمال محو ورود/خروج (خطی) روی ناحیه — خروجی بافر جدید */
export function applyFadeRegion(
  ctx: BaseAudioContext,
  src: AudioBuffer,
  fadeInSec: number,
  fadeOutSec: number,
  startSec = 0,
  endSec = src.duration
): AudioBuffer {
  const sr = src.sampleRate;
  const s = Math.max(0, Math.round(startSec * sr));
  const e = Math.min(src.length, Math.round(endSec * sr));
  const nIn = Math.round(Math.max(0, fadeInSec) * sr);
  const nOut = Math.round(Math.max(0, fadeOutSec) * sr);
  const out = copyBuffer(ctx, src);
  for (let c = 0; c < out.numberOfChannels; c++) {
    const d = out.getChannelData(c);
    for (let i = s; i < Math.min(e, s + nIn); i++) {
      d[i] *= (i - s) / Math.max(1, nIn);
    }
    for (let i = e - nOut; i < e; i++) {
      if (i >= s) d[i] *= Math.max(0, (e - i) / Math.max(1, nOut));
    }
  }
  return out;
}

/** پیک مطلق ناحیه (۰..۱) */
export function getPeak(src: AudioBuffer, startSec = 0, endSec = src.duration): number {
  const sr = src.sampleRate;
  const s = Math.max(0, Math.round(startSec * sr));
  const e = Math.min(src.length, Math.round(endSec * sr));
  let peak = 0;
  for (let c = 0; c < src.numberOfChannels; c++) {
    const d = src.getChannelData(c);
    for (let i = s; i < e; i++) {
      const a = Math.abs(d[i]);
      if (a > peak) peak = a;
    }
  }
  return peak;
}

/** نرمال‌سازی پیک به هدف (dBFS-) — خروجی بافر جدید + میزان اعمال */
export function normalizePeak(
  ctx: BaseAudioContext,
  src: AudioBuffer,
  targetDb: number,
  startSec = 0,
  endSec = src.duration
): { buffer: AudioBuffer; appliedDb: number } {
  const peak = getPeak(src, startSec, endSec);
  const target = Math.pow(10, targetDb / 20);
  const factor = peak > 1e-9 ? target / peak : 1;
  return {
    buffer: applyGainRegion(ctx, src, factor, startSec, endSec),
    appliedDb: 20 * Math.log10(factor)
  };
}

// ---------- EQ / Compression (OfflineAudioContext bake) ----------

export interface EqParams {
  low: number; // dB — باس (lowshelf 120Hz)
  mid: number; // dB — میانه (peaking 1kHz)
  high: number; // dB — زیر (highshelf 6kHz)
}

export interface CompParams {
  enabled: boolean;
  threshold: number; // dB
  ratio: number;
  knee: number; // dB
  attack: number; // ثانیه
  release: number; // ثانیه
}

export const DEFAULT_EQ: EqParams = { low: 0, mid: 0, high: 0 };
export const DEFAULT_COMP: CompParams = {
  enabled: false,
  threshold: -24,
  ratio: 4,
  knee: 20,
  attack: 0.003,
  release: 0.25
};

/** پخت زنجیره (تقویت + EQ + فشرده‌سازی) روی بافر → بافر جدید */
export async function renderEffects(
  src: AudioBuffer,
  params: { gain: number; eq: EqParams; comp: CompParams }
): Promise<AudioBuffer> {
  const off = new OfflineAudioContext(src.numberOfChannels, src.length, src.sampleRate);
  const source = off.createBufferSource();
  source.buffer = src;

  const gain = off.createGain();
  gain.gain.value = Math.max(0, params.gain);

  const lo = off.createBiquadFilter();
  lo.type = 'lowshelf';
  lo.frequency.value = 120;
  lo.gain.value = params.eq.low;

  const mid = off.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1000;
  mid.Q.value = 1;
  mid.gain.value = params.eq.mid;

  const hi = off.createBiquadFilter();
  hi.type = 'highshelf';
  hi.frequency.value = 6000;
  hi.gain.value = params.eq.high;

  source.connect(gain);
  gain.connect(lo);
  lo.connect(mid);
  mid.connect(hi);

  let tail: AudioNode = hi;
  if (params.comp.enabled) {
    const comp = off.createDynamicsCompressor();
    comp.threshold.value = params.comp.threshold;
    comp.ratio.value = params.comp.ratio;
    comp.knee.value = params.comp.knee;
    comp.attack.value = params.comp.attack;
    comp.release.value = params.comp.release;
    hi.connect(comp);
    tail = comp;
  }
  tail.connect(off.destination);
  source.start(0);
  return await off.startRendering();
}

/** اتصال زنجیرهٔ زنده برای پیش‌نمایش (پخش هم‌زمان بدون پخت) */
export function connectPreviewChain(
  ctx: AudioContext,
  source: AudioBufferSourceNode,
  params: { gain: number; eq: EqParams; comp: CompParams },
  destination: AudioNode
): { dispose: () => void } {
  const gain = ctx.createGain();
  gain.gain.value = Math.max(0, params.gain);
  const lo = ctx.createBiquadFilter();
  lo.type = 'lowshelf';
  lo.frequency.value = 120;
  lo.gain.value = params.eq.low;
  const mid = ctx.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1000;
  mid.Q.value = 1;
  mid.gain.value = params.eq.mid;
  const hi = ctx.createBiquadFilter();
  hi.type = 'highshelf';
  hi.frequency.value = 6000;
  hi.gain.value = params.eq.high;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = params.comp.threshold;
  comp.ratio.value = params.comp.ratio;
  comp.knee.value = params.comp.knee;
  comp.attack.value = params.comp.attack;
  comp.release.value = params.comp.release;

  source.connect(gain);
  gain.connect(lo);
  lo.connect(mid);
  mid.connect(hi);
  if (params.comp.enabled) {
    hi.connect(comp);
    comp.connect(destination);
  } else {
    hi.connect(destination);
  }
  return {
    dispose: () => {
      try {
        source.disconnect();
        gain.disconnect();
        lo.disconnect();
        mid.disconnect();
        hi.disconnect();
        comp.disconnect();
      } catch {
        /* ignore */
      }
    }
  };
}

// ---------- FFT (radix-2) ----------

function bitReverse(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
}

/** FFT درجا (n باید توان ۲ باشد) */
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  bitReverse(re, im);
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + half] * curRe - im[i + k + half] * curIm;
        const vIm = re[i + k + half] * curIm + im[i + k + half] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + half] = uRe - vRe;
        im[i + k + half] = uIm - vIm;
        const nRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nRe;
      }
    }
  }
}

/** IFFT درجا */
function ifft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 0; i < n; i++) im[i] = -im[i];
  fft(re, im);
  for (let i = 0; i < n; i++) {
    im[i] = -im[i];
    re[i] /= n;
    im[i] /= n;
  }
}

function makeHann(n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
  return w;
}

// ---------- Noise reduction (spectral subtraction) ----------

const FFT_N = 2048;
const FFT_HOP = 512;

/** میانگین طیف دامنهٔ ناحیهٔ «فقط نویز» → پروفایل نویز */
export function computeNoiseProfile(
  src: AudioBuffer,
  startSec: number,
  endSec: number
): Float32Array {
  const sr = src.sampleRate;
  const s = Math.max(0, Math.round(startSec * sr));
  const e = Math.min(src.length, Math.round(endSec * sr));
  const profile = new Float32Array(FFT_N / 2 + 1);
  if (e - s < FFT_N) return profile;
  const hann = makeHann(FFT_N);
  const re = new Float64Array(FFT_N);
  const im = new Float64Array(FFT_N);
  let frames = 0;
  for (let c = 0; c < src.numberOfChannels; c++) {
    const d = src.getChannelData(c);
    for (let st = s; st + FFT_N <= e; st += FFT_HOP) {
      for (let i = 0; i < FFT_N; i++) {
        re[i] = d[st + i] * hann[i];
        im[i] = 0;
      }
      fft(re, im);
      for (let i = 0; i <= FFT_N / 2; i++) {
        profile[i] += Math.sqrt(re[i] * re[i] + im[i] * im[i]);
      }
      frames++;
    }
  }
  if (frames > 0) {
    for (let i = 0; i <= FFT_N / 2; i++) profile[i] /= frames;
  }
  return profile;
}

/** حذف نویز با تفریق طیفی (amount: ۰..۲) — خروجی بافر جدید */
export function reduceNoise(
  ctx: BaseAudioContext,
  src: AudioBuffer,
  profile: Float32Array,
  amount: number,
  startSec = 0,
  endSec = src.duration
): AudioBuffer {
  const sr = src.sampleRate;
  const s = Math.max(0, Math.round(startSec * sr));
  const e = Math.min(src.length, Math.round(endSec * sr));
  const ch = src.numberOfChannels;
  const out: Float64Array[] = [];
  for (let c = 0; c < ch; c++) out.push(new Float64Array(src.length));
  const winSum = new Float64Array(src.length);
  const hann = makeHann(FFT_N);
  const re = new Float64Array(FFT_N);
  const im = new Float64Array(FFT_N);
  const sub = Math.max(0, Math.min(2, amount));

  for (let c = 0; c < ch; c++) {
    const d = src.getChannelData(c);
    const dst = out[c];
    for (let st = s; st + FFT_N <= e; st += FFT_HOP) {
      for (let i = 0; i < FFT_N; i++) {
        re[i] = d[st + i] * hann[i];
        im[i] = 0;
      }
      fft(re, im);
      for (let i = 0; i <= FFT_N / 2; i++) {
        const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
        let m = mag - sub * profile[i];
        const floor = Math.max(mag * 0.01, profile[i] * 0.05);
        if (m < floor) m = floor;
        const scale = mag > 1e-10 ? m / mag : 0;
        re[i] *= scale;
        im[i] *= scale;
      }
      for (let i = FFT_N / 2 + 1; i < FFT_N; i++) {
        re[i] = re[FFT_N - i];
        im[i] = -im[FFT_N - i];
      }
      ifft(re, im);
      for (let i = 0; i < FFT_N; i++) {
        dst[st + i] += re[i] * hann[i];
        winSum[st + i] += hann[i] * hann[i];
      }
    }
  }

  const res = ctx.createBuffer(ch, src.length, sr);
  for (let c = 0; c < ch; c++) {
    const data = res.getChannelData(c);
    const d = out[c];
    for (let i = 0; i < data.length; i++) {
      data[i] = winSum[i] > 1e-6 ? Math.max(-1, Math.min(1, d[i] / winSum[i])) : 0;
    }
  }
  return res;
}

// ---------- WAV encoder (خالص JS) ----------

export function encodeWav(src: AudioBuffer, bitDepth: 16 | 32): Blob {
  const ch = src.numberOfChannels;
  const rate = src.sampleRate;
  const frames = src.length;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = ch * bytesPerSample;
  const dataSize = frames * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const dv = new DataView(buffer);

  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  dv.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, bitDepth === 16 ? 1 : 3, true); // 1=PCM, 3=float32
  dv.setUint16(22, ch, true);
  dv.setUint32(24, rate, true);
  dv.setUint32(28, rate * blockAlign, true);
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, bitDepth, true);
  writeStr(36, 'data');
  dv.setUint32(40, dataSize, true);

  let off = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < ch; c++) {
      const v = src.getChannelData(c)[i];
      if (bitDepth === 16) {
        dv.setInt16(off, Math.max(-32768, Math.min(32767, Math.round(v * 32767))), true);
      } else {
        dv.setFloat32(off, Math.max(-1, Math.min(1, v)), true);
      }
      off += bytesPerSample;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

// ---------- FLAC encoder (خالص JS — زیرفریم‌های verbatim) ----------

class BitWriter {
  private bytes: number[] = [];
  private bitBuf = 0;
  private bitCount = 0;

  writeBits(value: number, n: number) {
    for (let i = n - 1; i >= 0; i--) {
      this.bitBuf = (this.bitBuf << 1) | ((value >>> i) & 1);
      this.bitCount++;
      if (this.bitCount === 8) {
        this.bytes.push(this.bitBuf & 0xff);
        this.bitBuf = 0;
        this.bitCount = 0;
      }
    }
  }

  align() {
    if (this.bitCount > 0) {
      this.bitBuf <<= 8 - this.bitCount;
      this.bytes.push(this.bitBuf & 0xff);
      this.bitBuf = 0;
      this.bitCount = 0;
    }
  }

  toBytes(): Uint8Array {
    this.align();
    return new Uint8Array(this.bytes);
  }
}

function crc8(data: Uint8Array): number {
  let c = 0;
  for (const b of data) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = c & 0x80 ? ((c << 1) ^ 0x07) & 0xff : (c << 1) & 0xff;
  }
  return c & 0xff;
}

function crc16(data: Uint8Array): number {
  let c = 0;
  for (const b of data) {
    c ^= b << 8;
    for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x8005) & 0xffff : (c << 1) & 0xffff;
  }
  return c & 0xffff;
}

function utf8FrameNum(n: number): number[] {
  if (n < 0x80) return [n];
  if (n < 0x800) return [0xc0 | (n >> 6), 0x80 | (n & 0x3f)];
  if (n < 0x10000) return [0xe0 | (n >> 12), 0x80 | ((n >> 6) & 0x3f), 0x80 | (n & 0x3f)];
  return [0xf0 | (n >> 18), 0x80 | ((n >> 12) & 0x3f), 0x80 | ((n >> 6) & 0x3f), 0x80 | (n & 0x3f)];
}

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
];

function md5K(i: number): number {
  return Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
}

function md5(bytes: Uint8Array): Uint8Array {
  const origLen = bytes.length;
  let padded = origLen + 1;
  while (padded % 64 !== 56) padded++;
  const buf = new Uint8Array(padded + 8);
  buf.set(bytes);
  buf[origLen] = 0x80;
  const bitLen = origLen * 8;
  const dv = new DataView(buf.buffer);
  dv.setUint32(padded, bitLen >>> 0, true);
  dv.setUint32(padded + 4, Math.floor(bitLen / 4294967296), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const rot = (x: number, c: number) => ((x << c) | (x >>> (32 - c))) >>> 0;

  for (let blk = 0; blk < buf.length; blk += 64) {
    const M = new Array<number>(16);
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(blk + i * 4, true);
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;
    for (let i = 0; i < 64; i++) {
      let F = 0;
      let g = 0;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + md5K(i) + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rot(F, MD5_S[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, a0, true);
  odv.setUint32(4, b0, true);
  odv.setUint32(8, c0, true);
  odv.setUint32(12, d0, true);
  return out;
}

/** کدگذاری FLAC (زیرفریم verbatim — بدون فشرده‌سازی، ولی فرمت معتبر) */
export function encodeFlac(src: AudioBuffer): Blob {
  const ch = src.numberOfChannels;
  const rate = src.sampleRate;
  const totalSamples = src.length;
  const blockSize = 4096;

  // ----- STREAMINFO -----
  // fLaC (4) + metadata block header (4) + content (34) = 42 bytes
  const streaminfo = new Uint8Array(42);
  const dv = new DataView(streaminfo.buffer);
  streaminfo[0] = 0x66; // f
  streaminfo[1] = 0x4c; // L
  streaminfo[2] = 0x61; // a
  streaminfo[3] = 0x43; // C
  // metadata block header: last + type 0 (STREAMINFO) + length 34
  streaminfo[4] = 0x80;
  streaminfo[5] = 0x00;
  streaminfo[6] = 0x00;
  streaminfo[7] = 0x22;
  const c = 8; // content start
  // min/max block size (16 bits each)
  dv.setUint16(c, blockSize, false);
  dv.setUint16(c + 2, blockSize, false);
  // min/max frame size (24 bits each) = 0 (unknown)
  const bitsPerSample = 16;
  const high4 = Math.floor(totalSamples / 4294967296) & 0xf; // total samples bits 35..32
  streaminfo[c + 10] = (rate >>> 12) & 0xff; // sample rate bits 19..12
  streaminfo[c + 11] = (rate >>> 4) & 0xff; // sample rate bits 11..4
  streaminfo[c + 12] = ((rate & 0xf) << 4) | ((ch - 1) << 1) | (((bitsPerSample - 1) >>> 4) & 1);
  streaminfo[c + 13] = (((bitsPerSample - 1) & 0xf) << 4) | (high4 & 0xf);
  dv.setUint32(c + 14, totalSamples >>> 0, false); // total samples bits 31..0
  // MD5 signature (16 bytes) — over interleaved big-endian 16-bit PCM
  streaminfo.set(md5(interleave16(src)), c + 18);

  // ----- Frames -----
  const frames: Uint8Array[] = [];
  const channelsData: Float32Array[] = [];
  for (let c = 0; c < ch; c++) channelsData.push(src.getChannelData(c));
  const frameCount = Math.ceil(totalSamples / blockSize);

  for (let f = 0; f < frameCount; f++) {
    const frameStart = f * blockSize;
    const n = Math.min(blockSize, totalSamples - frameStart);
    const bw = new BitWriter();
    bw.writeBits(0b11111111111110, 14); // sync
    bw.writeBits(0, 1); // reserved
    bw.writeBits(0, 1); // blocking strategy: fixed
    bw.writeBits(6, 4); // block size code: 4096
    bw.writeBits(0, 4); // sample rate code: get from streaminfo
    bw.writeBits(ch - 1, 4); // channel assignment
    bw.writeBits(0, 3); // sample size code: get from streaminfo
    bw.writeBits(0, 1); // reserved
    for (const b of utf8FrameNum(f)) bw.writeBits(b, 8); // frame number

    const header = bw.toBytes();
    const crc = crc8(header);

    const body: number[] = [];
    body.push(...header);
    body.push(crc);
    for (let c = 0; c < ch; c++) {
      body.push(0x82); // subframe header: verbatim + no wasted bits
      const d = channelsData[c];
      for (let i = frameStart; i < frameStart + n; i++) {
        const v = Math.max(-32768, Math.min(32767, Math.round(d[i] * 32767)));
        body.push((v >> 8) & 0xff);
        body.push(v & 0xff);
      }
    }
    const frameBytes = new Uint8Array(body);
    const crc16v = crc16(frameBytes);
    const finalFrame = new Uint8Array(frameBytes.length + 2);
    finalFrame.set(frameBytes);
    finalFrame[frameBytes.length] = (crc16v >> 8) & 0xff;
    finalFrame[frameBytes.length + 1] = crc16v & 0xff;
    frames.push(finalFrame);
  }

  return new Blob([streaminfo, ...frames], { type: 'audio/flac' });
}

function interleave16(src: AudioBuffer): Uint8Array {
  const ch = src.numberOfChannels;
  const out = new Uint8Array(src.length * ch * 2);
  const dv = new DataView(out.buffer);
  let off = 0;
  for (let i = 0; i < src.length; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-32768, Math.min(32767, Math.round(src.getChannelData(c)[i] * 32767)));
      dv.setInt16(off, v, false);
      off += 2;
    }
  }
  return out;
}

// ---------- MP3 encoder (lamejs — بارگذاری تنبل) ----------

export interface Mp3EncoderApi {
  encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
  flush(): Int8Array;
}

/** بارگذاری lamejs (باندل کامل lame.all.js) — نسخه npm (src/js) با import شکسته است: */
/*   Lame.js/Encoder.js/PsyModel.js به MPEGMode به‌صورت متغیر سراسری ارجاع می‌دهند و require ندارند.
       فقط باندل تک‌اسکوپ lame.all.js کار می‌کند؛ از طریق ?raw + new Function بارگذاری می‌شود. */
let lameCache: { Mp3Encoder: new (ch: number, sr: number, kbps: number) => Mp3EncoderApi } | null = null;

async function loadLameMp3Encoder() {
  if (lameCache) return lameCache.Mp3Encoder;
  const raw = (await import('lamejs/lame.all.js?raw')).default as string;
  // new Function اجرا در اسکوپ سراسری: تابع `lamejs` ساخته و فراخوانی می‌شود و
  // `lamejs.Mp3Encoder` روی آن می‌نشیند — آن را برمی‌گردانیم.
  const factory = new Function(`${raw}\n;return lamejs;`) as () => typeof lameCache;
  lameCache = factory();
  return lameCache!.Mp3Encoder;
}

/** کدگذاری MP3 با lamejs (بلوک‌بلوک برای حفظ پاسخ‌گویی UI) */
export async function encodeMp3(
  src: AudioBuffer,
  kbps: number,
  onProgress?: (p: number) => void
): Promise<Blob> {
  const ctor = await loadLameMp3Encoder();
  const enc = new ctor(src.numberOfChannels, src.sampleRate, kbps);

  const ch = src.numberOfChannels;
  const L = src.getChannelData(0);
  const R = ch > 1 ? src.getChannelData(1) : null;
  const l16 = new Int16Array(L.length);
  for (let i = 0; i < L.length; i++) l16[i] = Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767)));
  let r16: Int16Array | null = null;
  if (R) {
    r16 = new Int16Array(R.length);
    for (let i = 0; i < R.length; i++) r16[i] = Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767)));
  }

  const blockSize = 1152;
  const total = Math.ceil(L.length / blockSize);
  const parts: Int8Array[] = [];
  for (let b = 0; b < total; b++) {
    const s = b * blockSize;
    const e = Math.min(s + blockSize, L.length);
    const left = l16.subarray(s, e);
    const right = r16 ? r16.subarray(s, e) : undefined;
    const out = right ? enc.encodeBuffer(left, right) : enc.encodeBuffer(left);
    if (out.length) parts.push(out);
    if (b % 32 === 0) {
      onProgress?.(Math.round((b / total) * 90));
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  const tail = enc.flush();
  if (tail.length) parts.push(tail);
  onProgress?.(100);
  return new Blob(parts, { type: 'audio/mpeg' });
}

// ---------- M4A / WebM encoder (MediaRecorder — زمان واقعی) ----------

/** کدگذاری با MediaRecorder (پشتیبانی: audio/mp4 در Chrome/Edge/FF) */
export function encodeViaRecorder(
  src: AudioBuffer,
  mimeType: string,
  onProgress?: (p: number) => void
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    let settled = false;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
    };

    ctx
      .resume()
      .then(() => {
        const srcNode = ctx.createBufferSource();
        srcNode.buffer = src;
        const dest = ctx.createMediaStreamDestination();
        srcNode.connect(dest);

        const mime = MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/webm';
        let rec: MediaRecorder;
        try {
          rec = new MediaRecorder(dest.stream, { mimeType: mime });
        } catch (e) {
          finish(new Error('مرورگر شما این فرمت خروجی را پشتیبانی نمی‌کند.'));
          return;
        }
        const chunks: Blob[] = [];
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size) chunks.push(e.data);
        };
        rec.onerror = () => finish(new Error('خطا در کدگذاری صدا.'));
        rec.onstop = () => {
          try {
            srcNode.stop();
          } catch {
            /* ignore */
          }
          ctx.close().catch(() => undefined);
          if (settled) return;
          settled = true;
          if (!chunks.length) {
            reject(new Error('کدگذاری صدا نتیجه‌ای نداشت (مرورگر یا قابلیت ضبط صدا در دسترس نیست).'));
            return;
          }
          resolve(new Blob(chunks, { type: mime.split(';')[0] }));
        };

        const t0 = performance.now();
        const durMs = src.duration * 1000;
        const iv = window.setInterval(() => {
          const p = Math.min(100, Math.round(((performance.now() - t0) / durMs) * 100));
          onProgress?.(p);
          if (p >= 100) window.clearInterval(iv);
        }, 200);

        srcNode.onended = () => {
          try {
            if (rec.state !== 'inactive') rec.stop();
          } catch {
            /* ignore */
          }
        };

        rec.start(250);
        srcNode.start(0);
        window.setTimeout(() => {
          try {
            if (rec.state !== 'inactive') rec.stop();
          } catch {
            /* ignore */
          }
        }, durMs + 1500);
      })
      .catch(() => finish(new Error('خطا در راه‌اندازی کدگذاری صدا.')));
  });
}

/** تشخیص MIME ضبط از میکروفون */
export function pickRecordMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
  return candidates.find((m) => {
    try {
      return MediaRecorder.isTypeSupported(m);
    } catch {
      return false;
    }
  }) || '';
}
