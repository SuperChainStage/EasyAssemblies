import { appTools, defineConfig } from '@modern-js/app-tools';

const isProd = process.env.NODE_ENV === 'production';
const githubPagesBase = '/EasyAssemblies/';
const distRoot = isProd ? 'docs' : 'dist';
const appBase = isProd ? githubPagesBase : '/';

export default defineConfig({
  output: {
    distPath: {
      root: distRoot,
      html: './',
    },
    assetPrefix: appBase,
  },
  server: {
    baseUrl: appBase,
  },
  html: {
    outputStructure: 'flat',
  },
  source: {
    mainEntryName: 'index',
  },
  plugins: [appTools()],
});
