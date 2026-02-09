#!/usr/bin/env node

// ── ANSI Colors ──
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
};

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorShade {
  shade: string;
  hex: string;
  rgb: RGB;
  hsl: HSL;
}

interface ContrastPair {
  background: string;
  foreground: string;
  ratio: number;
  level: 'AAA' | 'AA' | 'AA Large' | 'Fail';
}

interface ColorPalette {
  baseColor: string;
  name: string;
  shades: ColorShade[];
  complementary: string;
  analogous: [string, string];
  triadic: [string, string];
  splitComplementary: [string, string];
  contrastPairs: ContrastPair[];
}

function printHelp(): void {
  console.log(`
${c.bgGreen}${c.white}${c.bold} COLOR-SYS ${c.reset}  ${c.dim}v1.0.0${c.reset}

${c.bold}Generate a complete design system color palette from one hex color.${c.reset}

${c.yellow}USAGE${c.reset}
  ${c.cyan}color-sys${c.reset} <hex-color> [options]
  ${c.cyan}npx @lxgicstudios/color-sys${c.reset} "#3B82F6" --tailwind

${c.yellow}ARGUMENTS${c.reset}
  ${c.green}<hex-color>${c.reset}      Base color in hex format (#RGB, #RRGGBB, or RRGGBB)

${c.yellow}OPTIONS${c.reset}
  ${c.green}--name <name>${c.reset}    Color name for output (default: "primary")
  ${c.green}--tailwind${c.reset}       Output as Tailwind CSS config
  ${c.green}--css${c.reset}            Output as CSS custom properties
  ${c.green}--scss${c.reset}           Output as SCSS variables
  ${c.green}--dark${c.reset}           Include dark mode variants
  ${c.green}--json${c.reset}           Output full palette as JSON
  ${c.green}--help${c.reset}           Show this help message

${c.yellow}EXAMPLES${c.reset}
  ${c.dim}# Generate palette from blue${c.reset}
  color-sys "#3B82F6"

  ${c.dim}# Tailwind config output${c.reset}
  color-sys "#10B981" --name emerald --tailwind

  ${c.dim}# CSS custom properties with dark mode${c.reset}
  color-sys "#8B5CF6" --name violet --css --dark

  ${c.dim}# Full JSON output${c.reset}
  color-sys "#EF4444" --json

${c.yellow}OUTPUT${c.reset}
  10-shade scale (50-950) matching Tailwind's naming convention.
  Includes complementary, analogous, triadic, and split-complementary colors.
  WCAG contrast pairs for accessibility.
`);
}

function parseArgs(argv: string[]): Record<string, any> {
  const args: Record<string, any> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--json') args.json = true;
    else if (arg === '--tailwind') args.tailwind = true;
    else if (arg === '--css') args.css = true;
    else if (arg === '--scss') args.scss = true;
    else if (arg === '--dark') args.dark = true;
    else if (arg === '--name' && argv[i + 1]) args.name = argv[++i];
    else if (!arg.startsWith('-')) positional.push(arg);
  }

  if (positional.length > 0) args.color = positional[0];
  return args;
}

// ── Color Conversion ──

function hexToRGB(hex: string): RGB {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number): string => {
    const h = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return h.length === 1 ? '0' + h : h;
  };
  return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
}

function rgbToHSL(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    default: h = ((r - g) / d + 4) / 6; break;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRGB(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255),
  };
}

function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRGB(hsl));
}

// ── Relative Luminance & Contrast ──

function relativeLuminance(rgb: RGB): number {
  const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  const linear = sRGB.map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(color1: RGB, color2: RGB): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function contrastLevel(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

// ── Palette Generation ──

function generateShades(baseHSL: HSL): ColorShade[] {
  const shadeConfigs: { shade: string; lightness: number; saturationAdjust: number }[] = [
    { shade: '50',  lightness: 97, saturationAdjust: -10 },
    { shade: '100', lightness: 93, saturationAdjust: -5 },
    { shade: '200', lightness: 86, saturationAdjust: 0 },
    { shade: '300', lightness: 76, saturationAdjust: 0 },
    { shade: '400', lightness: 64, saturationAdjust: 5 },
    { shade: '500', lightness: 50, saturationAdjust: 10 },
    { shade: '600', lightness: 42, saturationAdjust: 10 },
    { shade: '700', lightness: 34, saturationAdjust: 5 },
    { shade: '800', lightness: 26, saturationAdjust: 0 },
    { shade: '900', lightness: 20, saturationAdjust: -5 },
    { shade: '950', lightness: 12, saturationAdjust: -10 },
  ];

  return shadeConfigs.map(config => {
    const hsl: HSL = {
      h: baseHSL.h,
      s: Math.max(0, Math.min(100, baseHSL.s + config.saturationAdjust)),
      l: config.lightness,
    };
    const rgb = hslToRGB(hsl);
    const hex = rgbToHex(rgb);

    return { shade: config.shade, hex, rgb, hsl };
  });
}

function rotateHue(hsl: HSL, degrees: number): string {
  return hslToHex({ h: (hsl.h + degrees + 360) % 360, s: hsl.s, l: hsl.l });
}

function generateContrastPairs(shades: ColorShade[]): ContrastPair[] {
  const pairs: ContrastPair[] = [];
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  for (const shade of shades) {
    const whiteRatio = contrastRatio(shade.rgb, white);
    const blackRatio = contrastRatio(shade.rgb, black);

    const bestFg = whiteRatio > blackRatio ? '#FFFFFF' : '#000000';
    const bestRatio = Math.max(whiteRatio, blackRatio);

    pairs.push({
      background: shade.hex,
      foreground: bestFg,
      ratio: Math.round(bestRatio * 100) / 100,
      level: contrastLevel(bestRatio),
    });
  }

  return pairs;
}

function generatePalette(hexColor: string, name: string): ColorPalette {
  const rgb = hexToRGB(hexColor);
  const hsl = rgbToHSL(rgb);
  const shades = generateShades(hsl);
  const contrastPairs = generateContrastPairs(shades);

  return {
    baseColor: hexColor.toUpperCase(),
    name,
    shades,
    complementary: rotateHue(hsl, 180),
    analogous: [rotateHue(hsl, -30), rotateHue(hsl, 30)],
    triadic: [rotateHue(hsl, 120), rotateHue(hsl, 240)],
    splitComplementary: [rotateHue(hsl, 150), rotateHue(hsl, 210)],
    contrastPairs,
  };
}

// ── Output Formats ──

function outputTailwind(palette: ColorPalette): string {
  const lines = [
    `// Tailwind CSS config - ${palette.name} palette`,
    `// Generated by color-sys from ${palette.baseColor}`,
    '',
    'module.exports = {',
    '  theme: {',
    '    extend: {',
    '      colors: {',
    `        '${palette.name}': {`,
  ];

  for (const shade of palette.shades) {
    lines.push(`          '${shade.shade}': '${shade.hex}',`);
  }

  lines.push(
    '        },',
    '      },',
    '    },',
    '  },',
    '};',
  );

  return lines.join('\n');
}

function outputCSS(palette: ColorPalette, dark: boolean): string {
  const lines = [
    `/* CSS Custom Properties - ${palette.name} palette */`,
    `/* Generated by color-sys from ${palette.baseColor} */`,
    '',
    ':root {',
  ];

  for (const shade of palette.shades) {
    lines.push(`  --color-${palette.name}-${shade.shade}: ${shade.hex};`);
  }

  lines.push(
    '',
    `  /* Complementary */`,
    `  --color-${palette.name}-complementary: ${palette.complementary};`,
    `  --color-${palette.name}-analogous-1: ${palette.analogous[0]};`,
    `  --color-${palette.name}-analogous-2: ${palette.analogous[1]};`,
    '}',
  );

  if (dark) {
    lines.push(
      '',
      '@media (prefers-color-scheme: dark) {',
      '  :root {',
    );

    // In dark mode, flip the scale (950 becomes the lightest shade for dark backgrounds)
    const reversed = [...palette.shades].reverse();
    const shadeNames = palette.shades.map(s => s.shade);
    for (let i = 0; i < shadeNames.length; i++) {
      lines.push(`    --color-${palette.name}-${shadeNames[i]}: ${reversed[i].hex};`);
    }

    lines.push('  }', '}');
  }

  return lines.join('\n');
}

function outputSCSS(palette: ColorPalette): string {
  const lines = [
    `// SCSS Variables - ${palette.name} palette`,
    `// Generated by color-sys from ${palette.baseColor}`,
    '',
  ];

  for (const shade of palette.shades) {
    lines.push(`$${palette.name}-${shade.shade}: ${shade.hex};`);
  }

  lines.push(
    '',
    `$${palette.name}-complementary: ${palette.complementary};`,
    `$${palette.name}-analogous-1: ${palette.analogous[0]};`,
    `$${palette.name}-analogous-2: ${palette.analogous[1]};`,
    '',
    `// Map for programmatic access`,
    `$${palette.name}-shades: (`,
  );

  for (const shade of palette.shades) {
    lines.push(`  '${shade.shade}': ${shade.hex},`);
  }

  lines.push(');');

  return lines.join('\n');
}

// ── Color Swatch Display ──

function colorBlock(hex: string): string {
  const rgb = hexToRGB(hex);
  // Use 24-bit ANSI color (works in modern terminals)
  return `\x1b[48;2;${rgb.r};${rgb.g};${rgb.b}m  \x1b[0m`;
}

function printPalette(palette: ColorPalette): void {
  console.log(`\n${c.bgGreen}${c.white}${c.bold} COLOR-SYS ${c.reset}\n`);
  console.log(`${c.bold}Base Color:${c.reset} ${colorBlock(palette.baseColor)} ${palette.baseColor}`);
  console.log(`${c.bold}Name:${c.reset}       ${palette.name}\n`);

  // Shade scale
  console.log(`${c.bold}Shade Scale:${c.reset}\n`);
  for (const shade of palette.shades) {
    const block = colorBlock(shade.hex);
    const pair = palette.contrastPairs.find(p => p.background === shade.hex);
    const contrast = pair ? `${c.dim}${pair.ratio}:1 ${pair.level}${c.reset}` : '';
    console.log(`  ${shade.shade.padStart(4)} ${block} ${shade.hex}  ${c.dim}hsl(${shade.hsl.h}, ${shade.hsl.s}%, ${shade.hsl.l}%)${c.reset}  ${contrast}`);
  }

  // Color swatch bar
  console.log('\n  ' + palette.shades.map(s => colorBlock(s.hex)).join(''));

  // Harmony colors
  console.log(`\n${c.bold}Color Harmony:${c.reset}\n`);
  console.log(`  Complementary:        ${colorBlock(palette.complementary)} ${palette.complementary}`);
  console.log(`  Analogous:            ${colorBlock(palette.analogous[0])} ${palette.analogous[0]}  ${colorBlock(palette.analogous[1])} ${palette.analogous[1]}`);
  console.log(`  Triadic:              ${colorBlock(palette.triadic[0])} ${palette.triadic[0]}  ${colorBlock(palette.triadic[1])} ${palette.triadic[1]}`);
  console.log(`  Split Complementary:  ${colorBlock(palette.splitComplementary[0])} ${palette.splitComplementary[0]}  ${colorBlock(palette.splitComplementary[1])} ${palette.splitComplementary[1]}`);

  // WCAG contrast pairs
  console.log(`\n${c.bold}WCAG Contrast Pairs:${c.reset}\n`);
  for (const pair of palette.contrastPairs) {
    const levelColor = pair.level === 'AAA' ? c.green :
      pair.level === 'AA' ? c.blue :
      pair.level === 'AA Large' ? c.yellow : c.red;
    console.log(`  ${colorBlock(pair.background)} ${pair.background} + ${pair.foreground.padEnd(7)}  ${pair.ratio.toFixed(1).padStart(5)}:1  ${levelColor}${pair.level}${c.reset}`);
  }

  console.log('');
}

function isValidHex(hex: string): boolean {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.color) {
    console.error(`${c.red}${c.bold}Error:${c.reset} No color provided.`);
    console.error(`Run ${c.cyan}color-sys --help${c.reset} for usage info.\n`);
    process.exit(1);
  }

  let hexColor = args.color as string;
  if (!hexColor.startsWith('#')) hexColor = '#' + hexColor;

  if (!isValidHex(hexColor)) {
    console.error(`${c.red}${c.bold}Error:${c.reset} Invalid hex color: ${hexColor}`);
    console.error(`${c.dim}Use format: #RGB, #RRGGBB, or RRGGBB${c.reset}\n`);
    process.exit(1);
  }

  const name = (args.name as string) || 'primary';
  const palette = generatePalette(hexColor, name);

  // Output format
  if (args.json) {
    console.log(JSON.stringify(palette, null, 2));
  } else if (args.tailwind) {
    console.log(outputTailwind(palette));
  } else if (args.css) {
    console.log(outputCSS(palette, !!args.dark));
  } else if (args.scss) {
    console.log(outputSCSS(palette));
  } else {
    printPalette(palette);

    // Suggest next steps
    console.log(`${c.yellow}Output Formats:${c.reset}`);
    console.log(`  ${c.dim}Tailwind:${c.reset}  color-sys "${hexColor}" --tailwind`);
    console.log(`  ${c.dim}CSS vars:${c.reset}  color-sys "${hexColor}" --css`);
    console.log(`  ${c.dim}SCSS:${c.reset}      color-sys "${hexColor}" --scss`);
    console.log(`  ${c.dim}Dark mode:${c.reset} color-sys "${hexColor}" --css --dark`);
    console.log(`  ${c.dim}JSON:${c.reset}      color-sys "${hexColor}" --json`);
    console.log('');
  }
}

main();
