import { appTools, defineConfig } from '@modern-js/app-tools';

const isProd = process.env.NODE_ENV === 'production';
const githubPagesBase = '/EasyAssemblies/';
const distRoot = isProd ? 'docs' : 'dist';
const assetBase = isProd ? githubPagesBase : '/';

export default defineConfig({
  output: {
    distPath: {
      root: distRoot,
      html: './',
    },
    assetPrefix: assetBase,
  },
  server: {
    baseUrl: '/',
  },
  html: {
    outputStructure: 'flat',
  },
  source: {
    mainEntryName: 'index',
  },
  plugins: [appTools()],
});
