import { localesForRoute, pathForRoute, routePaths, type SiteRoute } from '../config/locales';

const origin = 'https://qognito.io';

export function GET() {
  const routes = Object.keys(routePaths) as SiteRoute[];
  const urls = routes.flatMap(route => localesForRoute(route).map(locale => {
    const alternates = localesForRoute(route).map(alternateLocale =>
      `<xhtml:link rel="alternate" hreflang="${alternateLocale}" href="${origin}${pathForRoute(route, alternateLocale)}" />`,
    ).join('');
    return `<url><loc>${origin}${pathForRoute(route, locale)}</loc>${alternates}</url>`;
  })).join('');

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
