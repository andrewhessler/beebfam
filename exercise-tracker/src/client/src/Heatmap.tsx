import { useEffect, useMemo, useState } from 'react';
import type { ExerciseTemplate } from './App';
import type { Item } from './App';
import './Heatmap.css';

// Generate how ever many days worth of dates grouped into weeks
const DAYS = 180;
const generateWeeks = () => {
  const days: Date[] = [];
  const today = new Date();
  for (let i = DAYS; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < DAYS; i += 7) {
    weeks.push(days.slice(i, i + 7).reverse());
  }
  return weeks.reverse();
};

const WEEKS = generateWeeks();

function Heatmap() {
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([]);
  const [currentExercise, setCurrentExercise] = useState<string>("");
  const [exerciseHistory, setExerciseHistory] = useState<Item[]>([]);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

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

  useEffect(() => {
    if (!currentExercise) return;

    async function getHistory() {
      const response = await fetch(`/get-history-by-exercise-name?name=${encodeURIComponent(currentExercise)}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { items }: { items: Item[] } = await response.json();
      setExerciseHistory(items);
    }
    getHistory();
  }, [currentExercise]);

  const exerciseDates = useMemo(() => {
    const dates = new Set<string>();
    exerciseHistory.forEach((item) => {
      const timestamp = item.date;
      const date = new Date(timestamp * 1000);
      const dateKey = date.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
      dates.add(dateKey);
    });
    return dates;
  }, [exerciseHistory]);

  const { daysCompleted, totalDays, oldestDate } = useMemo(() => {
    if (exerciseHistory.length === 0) {
      return { daysCompleted: 0, totalDays: 0, oldestDate: null };
    }

    // Find the oldest exercise date
    const oldestTimestamp = Math.min(...exerciseHistory.map(item => item.date));
    const oldestDate = new Date(oldestTimestamp * 1000);

    // Calculate days since oldest exercise
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - oldestDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const daysCompleted = exerciseDates.size;

    return { daysCompleted, totalDays, oldestDate };
  }, [exerciseHistory, exerciseDates]);

  return (
    <div className="heatmap-container">
      <select value={currentExercise} onChange={(event) => setCurrentExercise(event.target.value)}>
        {exerciseTemplates.map((template) => (
          <option key={template.name} value={template.name}>
            {template.name}
          </option>
        ))}
      </select>
      <div className="heatmap-stats">
        {daysCompleted} out of {totalDays} days since {oldestDate?.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })}
      </div>
      <div className="heatmap-grid">
        {hoveredDate && (
          <div className="heatmap-tooltip">
            {hoveredDate}
          </div>
        )}
        {WEEKS.map((week, weekIndex) => (
          <div key={weekIndex} className="heatmap-week">
            {week.map((day, dayIndex) => {
              const dateKey = day.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
              const hasExercise = exerciseDates.has(dateKey);
              return (
                <div
                  key={dayIndex}
                  className={`heatmap-day ${hasExercise ? 'has-exercise' : 'no-exercise'}`}
                  onMouseEnter={() => setHoveredDate(dateKey)}
                  onMouseLeave={() => setHoveredDate(null)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Heatmap;
