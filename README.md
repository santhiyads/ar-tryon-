
# AR Dress / Shirt Try-On (Webcam + MediaPipe)

A small web app that lets you try outfits virtually using your webcam.  
It uses **MediaPipe Pose** to detect your body and draws a shirt/dress image aligned to your shoulders and torso.

---

## Features

- Live webcam preview.
- Automatic body pose tracking using MediaPipe Pose.
- Select outfit from a bottom carousel.
- Upload your own PNG/JPG outfits.
- Take a snapshot and download as PNG.
- Error/status messages and a small help panel.

---

## Project Structure
<img width="921" height="367" alt="{CA931D7A-1987-4A24-952E-9169A755A77B}" src="https://github.com/user-attachments/assets/c3df2f6e-e425-4513-917f-a63b2fc3bdf4" />


If you use preloaded outfits, update the paths in `script.js`:
const dressImages = [
'assets/dress1.png',
'assets/dress2.png',
'assets/dress3.png',
'assets/dress4.png',
'assets/dress5.png'
];


---

## How to Run Locally

### Option 1 – Python simple server

1. Install Python (if not already installed).
2. Open a terminal/command prompt in the project folder (where `index.html` is).
3. Run:  python -m http.server 8000

python -m http.server 8000



5. Allow camera permission when the browser asks.

### Option 2 – VS Code + Live Server

1. Install **Visual Studio Code**.
2. Open the project folder in VS Code.
3. Install the **“Live Server”** extension.
4. Right‑click `index.html` → **Open with Live Server**.
5. Browser will open on `http://127.0.0.1:5500/` (or similar).

---

## Usage

1. Click **Start** to enable the webcam and pose tracking.
2. Stand 1–2 meters from the camera, face it, and ensure good lighting.
3. Choose an outfit:
- Use the bottom **carousel buttons**, or
- Use **Choose files** to upload your own PNG/JPG; thumbnails will appear in the buttons.
4. Click **Snapshot** to save the current frame as `ar-tryon‑TIMESTAMP.png`.
5. Click **?** for on‑screen tips.

---

## Important Code Points

- Pose detection setup: `initPose()` in `script.js`.
- Main drawing logic: `drawDressOverlay(landmarks)`.
- Controls position and size of the shirt/dress using shoulders and hips.
- Camera start/stop: `startCamera()` and `stopCamera()`.

To adjust fit:

- Vertical position (move outfit up/down):


const neck = {
x: (leftShoulder.x + rightShoulder.x) / 2,
y: Math.min(leftShoulder.y, rightShoulder.y) - 110 // more negative = higher
};

- Size (overall scale):
const dressWidth = shoulderWidth * 2.8; // increase for wider
const dressHeight = torsoHeight * 2.8; // increase for taller




---

## Browser Permissions

The app needs access to your **camera**.  
If you see camera errors:

- Make sure no other app (Meet, Zoom, WhatsApp, etc.) is using the camera.
- Refresh the page and click **Start** again.
- Check browser address bar → allow “Use camera”.

---

## Notes

- Works best on modern browsers (Chrome, Edge, recent Firefox).
- Requires a reasonably lit environment so MediaPipe can detect your pose.
- For custom shirts/dresses, use PNGs with transparent background for better results.
