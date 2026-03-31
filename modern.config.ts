import { appTools, defineConfig } from '@modern-js/app-tools';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  output: {
    distPath: {
      root: isProd ? 'docs' : 'dist',
      html: './', 
    },
    assetPrefix: isProd ? '/EasyAssemblies/' : '/',
  },
  server: {
    baseUrl: isProd ? '/EasyAssemblies/' : '/',
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