export const LANGUAGE_COLORS: Readonly<Record<string, string>> = {
  Python: '#3572A5',
  JavaScript: '#F1E05A',
  TypeScript: '#3178C6',
  Java: '#B07219',
  HTML: '#E34C26',
  CSS: '#563d7c',
  SCSS: '#C6538C',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00ADD8',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#7F52FF',
  Dart: '#00B4AB',
  HCL: '#0298C3',
  Shell: '#89e051',
  C: '#555555',
};

export const DEFAULT_LANGUAGE_COLOR = '#607466';

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? DEFAULT_LANGUAGE_COLOR;
}
