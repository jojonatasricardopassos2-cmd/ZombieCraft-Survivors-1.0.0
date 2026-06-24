export class AudioEngine {
    private ctx: AudioContext | null = null;
    private initialized = false;
    private masterGain: GainNode | null = null;
    private weatherFilter: BiquadFilterNode | null = null;

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.weatherFilter = this.ctx.createBiquadFilter();
            this.weatherFilter.type = 'lowpass';
            this.weatherFilter.frequency.value = 20000;
            this.weatherFilter.connect(this.masterGain);
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

    // --- NEW ANIMAL SOUNDS ---
    playCow() {
        if (!this.ctx || !this.masterGain) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.8);
    }

    playPig() {
        if (!this.ctx || !this.masterGain) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playSheep() {
        if (!this.ctx || !this.masterGain) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.6);
    }

    playBird() {
        if (!this.ctx || !this.masterGain) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, this.ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }
    // -------------------------

    playThunder() {
        this.playNoise(2.0, 1.5, true);
        this.playTone(50, 'sawtooth', 2.0, 1.0, true);
        setTimeout(() => this.playNoise(1.5, 0.8, true), 300);
        setTimeout(() => this.playTone(80, 'square', 1.5, 0.8, true), 500);
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
            this.playNoise(0.05, 0.05, true);
        } else if (material === 'stone' || material === 'coal') {
            this.playTone(80, 'square', 0.05, 0.05, true);
        } else if (material === 'wood') {
            this.playTone(120, 'triangle', 0.06, 0.05, true);
        } else {
            this.playNoise(0.04, 0.05, true);
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

    updateAmbient(isRaining: boolean, isSnowing: boolean, isDay: boolean, inWater: boolean, isGolden: boolean = false, stormIntensity: number = 0) {
        if (!this.ctx) return;
        
        if (isRaining && !isSnowing) {
            if (!this.ambientNodes['rain']) this.startAmbientNoise('rain', 600, 0.15 + (stormIntensity * 0.15), 'bandpass');
            else this.ambientNodes['rain'].gain.gain.setTargetAtTime(0.15 + (stormIntensity * 0.15), this.ctx!.currentTime, 0.5);
            
            if (stormIntensity > 0) {
                if (!this.ambientNodes['storm']) this.startAmbientNoise('storm', 200, 0.3 * stormIntensity, 'lowpass');
                else this.ambientNodes['storm'].gain.gain.setTargetAtTime(0.3 * stormIntensity, this.ctx!.currentTime, 0.5);
            } else {
                this.stopAmbient('storm');
            }
        } else {
            this.stopAmbient('rain');
            this.stopAmbient('storm');
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
        
        // Golden Forest Calming Chimes
        if (isGolden && Math.random() < 0.02) {
            const notes = [440, 493.88, 523.25, 587.33, 659.25, 783.99, 880]; // A Minor Pentatonic roughly or just calming notes
            const note = notes[Math.floor(Math.random() * notes.length)];
            this.playTone(note, 'sine', 3.0, 0.03); // Soft long chime
            setTimeout(() => {
                this.playTone(note * 1.5, 'sine', 2.0, 0.02);
            }, 500);
        }

        // Birds during day
        if (isDay && !isRaining && !isSnowing && Math.random() < 0.005) {
            this.playTone(2000 + Math.random() * 1000, 'sine', 0.1, 0.05);
            setTimeout(() => this.playTone(1800 + Math.random() * 800, 'sine', 0.1, 0.05), Math.random() * 200 + 100);
        }

        // Crickets and Owls during night
        if (!isDay && !isRaining && !isSnowing) {
            if (Math.random() < 0.01) {
                this.playTone(4000 + Math.random() * 500, 'sine', 0.05, 0.02);
                setTimeout(() => this.playTone(4000 + Math.random() * 500, 'sine', 0.05, 0.02), 100);
                setTimeout(() => this.playTone(4000 + Math.random() * 500, 'sine', 0.05, 0.02), 200);
            }
            if (Math.random() < 0.001) { // Owl
                this.playTone(300, 'sine', 0.6, 0.05);
                setTimeout(() => this.playTone(300, 'sine', 0.4, 0.05), 800);
            }
        }
        
        // Wind
        if (!this.ambientNodes['wind']) {
            this.startAmbientNoise('wind', 200, 0.02, 'lowpass');
        } else {
            // Wind varies
            this.setAmbientVolume('wind', 0.01 + Math.random() * 0.03);
        }
    }
    stopAllAmbients() {
        this.stopAmbient('rain');
        this.stopAmbient('snow');
        this.stopAmbient('water');
        this.stopAmbient('wind');
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

    playBackroomsHum() {
        if (!this.ctx || !this.masterGain) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, this.ctx.currentTime);
        // Low hum
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 1);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime + 10);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 12);
        
        // Add a bit of detune for unsettling effect
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 5; // 5Hz wobble
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 5;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        lfo.stop(this.ctx.currentTime + 12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 12);
    }
    
    playSmilerScream() { if (!this.ctx || !this.masterGain) return; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, this.ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 1); gain.gain.setValueAtTime(0.8, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1); osc.connect(gain); gain.connect(this.masterGain); osc.start(); osc.stop(this.ctx.currentTime + 1); }
    playJumpscare() { if (!this.ctx || !this.masterGain) return; const osc = this.ctx.createOscillator(); const osc2 = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.type = 'square'; osc2.type = 'sawtooth'; osc.frequency.setValueAtTime(200, this.ctx.currentTime); osc.frequency.linearRampToValueAtTime(1500, this.ctx.currentTime + 0.1); osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 1.5); osc2.frequency.setValueAtTime(400, this.ctx.currentTime); osc2.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 1.5); gain.gain.setValueAtTime(1, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5); osc.connect(gain); osc2.connect(gain); gain.connect(this.masterGain); osc.start(); osc2.start(); osc.stop(this.ctx.currentTime + 1.5); osc2.stop(this.ctx.currentTime + 1.5); }
    
    private staticNode: AudioBufferSourceNode | null = null;
    private staticGain: GainNode | null = null;
    startStatic(vol: number) { if (!this.ctx || !this.masterGain) return; if (!this.staticGain) { this.staticGain = this.ctx.createGain(); this.staticGain.connect(this.masterGain); const bufferSize = this.ctx.sampleRate * 2; const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate); const output = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1; this.staticNode = this.ctx.createBufferSource(); this.staticNode.buffer = buffer; this.staticNode.loop = true; this.staticNode.connect(this.staticGain); this.staticNode.start(); } this.staticGain.gain.setValueAtTime(vol, this.ctx.currentTime); }
    stopStatic() { if (this.staticGain && this.ctx) this.staticGain.gain.setValueAtTime(0, this.ctx.currentTime); }
    playBackroomsDrop() {
        if (!this.ctx || !this.masterGain) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 8);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 8);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 8);
    }
    
    playSeeYou() { if (!this.ctx || !this.masterGain) return; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(300, this.ctx.currentTime); osc.frequency.linearRampToValueAtTime(350, this.ctx.currentTime + 0.3); osc.frequency.linearRampToValueAtTime(250, this.ctx.currentTime + 0.6); gain.gain.setValueAtTime(0.3, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6); osc.connect(gain); gain.connect(this.masterGain); osc.start(); osc.stop(this.ctx.currentTime + 0.6); }
}

export const audio = new AudioEngine();
