export type SiteLocale = 'fr' | 'en' | 'es';

export const localeLabels: Record<SiteLocale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

export const routePaths = {
  home: { fr: '/', en: '/en/', es: '/es/' },
  blog: { fr: '/blog', en: '/en/blog', es: '/es/blog' },
  graph: { fr: '/graphe-des-procedes', en: '/en/graphe-des-procedes', es: '/es/graphe-des-procedes' },
  formations: { fr: '/formations', en: '/en/formations', es: '/es/formations' },
  parcours: { fr: '/parcours', en: '/en/parcours', es: '/es/parcours' },
  encodeur: { fr: '/encodeur', en: '/en/encodeur', es: '/es/encodeur' },
  whitepaper: {
    fr: '/livres-blancs/la-facture-fantome-ia',
    en: '/en/livres-blancs/la-facture-fantome-ia',
    es: '/es/livres-blancs/la-facture-fantome-ia',
  },
  legal: { fr: '/mentions-legales', es: '/es/mentions-legales' },
  privacy: { fr: '/confidentialite', es: '/es/confidentialite' },
} as const;

export type SiteRoute = keyof typeof routePaths;

function normalizedPath(path: string): string {
  const clean = path.replace(/\/+$/, '');
  return clean || '/';
}

export function routeForPath(path: string): SiteRoute {
  const current = normalizedPath(path);
  for (const [route, paths] of Object.entries(routePaths) as [SiteRoute, Partial<Record<SiteLocale, string>>][]) {
    if (Object.values(paths).some(candidate => candidate && normalizedPath(candidate) === current)) return route;
  }
  return 'home';
}

export function pathForRoute(route: SiteRoute, locale: SiteLocale): string {
  const paths = routePaths[route] as Partial<Record<SiteLocale, string>>;
  return paths[locale] || routePaths.home[locale];
}

export function localesForRoute(route: SiteRoute): SiteLocale[] {
  const paths = routePaths[route] as Partial<Record<SiteLocale, string>>;
  return (['fr', 'en', 'es'] as const).filter(locale => Boolean(paths[locale]));
}

export function languageLinks(path: string, currentLocale: SiteLocale) {
  const route = routeForPath(path);
  return (['fr', 'en', 'es'] as const).map(locale => ({
    locale,
    href: pathForRoute(route, locale),
    label: locale.toUpperCase(),
    title: localeLabels[locale],
    current: locale === currentLocale,
  }));
}

export function legalPath(locale: SiteLocale, page: 'legal' | 'privacy'): string {
  const paths = routePaths[page] as Partial<Record<SiteLocale, string>>;
  return paths[locale] || paths.fr!;
}
