import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

// Copy extension files to dist
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    closeBundle() {
      // Create directories
      const dirs = [
        'dist/src/assets',
        'dist/src/background',
        'dist/src/content',
        'dist/src/help',
        'dist/src/options',
        'dist/src/popup',
        'dist/src/report',
        'dist/src/utils/patterns'
      ];
      
      dirs.forEach(dir => {
        try {
          mkdirSync(dir, { recursive: true });
        } catch (err) {
          console.error(`Error creating directory ${dir}:`, err);
        }
      });

      // Files to copy
      const files = [
        ['manifest.json', 'dist/manifest.json'],
        ['src/assets/icon-16.png', 'dist/src/assets/icon-16.png'],
        ['src/assets/icon-48.png', 'dist/src/assets/icon-48.png'],
        ['src/assets/icon-128.png', 'dist/src/assets/icon-128.png'],
        ['src/background/background.js', 'dist/src/background/background.js'],
        ['src/content/content.js', 'dist/src/content/content.js'],
        ['src/content/content.css', 'dist/src/content/content.css'],
        ['src/help/help.html', 'dist/src/help/help.html'],
        ['src/help/help.css', 'dist/src/help/help.css'],
        ['src/options/options.html', 'dist/src/options/options.html'],
        ['src/options/options.css', 'dist/src/options/options.css'],
        ['src/options/options.js', 'dist/src/options/options.js'],
        ['src/popup/popup.html', 'dist/src/popup/popup.html'],
        ['src/popup/popup.css', 'dist/src/popup/popup.css'],
        ['src/popup/popup.js', 'dist/src/popup/popup.js'],
        ['src/report/report.html', 'dist/src/report/report.html'],
        ['src/report/report.css', 'dist/src/report/report.css'],
        ['src/report/report.js', 'dist/src/report/report.js'],
        ['src/utils/helpers.js', 'dist/src/utils/helpers.js'],
        ['src/utils/policyChecker.js', 'dist/src/utils/policyChecker.js'],
        ['src/utils/settings.js', 'dist/src/utils/settings.js'],
        ['src/utils/patterns/ethicalConcerns.js', 'dist/src/utils/patterns/ethicalConcerns.js'],
        ['src/utils/patterns/promptInjection.js', 'dist/src/utils/patterns/promptInjection.js'],
        ['src/utils/patterns/proprietaryInfo.js', 'dist/src/utils/patterns/proprietaryInfo.js'],
        ['src/utils/patterns/sensitiveData.js', 'dist/src/utils/patterns/sensitiveData.js']
      ];

      files.forEach(([src, dest]) => {
        try {
          copyFileSync(src, dest);
        } catch (err) {
          console.error(`Error copying ${src} to ${dest}:`, err);
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
      }
    }
  }
});