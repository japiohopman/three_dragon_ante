import React from 'react';
import { UI_ICONS } from './ui';
// Icon system index - Refactored for consistency
import { CURRENCY_ICONS } from './currency';
import { SKILL_ICONS } from './skill';
import { BOOK_READER_ICONS } from './book_reader';
import { MINIGAMES_ICONS } from './minigames';
import { Icon } from './Icon';

/**
 * @deprecated Use tactical imports from specific icon files instead of ALL_ICONS
 * to reduce bundle size.
 */
export const ALL_ICONS = {
  ...UI_ICONS,
  ...CURRENCY_ICONS,
  ...SKILL_ICONS,
  ...BOOK_READER_ICONS,
  ...MINIGAMES_ICONS,
};

export {
  UI_ICONS,
  CURRENCY_ICONS,
  SKILL_ICONS,
  BOOK_READER_ICONS,
  MINIGAMES_ICONS,
  Icon
};

/**
 * Compatibility helper for components using the legacy getIcon pattern
 */
export const getIcon = (category: string, name: string, props: any = {}) => {
  return React.createElement(Icon, { name, ...props });
};
