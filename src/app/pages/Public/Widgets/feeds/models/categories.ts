// 1. نفس الـ Enum اللي في الـ Backend بالظبط
export enum CategoryEnum {
  Community = 0,
  Culture = 1,
  Education = 2,
  Housing = 3,
  Health = 4,
  Legal = 5,
  Lifestyle = 6,
  News = 7,
  Professions = 8,
  Social = 9,
  Transportation = 10,
  Tv = 11
}

// 2. خريطة الألوان لكل قسم (بناء على الصورة اللي بعتها)
// 2. خريطة الألوان لكل قسم (بناء على الصورة اللي بعتها)
export const CATEGORY_THEMES = {
  [CategoryEnum.Community]: { color: '#ff7f50', label: 'Community', path: 'community', icon: 'bi-people-fill' }, // Orange
  [CategoryEnum.Culture]: { color: '#dc3545', label: 'Culture', path: 'culture', icon: 'bi-palette-fill' },       // Red
  [CategoryEnum.Education]: { color: '#0056b3', label: 'Education', path: 'education', icon: 'bi-mortarboard-fill' }, // Dark Blue
  [CategoryEnum.Housing]: { color: '#6c757d', label: 'Housing', path: 'housing', icon: 'bi-house-door-fill' },       // Grey (Example)
  [CategoryEnum.Health]: { color: '#00c3ff', label: 'Health', path: 'health', icon: 'bi-heart-pulse-fill' },          // Cyan
  [CategoryEnum.Legal]: { color: '#102a43', label: 'Legal', path: 'legal', icon: 'bi-hammer' },             // Navy
  [CategoryEnum.Lifestyle]: { color: '#8bc34a', label: 'Lifestyle', path: 'lifestyle', icon: 'bi-cup-hot-fill' }, // Green
  [CategoryEnum.News]: { color: '#333333', label: 'News', path: 'news', icon: 'bi-newspaper' },                // Black
  [CategoryEnum.Professions]: { color: '#2ecc71', label: 'Professions', path: 'professions', icon: 'bi-briefcase-fill' },
  [CategoryEnum.Social]: { color: '#17a2b8', label: 'Social', path: 'social', icon: 'bi-chat-quote-fill' },
  [CategoryEnum.Transportation]: { color: '#f1c40f', label: 'Transportation', path: 'transportation', icon: 'bi-car-front-fill' }, // Yellow
  [CategoryEnum.Tv]: { color: '#0d47a1', label: 'TV', path: 'tv', icon: 'bi-tv-fill' }
};