# trackER 🎛️

> **Minimalist Studio Album & Track Production System with Client-Side AES-256 Encryption**

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Security](https://img.shields.io/badge/Encryption-AES--256--GCM-22c55e?logo=lock&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Offline](https://img.shields.io/badge/Offline--First-100%25-orange.svg)](#offline-first-architecture)

**trackER** is a clean, modern web application designed for music producers, beatmakers, audio engineers, and indie artists to plan, track, and ship albums and EPs. Built with a sleek Apple-inspired aesthetic (macOS SF Pro style) and clean Google design language, trackER keeps studio sessions organized with zero distractions.

---

## ✨ Key Features

### 🎚️ 1. Multi-Format Production Pipeline
Track every stage of production with tailored point systems:
- **Full Songs (10 Points)**:
  - **Beatmaking (4 pts)**: Idea / Demo loop, Arrangement, Instrumental Mix, Mastering.
  - **Vocals (4 pts)**: Lyrics writing, Guide vocal / Demo, Clean studio takes, Processing & Tuning.
  - **Visuals & Promo (2 pts)**: Cover art concept / Spotify Canvas, Final master artwork.
- **Instrumentals (5 Points)**:
  - 3 points for Beatmaking (Demo, Arrangement, Mix & Master).
  - 2 points for Visuals & Artwork (Vocals skipped automatically).
- **Skits & Interludes (5 Points)**:
  - 2 points for Sound Design & Beat arrangement.
  - 3 points for Voice recording, Script / Dialogue, and Vocal FX.

### 🔐 2. Zero-Knowledge Client-Side Vault (AES-256-GCM)
Your tracks, unreleased lyrics, and session notes never leave your browser unencrypted:
- **Web Crypto API**: Industry-standard **AES-GCM (256-bit)** running natively in the client.
- **PBKDF2 Key Derivation**: 100,000 iterations with SHA-256 and unique per-user cryptographic salts.
- **No Plaintext Storage**: Data is encrypted before touching `localStorage`.
- **Guest Mode**: Instant studio access without registration, with the ability to lock your project into an encrypted profile at any time.

### 🔗 3. Seamless Album Sharing
Share your album progress with co-producers, managers, or fans in seconds:
- **Direct Link Sharing**: Generates a self-contained URL with the album state encoded into the link hash. Anyone opening the link can view and import the album without an account.
- **Messenger Summary**: One-click formatted progress report with visual emoji progress bars (`[████████░░]`), ready for Telegram, Discord, or WhatsApp.
- **Native Share Sheet**: Integrated with the system share dialog (AirDrop, Messages, etc.) on supported desktop and mobile browsers.

### 📄 4. Compact 1-Page B&W Studio Production Sheet
- High-density, print-ready checklist designed specifically for studio control rooms.
- Clean black-and-white layout optimized to fit completely on **a single A4 landscape sheet** with no awkward page breaks.
- Export as PDF or copy raw Markdown directly to your clipboard.

### 📋 5. Big Studio Board (Private & Public)
- **Private Canvas**: Freeform plain-text workspace for lyrics, scratch rhymes, tempo automation notes, and mix feedback.
- **Public Community Board**: Collaborative board for studio teams with optional anonymous posting and admin moderation capabilities.

### 🎨 6. Material 3 Design & Color Accents
- **Adaptive Dark / Light Themes**: High-contrast Apple Obsidian dark mode for late-night dim studio sessions, and clean crisp light mode for daylight.
- **Harmonious M3 Color Accents**: Electric Indigo, Sage Green, Olive Branch, Terracotta Rust, Orchid Plum, Warm Ochre Gold, and Monochrome Neutral.
- **Tactile Micro-Animations**: Smooth checkbox pop physics, interactive vinyl record sleeve preview, and progress bar shimmer.

### 🌐 7. Complete Bilingual Interface
- Full, native localization in both **English** and **Ukrainian (Українська)** with instant 1-click toggling.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + Vite |
| **Styling** | Vanilla CSS (CSS Custom Properties & Design Tokens) |
| **Cryptography** | Web Crypto API (`SubtleCrypto`, AES-GCM, PBKDF2) |
| **Audio Engine** | Web Audio API (Live demo previews & audio cues) |
| **Icons** | Lucide React |

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/denysochek/trackER.git
   cd trackER
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview production build locally**:
   ```bash
   npm run preview
   ```

---

## 🔒 Security Architecture

```
Password + Cryptographic Salt
             │
             ▼ (PBKDF2 / 100,000 iterations / SHA-256)
     Derived AES-256 Key
             │
             ├──► Encrypt Album Payload (AES-GCM + Fresh IV) ──► Local Storage Vault
             └──► Decrypt on User Login in Browser Memory
```

- **Zero-Knowledge**: No keys or plaintext project files are ever transmitted across networks.
- **Offline Reliability**: Works completely offline without requiring an active internet connection.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

---

Made with passion for music makers and audio producers worldwide. 🎧
