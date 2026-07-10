# NPC Portrait Matrix Generation Skill

This document outlines the precise prompting strategy for generating 3x3 NPC emotion matrices for the Artificer game.

## Core Requirements
- **Grid Size**: Exactly 3x3 (9 total portraits).
- **Subject**: Same character in every cell.
- **Background**: Solid, bright chroma-key green (#00FF00).
- **Framing**: Waist-up or bust. Ensure the bottom of the character's torso touches the bottom edge of each cell (no floating torsos).
- **Consistency**: Clothing, hair, and features must remain identical across all cells.

## The 3x3 Emotion Matrix Layout
The grid should follow this specific order of emotions:
1. **Top-Left**: Neutral
2. **Top-Center**: Curious
3. **Top-Right**: Skeptical
4. **Middle-Left**: Happy
5. **Middle-Center**: Greedy
6. **Middle-Right**: Angry
7. **Bottom-Left**: Sad
8. **Bottom-Center**: Surprised
9. **Bottom-Right**: Proud

## Prompt Template

### System Instruction / Prefix
"Generate a high-quality 2D character sheet for a tabletop RPG. The image MUST be a strictly organized 3x3 grid containing exactly 9 individual portrait cells. Each cell must feature the SAME character with different facial expressions. Use a solid, vibrant chroma-key green background (#00FF00) for every cell. Ensure the character is framed from the waist up, and their body is grounded at the bottom of each cell frame with no empty space beneath them."

### Character Description
[Insert Character Details here, e.g., 'A rugged Mountain Dwarf blacksmith with a braided beard and leather apron']

### Emotion Specification
"The 9 emotions in the grid, from top-left to bottom-right, must be:
Row 1: Neutral, Curious, Skeptical.
Row 2: Happy, Greedy, Angry.
Row 3: Sad, Surprised, Proud."

### Technical Constraints
"Style: Detailed digital painting, sharp focus, consistent lighting.
Negative Prompt: 4x3 grid, 2x2 grid, 12 cells, full body, floating, white background, inconsistent features, messy layout."

## Troubleshooting
- **If getting 12 cells**: Emphasize "Strict 3x3 grid" and "Exactly 9 portraits".
- **If floating**: Add "Character must be anchored to the bottom of the frame".
- **If background is messy**: Specify "Solid flat green background, hex #00FF00".
 Core Requirements (Strict Enforcement)
Grid: EXACTLY 3×3 (9 portraits total).
Canvas Structure: Single image composed of 9 equal cells.
Cell Resolution: Each cell MUST be 768×512 pixels (width × height).
Total Canvas Size: 2304×1536 pixels (3 × 768, 3 × 512).
Subject Consistency:
Same character in ALL cells.
Identical: head shape, proportions, clothing, hair, lighting, color palette.
NO variation except facial expression.
Framing (CRITICAL):
Waist-up or bust.
Torso must TOUCH the bottom edge of the frame in every cell.
ZERO bottom padding.
NO empty space below torso.
Character must be:
perfectly vertically grounded
horizontally centered in each cell
Head must NOT be cropped.
Background (Animation-Safe):
Solid flat chroma green: #00FF00
NO gradients
NO lighting variation
NO shadows
NO texture, noise, or artifacts