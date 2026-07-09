
import React from 'react';
import { ALL_ICONS } from './index';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number | string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className = '',
  ...props
}) => {
  // Normalize naming: kebab-case to snake_case
  const normalizedName = name.replace(/-/g, '_');

  // Try to find the icon path
  let path = ALL_ICONS[normalizedName as keyof typeof ALL_ICONS];

  // Fallback for common renames or missing icons
  if (path === undefined || path === "") {
    const fallbacks: Record<string, string> = {
      'gold_coin': 'coin',
      'gold': 'coin',
      'thinking': 'brain',
      'skull': 'death',
      'close': 'x',
      'alert': 'alert_triangle',
      'wrench': 'settings',
      'dice_5': 'roll_dice',
      'sparkles': 'magic',
      'swords': 'athletics',
      'target': 'place',
      'scroll': 'document',
      'refresh': 'refresh',
      'play': 'play',
      'hand': 'grab',
      'crown': 'award',
      'trophy': 'award',
      'hourglass': 'nature',
      'book_open': 'open_book',
      'hammer': 'wrench',
      'message_square': 'info'
    };

    const fallbackName = fallbacks[normalizedName];
    if (fallbackName) {
      path = ALL_ICONS[fallbackName as keyof typeof ALL_ICONS];
    }
  }

  if (path === undefined || path === "") {
    // If still not found, search for anything containing the name
    const similarKey = Object.keys(ALL_ICONS).find(k => k.includes(normalizedName));
    if (similarKey) {
      const similarPath = ALL_ICONS[similarKey as keyof typeof ALL_ICONS];
      if (similarPath) path = similarPath;
    }
  }

  // Only warn if absolutely not found in any form
  if (!(normalizedName in ALL_ICONS) && (path === undefined || path === "")) {
    console.warn(`Icon "${name}" (normalized: "${normalizedName}") not found in icon system.`);
    return null;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d={path} />
    </svg>
  );
};
