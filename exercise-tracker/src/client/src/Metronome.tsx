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

  const [warmupBeats, setWarmupBeats] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [isWarmup, setIsWarmup] = useState<boolean>(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const playClick = useCallback((frequency: number = 800) => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
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

  const startMetronome = useCallback(() => {
    // Initialize audio context on user interaction
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
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
        // Warmup phase - lower frequency
        setIsWarmup(true);
        setCurrentBeat(beatCount + 1);
        playClick(400);
        beatCount++;
        timeoutRef.current = window.setTimeout(tick, interval);
      } else if (beatCount < totalWarmup + totalBeats) {
        // Main phase - higher frequency
        setIsWarmup(false);
        setCurrentBeat(beatCount - totalWarmup + 1);
        playClick(800);
        beatCount++;
        timeoutRef.current = window.setTimeout(tick, interval);
      } else {
        // Done
        stopMetronome();
      }
    };

    tick();
  }, [bpm, beats, warmupBeats, playClick, stopMetronome]);

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
