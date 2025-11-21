import { useCallback, useState } from 'react';
import './App.css';

const ALL_OPTIONS = [
  "mario bros' circuit", "crown city", "desert hills", "koopa troopa beach", "moo moo meadows", "dk spaceport", "whistlestop summit",
  "wario stadium", "shy guy bazaar", "sky-high sundae", "dino dino jungle", "starview peak", "dandelion depths", "boo cinema", "peach beach",
  "peach stadium", "airship fortress", "cheep cheep falls", "dry bones burnout", "acorn heights", "faraway oasis", "great ? block ruins", "toad's factory",
  "salty salty speedway", "bowser's castle", "choco mountain", "mario circuit", "wario shipyard", "rainbow road", "dk pass"
];


const calcResults = () => ALL_OPTIONS[Math.floor(Math.random() * ALL_OPTIONS.length)];


function App() {
  const [numOfRounds, setNumOfRounds] = useState<number>(4);
  const [roundResults, setRoundResults] = useState<string[]>(Array.from({ length: 4 }, calcResults));

  const randomizeResults = useCallback(() => {
    const payload = Array.from({ length: numOfRounds }, calcResults);
    setRoundResults(payload);
  }, [numOfRounds]);

  return (
    <>
      <a id="hub-link" href="https://beebfam.org">Back to Hub</a>
      <div className='rounds'>
        Rounds: <select onChange={(value) => setNumOfRounds(parseInt(value.currentTarget.value))} value={4}>
          {[3, 4, 5, 6, 8, 12, 16, 32].map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        {roundResults?.map((result, index) =>
          <div className='round-card' key={"round " + index}>
            <div className='round-name'>
              Round {index + 1}
            </div>
            <div className='round-result'>
              {result}
            </div>
          </div>
        )}
      </div >
      <button onClick={randomizeResults}>Randomize Tracks</button>
    </>
  )
}

export default App
