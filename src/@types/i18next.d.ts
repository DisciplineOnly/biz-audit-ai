import 'i18next';
import type common from '../../public/locales/en/common.json';
import type landing from '../../public/locales/en/landing.json';
import type steps from '../../public/locales/en/steps.json';
import type generating from '../../public/locales/en/generating.json';
import type report from '../../public/locales/en/report.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      landing: typeof landing;
      steps: typeof steps;
      generating: typeof generating;
      report: typeof report;
    };
  }
}
