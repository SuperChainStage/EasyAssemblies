import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  output: {
    distPath: {
      root: 'docs',
      html: './', 
    },
    assetPrefix: '/EasyAssemblies/',
  },
  server: {
    baseUrl: '/EasyAssemblies/',
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