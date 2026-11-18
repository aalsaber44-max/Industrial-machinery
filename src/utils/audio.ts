/**
 * توليد مؤثرات صوتية خفيفة عبر Web Audio API دون الحاجة لملفات خارجية.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq: number, durationMs: number, type: OscillatorType, startOffset = 0, gainVal = 0.08): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

export function playFeedbackSound(kind: 'correct' | 'close' | 'wrong' | 'finish', muted: boolean): void {
  if (muted) return;
  try {
    if (kind === 'correct') {
      playTone(587.33, 120, 'sine', 0, 0.07);
      playTone(880, 180, 'sine', 0.09, 0.07);
    } else if (kind === 'close') {
      playTone(440, 140, 'triangle', 0, 0.06);
      playTone(493.88, 160, 'triangle', 0.12, 0.06);
    } else if (kind === 'wrong') {
      playTone(240, 180, 'sawtooth', 0, 0.045);
      playTone(190, 220, 'sawtooth', 0.13, 0.045);
    } else if (kind === 'finish') {
      playTone(523.25, 130, 'sine', 0, 0.07);
      playTone(659.25, 130, 'sine', 0.11, 0.07);
      playTone(783.99, 220, 'sine', 0.22, 0.08);
    }
  } catch {
    // تجاهل أي قيود من المتصفح على الصوت التلقائي
  }
}
