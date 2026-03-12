<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { LandingPage } from '$lib';

	const siteUrl = (env.PUBLIC_SITE_URL || 'https://hostify.dev').replace(/\/$/, '');
	const socialImage = `${siteUrl}/favicon.svg`;
	const title = 'Hostify | Deploy static sites from GitHub in minutes';
	const description =
		'Hostify lets you connect GitHub, auto-build, and deploy static sites with zero friction. Simple auth, live previews, and secure hosting.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={socialImage} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={socialImage} />
	<script type="application/ld+json">
		{JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'SoftwareApplication',
			name: 'Hostify',
			description,
			applicationCategory: 'WebApplication',
			operatingSystem: 'Any',
			url: siteUrl,
			publisher: {
				'@type': 'Organization',
				name: 'Hostify'
			},
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'USD'
			}
		})}
	</script>
</svelte:head>

<LandingPage />
