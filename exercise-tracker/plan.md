# Metronome Feature Implementation Plan

## Overview
Add a simple metronome component to the exercise tracker that plays beats at a specified BPM with an optional warm-up period.

## Feature Requirements
- **Inputs:**
  - BPM (beats per minute)
  - Number of main beats
  - Number of warm-up beats
- **Output:** Audio beats played on the client side
- **Controls:** Play button to start the metronome

## Technical Approach

### 1. Create New Component: `Metronome.tsx`
Create a standalone component that encapsulates all metronome logic.

**State:**
- `bpm: number` - beats per minute (default: 60)
- `beats: number` - number of main exercise beats
- `warmupBeats: number` - number of warm-up beats before main beats
- `isPlaying: boolean` - whether metronome is currently active
- `currentBeat: number` - for visual feedback (optional)
- `isWarmup: boolean` - to distinguish warmup vs main phase (for different sounds)

**Audio Implementation:**
Use the Web Audio API (`AudioContext`) to generate click sounds:
- Create oscillator-based clicks (no external audio files needed)
- Use different frequencies for warmup beats vs main beats (e.g., lower pitch for warmup)
- Schedule beats precisely using `AudioContext.currentTime` for accurate timing

**Key Functions:**
```typescript
const playClick = (frequency: number) => {
  // Create short oscillator burst for click sound
}

const startMetronome = () => {
  // Calculate interval from BPM: interval = 60000 / bpm (ms)
  // Play warmup beats first, then main beats
  // Use setTimeout/setInterval or requestAnimationFrame with AudioContext timing
}

const stopMetronome = () => {
  // Clear intervals, stop audio context
}
```

### 2. UI Layout
```
+----------------------------------+
|          Metronome               |
+----------------------------------+
| BPM:         [____60____]        |
| Warmup Beats:[____4_____]        |
| Main Beats:  [____20____]        |
+----------------------------------+
|         [ ▶ Play ]               |
|    Beat: 5 / 20 (Main Phase)     |
+----------------------------------+
```

### 3. Create CSS: `Metronome.css`
- Style inputs consistently with existing App.css
- Style the play/stop button
- Add visual feedback for current beat (optional pulsing animation)

### 4. Integrate into App
**Option A: Add as new route `/metronome`**
- Add to Navigation component
- Add Route in App.tsx
- Keeps it separate from main exercise tracking

**Option B: Add to Home page**
- Add as collapsible section below exercise input
- More convenient for use during exercises

**Recommendation:** Option A (new route) - cleaner separation, consistent with existing Heatmap pattern

### 5. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/client/src/Metronome.tsx` | Create | New metronome component |
| `src/client/src/Metronome.css` | Create | Styles for metronome |
| `src/client/src/App.tsx` | Edit | Add route and navigation link |

## Implementation Steps

1. **Create `Metronome.tsx`**
   - Set up component with BPM, beats, warmupBeats state
   - Implement Web Audio API click generation
   - Implement play/stop logic with accurate timing
   - Add visual beat counter feedback

2. **Create `Metronome.css`**
   - Style input fields
   - Style play/stop button
   - Add beat indicator styles

3. **Update `App.tsx`**
   - Import Metronome component
   - Add `/metronome` route
   - Add navigation link in Navigation component

## Code Snippet: Web Audio Click

```typescript
const playClick = (audioContext: AudioContext, frequency: number = 800) => {
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
};
```

## Additional Considerations

- **Mobile Support:** Web Audio API works on mobile but may require user interaction to start AudioContext
- **Background Tab:** Browser may throttle timers in background tabs; consider warning user
- **Persistence:** Could save last-used settings to localStorage (optional enhancement)
- **Sound Options:** Could add different click sounds later (optional enhancement)
