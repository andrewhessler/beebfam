import { useEffect, useState } from 'react';
import './App.css';

interface Habit {
  id: number;
  name: string;
  date: string;
  updated_at: number;
}

interface HabitsResponse {
  habits: Habit[];
}

interface HabitTemplate {
  name: string;
  max_occurrences: number | null;
}

interface TemplatesResponse {
  templates: HabitTemplate[];
}

const DAYS = 7;
function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitTemplates, setHabitTemplates] = useState<HabitTemplate[]>([]);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await fetch('/get-habits');
        const data: HabitsResponse = await response.json();
        setHabits(data.habits);
      } catch (error) {
        console.error('Error fetching habits:', error);
      }
    };

    const fetchTemplates = async () => {
      try {
        const response = await fetch('/get-templates');
        const data: TemplatesResponse = await response.json();
        setHabitTemplates(data.templates);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchHabits();
    fetchTemplates();
  }, []);

  const handleAddHabit = async (name: string, date: string) => {
    try {
      const response = await fetch('/add-habit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, date }),
      });

      if (response.ok) {
        const data: HabitsResponse = await response.json();
        setHabits(data.habits);
      }
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const handleUndo = async () => {
    try {
      const response = await fetch('/undo-last', {
        method: 'POST',
      });

      if (response.ok) {
        const data: HabitsResponse = await response.json();
        setHabits(data.habits);
      }
    } catch (error) {
      console.error('Error undoing:', error);
    }
  };

  // Generate dates array (today at top, going back)
  const dates = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  // Count how many times a habit has been completed on a given date
  const getHabitCount = (name: string, date: string): number => {
    return habits.filter(h => h.name === name && h.date === date).length;
  };

  // Get the max occurrences for a habit template
  const getMaxOccurrences = (name: string): number => {
    const template = habitTemplates.find(t => t.name === name);
    return template?.max_occurrences ?? 1;
  };

  // Calculate completion percentage (0 to 1)
  const getCompletionPercentage = (name: string, date: string): number => {
    const count = getHabitCount(name, date);
    const max = getMaxOccurrences(name);
    return Math.min(count / max, 1);
  };

  // Get background color based on completion percentage
  const getCellColor = (name: string, date: string): string => {
    const percentage = getCompletionPercentage(name, date);
    if (percentage === 0) {
      return '#151b23'; // no-habit color
    }

    const fullColor = [64, 196, 99];
    const baseColor = [21, 27, 35];

    const r = Math.round(baseColor[0] + (fullColor[0] - baseColor[0]) * percentage);
    const g = Math.round(baseColor[1] + (fullColor[1] - baseColor[1]) * percentage);
    const b = Math.round(baseColor[2] + (fullColor[2] - baseColor[2]) * percentage);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Handle cell click - add habit if not at max occurrences
  const handleCellClick = (name: string, date: string) => {
    const count = getHabitCount(name, date);
    const max = getMaxOccurrences(name);

    if (count < max) {
      handleAddHabit(name, date);
    }
  };

  return (
    <>
      <a id="hub-link" href="https://beebfam.org">Back to Hub</a>
      <div className="heatmap-container">
        <div className="heatmap-controls">
          <button onClick={handleUndo}>
            Undo Last
          </button>
        </div>

        <div className="heatmap-table-wrapper">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th>Date</th>
                {habitTemplates.map(template => (
                  <th key={template.name}>
                    {template.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map(date => (
                <tr key={date}>
                  <td>{date}</td>
                  {habitTemplates.map(template => {
                    const count = getHabitCount(template.name, date);
                    const max = getMaxOccurrences(template.name);

                    return (
                      <td key={`${date}-${template.name}`}>
                        <div
                          onClick={() => handleCellClick(template.name, date)}
                          className="heatmap-cell"
                          style={{ backgroundColor: getCellColor(template.name, date) }}
                          title={`${template.name} - ${date} (${count}/${max})`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default App
