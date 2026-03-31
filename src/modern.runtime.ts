import { defineRuntimeConfig } from '@modern-js/runtime';

const useHashRouterInProduction = process.env.NODE_ENV === 'production';

export default defineRuntimeConfig({
  router: {
    supportHtml5History: !useHashRouterInProduction,
  },
});
