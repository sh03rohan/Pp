# Physics in CSE — Interactive Presentation

**Topic:** Importance and Applications of Physics in Computer Science and Engineering (CSE)
4 speakers · 12 slides · about 2 minutes per speaker (8 minutes total)

## How to open
Double-click `index.html`. It opens in Chrome, Edge, Firefox or Safari.
No internet and no server are needed. The fonts are included in the files.

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
| 1 | 1–3 | Introduction: what Physics and CSE are, and why they connect |
| 2 | 4–6 | Electricity, transistors and binary, logic gates |
| 3 | 7–9 | Fiber optics, wireless, sensors and robots |
| 4 | 10–12 | Quantum computing, future technology, conclusion |

## Interactive parts (try them before class)
- **Slide 3:** click the 4 steps to light up each part of the computer.
- **Slide 4:** move the voltage slider. The charges speed up and the light gets brighter.
- **Slide 5:** click the big ON/OFF switch, then click the 8 bit tiles (01000001 = "A").
- **Slide 6:** choose AND / OR / NOT, then click inputs A and B. The truth table highlights the current row.
- **Slide 7:** type a short word (up to 5 letters) and click **Send**. It travels as light flashes.
- **Slide 8:** click Wi-Fi, Bluetooth or Mobile network.
- **Slide 9:** move the box. The robot measures the echo and stops when the box is too close.
- **Slide 10:** click **Measure**. Each click measures a new qubit and gives 0 or 1.

## Add your names
Change the names in two places:
1. `js/notes.js`: the `SPEAKERS` list at the top (used in the top bar and the notes panel).
2. `index.html`: search for "Speaker 1" (the title slide and the "Thank You" card).

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
