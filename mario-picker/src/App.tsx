import { useCallback, useState } from 'react';
import './App.css'

const ROUND_1_OPTIONS = ["mario bros' circuit", "crown city", "desert hills", "koopa troopa beach", "moo moo meadows", "dk spaceport", "whistlestop summit"];
const ROUND_2_OPTIONS = ["wario stadium", "shy guy bazaar", "sky-high sundae", "dino dino jungle", "starview peak", "dandelion depths", "boo cinema", "peach beach"];
const ROUND_3_OPTIONS = ["peach stadium", "airship fortress", "cheep cheep falls", "dry bones burnout", "acorn heights", "faraway oasis", "great ? block ruins", "toad's factory"];
const ROUND_4_OPTIONS = ["salty salty speedway", "bowser's castle", "choco mountain", "mario circuit", "wario shipyard", "rainbow road", "dk pass"];
const ALL_OPTIONS = [...ROUND_1_OPTIONS, ...ROUND_2_OPTIONS, ...ROUND_3_OPTIONS, ...ROUND_4_OPTIONS];
const ROUND_OPTIONS = [ROUND_1_OPTIONS, ROUND_2_OPTIONS, ROUND_3_OPTIONS, ROUND_4_OPTIONS];
const ROUND_ALL_OPTIONS = [ALL_OPTIONS, ALL_OPTIONS, ALL_OPTIONS, ALL_OPTIONS];


const calcResults = () => ROUND_OPTIONS.map((options) =>
  options[Math.floor(Math.random() * options.length)]
)

const calcAllResults = () => {
  return ROUND_ALL_OPTIONS.map((options) => {
    const choice = Math.floor(Math.random() * options.length);
    return options[choice];
  });
}


function App() {
  const [roundResults, setRoundResults] = useState<string[]>(calcResults);

  const randomizeResults = useCallback(() => {
    setRoundResults(calcResults());
  }, []);

  const randomizeAllResults = useCallback(() => {
    setRoundResults(calcAllResults());
  }, []);

  return (
    <>
      <div className='rounds'>
        {roundResults.map((result, index) =>
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
      <button onClick={randomizeAllResults}>Randomize All Tracks</button>
    </>
  )
}

export default App
