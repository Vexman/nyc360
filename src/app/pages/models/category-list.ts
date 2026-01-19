import { CategoryEnum, CATEGORY_THEMES } from '../Public/Widgets/feeds/models/categories';

export interface CategoryModel {
  id: number | null;
  name: string;
  icon: string;
  path?: string; // Adding optional path
  color?: string; // Adding optional color
}

// Generate the list dynamically from the Source of Truth (CategoryEnum + CATEGORY_THEMES)
export const CATEGORY_LIST: CategoryModel[] = Object.values(CategoryEnum)
  .filter(value => typeof value === 'number') // Filter out the string keys of the Enum
  .map(id => {
    const theme = CATEGORY_THEMES[id as CategoryEnum];
    return {
      id: id as number,
      name: theme ? theme.label : 'Unknown',
      icon: theme ? (theme as any).icon : 'bi-question', // Cast as any just in case, though we added it
      path: theme?.path,
      color: theme?.color
    };
  });

// Helper function to get list with 'All'
export function getCategoriesWithAll(): CategoryModel[] {
  return [
    { id: -1, name: 'All', icon: 'bi-grid-fill' },
    ...CATEGORY_LIST
  ];
}
