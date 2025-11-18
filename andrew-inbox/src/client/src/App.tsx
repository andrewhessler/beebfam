import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

type Item = {
  id: string,
  name: string,
  created_at: number,
}

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState<string>("");
  const inputRef = useRef(null);

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
      setNewItem("");
    }
  }, [newItem])

  useEffect(() => {
    if (inputRef.current) {
      (inputRef.current as HTMLInputElement).focus()
    }
  })
  return (
    <>
      <a id="hub-link" href="https://beebfam.org">Back to Hub</a>
      <div id="items">
        <input ref={inputRef} type="text" value={newItem} onKeyDown={addItem} onChange={(event) => setNewItem(event.target.value)} />
        {items.sort((a, b) => b.created_at - a.created_at).map((item) =>
          <button className="item" onClick={() => deleteItem(item)}>
            <div className="item-card">
              <div className="item-name">{(new Date(item.created_at * 1000)).toLocaleDateString("en-CA")} - {item.name}</div>
            </div>
          </button>
        )}
      </div>
    </>
  )
}

export default App
