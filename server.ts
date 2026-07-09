import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { PERSONA_REGISTRY } from "./src/constants/npcLines";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini
  const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: Generate New NPC Profile (The Artificer Core)
  app.post("/api/artificer/generate-npc", async (req, res) => {
    try {
      const { theme } = req.body;

      const prompt = `
        Create a unique D&D NPC patron for a fantasy tavern (The Dragon's Flagon).
        Theme: ${theme || "Random"}

        Determine if this character is a gambler (someone who enjoys tavern games like Three-Dragon Ante).
        Some patrons might be professional gamblers, while others might be reluctant, lucky, or just observers.
        Assign stats between 3 and 20 based on their role and personality.

        Return a JSON object:
        {
          "name": "Full Name",
          "race": "D&D Race",
          "role": "Class or Profession",
          "personality": "Short description of personality and their attitude towards gambling.",
          "id": "snake_case_id",
          "isGambler": boolean,
          "stats": {
            "strength": number,
            "dexterity": number,
            "intelligence": number,
            "wisdom": number,
            "charisma": number
          }
        }
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Artificer NPC Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Push NPC to GitHub Vault
  app.post("/api/artificer/push-to-vault", async (req, res) => {
    try {
      const { npc } = req.body;
      const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

      if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: "GITHUB_TOKEN not configured" });
      }

      // Target repository info (Inferred from environment or defaults)
      const REPO_OWNER = process.env.REPO_OWNER || "japiohopman";
      const REPO_NAME = process.env.REPO_NAME || "artificer";

      // Sanitize NPC ID to prevent path traversal
      const safeId = npc.id.replace(/[^a-z0-9_-]/gi, '_');
      const FILE_PATH = `src/constants/vault/${safeId}.json`;
      const MESSAGE = `Forge: Summoning ${npc.name} to the Guild Vault`;

      const content = Buffer.from(JSON.stringify(npc, null, 2)).toString("base64");

      // Github API - Create or Update file
      const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        method: "PUT",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: MESSAGE,
          content: content,
          // If we wanted to update, we'd need the 'sha' of the existing file.
          // For now, we assume these are new NPCs (summoned).
        })
      });

      const result = await response.json();

      if (response.ok) {
        res.json({ success: true, url: result.content.html_url });
      } else {
        res.status(response.status).json({ error: result.message || "GitHub API Error" });
      }
    } catch (error: any) {
      console.error("Vault Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
