# Icon System Documentation

This document outlines the architecture and usage of the centralized SVG icon system in **The Dragon's Flagon**. The system is designed for performance, consistency, and ease of management without relying on heavy external libraries for the core game visuals.

## Core Concepts

1.  **Centralized Data**: Icons are stored as SVG path strings in category-specific files (e.g., `ui.ts`, `minigames.ts`).
2.  **Normalized Access**: All icons are aggregated in `index.ts` and normalized (snake_case) for retrieval.
3.  **Single Component**: A universal `<Icon />` component handles path lookup, fallback logic, and SVG rendering.
4.  **Helper Function**: `getIcon()` provides a developer-friendly interface for backward compatibility and quick instantiation.

## Directory Structure

All icon assets are managed in `src/assets/icons/`:

```
src/assets/icons/
├── index.ts           # Registry aggregating all icon categories
├── Icon.tsx           # Main SVG rendering component with fallback logic
├── ui.ts              # UI-specific icons (buttons, panels, status)
├── minigames.ts       # Minigame-specific icons (cards, dice, game actions)
├── currency.ts        # Currency and transaction icons
├── skill.ts           # Character skill and attribute icons
└── book_reader.ts     # Icons for the lore and rulebook systems
```

## How to Add New Icons

### 1. Identify the Category
Choose the most relevant file (e.g., `minigames.ts` for card game assets). If a new category is needed, create a new `.ts` file.

### 2. Add the SVG Path
Add the icon name and its SVG path data to the corresponding map. Values MUST be just the `d` attribute of the SVG path.

```typescript
// src/assets/icons/minigames.ts
export const MINIGAMES_ICONS = {
  // ... existing icons
  'my_new_icon': "M256 32C132.3 32 32 132.3 32 256s..."
};
```

### 3. Register in index.ts
If you created a new file, import and spread it into `ALL_ICONS` in `src/assets/icons/index.ts`.

## Usage Guidelines

### Preferred Method: <Icon /> Component
Use the `<Icon />` component directly for full TypeScript support and props control.

```tsx
import { Icon } from '@/assets/icons';

const MyComponent = () => (
    <Icon name="gold-coin" size={24} className="text-amber-500" />
);
```

### Compatibility Method: getIcon()
Used primarily in legacy components or when a function-call pattern is cleaner (e.g., in maps).

```tsx
import { getIcon } from '@/assets/icons';

// getIcon(category, name, props)
{getIcon('ui', 'trophy', { size: 32, className: "text-blue-400" })}
```

## Minigame Icon Registry (New)

The `minigames.ts` set includes specialized icons for **Three Dragon Ante** and other tavern games:

| Icon | Purpose |
| :--- | :--- |
| `crown` | Game leader, winners |
| `trophy` | Gambit/Game victory |
| `skull` | Losses, requirement failures |
| `swords` | Attack/Gambit phase |
| `gold-coin` | Stakes and betting |
| `scroll` | Game rules, logs |
| `thinking` | AI status indicator |
| `hourglass` | Turn time, delays |

## Fallback & Normalization

The system includes built-in robustness:
-   **Auto-Normalization**: Replaces dashes `-` with underscores `_` automatically.
-   **Aliases**: Fallbacks like `gold-coin` -> `coin` handle naming variations.
-   **Similarity Search**: If an exact match fails, it attempts to find sub-string matches to prevent broken UI.
