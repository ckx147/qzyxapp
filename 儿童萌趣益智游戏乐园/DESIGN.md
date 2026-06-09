---
product: "儿童萌趣益智游戏乐园"
audience: "3-8 岁儿童与家长"
status: "active"
last_updated: "2026-06-09"
visual_direction: "storybook exploration park"
---

## 1. Overview

This app should feel warm, focused, and trustworthy: an interactive storybook exploration park rather than a noisy arcade. The UI uses illustrated chapter moments, soft paper surfaces, tactile controls, clear hierarchy, and small celebratory rewards.

The core rule is simple: every surface should feel like a page or chapter that helps the child choose the next adventure. Surrounding chrome should guide children and parents without competing with the board, number grid, or current task.

## 2. Colors

Primary coral: `#FF6B6B` for key actions, rewards, and positive emotional emphasis.

Warm amber: `#FF9F1C`, `#FFD166`, and `#D97706` for highlights, points, and playful focus cues.

Fresh green: `#10B981`, `#4ADE80`, and `#059669` for logic, success, and calm game states.

Storybook surface colors: `#FFF9F2`, `#FFFDF9`, `#FFE5CC`, and `#FFE0C2` for paper, page grids, panels, and dividers.

Text colors: use slate for most text, with high-contrast slate for headings and softer slate for hints. Avoid long blocks of saturated color.

## 3. Typography

Use Outfit for interface text and JetBrains Mono for scores, timers, numeric targets, and board numbers.

Headings are compact and confident. Game titles stay around `text-sm` with heavy weight. Supporting text is small, usually `10px-12px`, with relaxed line height.

Avoid oversized type inside cards, sidebars, and controls. Large type is reserved for game numbers, scores, timers, and reward moments.

## 4. Elevation

Use soft ambient shadows, not thick arcade bevels. Main panels should use light borders plus a gentle shadow.

Preferred panel shadow: `0 16px 40px rgba(255, 159, 28, 0.08)`.

Preferred interactive shadow: `0 8px 18px rgba(255, 107, 107, 0.14)`.

Heavy `border-b-8`, `shadow-xl`, and stacked gradients should be reserved for true tactile gameplay objects like wooden boards or movable tiles.

## 5. Components

Storybook page: warm paper surface with subtle grid texture. Use it for the mobile canvas background and chapter routes.

Storybook hero: one illustrated scene per major section. It should show a simple place, path, character, or object that describes the current adventure.

Chapter card: a single list item with an icon stamp, title, short story hook, reward chip, and route trail. Use this instead of generic repeated 2x2 cards for game selection.

Game panel: white or warm-white surface, `24px-32px` radius, light peach border, gentle shadow, no thick bottom border.

Game header: compact row, light divider, icon in a small soft square or calm emoji treatment. Use subtle `animate-soft-pop` only when motion adds delight.

Instruction and mascot cards: warm paper surface, one-pixel border, `16px-24px` radius, no heavy bevel.

Primary buttons: saturated solid or very subtle warm gradient, pill or `16px` radius, small press offset, `2px` bottom border at most.

Boards and tiles: can remain more tactile because they are the playable object. Keep their texture purposeful and readable.

## 6. Do's and Don'ts

Do keep each screen scannable within one mobile viewport.

Do make current task, next target, timer, and reward easy to find at a glance.

Do use celebratory motion sparingly and support reduced motion.

Don't stack gradient backgrounds, thick borders, pulsing labels, and bouncing icons in the same small area.

Don't let decorative cards compete with the game board.

Don't introduce generic purple-blue AI gradients, oversized rounded cards, or ornamental blur blobs.

Don't rely on emoji alone as the brand system. Emoji can stay as child-friendly glyphs, but chapter structure, paper texture, and custom layout must carry the visual identity.
