<div align="center">
<img width="1200" height="475" alt="The Dragon's Flagon Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# 🐉 The Dragon's Flagon

**The Dragon's Flagon** is an immersive tavern-themed mini-game suite designed for the **Arcane Codex (Artificer)** ecosystem. It provides a tactile, "parchment-and-ink" gambling experience, featuring the legendary Three-Dragon Ante, alongside classic tavern pastimes like Solitaire and Memory.

---

## 👥 The Lorekeeper Collective

This project is maintained by a specialized collective of AI agents, ensuring architectural alignment with the main Arcane Codex repository:
*   👑 **Jules (The Orchestrator)**: Master architect and project lead. Jules ensures the structural integrity and documentation of the Flagon's systems.
*   🛠️ **Jimmy (The Artificer)**: Specialist in game mechanics. Jimmy engineered the complex logic of Three-Dragon Ante flights and card powers.
*   🎙️ **Sonny (The Atmospheric Orchestrator)**: Audio Architect. Sonny designed the multi-layered tavern soundscape and tactile foley effects.

---

## ✨ Key Features

### 🐲 Three-Dragon Ante (TDA)
A high-stakes strategy card game where players build "Flights" of dragons.
*   **Context-Aware NPCs**: 37 unique characters mapped to 9 Voice Archetypes, powered by Gemini 2.0 Flash for dynamic dialogue.
*   **RPG Mechanics**: Integrated D&D skill checks (Bluff, Sleight of Hand, Concentration) that influence gameplay.
*   **Visual Fidelity**: High-performance sprite atlas system for cards and animated NPC emotion matrices.

### 🃏 Classic Tavern Games
*   **Solitaire**: A full-featured Klondike implementation with drag-and-drop logistics and scoring.
*   **Memory**: A quick-play challenge featuring the Flagon's unique card art.

### 🏛️ The Tavern Hub
A central interface for selecting games, managing gold, and interacting with the 37-NPC roster.

---

## 🛠️ Tech Stack

*   **Frontend**: [React 18](https://react.dev/), [Vite 6](https://vitejs.dev/)
*   **Styling & Motion**: [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion 12](https://www.framer.com/motion/)
*   **State Management**: [Zustand 5](https://github.com/pmndrs/zustand)
*   **AI**: [Google Gemini API](https://ai.google.dev/gemini-api) (gemini-2.0-flash)
*   **Backend**: [Express 4](https://expressjs.com/) (Secure Proxy & NPC Vault sync)

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (Latest LTS)
*   A Google Gemini API Key

### Installation
1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd the-dragons-flagon
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**: Copy `.env.example` to `.env` and provide your `GEMINI_API_KEY`.
4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The tavern doors open at `http://localhost:3000`.

---

## 📂 Repository Structure

*   `src/`: Core application logic.
    *   `components/`: Modular UI elements (TableTop, Card, NPCShowcase).
    *   `store/`: Zustand state slices for game logic and NPC management.
    *   `utils/`: Card logic, constants, and NPC archetype mappings.
*   `docs/`: Comprehensive technical documentation and integration guides.
*   `tests/`: Playwright visual verification and Vitest unit tests.
*   `server.ts`: Express-based dev server and AI proxy.

---

## 🛡️ Security & Integrity

The Dragon's Flagon implements strict validation for game assets and character states.
*   **AI Proxying**: All Gemini calls are routed through the backend to protect sensitive API keys.
*   **Path Guarding**: Secure file operations for NPC vault synchronization.

---

**Forged by the Lorekeepers of Artificer.**
