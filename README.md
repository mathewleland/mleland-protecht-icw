# Protecht-icw coding challenge

A lightweight, embeddable "In-Checkout Widget" (ICW) that fetches an insurance quote from the Protecht API and renders it in isolation. Built with vanilla TypeScript and Web Components to minimize bundle size and avoid CSS conflicts.

---

## Project Overview

- **Purpose**: Provide a drop-in widget merchants can embed on their checkout page to display price, perils, links, and underwriter information.
- **Key Features**:
  - **One-time fetch → render**: Calls `/api/internal/widgets/icw/configure/v4` and displays the response.
  - **Shadow DOM isolation**: Ensures no CSS leakage between the host page and the widget.
  - **TypeScript-driven**: Type safety for request/response shapes, fewer runtime bugs.
  - **Zero framework dependency**: Vanilla Web Components (no React/Vue/Solid) for minimal bundle size (~5 KB gzipped).
  - **Easy embedding**: Single script import + a function call to mount the widget.

---


## Setup & Build

1. **Clone the repository**

   ```bash
   git clone https://github.com/mathewleland/mleland-protecht-icw.git
   cd mleland-protecht-icw
   ```

2. **Install dependencies and build**

   ```bash
   npm install
   npm run build
   ```

   This runs Rollup and outputs:
   - `dist/icw.esm.js` (ES module build, unminified)
   - `dist/icw.umd.min.js` (UMD build, minified)

---

## Usage

1. **Include the widget script** (choose whichever format you prefer):

   ```html
   <!-- UMD (minified) -->
   <script src="dist/icw.umd.min.js"></script>

   <!-- or ESM (for modern browsers / bundlers) -->
   <script type="module" src="dist/icw.esm.js"></script>
   ```

2. **Add a container element** somewhere on your page:

   ```html
   <div id="icw-container"></div>
   ```

3. **Initialize the widget** after the DOM is ready:

   ```html
   <script>
     document.addEventListener('DOMContentLoaded', () => {
       // Replace with your actual sandbox or production API key
       const API_KEY = 'YOUR_API_KEY';

       ProtechtICW.createICWWidget({
         containerId: 'icw-container',
         apiKey: API_KEY,
         currency: 'USD',
         items: [
           { unit_cost: '100.00', quantity: 1 }
         ],
         locale: 'en_US'
       });
     });
   </script>
   ```

4. **What happens next**:
   - The widget displays a "Loading…" message.
   - It sends a POST to `https://api.sandbox.protecht.com/api/internal/widgets/icw/configure/v4`.
   - On success, it renders:
     - Quote Total
     - Perils
     - Links
     - Underwriter info
   - On error, it shows a descriptive red error message.

---

## Assumptions & Limitations

- **One-time render**: No live reactivity; designed for "fetch once, display once."
- **No dependencies**: Avoids libraries like React, Solid, lit-html by default.
- **Material Icons**: Requires host page to include:

  ```html
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  ```

  I tried to bundle these in my own script but had a very difficult time. Ideally, to avoid this, I would have the SVG icons live on the server and fetch them dynamically on the api request

- **Styling**: Scoped to Shadow DOM. Host page cannot override widget styles unless explicitly supported.
- **Browser Support**: Modern browsers with Web Component support (ES2019+). No IE11 support out-of-the-box.
- **No retry logic**: Network errors display an error message, but no automatic retry is implemented.

---

## Testing

This project uses Vitest for unit testing.

To run tests:

```bash
npm test
```

Tests include:
- Validating `configureICW()` API client.
- Ensuring `<protecht-icw>` renders:
  - Loading state
  - Error state
  - Fetched data

---

## Project Structure

```
protecht-icw/
├── src/
│   ├── api/
│   │   ├── httpClient.ts
│   │   └── types.ts
│   ├── components/
│   │   └── ICWWidget.ts
│   ├── styles/
│   │   └── widget.css
│   ├── index.ts
│   └── vitest.config.ts
├── dist/
│   ├── icw.esm.js
│   └── icw.umd.min.js
├── package.json
├── rollup.config.js
├── tsconfig.json
└── README.md
```
