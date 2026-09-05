/// <reference types="vite/client" />
import React from 'react';
import { GameIcon, GameIconProps } from '../../game_icons';

export interface IconDefinition {
  name: string;
  category: string;
  path: string;
  innerHtml: string;
  viewBox: string;
  label: string;
  description: string;
  fullPath: string;
}

// Build-time autodiscovery of all SVG icons in public/assets/icons/svg/
const svgModules = import.meta.glob('../../../public/assets/icons/svg/**/*.svg', { query: '?raw', eager: true }) as Record<
  string,
  string | { default: string }
>;

function parseSvgModule(filePath: string, rawInput: string | { default: string }): IconDefinition {
  const rawContent = typeof rawInput === 'string' ? rawInput : rawInput?.default || '';

  // Extract category and name from filepath
  const relPath = filePath.replace(/^.*public\/assets\/icons\/svg\//, '');
  const parts = relPath.split('/');
  const fileName = parts.pop() || '';
  const canonicalName = fileName.replace(/\.svg$/i, '');
  const category = parts.length > 0 ? parts.join('/') : 'root';

  // Extract viewBox
  const viewBoxMatch = rawContent.match(/viewBox=["\']([^"\']+)["\']/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 512 512';

  // Extract metadata attributes
  const labelMatch = rawContent.match(/data-label=["\']([^"\']+)["\']/i);
  const descMatch = rawContent.match(/data-description=["\']([^"\']+)["\']/i);
  const label = labelMatch ? labelMatch[1] : canonicalName;
  const description = descMatch ? descMatch[1] : '';

  // Extract inner SVG content
  let innerHtml = rawContent
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .trim();
  const svgMatch = innerHtml.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (svgMatch) {
    innerHtml = svgMatch[1].trim();
  }

  // Extract first path d attribute if available
  const pathMatch = rawContent.match(/<path[^>]*d=["\']([^"\']+)["\']/i);
  const path = pathMatch ? pathMatch[1] : '';

  return {
    name: canonicalName,
    category,
    path,
    innerHtml,
    viewBox,
    label,
    description,
    fullPath: filePath,
  };
}

const ALL_ICON_DEFINITIONS: Record<string, IconDefinition> = {};
const CATEGORY_MAPS: Record<string, Record<string, IconDefinition>> = {};
const AMBIGUOUS_NAMES = new Set<string>();

Object.entries(svgModules).forEach(([filePath, moduleContent]) => {
  const iconDef = parseSvgModule(filePath, moduleContent);
  const normalizedKey = iconDef.name.replace(/-/g, '_');

  // 1. Populate category maps
  if (!CATEGORY_MAPS[iconDef.category]) {
    CATEGORY_MAPS[iconDef.category] = {};
  }
  CATEGORY_MAPS[iconDef.category][iconDef.name] = iconDef;
  CATEGORY_MAPS[iconDef.category][normalizedKey] = iconDef;

  // 2. Populate category-qualified keys in global registry
  ALL_ICON_DEFINITIONS[`${iconDef.category}/${iconDef.name}`] = iconDef;
  ALL_ICON_DEFINITIONS[`${iconDef.category}/${normalizedKey}`] = iconDef;
  ALL_ICON_DEFINITIONS[`${iconDef.category}:${iconDef.name}`] = iconDef;
  ALL_ICON_DEFINITIONS[`${iconDef.category}:${normalizedKey}`] = iconDef;

  // 3. Detect duplicate bare names across categories explicitly
  const registerStandalone = (key: string) => {
    if (AMBIGUOUS_NAMES.has(key)) {
      delete ALL_ICON_DEFINITIONS[key];
      return;
    }

    const existing = ALL_ICON_DEFINITIONS[key];
    if (existing && existing.category !== iconDef.category) {
      AMBIGUOUS_NAMES.add(key);
      AMBIGUOUS_NAMES.add(iconDef.name);
      AMBIGUOUS_NAMES.add(normalizedKey);
      delete ALL_ICON_DEFINITIONS[key];
    } else if (!existing) {
      ALL_ICON_DEFINITIONS[key] = iconDef;
    }
  };

  registerStandalone(iconDef.name);
  registerStandalone(normalizedKey);
});

// Category specific indices
export const UI_ICONS = CATEGORY_MAPS['ui'] || {};
export const MINIGAME_ICONS = CATEGORY_MAPS['minigame'] || {};
export const MINIGAMES_ICONS = MINIGAME_ICONS;
export const CURRENCY_ICONS = CATEGORY_MAPS['currency'] || {};
export const SKILL_ICONS = CATEGORY_MAPS['skill'] || {};
export const DICE_ICONS = CATEGORY_MAPS['dice'] || {};
export const WORLD_ATLAS_ICONS = CATEGORY_MAPS['world_atlas'] || {};
export const BOOK_READER_ICONS = CATEGORY_MAPS['book_reader'] || {};
export const EQUIPMENT_DOLL_ICONS = CATEGORY_MAPS['equipment_doll'] || {};

// Legacy backward-compatibility path dictionary
export const ALL_ICONS: Record<string, string> = {};
Object.entries(ALL_ICON_DEFINITIONS).forEach(([key, def]) => {
  ALL_ICONS[key] = def.path || def.innerHtml;
});

export const ALL_ICON_DEFS = ALL_ICON_DEFINITIONS;

export function getIconDefinition(name: string, category?: string): IconDefinition | undefined {
  if (!name) return undefined;

  let reqCat = category;
  let reqName = name;

  // Handle slash or colon formatted names like "action/move" or "action:move"
  if (!reqCat && (name.includes('/') || name.includes(':'))) {
    const splitChar = name.includes('/') ? '/' : ':';
    const parts = name.split(splitChar);
    reqCat = parts[0];
    reqName = parts.slice(1).join(splitChar);
  }

  const normName = reqName.replace(/-/g, '_');

  if (reqCat) {
    const normCat = reqCat.replace(/-/g, '_');
    const catMap = CATEGORY_MAPS[reqCat] || CATEGORY_MAPS[normCat];
    if (catMap) {
      if (catMap[reqName]) return catMap[reqName];
      if (catMap[normName]) return catMap[normName];
    }
    const catQualifiedKey = `${reqCat}/${normName}`;
    if (ALL_ICON_DEFINITIONS[catQualifiedKey]) return ALL_ICON_DEFINITIONS[catQualifiedKey];
  }

  // Bare lookups fail deterministically if ambiguous
  if (AMBIGUOUS_NAMES.has(reqName) || AMBIGUOUS_NAMES.has(normName)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[GameIcon] Ambiguous bare icon name "${name}". Specify category e.g. "category/${name}".`);
    }
    return undefined;
  }

  return ALL_ICON_DEFINITIONS[normName] || ALL_ICON_DEFINITIONS[reqName];
}

export { GameIcon, GameIcon as Icon };
export type { GameIconProps };

/**
 * Compatibility helper for components using the legacy getIcon pattern
 */
export const getIcon = (category: string, name: string, props: any = {}) => {
  const iconName = category ? `${category}/${name}` : name;
  return React.createElement(GameIcon, { name: iconName, ...props });
};
