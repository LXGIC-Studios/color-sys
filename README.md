# @lxgicstudios/color-sys

[![npm version](https://img.shields.io/npm/v/@lxgicstudios/color-sys)](https://www.npmjs.com/package/@lxgicstudios/color-sys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-blue)](https://www.npmjs.com/package/@lxgicstudios/color-sys)

Generate a complete design system color palette from one hex color. Outputs a 10-shade scale (50-950) like Tailwind, complementary/analogous/triadic colors, and WCAG contrast pairs.

Pick one color. Get a full palette with accessible contrast ratios, ready for Tailwind, CSS, or SCSS.

## Install

```bash
# Use directly with npx
npx @lxgicstudios/color-sys "#3B82F6"

# Or install globally
npm install -g @lxgicstudios/color-sys
```

## Usage

```bash
# Generate a palette (visual display)
color-sys "#3B82F6"

# Tailwind config output
color-sys "#10B981" --name emerald --tailwind

# CSS custom properties
color-sys "#8B5CF6" --name violet --css

# CSS with dark mode variants
color-sys "#EF4444" --name red --css --dark

# SCSS variables
color-sys "#F59E0B" --name amber --scss

# Full JSON output
color-sys "#3B82F6" --json
```

## What You Get

### Shade Scale (50-950)

Just like Tailwind's color system. Eleven shades from near-white to near-black, all derived from your base color.

### Color Harmony

- **Complementary** - opposite on the color wheel
- **Analogous** - two neighbors on the color wheel
- **Triadic** - three evenly spaced colors
- **Split Complementary** - two colors adjacent to the complement

### WCAG Contrast Pairs

Every shade gets tested against white and black text. You'll see the contrast ratio and WCAG compliance level (AAA, AA, AA Large, or Fail) so you know which text colors work on which backgrounds.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--name <name>` | Color name for output variables | primary |
| `--tailwind` | Output as Tailwind CSS config | false |
| `--css` | Output as CSS custom properties | false |
| `--scss` | Output as SCSS variables | false |
| `--dark` | Include dark mode variants (with --css) | false |
| `--json` | Output full palette as JSON | false |
| `--help` | Show help message | - |

## Features

- Zero external dependencies
- Generates 11 shades (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950)
- Outputs Tailwind config, CSS variables, or SCSS variables
- Dark mode support (flips the scale for `prefers-color-scheme: dark`)
- WCAG contrast ratio calculation for every shade
- Color harmony: complementary, analogous, triadic, split-complementary
- Visual color swatches in terminal (24-bit color support)
- Accepts #RGB, #RRGGBB, or RRGGBB formats

## Output Examples

### Tailwind Config

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'primary': {
          '50': '#f5f8fe',
          '500': '#3b82f6',
          '950': '#1a2744',
        },
      },
    },
  },
};
```

### CSS Custom Properties

```css
:root {
  --color-primary-50: #f5f8fe;
  --color-primary-500: #3b82f6;
  --color-primary-950: #1a2744;
  --color-primary-complementary: #f6a33b;
}
```

---

**Built by [LXGIC Studios](https://lxgicstudios.com)**

[GitHub](https://github.com/lxgicstudios/color-sys) | [Twitter](https://x.com/lxgicstudios)
