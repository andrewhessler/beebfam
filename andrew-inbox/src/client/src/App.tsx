import { useCallback, useEffect, useState } from 'react'
import './App.css'

type Item = {
  id: string,
  name: string,
}

function App() {
  const [items, setItems] = useState<Item[]>([{ id: 'somethin', name: 'cool' }, { id: 'somethin2', name: 'cool' }]);
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
    const response = await fetch(`/${item.id}/delete-item`, {
      method: "POST",
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
    }
  }, [newItem])

  return (
    <div id="items">
      <input type="text" value={newItem} onKeyDown={addItem} onChange={(event) => setNewItem(event.target.value)} />
      {items.map((item) =>
        <button className="item" onClick={() => deleteItem(item)}>
          <div className="item-card">
            <div className="item-name">{item.name}</div>
          </div>
        </button>
      )}
    </div>
  )
}

export default App
