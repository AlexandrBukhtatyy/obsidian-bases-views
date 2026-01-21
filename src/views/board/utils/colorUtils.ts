/**
 * Color utilities for Board view - Notion-style.
 * Generates consistent colors for status badges based on value hash.
 * Optimized for dark theme with vibrant, saturated colors.
 */

export interface BadgeColors {
  background: string;
  text: string;
  border: string;
}

/**
 * Simple string hash function (djb2 algorithm).
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Notion-style color palette for badges.
 * These are the primary Notion colors, optimized for dark theme.
 */
const NOTION_COLORS: BadgeColors[] = [
  // Red/Pink
  { background: 'rgba(255, 115, 105, 0.5)', text: '#ff7369', border: 'rgba(255, 115, 105, 0.3)' },
  // Orange
  { background: 'rgba(255, 163, 68, 0.5)', text: '#ffa344', border: 'rgba(255, 163, 68, 0.3)' },
  // Yellow
  { background: 'rgba(255, 220, 73, 0.5)', text: '#ffdc49', border: 'rgba(255, 220, 73, 0.3)' },
  // Green
  { background: 'rgba(77, 171, 154, 0.5)', text: '#4dab9a', border: 'rgba(77, 171, 154, 0.3)' },
  // Blue
  { background: 'rgba(82, 156, 202, 0.5)', text: '#529cca', border: 'rgba(82, 156, 202, 0.3)' },
  // Purple
  { background: 'rgba(154, 109, 215, 0.5)', text: '#9a6dd7', border: 'rgba(154, 109, 215, 0.3)' },
  // Pink
  { background: 'rgba(226, 85, 161, 0.5)', text: '#e255a1', border: 'rgba(226, 85, 161, 0.3)' },
  // Brown
  { background: 'rgba(147, 114, 100, 0.5)', text: '#937264', border: 'rgba(147, 114, 100, 0.3)' },
  // Teal
  { background: 'rgba(68, 131, 170, 0.5)', text: '#4483aa', border: 'rgba(68, 131, 170, 0.3)' },
  // Coral
  { background: 'rgba(255, 134, 111, 0.5)', text: '#ff866f', border: 'rgba(255, 134, 111, 0.3)' },
  // Lime
  { background: 'rgba(133, 211, 108, 0.5)', text: '#85d36c', border: 'rgba(133, 211, 108, 0.3)' },
  // Violet
  { background: 'rgba(130, 80, 223, 0.5)', text: '#8250df', border: 'rgba(130, 80, 223, 0.3)' },
];

/**
 * Generate consistent colors from a string value using Notion palette.
 * Same value always produces same color.
 */
export function generateColorFromValue(value: string): BadgeColors {
  const hash = hashString(value);
  const colorIndex = hash % NOTION_COLORS.length;
  return NOTION_COLORS[colorIndex];
}

/**
 * Predefined colors for common status values.
 * These match typical Notion-style colors.
 */
const PREDEFINED_COLORS: Record<string, BadgeColors> = {
  'No Status': {
    background: 'rgba(128, 128, 128, 0.3)',
    text: 'var(--text-muted)',
    border: 'rgba(128, 128, 128, 0.2)',
  },
  'Uncategorized': {
    background: 'rgba(128, 128, 128, 0.3)',
    text: 'var(--text-muted)',
    border: 'rgba(128, 128, 128, 0.2)',
  },
  'No Category': {
    background: 'rgba(128, 128, 128, 0.3)',
    text: 'var(--text-muted)',
    border: 'rgba(128, 128, 128, 0.2)',
  },
};

/**
 * Get color for a value, checking predefined colors first.
 */
export function getColorForValue(value: string): BadgeColors {
  // Check for predefined colors
  if (PREDEFINED_COLORS[value]) {
    return PREDEFINED_COLORS[value];
  }

  // Generate color from value hash
  return generateColorFromValue(value);
}

/**
 * Get contrasting text color based on background lightness.
 */
export function getContrastingTextColor(bgLightness: number): string {
  return bgLightness > 60 ? 'hsl(0, 0%, 20%)' : 'hsl(0, 0%, 95%)';
}
