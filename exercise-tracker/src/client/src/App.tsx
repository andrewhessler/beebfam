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
  time: string,
}

export type ExerciseType = "anaerobic" | "aerobic";

export type Exercise = {
  name: string,
  type: ExerciseType,
  duration_min?: number | string,
  distance?: number | string,
  weight?: number | string,
  sets?: number | string,
  reps?: number | string,
}

export type ExerciseTemplate = {
  name: string,
  type: ExerciseType,
  category: string,
  duration_min?: number | string,
  distance?: number | string,
  weight?: number | string,
  sets?: number | string,
  reps?: number | string,
}


function App() {
  const [exerciseTemplates, setExerciseTemplates] = useState<Record<string, ExerciseTemplate>>({});
  const [exercise, setExercise] = useState<Exercise>({ name: "biking", type: 'aerobic' });
  const [exerciseCategory, setExerciseCategory] = useState<string>("misc");
  const [exerciseCategories, setExerciseCategories] = useState<string[]>(["misc"]);
  const [exerciseHistory, setExerciseHistory] = useState<Item[]>([]);

  const dateGroupedHistory = useCallback(() => {
    const dateGroups: Record<string, Item[]> = {};

    exerciseHistory.forEach((item) => {
      const date = new Date(item.date * 1000);
      const dateKey = date.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
      const time = date.toLocaleTimeString('en-CA', { timeZone: 'America/Chicago' });
      item.time = time;

      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(item);
    });

    // Sort exercises by name
    Object.keys(dateGroups).forEach((dateKey) => {
      dateGroups[dateKey].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Sort dates
    const sortedKeys = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));

    return { dateGroups, sortedKeys };
  }, [exerciseHistory]);

  useEffect(() => {
    async function getTemplates() {
      const response = await fetch("/get-templates");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { templates }: { templates: ExerciseTemplate[] } = await response.json();
      const map: Record<string, ExerciseTemplate> = {};
      const categorySet: Set<string> = new Set();
      for (const template of templates) {
        categorySet.add(template.category);
        map[template.name] = { ...template, type: template.type.toLowerCase() as ExerciseType };
      }
      setExerciseCategories([...categorySet]);
      setExerciseTemplates(map);
      setExercise(map["biking"]);
    }
    async function getItems() {
      const response = await fetch("/get-items");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { items } = await response.json();
      setExerciseHistory(items);
    }
    getTemplates();
    getItems();
  }, [])

  const addItem = useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const response = await fetch(`/add-item`, {
        method: "POST",
        body: JSON.stringify({
          name: exercise.name,
          type: exercise.type,
          duration_min: exercise.duration_min ? parseFloat(exercise.duration_min as string) : undefined,
          distance: exercise.distance ? parseFloat(exercise.distance as string) : undefined,
          weight: exercise.weight ? parseFloat(exercise.weight as string) : undefined,
          sets: exercise.sets ? parseInt(exercise.sets as string) : undefined,
          reps: exercise.reps ? parseInt(exercise.reps as string) : undefined,
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

  // update exercise defaults when switching category
  useEffect(() => {
    const firstExercise = Object.values(exerciseTemplates).find((item) => item.category === exerciseCategory)!;
    if (exerciseCategory && firstExercise) {
      setExercise(firstExercise);

    }
  }, [exerciseCategory])

  return (
    <>
      <a id="hub-link" href="https://beebfam.org">Back to Hub</a>
      <div id="content">
        <div id="input">
          <select id="input-select" onChange={(event) => setExerciseCategory(event.target.value)}>
            {exerciseCategories.map((ex) =>
              <option key={ex} value={ex}>{ex}</option>
            )}
          </select>
          <select id="input-select" onChange={(event) => setExercise(exerciseTemplates[event.target.value])}>
            {Object.values(exerciseTemplates).filter((ex) => ex.category === exerciseCategory).map((ex) =>
              <option key={ex.name} value={ex.name}>{ex.name}</option>
            )}
          </select>
          {exercise.type === "aerobic" ?
            (<>
              <div>
                Duration: <input type="text" onKeyDown={addItem}
                  onChange={(event) => setExercise({ ...exercise, duration_min: event.target.value })}
                  value={exercise.duration_min || ''}></input>
              </div>
              <div>
                Distance: <input type="text" onKeyDown={addItem}
                  onChange={(event) => setExercise({ ...exercise, distance: event.target.value })}
                  value={exercise.distance || ''}></input>
              </div>
            </>)
            :
            (<>
              <div>
                Weight: <input type="text" onKeyDown={addItem}
                  onChange={(event) => setExercise({ ...exercise, weight: event.target.value })}
                  value={exercise.weight || ''}></input>
              </div>
              <div>
                Sets: <input type="text" onKeyDown={addItem}
                  onChange={(event) => setExercise({ ...exercise, sets: event.target.value })}
                  value={exercise.sets || ''}></input>
              </div>
              <div>
                Reps: <input type="text" onKeyDown={addItem}
                  onChange={(event) => setExercise({ ...exercise, reps: event.target.value })}
                  value={exercise.reps || ''}></input>
              </div>
            </>)
          }
        </div>
        <div id="exercise-history">
          {(() => {
            const { dateGroups, sortedKeys } = dateGroupedHistory();
            return sortedKeys.map((dateKey) => (
              <div className="date-group">
                <h3 className="date-header">{dateKey}</h3>
                {dateGroups[dateKey].map((item) => (
                  item.weight ?
                    <div className="exercise-item">
                      {item.name} {item.weight + "x" + item.sets + "x" + item.reps}
                    </div>
                    :
                    <div className="exercise-item">
                      {item.name} {item.distance ? `dist: ${item.distance}` : ''} {item.duration_min ? `dur: ${item.duration_min}` : ''} - {item.time}
                    </div>
                ))}
              </div>
            ));
          })()}
        </div>
      </div>
    </>
  )
}

export default App
