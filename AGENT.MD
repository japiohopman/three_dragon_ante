# 🤖 Agent Entry Point

Welcome to The Dragon's Flagon: Three-Dragon Ante. If you are an AI agent (Jules or otherwise),
read these in order before touching anything.

## 📍 Read in this order
1. 👉 **[ROADMAP.md](./ROADMAP.md)** — what's in scope *right now*. Start here.
2. 👉 **[AGENT_RULES.md](./AGENT_RULES.md)** — the rules for how you're allowed to work. Non-negotiable.
3. 👉 **[docs/goal.md](./docs/goal.md)** — the game design / technical design doc (rules, state shape, sprite system).
4. 👉 **[ROBHEINSOO_INSTRUCTIONS.md](./ROBHEINSOO_INSTRUCTIONS.md)** — tone/flavor and dev-standards brief for this project.

## 🛠️ General Guidelines
- **Groundedness**: verify against the actual code — `docs/goal.md` and `todo.md` can drift.
- **Verification**: don't mark a ROADMAP.md item `[x]` (or move it) until you've actually run
  `npm run dev` and watched the behavior. See AGENT_RULES.md §1.
- **Scope discipline**: work the task assigned in `### Active`. If you think something else in
  `### Ready` or `## Later` should jump the queue, say so in your PR description instead of
  just doing it.
- **Repo hygiene**: no new binary asset over 1MB, no vendored/reference code committed without
  flagging it first. See AGENT_RULES.md §4.

---
*Happy coding.*
