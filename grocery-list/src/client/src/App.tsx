import { useCallback, useEffect, useState } from 'react'
import './App.css'

type Item = {
  name: string,
  active: boolean,
}

function App() {
  const [items, setItems] = useState<Item[]>([{ name: 'something', active: true }, { name: 'something else', active: false }]);
  const [newItem, setNewItem] = useState<string>("");

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
      const response = await fetch(`/toggle-item`, {
        method: "POST",
        body: JSON.stringify({
          name: newItem
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
      setNewItem("");
    }
  }, [newItem])

  const toggleItem = useCallback(async (item: Item) => {
    const response = await fetch(`/toggle-item`, {
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

  return (
    <div id="items">
      <input type="text" value={newItem} onKeyDown={addItem} onChange={(event) => setNewItem(event.target.value)} />
      {items.filter((item) => item.active).map((item) =>
        <button className="item" onClick={() => toggleItem(item)}>
          <div className="item-card">
            <div className="item-name">{item.name}</div>
            <button className="delete-item" onClick={() => deleteItem(item)}>🗑️</button>
          </div>
        </button>
      )}
      <h2>Inactive Items</h2>
      {items.filter((item) => !item.active).sort((a, b) => a.name.localeCompare(b.name)).map((item) =>
        <button className="item" onClick={() => toggleItem(item)}>
          <div className="item-card">
            <div className="item-name">{item.name}</div>
            <button className="delete-item" onClick={() => deleteItem(item)}>🗑️</button>
          </div>
        </button>
      )}
    </div>
  )
}

export default App
