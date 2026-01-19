// 1) Same enum as the Backend (exact numeric match)
// 1) نفس الـ Enum الموجود في الـ Backend بالظبط (بنفس القيم الرقمية)
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
  Tv = 11,
}

// 2) Theme type
// 2) نوع الثيم
export type CategoryTheme = Readonly<{
  bg: string; // EN: Background color | AR: لون الخلفية
  stroke: string; // EN: Border / outline | AR: لون الحدود
  color: string; // EN: Primary brand color | AR: اللون الأساسي
  label: string; // EN: Display label | AR: اسم العرض
  path: string; // EN: URL path | AR: مسار الرابط
}>;

// 3) Helper to reference CSS variables
// 3) دالة مساعدة لاستخدام CSS variables
const cssVar = (token: string) => `var(${token})`;

// 4) Category theme map (CSS vars, original `color` preserved)
// 4) خريطة الثيمات لكل قسم (باستخدام CSS vars مع الحفاظ على اسم color)
export const CATEGORY_THEMES: Readonly<Record<CategoryEnum, CategoryTheme>> = {
  [CategoryEnum.Community]: {
    bg: cssVar('--community-bg'),
    stroke: cssVar('--community-stroke'),
    color: cssVar('--community-color'),
    label: 'Community',
    path: 'community',
    icon: 'bi-people-fill' ,
  },

  [CategoryEnum.Culture]: {
    bg: cssVar('--culture-bg'),
    stroke: cssVar('--culture-stroke'),
    color: cssVar('--culture-color'),
    label: 'Culture',
    path: 'culture',
    icon: 'bi-palette-fill',
  },

  [CategoryEnum.Education]: {
    bg: cssVar('--education-bg'),
    stroke: cssVar('--education-stroke'),
    color: cssVar('--education-color'),
    label: 'Education',
    path: 'education',
    icon: 'bi-mortarboard-fill',
  },

  [CategoryEnum.Housing]: {
    bg: cssVar('--housing-bg'),
    stroke: cssVar('--housing-stroke'),
    color: cssVar('--housing-color'),
    label: 'Housing',
    path: 'housing',
    icon: 'bi-house-door-fill',
  },

  [CategoryEnum.Health]: {
    bg: cssVar('--health-bg'),
    stroke: cssVar('--health-stroke'),
    color: cssVar('--health-color'),
    label: 'Health',
    path: 'health',
    icon: 'bi-heart-pulse-fill',
  },

  [CategoryEnum.Legal]: {
    bg: cssVar('--legal-bg'),
    stroke: cssVar('--legal-stroke'),
    color: cssVar('--legal-color'),
    label: 'Legal',
    path: 'legal',
    icon: 'bi-hammer',
  },

  [CategoryEnum.Lifestyle]: {
    bg: cssVar('--lifestyle-bg'),
    stroke: cssVar('--lifestyle-stroke'),
    color: cssVar('--lifestyle-color'),
    label: 'Lifestyle',
    path: 'lifestyle',
    icon: 'bi-cup-hot-fill',
  },

  [CategoryEnum.News]: {
    bg: cssVar('--news-bg'),
    stroke: cssVar('--news-stroke'),
    color: cssVar('--news-color'),
    label: 'News',
    path: 'news',
    icon: 'bi-newspaper',
  },

  [CategoryEnum.Professions]: {
    bg: cssVar('--professions-bg'),
    stroke: cssVar('--professions-stroke'),
    color: cssVar('--professions-color'),
    label: 'Professions',
    path: 'professions',
    icon: 'bi-briefcase-fill',
  },

  [CategoryEnum.Social]: {
    bg: cssVar('--social-bg'),
    stroke: cssVar('--social-stroke'),
    color: cssVar('--social-color'),
    label: 'Social',
    path: 'social',
    icon: 'bi-chat-quote-fill',
  },

  [CategoryEnum.Transportation]: {
    bg: cssVar('--transportation-bg'),
    stroke: cssVar('--transportation-stroke'),
    color: cssVar('--transportation-color'),
    label: 'Transportation',
    path: 'transportation',
    icon: 'bi-car-front-fill',
  },

  [CategoryEnum.Tv]: {
    bg: cssVar('--tv-bg'),
    stroke: cssVar('--tv-stroke'),
    color: cssVar('--tv-color'),
    label: 'TV',
    path: 'tv',
    icon: 'bi-tv-fill',
  },
} as const;
