# trackER 🎛️
### Minimalist Studio Album & Track Production System with Client-Side AES-256 Encryption

trackER is a modern, minimalist web system—featuring an aesthetic inspired by Apple (SF Pro / macOS Clean UI) and Google’s clean design—tailored for musicians, producers, and sound engineers. It offers full end-to-end client-side encryption for projects, supports light and dark modes, and includes a detailed 10-point tracking system for individual tracks.

---

🍏 1. Apple / Google Clean Visual Vibe
Light & Dark Modes:

☀️ Light Mode (Apple Gray/White): Clean #F5F5F7 backdrop, icy crisp #FFFFFF cards, sleek rgba(0,0,0,0.07) borders, smooth depth, and zero eye strain when locked in for late-night sessions.

🌙 Dark Mode (Apple Obsidian/Charcoal): True black #000000, studio-ready #1C1C1E cards, and subtle rgba(255,255,255,0.09) borders for maximum stealth mode.

Instant theme toggle right in the header built like an Apple Segmented Control.

Typography: Crisp Apple system fonts (-apple-system, SF Pro Display, Inter, Google Sans).

No-BS Design: Zero cheap neon distraction — strictly high-end studio tool aesthetic for real hitmakers.

🔐 2. Locked-In Encrypted Vault (Zero-Knowledge AES-256-GCM)
Web Crypto API: Your beats and unreleased heat stay strictly on your machine. All crypto magic runs right in the client browser.

Key Derivation: Hardened with PBKDF2 (100,000 iterations, SHA-256) backed by a unique cryptographic Salt for every user profile.

The Stash / Vault: Albums, track lists, bars/lyrics, BPMs, key scales, and confidential session notes are locked up tight with AES-256-GCM using a fresh Initialization Vector (IV) on every save.

Top-Tier Security: No plain-text passwords stored anywhere. Your raw files stay untouchable; the database only ever sees encrypted code.

Guest Cook Mode: Jump straight into the DAW/tracker without signing up, then lock it down into an encrypted profile whenever you're ready.

🌐 3. Multi-Language Support (UK 🇺🇦 / EN 🇬🇧)
Switch the entire studio interface in 1 click.

🎚️ 4. 10-Point Track Scoring System (10 / 10 Scale)
Beat / Instrumental (4 pts): Demo/Idea, Arrangement, Mix, Master.

Lyrics & Vocals (4 pts): Writing Bars, Scratch/Demo Vocals, Final Takes, Vocal FX & Processing.

Visuals & Promo (2 pts): Cover Art / Music Video Concept, Final Visual Assets.

Built-in lightweight player to audition your bounce demos on the fly (Web Audio API).

📄 5. Export & Studio Reports
Studio Sheet: Crisp print-ready format for studio engineers during session lock-ins, or instant Markdown copy to share with the label/team.

Session Backup: Full database Import & Export via .json stash files.

🎮 Studio Extras & Easter Eggs
Interactive Vinyl Logo (DJ Scratch & Fly-off):

Real-time rotating vinyl record right on the logo mark.

Scratch Effect: Hover and pull with your mouse to pull off authentic DJ scratches (synthesized live via Web Audio API).

Fly-Off Action: Hold-click the platter for ~1.5 seconds and watch the disc fly off the turntable with a whistle, spin in mid-air, and crash into the bottom right corner! The deck stays bare with just the spindle until you click the record to pop it back in place with a sharp click.

One-Time Master Passphrase:

Dynamic key compiled from: Album Title + User + Current Hour.

Revealed ONLY ONCE. No manual edits — reset or generate fresh only.

Allows you to throw a hard passcode lock on any specific album folder.

Offline Sync & Local Vault:

Fully standalone operation without an active internet connection. Seamlessly pack and unpack your track data via .json / .trackER bundles.