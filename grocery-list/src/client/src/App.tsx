import { useCallback, useEffect, useState } from 'react';
import './App.css';

type Item = {
  name: string,
  active: boolean,
  category: string,
  qty: string,
}

const CATEGORIES = [
  "produce",
  "deli",
  "bakery",
  "meat counter",
  "dry goods",
  "dairy",
  "frozen",
  "household",
  "health & beauty",
  "pet",
  "amazon",
  "sewing",
  "misc"
];

function App() {
  const [items, setItems] = useState<Item[]>([{ name: 'something', category: "", active: true, qty: "70 lbs" }
    , { name: 'something else', category: "produce", qty: "2", active: false }]);
  const [newItem, setNewItem] = useState<string>("");
  const [qty, setQty] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [filter, setFilter] = useState<string>("all");


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

  const deleteItem = useCallback(async (item: Item, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
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
          name: newItem,
          qty,
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
      setNewItem("");
    }
  }, [newItem, qty, category])

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
      <div id="input">
        <input type="text" placeholder='name' onKeyDown={addItem} onChange={(event) => setNewItem(event.target.value)} />
        <input type="text" placeholder='qty' onKeyDown={addItem} onChange={(event) => setQty(event.target.value)} />
        <select onChange={(event) => setCategory(event.target.value)}>
          {CATEGORIES.map((cat) =>
            <option value={cat}>{cat}</option>
          )}
        </select>
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
      {CATEGORIES.filter((cat) => cat === filter || filter === "all").map((cat) => (
        <div className="category">
          <h3 className="category-header">{cat?.length ? cat : "misc"}</h3>
          {items.filter((item) => item.active && item.category === cat).map((item) => (
            <button className="item" onClick={() => toggleItem(item)}>
              <div className="item-card">
                <div className="item-name">{item.name}</div>
                <div className='item-qty'>{item.qty}</div>
                <button className="delete-item" onClick={(event) => deleteItem(item, event)}>X</button>
              </div>
            </button>
          ))}
        </div>)
      )}
      <h2>Inactive Items</h2>
      {CATEGORIES.filter((cat) => cat === filter || filter === "all").map((cat) => (
        <div>
          <h3>{cat?.length ? cat : "misc"}</h3>
          {items.filter((item) => !item.active && item.category === cat).map((item) => (
            <button className="item" onClick={() => toggleItem(item)}>
              <div className="item-card">
                <div className="item-name">{item.name}</div>
                <div className='item-qty'>{item.qty}</div>
                <button className="delete-item" onClick={(event) => deleteItem(item, event)}>X</button>
              </div>
            </button>
          ))}
        </div>)
      )}
    </div>
  )
}

export default App
