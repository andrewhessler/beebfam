import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

type Item = {
  name: string,
  active: boolean,
  category: string,
  qty: string,
  store: string,
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

const STORES = [
  "hyvee",
  "target",
  "ulta",
  "amazon",
  "wawak",
  "other"
];

const CATEGORY_STORE_COMBOS: { store: string, category: string }[] = [];

for (const store of STORES) {
  for (const category of CATEGORIES) {
    CATEGORY_STORE_COMBOS.push({
      store,
      category,
    })
  }
}

function App() {
  const [items, setItems] = useState<Item[]>([]);

  // For some reason when we add new items to the datalist it opens, so this is in separate state and not updated after first fetch
  const [itemsForSelect, setItemsForSelect] = useState<Item[]>([]);

  const newItemRef = useRef(null);
  const [newItem, setNewItem] = useState<string | null>();
  const [qty, setQty] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [store, setStore] = useState<string>(STORES[0]);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");


  useEffect(() => {
    async function getItems() {
      const response = await fetch("/get-items");
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { items } = await response.json();
      setItems(items);
      setItemsForSelect(items);
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
      event.preventDefault();
      const matchedCategory = items.find((item) => item.name == newItem)?.category;
      const matchedStore = items.find((item) => item.store == newItem)?.store;
      const response = await fetch(`/add-item`, {
        method: "POST",
        body: JSON.stringify({
          name: newItem,
          qty,
          category: matchedCategory || category,
          store: matchedStore || store,
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { items: fetchedItems } = await response.json();
      setItems(fetchedItems);
      setNewItem("");
      setQty(null);
    }
  }, [newItem, qty, category, store, items])

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
    <>
      <a id="hub-link" href="https://beebfam.org">Back to Hub</a>
      <div id="content">
        <div id="input">
          <select id="input-select" onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((cat) =>
              <option value={cat}>{cat}</option>
            )}
          </select>
          <select id="input-select" onChange={(event) => setStore(event.target.value)}>
            {STORES.map((store) =>
              <option value={store}>{store}</option>
            )}
          </select>
          <input type="text" list="existing-names" ref={newItemRef} value={newItem ? newItem : ""} placeholder='name' onKeyDown={addItem} onChange={(event) => setNewItem(event.target.value)} />
          <datalist id="existing-names">
            {
              itemsForSelect?.map((item) =>
                <option value={item.name}></option>
              )
            }
          </datalist>
          <input type="text" value={qty ? qty : ""} placeholder='qty' onKeyDown={addItem} onChange={(event) => setQty(event.target.value)} />
        </div>
        <div id="filter">
          <label>filter category: </label>
          <select onChange={(event) => setCatFilter(event.target.value)}>
            <option value="all">all</option>
            {CATEGORIES.map((cat) =>
              <option value={cat}>{cat}</option>
            )}
          </select>

          <label>filter store: </label>
          <select onChange={(event) => setStoreFilter(event.target.value)}>
            <option value="all">all</option>
            {STORES.map((store) =>
              <option value={store}>{store}</option>
            )}
          </select>
        </div>
        {CATEGORY_STORE_COMBOS.filter((combo) => ((combo.category === catFilter || catFilter === "all") || (combo.store === storeFilter || storeFilter === "all"))
          && items.some((item) => item.category === combo.category && item.store === combo.store && item.active)).map((combo) => (
            <div className="category">
              <h3 className="category-header">{combo?.category?.length ? combo.category : "misc"} - {combo.store}</h3>
              {items?.filter((item) => item.active && item.category === combo.category && item.store === combo.store)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => (
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
        {CATEGORY_STORE_COMBOS.filter((combo) => combo.category === catFilter || catFilter === "all").map((combo) => (
          <div className="category">
            <h3>{combo?.category.length ? combo.category : "misc"} - {combo.store}</h3>
            {items?.filter((item) => !item.active && item.category === combo.category && item.store === combo.store)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((item) => (
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
    </>
  )
}

export default App
