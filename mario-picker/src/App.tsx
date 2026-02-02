import { useCallback, useState } from 'react';
import './App.css';
import { RoundDisplay } from './RoundDisplay';

type Track = {
  name: string;
  image: string;
}

const ALL_OPTIONS: Track[] = [
  { name: "acorn heights", image: "acorn_heights.jpg" },
  { name: "airship fortress", image: "airship_fortress.jpg" },
  { name: "boo cinema", image: "boo_cinema.png" },
  { name: "bowser's castle", image: "bowsers_castle.png" },
  { name: "cheep cheep falls", image: "cheep_cheep_falls.png" },
  { name: "choco mountain", image: "choco_mountain.jpg" },
  { name: "crown city", image: "crown_city.png" },
  { name: "dandelion depths", image: "dandelion_depths.png" },
  { name: "desert hills", image: "desert_hills.jpg" },
  { name: "dino dino jungle", image: "dino_dino_jungle.png" },
  { name: "dk pass", image: "dk_pass.png" },
  { name: "dk spaceport", image: "dk_spaceport.png" },
  { name: "dry bones burnout", image: "dry_bones_burnout.png" },
  { name: "faraway oasis", image: "faraway_oasis.png" },
  { name: "great ? block ruins", image: "great_block_ruins.png" },
  { name: "koopa troopa beach", image: "koopa_troopa_beach.png" },
  { name: "mario bros' circuit", image: "mario_bros_circuit.png" },
  { name: "mario circuit", image: "mario_circuit.jpg" },
  { name: "moo moo meadows", image: "moo_moo_meadows.jpg" },
  { name: "peach beach", image: "peach_beach.jpg" },
  { name: "peach stadium", image: "peach_stadium.jpg" },
  { name: "rainbow road", image: "rainbow_road.avif" },
  { name: "salty salty speedway", image: "salty_salty_speedway.png" },
  { name: "shy guy bazaar", image: "shy_guy_bazaar.png" },
  { name: "sky-high sundae", image: "sky_high_sundae.png" },
  { name: "starview peak", image: "starview_peak.png" },
  { name: "toad's factory", image: "toads_factory.png" },
  { name: "wario shipyard", image: "wario_shipyard.png" },
  { name: "wario stadium", image: "wario_stadium.jpg" },
  { name: "whistlestop summit", image: "whistlestop_summit.jpg" }
];


const calcResults = () => ALL_OPTIONS[Math.floor(Math.random() * ALL_OPTIONS.length)];
const DEFAULT_ROUND_NUM = 4;


function App() {
  const [roundResults, setRoundResults] = useState<Track[]>(Array.from({ length: DEFAULT_ROUND_NUM }, calcResults));

  const randomizeResults = useCallback(() => {
    const payload = Array.from({ length: DEFAULT_ROUND_NUM }, calcResults);
    setRoundResults(payload);
  }, []);

  return (
    <>
      <a id="hub-link" href="https://beebfam.org">Back to Hub</a>
      <div className='rounds'>
        {roundResults?.map((result, index) =>
          <div className='round-card' key={"round " + index}>
            <div className='round-result'>
              {result.name}
            </div>
            <RoundDisplay seed={Math.random()} imageSrc={'/assets/' + result.image} />
          </div>
        )}
      </div >
      <button onClick={randomizeResults}>Randomize Tracks</button>
    </>
  )
}

export default App
