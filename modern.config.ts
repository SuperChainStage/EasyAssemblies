import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    distPath: {
      html: './', 
    },
  },
  html: {
    outputStructure: 'flat',
  },
  source: {
    mainEntryName: 'index',
  },
  plugins:[
    appTools(),
  ],
});