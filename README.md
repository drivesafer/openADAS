# 🚗 OpenADAS

**OpenADAS** is an open-source, smartphone-based Advanced Driver Assistance System (ADAS) that uses existing vehicle cameras (via smartphones or dashcams) to provide real-time driver safety alerts.

The goal of OpenADAS is simple:

> **Make ADAS accessible, transparent, and community-driven — especially for everyday drivers.**

No special hardware.  
No expensive proprietary systems.  
Just a phone, a camera, and open-source software.

---

## 🌟 Key Features

- 📱 **Runs on smartphones & browsers** (Web-based)
- 🎥 Uses **existing vehicle cameras or dashcams**
- 🧠 Computer vision–based driving assistance
- 🔧 Modular architecture: **each ADAS mode is a standalone web app**
- 🌍 Community-driven & open-source

---

## 🚦 Available Driving Modes

OpenADAS is built around independent **modes**. Each mode focuses on one driving assistance task.

| Mode | Description |
|----|----|
| 🛑 **Traffic Sign Recognition** | Detects and recognizes traffic signs in real time |
| 🛣️ **Lane Departure Warning** | Alerts when the vehicle drifts out of its lane |
| 🛑➕🛣️ **Traffic Sign + Lane Departure** | Combined mode with both features |

👉 You can switch modes from the **Home / Mode Picker** screen.

---

## 🧭 Project Structure

```

openADAS/
├─ index.html                 # Home / Mode picker
├─ mode/
│  ├─ _boilerplate/           # Template for creating new modes
│  ├─ traffic-sign/
│  ├─ lane-departure/
│  └─ traffic-sign-lane-departure/
├─ assets/
│  ├─ sample-videos/          # Test videos for contributors
│  └─ screenshots/
├─ docs/
│  ├─ CONTRIBUTING.md
│  ├─ MODES.md
│  └─ ROADMAP.md
└─ README.md

```

Each folder inside `mode/` is a **self-contained web app**.

---

## ▶️ Try It Online

👉 **Live demo (GitHub Pages):**  
https://drivesafer.github.io/openADAS/

You can:
- Run directly in your browser
- Use a sample driving video
- Or use your device camera (if supported)

---

## 👥 Who Is This For?

### 🚗 Drivers / Non-programmers
You can help by:
- Testing the app on real roads
- Sending driving videos
- Reporting false alerts or missed detections
- Suggesting new driving scenarios or modes

👉 **No coding required.**

### 💻 Developers
You can help by:
- Improving detection accuracy
- Optimizing performance (FPS, battery, latency)
- Adding new modes
- Improving UI/UX for real drivers

---

## 🤝 How to Contribute (Even If You Don’t Code)

OpenADAS is designed so **anyone can contribute**.

### ✅ No-code contributions
- 📹 Upload sample driving videos
- 🐞 Report bugs or incorrect warnings
- 💡 Suggest new ADAS modes or improvements
- 🧪 Test on different phones, browsers, vehicles

### 🧑‍💻 Code contributions
- Add a new mode (copy `_boilerplate`)
- Improve existing detection logic
- Refactor UI / performance
- Improve documentation

👉 See **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** for details.

---

## 🧩 Creating a New Mode (2-Minute Guide)

1. Copy the boilerplate:
```

mode/_boilerplate → mode/my-new-mode

```
2. Edit:
- `mode/my-new-mode/index.html`
- `mode/my-new-mode/app.js`
- `mode/my-new-mode/README.md`
3. Add a button to `index.html` (Home page)
4. Done 🎉

No build tools.  
No framework lock-in.  
Just HTML, CSS, and JavaScript.

---

## 🛣️ Roadmap

- ✅ Basic ADAS modes running in browser
- 🔄 Improve UI for real driving conditions (day/night)
- 📊 Community-driven dataset collection
- 📱 Better mobile performance & stability
- 🔔 Audio & visual alert customization

See **[docs/ROADMAP.md](docs/ROADMAP.md)** for details.

---

## 📜 License

This project is licensed under the **MIT License**.  
You are free to use, modify, and distribute it.

---

## ❤️ Community & Vision

OpenADAS is not just a project — it’s a **community experiment**.

If you drive, you can help.  
If you code, you can help more.  
If you care about road safety, you belong here.

> **Drive safer. Build together. OpenADAS.**
