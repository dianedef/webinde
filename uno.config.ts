import type { IconifyJSON } from '@iconify/types';
import {
  defineConfig,
  presetIcons,
  presetWind,
  presetTypography,
} from 'unocss';
import colors from './src/components/config/colors.json';

export default defineConfig({
  presets: [
    presetWind(),
    presetIcons({
      collections: {
        logos: () =>
          import('@iconify-json/logos/icons.json').then((i) => i.default as IconifyJSON),
        uil: () =>
          import('@iconify-json/uil/icons.json').then((l) => l.default as IconifyJSON),
      },
    }),
    presetTypography(),
  ],
  theme: {
    colors: {
      softWhite: colors.softWhite,
    },
  },
  rules: [
    ['dark-text', { color: colors.softWhite }],
    ['dark-bg', { backgroundColor: '#1a1a1a' }],
    // Règles spécifiques pour la prose en mode sombre
    [/^prose-dark$/, () => ({
      '--un-prose-headings': colors.softWhite,
      '--un-prose-body': colors.softWhite,
      '--un-prose-links': colors.softWhite,
      '--un-prose-lists': colors.softWhite,
      '--un-prose-hr': colors.softWhite,
      '--un-prose-captions': colors.softWhite,
      '--un-prose-code': colors.softWhite,
      '--un-prose-borders': colors.softWhite,
      '--un-prose-bg-soft': '#1a1a1a',
    })],
  ],
  shortcuts: {
    'dark-mode': 'dark:text-softWhite dark:bg-black prose-dark',
  },
});
