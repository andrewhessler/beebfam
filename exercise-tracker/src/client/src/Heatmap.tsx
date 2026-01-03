import { useEffect, useState } from 'react';

type ExerciseType = "anaerobic" | "aerobic";

type ExerciseTemplate = {
  name: string,
  type: ExerciseType,
  category: string,
  duration_min?: number | string,
  distance?: number | string,
  weight?: number | string,
  sets?: number | string,
  reps?: number | string,
}

function Heatmap() {
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [currentExercise, setCurrentExercise] = useState<string>("");

  useEffect(() => {
    async function getTemplates() {
      const response = await fetch("/get-templates");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { templates }: { templates: ExerciseTemplate[] } = await response.json();
      setExerciseTemplates(templates);
      if (templates.length > 0) {
        setCurrentExercise(templates[0].name);
      }
    }
    getTemplates();
  }, []);

  return (
    <div>
      <select value={currentExercise} onChange={(event) => setCurrentExercise(event.target.value)}>
        {exerciseTemplates.map((template) => (
          <option key={template.name} value={template.name}>
            {template.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Heatmap;
