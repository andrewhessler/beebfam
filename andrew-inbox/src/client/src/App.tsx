import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

type Item = {
  id: string,
  name: string,
}

// ios workaround
// https://github.com/WebKit/WebKit/pull/2907#issuecomment-2204513113
function focusAndOpenKeyboard(el: HTMLInputElement, timeout: number) {
  if (!timeout) {
    timeout = 100;
  }
  if (el) {
    // Align temp input element approximately where the input element is
    // so the cursor doesn't jump around
    const __tempEl__ = document.createElement('input');
    __tempEl__.style.position = 'absolute';
    __tempEl__.style.top = (el.offsetTop + 7) + 'px';
    __tempEl__.style.left = el.offsetLeft + 'px';
    __tempEl__.style.height = "0";
    __tempEl__.style.opacity = "0";
    // Put this temp element as a child of the page <body> and focus on it
    document.body.appendChild(__tempEl__);
    __tempEl__.focus();

    // The keyboard is open. Now do a delayed focus on the target element
    setTimeout(function() {
      el.focus();
      el.click();
      // Remove the temp element
      document.body.removeChild(__tempEl__);
    }, timeout);
  }
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
      focusAndOpenKeyboard(inputRef.current, 100);
    }
  }, [])
  return (
    <div id="items">
      <input ref={inputRef} type="text" value={newItem} onKeyDown={addItem} onChange={(event) => setNewItem(event.target.value)} />
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
