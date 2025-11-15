import { useCallback, useEffect, useState } from 'react';
import './App.css';

type Item = {
  name: string,
  duration_min?: number,
  distance?: number,
  weight?: number,
  sets?: number,
  reps?: number,
  date: number,
}

type ExerciseType = "anaerobic" | "aerobic";

type Exercise = {
  name: string,
  type: ExerciseType,
  duration_min?: number,
  distance?: number,
  weight?: number,
  sets?: number,
  reps?: number,
}

const EXERCISES: Record<string, Exercise> = {
  "biking": {
    name: "biking",
    type: "aerobic",
    duration_min: 25,
    distance: 9,
  },
  "hand grippers": {
    name: "hand grippers",
    type: "anaerobic",
    weight: 20,
    sets: 3,
    reps: 10,
  },
  "wrist curls": {
    name: "wrist curls",
    type: "anaerobic",
    weight: 10,
    sets: 3,
    reps: 10,
  }
};

function App() {
  const [exercise, setExercise] = useState<Exercise>(EXERCISES["biking"]);
  const [exerciseHistory, setExerciseHistory] = useState<Item[]>([]);


  useEffect(() => {
    async function getItems() {
      const response = await fetch("http://localhost:8085/get-items");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { items } = await response.json();
      setExerciseHistory(items);
    }
    getItems();
  }, [])

  const addItem = useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const response = await fetch(`http://localhost:8085/add-item`, {
        method: "POST",
        body: JSON.stringify({
          ...exercise
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { items } = await response.json();
      setExerciseHistory(items);
    }
  }, [exercise])

  return (
    <>
      <a id="hub-link" href="https://beebfam.org">Back to Hub</a>
      <div id="content">
        <div id="input">
          <select id="input-select" onChange={(event) => setExercise(EXERCISES[event.target.value])}>
            {Object.keys(EXERCISES).map((ex) =>
              <option key={ex} value={ex}>{ex}</option>
            )}
          </select>
          {exercise.type === "aerobic" ?
            (<>
              <div>
                Duration: <input type="text" onKeyDown={addItem}
                  onChange={(event) => setExercise({ ...exercise, duration_min: parseFloat(event.target.value) })}
                  value={exercise.duration_min || ''}></input>
              </div>
              <div>
                Distance: <input type="text" onKeyDown={addItem}
                  onChange={(event) => setExercise({ ...exercise, distance: parseFloat(event.target.value) })}
                  value={exercise.distance || ''}></input>
              </div>
            </>)
            :
            (<>
              <div>
                Weight: <input type="text" onKeyDown={addItem}
                  onChange={(event) => setExercise({ ...exercise, weight: parseFloat(event.target.value) })}
                  value={exercise.weight || ''}></input>
              </div>
              <div>
                Sets: <input type="text" onKeyDown={addItem}
                  onChange={(event) => setExercise({ ...exercise, sets: parseInt(event.target.value) })}
                  value={exercise.sets || ''}></input>
              </div>
              <div>
                Reps: <input type="text" onKeyDown={addItem}
                  onChange={(event) => setExercise({ ...exercise, reps: parseInt(event.target.value) })}
                  value={exercise.reps || ''}></input>
              </div>
            </>)
          }
        </div>
        <div id="exercise-history">
          {exerciseHistory.map((item) => (
            item.weight ?
              <div id="exercise-item">
                {item.name} {item.weight + "x" + item.sets + "x" + item.reps}
              </div>
              :
              <div id="exercise-item">
                {item.name} dist: {item.distance} dur: {item.duration_min}
              </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default App
