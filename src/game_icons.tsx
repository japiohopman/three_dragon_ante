import React from 'react';
import { getIconDefinition, IconDefinition, ALL_ICON_DEFS } from './assets/icons';

export interface GameIconProps extends React.SVGAttributes<SVGElement> {
  name?: string;
  size?: number | string;
  color?: string;
  fallbackName?: string;
  title?: string;
}

const LEGACY_FALLBACK_MAP: Record<string, string> = {
  gold_coin: 'coin',
  gold: 'coin',
  thinking: 'brain',
  skull: 'death',
  close: 'x',
  alert: 'alert_triangle',
  wrench: 'settings',
  roll_dice: 'dice_roll',
  dices: 'dice_roll',
  sparkles: 'magic_effect',
  swords: 'athletics',
  target: 'place',
  scroll: 'document',
  refresh: 'refresh',
  play: 'play',
  play_card: 'play_card',
  hand: 'grab',
  crown: 'award',
  trophy: 'award',
  hourglass: 'hourglass',
  book_open: 'read_mode',
  hammer: 'hammer',
  message_square: 'info',
  flame: 'fire',
  mic: 'speaker_on',
};

export const GameIcon: React.FC<GameIconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  fill,
  fallbackName,
  title,
  className = '',
  ...props
}) => {
  if (name === '' && !fallbackName) {
    return null;
  }

  const rawName = name || fallbackName || '';
  if (!rawName) return null;

  const normalizedName = rawName.replace(/-/g, '_');

  let iconDef: IconDefinition | undefined = getIconDefinition(normalizedName);

  if (!iconDef) {
    const alias = LEGACY_FALLBACK_MAP[normalizedName];
    if (alias) {
      iconDef = getIconDefinition(alias);
    }
  }

  if (!iconDef && fallbackName) {
    const normalizedFallback = fallbackName.replace(/-/g, '_');
    iconDef = getIconDefinition(normalizedFallback) || getIconDefinition(LEGACY_FALLBACK_MAP[normalizedFallback] || '');
  }

  if (!iconDef) {
    // Search substring match if available
    const similarKey = Object.keys(ALL_ICON_DEFS).find((k) => k.includes(normalizedName));
    if (similarKey) {
      iconDef = ALL_ICON_DEFS[similarKey];
    }
  }

  if (!iconDef) {
    if (process.env.NODE_ENV !== 'production' && rawName !== '') {
      console.warn(`[GameIcon] Icon "${rawName}" (normalized: "${normalizedName}") not found in Solo SVG icon system.`);
    }
    return null;
  }

  const viewBox = iconDef.viewBox || '0 0 512 512';
  const iconFill = fill || color;

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={iconFill}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {title && <title>{title}</title>}
      {iconDef.innerHtml ? (
        <g dangerouslySetInnerHTML={{ __html: iconDef.innerHtml }} />
      ) : (
        <path d={iconDef.path} />
      )}
    </svg>
  );
};

export default GameIcon;
