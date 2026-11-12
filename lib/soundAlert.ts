// Audio alert engine using Web Audio API for zero-dependency, ultra-reliable notification sounds

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * High-priority chime for Admin when a new order is received.
 * 3-note ascending cheerful chime: C5 -> E5 -> G5 -> C6
 */
export function playOrderAlertSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 }, // C5
      { freq: 659.25, time: 0.14, duration: 0.15 }, // E5
      { freq: 783.99, time: 0.28, duration: 0.18 }, // G5
      { freq: 1046.50, time: 0.44, duration: 0.35 }, // C6
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, ctx.currentTime);
    masterGain.connect(ctx.destination);

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

      const startTime = ctx.currentTime + note.time;
      const endTime = startTime + note.duration;

      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(endTime);
    });
  } catch (err) {
    console.warn('Audio play error:', err);
  }
}

/**
 * Gentle notification chime for Customer when an order update occurs (Confirmed, Shipped, Delivered, etc.).
 * 2-note bell: F5 -> A5
 */
export function playCustomerUpdateSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 698.46, time: 0, duration: 0.18 }, // F5
      { freq: 880.00, time: 0.16, duration: 0.32 }, // A5
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.25, ctx.currentTime);
    masterGain.connect(ctx.destination);

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

      const startTime = ctx.currentTime + note.time;
      const endTime = startTime + note.duration;

      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(endTime);
    });
  } catch (err) {
    console.warn('Customer audio play error:', err);
  }
}

/**
 * Triggers browser desktop push notification if user has granted permission.
 */
export function triggerDesktopNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/images/favicon.ico',
        badge: '/images/favicon.ico',
        ...options,
      });
    }
  } catch (err) {
    console.warn('Desktop notification error:', err);
  }
}

