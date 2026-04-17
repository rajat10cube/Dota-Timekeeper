# Dota Timekeeper

Dota Timekeeper is a lightweight, transparent, and click-through companion application built using Electron and React. It acts as an unobtrusive assistant during your Dota 2 matches, providing visual alerts and subtle audible chimes for critical objective timings. 

By running on top of your game without interfering with your mouse or keyboard inputs, it helps you maintain awareness of objective spawns so you can focus on winning your lane and the game at large.

### Features
- **Visual & Audio Alarms:** Get warned 15 seconds in advance for:
  - Bounty Runes
  - Power/Water Runes
  - Wisdom Runes
  - Healing Lotuses
  - Neutral Camp Stacking (Alerts you at the perfect time to pull!)
- **Click-Through:** The overlay is entirely transparent to mouse clicks—you will never accidentally click the overlay while playing the game.
- **Customizable:** Right-click the application in your Windows System Tray (Taskbar) to customize which alerts you want to see, and change where the overlay is positioned on your screen.

---

## Is this Cheating? Will I get VAC banned?

**No, and no.** This tool is universally safe and will **not** trigger Valve Anti-Cheat (VAC) bans. 

This application functions entirely by utilizing **Valve's official Game State Integration (GSI)**. GSI is a feature intentionally built into Dota 2 by Valve specifically for developers, broadcasters, and hardware vendors to receive live match telemetry (such as the match clock and your current hero state). 

Dota Timekeeper:
- **DOES NOT** inject any code into the Dota 2 game client.
- **DOES NOT** interact with or scan the game's internal memory.
- **DOES NOT** modify any game files or inputs.
- Simply runs a local listening server waiting for Dota 2 to voluntarily broadcast the current game time via HTTP requests. 

It operates completely within the boundaries defined by Valve's official developer API. It only automates keeping an eye on the in-game clock, serving as an educational utility to build good map-awareness habits.

---

## How to Run & Install

### Initial Setup
The overlay relies on a configuration file to tell Dota 2 to send data to our overlay. 

When you run the application for the first time, it will automatically generate a file named `gamestate_integration_overlay.cfg` and place it onto your Desktop. 
You must move this file into your Dota 2 installation folder. By default on Windows, this is:
`C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration\`

*(If the `gamestate_integration` folder does not exist inside the `cfg` folder, simply create it).*

Next, ensure you are playing Dota 2 in **Borderless Windowed** or **Windowed** mode (Exclusive Fullscreen prevents overlays from rendering on top). 

### Starting the Overlay
If you have the compiled `.exe` package, simply run `Dota Timekeeper Setup 0.0.1.exe` to install and launch it. The overlay will run, overlay itself on your display, and a small Dota icon will sit quietly in your System Tray waiting for a match.

If you are developing or running from source:
1. Ensure you have [Node.js](https://nodejs.org) installed.
2. Navigate to this directory using your terminal.
3. Run `npm install` to download all dependencies.
4. Run `npm run package` to seamlessly compile and package a distributable `.exe` inside the `/release/` directory.
