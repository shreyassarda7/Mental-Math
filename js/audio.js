/**
 * Simple Audio Engine using Web Audio API
 * No external files required.
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioContext();

function playTone(freq, type, duration) {
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
}

export function playCorrect() {
    // High pitch upbeat chime (Major Third)
    playTone(600, 'sine', 0.1);
    setTimeout(() => playTone(800, 'sine', 0.2), 100);
}

export function playWrong() {
    // Low pitch error buzz
    playTone(150, 'sawtooth', 0.3);
}

export function playTick() {
    // Woodblock style tick
    playTone(800, 'square', 0.05);
}
