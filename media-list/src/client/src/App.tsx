import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

type Item = {
  name: string,
  category: string,
  created_at: number,
}

const CATEGORIES = [
  "books",
  "movies",
  "games",
  "shows",
];

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const newItemRef = useRef(null);
  const [newItem, setNewItem] = useState<string | null>();
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [filter, setFilter] = useState<string>("all");
  const [showAndrew, setShowAndrew] = useState<boolean>(false);
  const [flashSuccess, setFlashSuccess] = useState<boolean>(false);


  useEffect(() => {
    async function getItems() {
      const response = await fetch("/get-items");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { items } = await response.json();
      setItems(items);
    }
    getItems();
  }, [])

  const deleteItem = useCallback(async (item: Item) => {
    const response = await fetch(`/delete-item`, {
      method: "POST",
      body: JSON.stringify({
        name: item.name
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const { items } = await response.json();
    setItems(items);
  }, [])

  const addItem = useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const response = await fetch(`/add-item`, {
        method: "POST",
        body: JSON.stringify({
          name: newItem,
          category,
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { items } = await response.json();
      setItems(items);
      setNewItem(null);
      setFlashSuccess(true);
      setTimeout(() => setFlashSuccess(false), 500);
      if (newItemRef.current) {
        (newItemRef.current as HTMLInputElement).focus();
      }
    }
  }, [newItem, category])

  return (
    <>
      <a id="hub-link" href="https://beebfam.org">Back to Hub</a>
      <div id="content">
        <div id="input" className={flashSuccess ? 'flash-green' : ''}>
          <select id="input-select" onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((cat) =>
              <option value={cat}>{cat}</option>
            )}
          </select>
          <input type="text" ref={newItemRef} value={newItem ? newItem : ""} placeholder='name' onKeyDown={addItem} onChange={(event) => setNewItem(event.target.value)} />
        </div>
        <div id="andrew-filter">
          <label>Show Andrew: </label>
          <input type="checkbox" checked={showAndrew} onChange={(event) => setShowAndrew(event.currentTarget.checked)} />
        </div>
        <div id="filter">
          <label>filter: </label>
          <select onChange={(event) => setFilter(event.target.value)}>
            <option value="all">all</option>
            {CATEGORIES.map((cat) =>
              <option value={cat}>{cat}</option>
            )}
          </select>
        </div>
        {CATEGORIES.filter((cat) => cat === filter || filter === "all")
          .map((cat) => (
            <div className="category">
              <h3 className="category-header">{cat?.length ? cat : "misc"}</h3>
              {items.filter((item) => item.category === cat && (showAndrew || !item.name.toLowerCase().includes("(andrew)")))
                .sort((a, b) => a.created_at - b.created_at)
                .map((item) => (
                  <button className="item" onClick={() => deleteItem(item)}>
                    <div className="item-card">
                      <div className="item-name">{item.name}</div>
                    </div>
                  </button>
                ))}
            </div>)
          )}
      </div>
    </>
  )
}

export default App
