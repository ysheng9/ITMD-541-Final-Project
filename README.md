# Mini Store — Starter Files

This is your starting point for the capstone project. **Run it right now,
before changing anything** — you should already see real products loading
from a live API, with filtering and sorting that both work. Your job is to
make the shopping cart and checkout actually function on top of that.

Seeing something real and working on screen immediately is the point —
you are not starting from a blank page.

---

## If the Live API Is Ever Down

This project uses a free, third-party service with no published uptime guarantee. A file called `products-fallback.json` is included in this folder, with the same shape as the real API's response (8 products across 3 categories, wrapped in a `products` property).

If the live API stops responding while you're working, change one line inside `loadProducts()`:

```js
// Normal — the live API
const response = await fetch("https://dummyjson.com/products");
```

```js
// Temporary fallback — while the live API is down
const response = await fetch("products-fallback.json");
```

Nothing else needs to change — `fetch()` works identically against a local file served by your dev server as it does against a live URL, and the fallback file is already wrapped in a `products` property the same way the real API's response is. Finish your work, then switch the line back to the live API URL before your final submission.

## Running It

This is plain HTML/CSS/JS — nothing to install.

**Don't just double-click `index.html`.** Some browsers block the `fetch()`
call when a page is opened directly from disk (`file://...`). Serve it
locally instead, using any one of these:

```
npx serve .
```
*(uses Node, already installed since Lab 1 — nothing new to install)*

```
python3 -m http.server 8000
```

Or open the folder in VS Code and click **Go Live** (Live Server extension).

Then open the address it prints (e.g. `http://localhost:3000`) in your
browser. **You need an internet connection** — this page fetches real data
every time it loads.

---

## What You're Building

Open `script.js` and search for the word `TODO`. There are six:

1. `cart.addItem(product)` — add a product, or bump its quantity if it's already in the cart
2. `cart.decreaseItem(id)` — lower a quantity by one, removing the item at zero
3. `cart.removeItem(id)` — remove an item completely
4. `cart.getTotal()` — calculate the cart's grand total
5. `cart.getItemCount()` — calculate the total number of items across the whole cart
6. The checkout form's submit handler — validate the form and the cart, then confirm the order

Everything else — fetching real data, rendering the product grid, the
category filter, the price sort, and all the button wiring — is done and
commented for you to read. You shouldn't need to change any of it.

---

## The Array Sitting Behind Your Cart

Before writing any code, understand the shape you're working with. Your
cart doesn't need a "total" variable and a separate "count" variable and a
separate list of names — **one array of small objects holds everything**:

```js
cart.items = [
  { id: 1, name: "Backpack", price: 109.95, quantity: 2 },
  { id: 7, name: "Sunglasses", price: 15.99, quantity: 1 },
];
```

Everything else is derived from this one array:
- The cart panel's list — one row per entry
- The grand total — price times quantity, added up across every entry
- The item count badge in the header — every quantity, added up

This is exactly why `getTotal()` and `getItemCount()` are their own separate
functions instead of variables you update by hand in five different places.
Whenever the array changes, calling them again always gives you the
correct, current number — there's nothing to accidentally forget to update.

---

## Understanding the Async Fetch (Already Written, Worth Reading Closely)

`loadProducts()` at the top of `script.js` is fully working. Here's the
flow, in order, the first time the page loads:

```js
async function loadProducts() {
  statusMessage.textContent = "Loading products…";   // 1. say something's happening

  try {
    const response = await fetch("https://dummyjson.com/products"); // 2. wait for the server
    if (!response.ok) throw new Error(`Request failed: ${response.status}`); // 3. check it worked
    const data = await response.json();               // 4. parse the response body
    const raw = data.products;                        // 4b. unwrap the array (see note below)

    products = raw.map((item) => { /* ...reshape each item... */ });   // 5. transform it

    renderProducts(getVisibleProducts());              // 6. show it
  } catch (error) {
    statusMessage.textContent = "Couldn't load products…"; // 7. fail politely
  }
}
```

**Worth noticing at step 4b:** this particular API wraps its product array inside a `products` property, alongside some pagination info (`total`, `skip`, `limit`) — it doesn't hand back a bare array directly the way some APIs do. Always check the actual shape of a real response (open the URL in your browser first) rather than assuming.

The only line that actually "waits" is the `fetch()` call — everything
before it (setting the loading message) runs instantly, and everything
after it only runs once the real data has actually arrived. That's the
entire point of `await`: it pauses this one function, not the whole page.

**Try this to see the error path yourself:** open DevTools, go to the
Network tab, change "No throttling" to **Offline**, then reload the page.
You should see the friendly error message appear instead of a blank page.
Switch back to "No throttling" and reload again afterward.

---

## New Array Methods You'll Need (Beyond forEach)

Be honest with yourself here: **forEach() is the only array-looping method
covered in any lab so far.** The code in this starter — and the TODOs you're
about to write — uses several more that were never explicitly taught. This
is the one place this project genuinely asks you to learn something new,
not just apply something from an earlier lab. Take a few minutes with this
section before diving into the TODOs.

The good news: `forEach()` already taught you the hardest part — running
code once for every item in an array. Each of these is really just a
variation on that same idea, with a different job at the end.

**`.map()` — loop AND build a brand-new array out of the results.**
Unlike `forEach()`, which just runs code and returns nothing, `map()`
collects whatever each pass returns into a new array. This is exactly how
`loadProducts()` turns the raw API data into your own product shape:
```js
const doubled = [1, 2, 3].map((n) => n * 2);   // [2, 4, 6]
```

**`.filter()` — loop and keep only the items that pass a test.**
```js
const evens = [1, 2, 3, 4].filter((n) => n % 2 === 0);   // [2, 4]
```
This is how the category dropdown narrows the product grid, and how
`removeItem()` will remove one specific entry from the cart — "keep
everything except the one I don't want."

**`.find()` — loop and return the FIRST item that matches, or `undefined`
if nothing does.**
```js
const found = [{ id: 1 }, { id: 2 }].find((item) => item.id === 2); // { id: 2 }
```
This is exactly how you'll check "is this product already in the cart?"
in `addItem()`.

**`.reduce()` — combine an entire array into ONE single value.**
This is the least like `forEach()`, and the one worth the most practice.
```js
const sum = [10, 20, 30].reduce((total, n) => total + n, 0);   // 60
```
Read this as: "starting from 0, go through the array one number at a time,
adding each one to the running total." This is exactly the shape you need
for `getTotal()` and `getItemCount()`.

**Where to see each one already in action:** open `script.js` and look at
`loadProducts()` (`.map()`), `getVisibleProducts()` (`.filter()`), and
`populateCategoryFilter()` (the `[...new Set(...)]` pattern, which just
means "remove duplicates from this list"). Reading real, working examples
of each of these before you write your own is the fastest way to get
comfortable with them.

---

## Add & Remove Patterns (A Worked Example, Different From Your Cart)

Your cart's `addItem`/`decreaseItem`/`removeItem` are deliberately left for
you to write. Here's the exact same underlying pattern, applied to a
**different** example — a simple playlist — so you can see how it works
without it being something you can just copy into the cart directly.

```js
const playlist = { songs: [] }; // each entry: { title, playCount }

function addSong(title) {
  const existing = playlist.songs.find((s) => s.title === title);
  if (existing) {
    existing.playCount++;                 // already there — bump it
  } else {
    playlist.songs.push({ title, playCount: 1 }); // new — add it
  }
}

function removeSong(title) {
  playlist.songs = playlist.songs.filter((s) => s.title !== title);
}
```

Notice the shape of the problem:
- **Adding** is a two-way fork: "is it already here?" (`.find()`) decides
  whether you increment an existing entry or push a brand new one.
- **Removing** rebuilds the array with `.filter()`, keeping everything
  except the one thing you're removing.

Your `cart.addItem()` needs that exact same fork. Your `cart.removeItem()`
needs that exact same filter. `cart.decreaseItem()` is the trickiest one:
it's a decrement, followed by a check — if the quantity hits zero, THEN you
filter it out, the same way `removeSong` does.

---

## Do You Need localStorage?

**No — not for the base project.** The spec doesn't require the cart to
survive a page reload, and the starter code doesn't use localStorage
anywhere. It's completely normal and expected for the cart to reset to
empty every time the page reloads.

**If you want to go further:** since you already covered localStorage in
Lab 10, you could optionally save the cart after every change and load it
back on page start, the same read-on-load/write-on-change pattern from that
lab:

```js
// Optional — not required. Save after every cart change:
localStorage.setItem("cart", JSON.stringify(cart.items));

// Optional — load once when the page starts:
const saved = localStorage.getItem("cart");
if (saved) {
  cart.items = JSON.parse(saved);
  cart.render();
}
```

Treat this as a stretch idea, not a requirement — get the base cart working
first.

---

## A Realistic Pace Over a Couple of Weeks

You don't need to do this in one sitting. A reasonable way to break it up:

| Session | Focus |
|---|---|
| 1 | Read this README fully. Run the starter and confirm products load. Read through script.js top to bottom, matching the comments to what you see on screen. |
| 2 | Write addItem() and decreaseItem(). Test by clicking Add to Cart on a few different products and watching the cart panel. |
| 3 | Write removeItem(), getTotal(), and getItemCount(). Confirm the total and item count in the header are always correct. |
| 4 | Write the checkout handler (TODO 6). Test all three cases: empty cart, invalid form, and a real successful order. |
| 5 | Test edge cases, resize your browser to check mobile, and deploy. |

If you get stuck on any one TODO for more than about 20 to 30 minutes,
that's the moment to re-read the relevant earlier lab (see the "Where to
Look Back" table in the main capstone document) or ask for help — don't
grind silently.

---

## Common Bugs to Watch For

- **Clicking Add to Cart does nothing, with no error.** You almost
  certainly forgot to call `this.render()` at the end of addItem(). The
  data changed; the screen just doesn't know yet.
- **The total is NaN.** Check that you're multiplying price times
  quantity and starting your reduce at 0, not forgetting the second
  argument.
- **Quantity goes negative.** Make sure decreaseItem checks whether the
  new quantity is 0 or below and removes the item, rather than letting it
  go negative.
- **Adding the same product twice creates two rows.** This means find()
  isn't matching correctly — double check you're comparing i.id to
  product.id, not comparing the whole object.
