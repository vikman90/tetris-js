class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.musicGain = null;
        // Music state
        this.isPlayingMusic = false;
        this.nextNoteTime = 0;
        this.noteIndex = 0;
        this.timerID = null;
        this.tempo = 140;

        // Korobeiniki Theme (Tetris A)
        // [Note, Duration (1=quarter)]
        // Frequencies approximated to nearest note
        this.melody = [
            // Part A
            [659.25, 1], [493.88, 0.5], [523.25, 0.5], [587.33, 1], [523.25, 0.5], [493.88, 0.5],
            [440.00, 1], [440.00, 0.5], [523.25, 0.5], [659.25, 1], [587.33, 0.5], [523.25, 0.5],
            [493.88, 1.5], [523.25, 0.5], [587.33, 1], [659.25, 1],
            [523.25, 1], [440.00, 1], [440.00, 2],
            // repeat simlar part with variation... simplified for loop:
            [587.33, 1.5], [698.46, 0.5], [880.00, 1], [783.99, 0.5], [698.46, 0.5],
            [659.25, 1.5], [523.25, 0.5], [659.25, 1], [587.33, 0.5], [523.25, 0.5],
            [493.88, 1], [493.88, 0.5], [523.25, 0.5], [587.33, 1], [659.25, 1],
            [523.25, 1], [440.00, 1], [440.00, 2]
        ];
        // Bass Line (Corrected Korobeiniki Progression)
        // Pattern: Root - Fifth (Half notes)
        this.bassLine = [
            // Bar 1: Em
            [82.41, 2], [123.47, 2],        // E, B
            // Bar 2: Am
            [110.00, 2], [164.81, 2],       // A, E 
            // Bar 3: E7 (or G#dim, using E base)
            [82.41, 2], [123.47, 2],        // E, B
            // Bar 4: Am
            [110.00, 2], [164.81, 2],       // A, E
            // Bar 5: Dm
            [146.83, 2], [220.00, 2],       // D, A
            // Bar 6: Am
            [110.00, 2], [164.81, 2],       // A, E
            // Bar 7: E7
            [82.41, 2], [123.47, 2],        // E, B
            // Bar 8: Am
            [110.00, 2], [110.00, 2]        // A, A
        ];
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Lower volume safety
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.3;
            this.musicGain.connect(this.masterGain);

            this.bassGain = this.ctx.createGain();
            this.bassGain.gain.value = 0.6; // Boosted bass volume
            this.bassGain.connect(this.masterGain);
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
        }
        return this.isMuted;
    }

    // --- SFX ---

    // Helper to play tone
    playTone(freq, type, duration, startTime = 0) {
        if (this.isMuted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime + startTime;

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    move() {
        // Short low square blip
        this.playTone(200, 'square', 0.05);
    }

    rotate() {
        // Higher triangle blip
        this.playTone(400, 'triangle', 0.05);
    }

    drop() {
        // Fast slide down
        if (this.isMuted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    clear() {
        // Major chime (C - E - G)
        this.playTone(523.25, 'sine', 0.2, 0);
        this.playTone(659.25, 'sine', 0.2, 0.1);
        this.playTone(783.99, 'sine', 0.4, 0.2);
    }

    gameOver() {
        // Sad melody
        this.playTone(600, 'sawtooth', 0.3, 0);
        this.playTone(550, 'sawtooth', 0.3, 0.3);
        this.playTone(500, 'sawtooth', 0.6, 0.6);
        this.stopMusic();
    }

    // --- MUSIC ---

    startMusic() {
        if (this.isPlayingMusic || !this.ctx) return;
        this.isPlayingMusic = true;
        this.noteIndex = 0;
        this.bassNoteIndex = 0;
        this.nextNoteTime = this.ctx.currentTime;
        this.nextBassNoteTime = this.ctx.currentTime;
        this.scheduler();
    }

    stopMusic() {
        this.isPlayingMusic = false;
        clearTimeout(this.timerID);
    }

    scheduler() {
        if (!this.isPlayingMusic) return;

        // Schedule Melody
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.scheduleNote(this.melody[this.noteIndex], this.nextNoteTime, 'melody');
            this.nextNote('melody');
        }

        // Schedule Bass
        while (this.nextBassNoteTime < this.ctx.currentTime + 0.1) {
            this.scheduleNote(this.bassLine[this.bassNoteIndex], this.nextBassNoteTime, 'bass');
            this.nextNote('bass');
        }

        this.timerID = setTimeout(() => this.scheduler(), 25);
    }

    nextNote(voice) {
        const secondsPerBeat = 60.0 / this.tempo;

        if (voice === 'melody') {
            const noteDuration = this.melody[this.noteIndex][1];
            this.nextNoteTime += noteDuration * secondsPerBeat;
            this.noteIndex++;
            if (this.noteIndex === this.melody.length) this.noteIndex = 0;
        } else { // voice === 'bass'
            const noteDuration = this.bassLine[this.bassNoteIndex][1];
            this.nextBassNoteTime += noteDuration * secondsPerBeat;
            this.bassNoteIndex++;
            if (this.bassNoteIndex === this.bassLine.length) this.bassNoteIndex = 0;
        }
    }

    scheduleNote(note, time, voice) {
        if (this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if (voice === 'melody') {
            osc.type = 'square'; // 8-bit sound
            osc.connect(gain);
            gain.connect(this.musicGain);
        } else { // voice === 'bass'
            osc.type = 'triangle'; // Smoother bass
            osc.connect(gain);
            gain.connect(this.bassGain);
        }

        osc.frequency.value = note[0];

        const secondsPerBeat = 60.0 / this.tempo;
        const durationSec = note[1] * secondsPerBeat;

        // Custom volume per voice
        const volume = voice === 'melody' ? 0.1 : 0.4;

        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + durationSec - 0.05);

        osc.start(time);
        osc.stop(time + durationSec);
    }
}

const soundManager = new SoundManager();
