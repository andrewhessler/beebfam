import { useState, useRef, useCallback, useEffect } from 'react';
import './Metronome.css';

interface MetronomeProps {
  beats?: string | number;
  beatMultiplier?: number;
}

function Metronome({ beats: beatsProp = 20, beatMultiplier: beatsMultiplierProp = 1 }: MetronomeProps) {
  const [bpm, setBpm] = useState<number>(50);
  const [beats, setBeats] = useState<number>(Number.isInteger(beatsProp) ? beatsProp as number * beatsMultiplierProp : parseInt(beatsProp as string) * beatsMultiplierProp);

  useEffect(() => {
    const newBeats = Number.isInteger(beatsProp) ? beatsProp as number : parseInt(beatsProp as string);
    setBeats(newBeats * beatsMultiplierProp);
  }, [beatsProp, beatsMultiplierProp]);

  const [plays, setPlays] = useState<number>(0);
  const [warmupBeats, setWarmupBeats] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [isWarmup, setIsWarmup] = useState<boolean>(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const soundBuffersRef = useRef<{ common: AudioBuffer | null; warmup: AudioBuffer | null; accent: AudioBuffer | null }>({
    common: null,
    warmup: null,
    accent: null,
  });

  const createSound = useCallback((frequency: number, volume: number): AudioBuffer | null => {
    // sound math from https://metronome-online.com/
    // ON MOBILE: sounds will not play if phone is in silent mode, sounds are treated as ringtones, not media
    if (!audioContextRef.current) return null;

    const audioContext = audioContextRef.current;
    const sampleRate = audioContext.sampleRate;
    const duration = sampleRate * 0.1;
    const buffer = audioContext.createBuffer(1, duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    const angularFreq = 2 * Math.PI / sampleRate * frequency;
    const decay1 = 100 / sampleRate;
    const decay2 = 200 / sampleRate;
    const decay3 = 500 / sampleRate;

    for (let i = 0; i < duration; i++) {
      channelData[i] = volume * (
        0.09 * Math.exp(-i * decay1) * Math.sin(angularFreq * i) +
        0.34 * Math.exp(-i * decay2) * Math.sin(2 * angularFreq * i) +
        0.57 * Math.exp(-i * decay3) * Math.sin(6 * angularFreq * i)
      );
    }

    return buffer;
  }, []);

  const initializeSounds = useCallback(() => {
    if (!audioContextRef.current) return;

    soundBuffersRef.current = {
      common: createSound(440, 0.7),
      warmup: createSound(330, 0.5),
      accent: createSound(880, 0.5),
    };
  }, [createSound]);

  const playClick = useCallback((type: 'common' | 'warmup' | 'accent') => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const buffer = soundBuffersRef.current[type];

    if (!buffer) return;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    const t = audioContext.currentTime;
    source.start(t);
    source.stop(t + 0.1);
  }, []);

  const stopMetronome = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    setIsWarmup(true);
  }, []);

  const startMetronome = useCallback(async () => {
    // Initialize audio context on user interaction (with Safari fallback)
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      initializeSounds();
    }

    // Resume AudioContext if suspended (required for mobile browsers)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const interval = 60000 / bpm;
    const totalWarmup = warmupBeats;
    const totalBeats = beats;
    let beatCount = 0;

    setIsPlaying(true);
    setIsWarmup(true);
    setCurrentBeat(0);

    const tick = () => {
      if (beatCount < totalWarmup) {
        setIsWarmup(true);
        setCurrentBeat(beatCount + 1);
        playClick('warmup');
        beatCount++;
        timeoutRef.current = window.setTimeout(tick, interval);
      } else if (beatCount < totalWarmup + totalBeats) {
        setIsWarmup(false);
        const mainBeatNumber = beatCount - totalWarmup + 1;
        setCurrentBeat(mainBeatNumber);
        if (beatCount === totalBeats + 1) {
          playClick('accent');
        } else {
          playClick('common');
        }
        beatCount++;
        timeoutRef.current = window.setTimeout(tick, interval);
      } else {
        stopMetronome();
        setPlays((p) => p + 1);
      }
    };

    tick();
  }, [bpm, beats, warmupBeats, playClick, stopMetronome, initializeSounds]);

  const handleToggle = useCallback(() => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  }, [isPlaying, startMetronome, stopMetronome]);

  return (
    <div className="metronome-container">
      <h2>Metronome</h2>

      <div className="metronome-plays">
        <span id="plays">Sets Played: {plays}</span>
      </div>
      <div className="metronome-inputs">
        <div className="metronome-input-group">
          <label htmlFor="bpm">BPM:</label>
          <input
            id="bpm"
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isPlaying}
            min="1"
            max="300"
          />
        </div>

        <div className="metronome-input-group">
          <label htmlFor="warmup">Warmup Beats:</label>
          <input
            id="warmup"
            type="number"
            value={warmupBeats}
            onChange={(e) => setWarmupBeats(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={isPlaying}
            min="0"
          />
        </div>

        <div className="metronome-input-group">
          <label htmlFor="beats">Main Beats:</label>
          <input
            id="beats"
            type="number"
            value={beats}
            onChange={(e) => setBeats(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isPlaying}
            min="1"
          />
        </div>
      </div>

      <button className="metronome-button" onClick={handleToggle}>
        {isPlaying ? '⏹ Stop' : '▶ Play'}
      </button>

      {isPlaying && (
        <div className="metronome-status">
          <div className={`beat-indicator ${isWarmup ? 'warmup' : 'main'}`}>
            {isWarmup ? '🔶' : '🔵'}
          </div>
          <div className="beat-count">
            Beat {currentBeat} / {isWarmup ? warmupBeats : beats}
          </div>
          <div className="phase-label">
            {isWarmup ? 'Warmup Phase' : 'Main Phase'}
          </div>
        </div>
      )}
    </div>
  );
}

export default Metronome;
