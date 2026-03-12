import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

const SITE_URL = (env.PUBLIC_SITE_URL || 'https://hostify.dev').replace(/\/$/, '');

const routes = ['/', '/auth', '/dash', '/deploy'];

const buildSitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
	.map(
		(route) => `  <url>
    <loc>${SITE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.7'}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

export const GET: RequestHandler = () => {
	return new Response(buildSitemap(), {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
