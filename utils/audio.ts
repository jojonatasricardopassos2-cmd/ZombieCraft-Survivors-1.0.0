export class AudioEngine {
    private ctx: AudioContext | null = null;
    private initialized = false;
    private masterGain: GainNode | null = null;

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; // Default low volume
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.error('AudioContext not supported', e);
        }
    }

    setVolume(vol: number) {
        if (!this.ctx || !this.masterGain) return;
        this.resume();
        this.masterGain.gain.value = vol;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number, vol = 1, modulation = false) {
        if (!this.ctx || !this.masterGain) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        if (modulation) {
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    private playNoise(duration: number, vol = 1, isLow = false) {
        if (!this.ctx || !this.masterGain) return;
        this.resume();

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = isLow ? 'lowpass' : 'bandpass';
        filter.frequency.value = isLow ? 400 : 1000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
    }

    playBreak() {
        this.playNoise(0.15, 0.4, true);
        this.playTone(150, 'square', 0.1, 0.2);
    }

    playPlace() {
        this.playTone(200, 'sine', 0.1, 0.4);
        setTimeout(() => this.playTone(300, 'sine', 0.1, 0.2), 50);
    }

    playHit() {
        this.playNoise(0.2, 0.6);
        this.playTone(100, 'sawtooth', 0.2, 1, true);
    }

    playAnimalHurt() {
        this.playTone(400, 'sawtooth', 0.3, 0.5, true);
        setTimeout(() => this.playTone(350, 'square', 0.2, 0.3), 50);
    }

    playZombieHurt() {
        this.playTone(100, 'sawtooth', 0.5, 0.8, true);
        this.playNoise(0.3, 0.3, true);
    }
    
    playCowHurt() {
        this.playTone(150, 'square', 0.5, 0.6, true);
    }

    playStep(material: string = 'default') {
        if (!this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        if (material === 'grass' || material === 'snow') {
            this.playNoise(0.05, 0.05, true, 'bandpass', 1200);
        } else if (material === 'stone' || material === 'coal') {
            this.playTone(80, 'square', 0.05, 0.05, true);
        } else if (material === 'wood') {
            this.playTone(120, 'triangle', 0.06, 0.05, true);
        } else {
            this.playNoise(0.04, 0.05, true, 'lowpass', 1000);
        }
    }

    // Ambient loops
    private ambientNodes: { [key: string]: { src: any, gain: GainNode } } = {};

    private startAmbientNoise(key: string, filterFreq: number, vol = 0.5, type: BiquadFilterType = 'lowpass') {
        if (!this.ctx || !this.masterGain || this.ambientNodes[key]) return;
        this.resume();

        const bufferSize = this.ctx.sampleRate * 2; // 2 sec loop
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = filterFreq;

        const gain = this.ctx.createGain();
        gain.gain.value = 0; // fade in
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        this.ambientNodes[key] = { src: noise, gain };
    }

    stopAmbient(key: string) {
        if (!this.ctx || !this.ambientNodes[key]) return;
        const node = this.ambientNodes[key];
        node.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        setTimeout(() => {
            try { node.src.stop(); } catch(e){}
            delete this.ambientNodes[key];
        }, 1000);
    }
    
    setAmbientVolume(key: string, vol: number) {
        if (!this.ctx || !this.ambientNodes[key]) return;
        this.ambientNodes[key].gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 1);
    }

    updateAmbient(isRaining: boolean, isSnowing: boolean, isDay: boolean, inWater: boolean) {
        if (!this.ctx) return;
        
        if (isRaining && !isSnowing) {
            if (!this.ambientNodes['rain']) this.startAmbientNoise('rain', 600, 0.15, 'bandpass');
        } else {
            this.stopAmbient('rain');
        }
        
        if (isSnowing) {
             if (!this.ambientNodes['snow']) this.startAmbientNoise('snow', 8000, 0.05, 'highpass');
        } else {
             this.stopAmbient('snow');
        }

        if (inWater) {
             if (!this.ambientNodes['water']) this.startAmbientNoise('water', 300, 0.2, 'lowpass');
        } else {
             this.stopAmbient('water');
        }

        // Birds during day
        if (isDay && !isRaining && !isSnowing && Math.random() < 0.005) {
            this.playTone(2000 + Math.random() * 1000, 'sine', 0.1, 0.05);
            setTimeout(() => this.playTone(1800 + Math.random() * 800, 'sine', 0.1, 0.05), Math.random() * 200 + 100);
        }

        // Crickets during night
        if (!isDay && !isRaining && !isSnowing && Math.random() < 0.01) {
            this.playTone(4000 + Math.random() * 500, 'sine', 0.05, 0.02);
            setTimeout(() => this.playTone(4000 + Math.random() * 500, 'sine', 0.05, 0.02), 100);
            setTimeout(() => this.playTone(4000 + Math.random() * 500, 'sine', 0.05, 0.02), 200);
        }
    }
    stopAllAmbients() {
        this.stopAmbient('rain');
        this.stopAmbient('snow');
        this.stopAmbient('water');
    }

    // Menu music
    private menuMusicInterval: any = null;
    
    playMenuMusic() {
        if (!this.ctx || !this.masterGain) return;
        this.resume();
        if (this.menuMusicInterval) return; // already playing

        // A simple calming melody loop
        const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C4, D4, E4, G4, A4, C5
        
        const playNote = () => {
            const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
            this.playTone(freq, 'sine', 2.0, 0.05); // long soft note
        };
        
        playNote(); // play first
        this.menuMusicInterval = setInterval(playNote, 1500); // every 1.5s
    }

    stopMenuMusic() {
        if (this.menuMusicInterval) {
            clearInterval(this.menuMusicInterval);
            this.menuMusicInterval = null;
        }
    }
}

export const audio = new AudioEngine();
