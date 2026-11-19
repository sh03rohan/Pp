# Physics in CSE — Interactive Presentation

**Topic:** Importance and Applications of Physics in Computer Science and Engineering (CSE)
4 speakers · 8 slides (2 per speaker) · about 2 minutes per speaker (8 minutes total)

## How to open
Double-click `index.html`. It opens in Chrome, Edge, Firefox or Safari.
No internet and no server are needed. The fonts are included in the files.

## Works on every screen
- **Laptop, projector, desktop, landscape tablet:** the full 16:9 slide is scaled to fit the screen (best for presenting).
- **Phone, portrait tablet, small window:** the layout switches automatically to one column. Each slide scrolls up and down, and the text stays large enough to read.
- **Phone turned sideways:** a compact two-column layout.
- Swipe left or right on a touch screen to change slides.

## Controls
| Action | Key / button |
|---|---|
| Next slide | → or Space or PageDown, or the **Next** button |
| Previous slide | ← or PageUp, or the **‹** button |
| First / last slide | Home / End |
| Speaker notes + practice timer | **N** or the **Notes** button |
| Fullscreen | **F** or the **⛶** button (the controls hide after 2.5 s when you don't move the mouse) |
| Jump to a slide | Click a dot (the dots are grouped by speaker) |

## Who presents what
| Speaker | Slides | Topic |
|---|---|---|
| Habibullah Babar | 1–2 | Title and introduction · Physics + CSE: why they connect |
| Shammy Sultana | 3–4 | Electricity and transistors (binary) · Logic gates |
| Hridoy Dhar | 5–6 | Light and waves (fiber optics + wireless) · Sensors and robots |
| Sakibul Hasan Rohan | 7–8 | Quantum computing · Future technology and conclusion |

## Interactive parts (try them before class)
- **Slide 2:** click the 4 steps to light up each part of the computer.
- **Slide 3:** click the big ON/OFF switch, then click the 8 bit tiles (01000001 = "A").
- **Slide 4:** choose AND / OR / NOT, then click inputs A and B. The truth table highlights the current row.
- **Slide 5:** type a short word (up to 5 letters) and click **Send**. It travels as light flashes.
- **Slide 6:** move the box. The robot measures the echo and stops when the box is too close.
- **Slide 7:** click **Measure**. Each click measures a new qubit and gives 0 or 1.

## Changing names
Names are in `js/notes.js` (the `SPEAKERS` list, used in the top bar and the notes panel) and in `index.html` (title slide and the "Thank You" card).

## Speaker scripts
- `speaker-scripts.pdf`: one page per speaker, ready to print.
- `speaker-scripts.html` / `speaker-scripts.md`: the same scripts as a web page and as plain text.
- If you change the scripts in `js/notes.js`, run `node tools/build-scripts.js` to update the HTML and Markdown files.

## Files
```
index.html            the presentation
css/style.css         design and animations
js/main.js            navigation, notes panel, interactive demos
js/notes.js           speaker scripts (one entry per slide)
assets/fonts/         Inter font (SIL Open Font License)
tools/build-scripts.js  rebuilds the script documents
```
