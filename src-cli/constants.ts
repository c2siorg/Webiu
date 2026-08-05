/**
 * Centralized Constants for Webiu CLI (create-webiu)
 */

export const VERSION = '2.1.0';

export const WEBIU_REPO = 'https://github.com/TarunyaProgrammer/Webiu.git';
export const WEBIU_BRANCH = 'webiu-npm-pack';

export interface NavbarSectionChoice {
  name: string;
  value: string;
  disabled?: boolean;
  checked?: boolean;
}

export const ALL_NAVBAR_SECTIONS: NavbarSectionChoice[] = [
  { name: '🏠 Home          (always included)', value: 'home', disabled: true },
  { name: '📁 Projects', value: 'projects', checked: true },
  { name: '📰 Publications', value: 'publications', checked: true },
  { name: '👥 Contributors', value: 'contributors', checked: true },
  { name: '🌐 Community', value: 'community', checked: true },
  { name: '💼 Opportunities', value: 'opportunities', checked: true },
  { name: '🎓 GSoC (Google Summer of Code)', value: 'gsoc', checked: true },
];
