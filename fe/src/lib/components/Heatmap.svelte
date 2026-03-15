<script lang="ts">
	import type { Theme } from '$lib/stores/theme';

	export let data: { label: string; values: number[] }[] = [
		{ label: 'Mon', values: [2, 4, 1, 0, 3, 5, 6] },
		{ label: 'Tue', values: [0, 1, 2, 3, 4, 5, 8] },
		{ label: 'Wed', values: [1, 0, 0, 2, 3, 4, 2] },
		{ label: 'Thu', values: [3, 2, 5, 6, 4, 3, 1] },
		{ label: 'Fri', values: [4, 6, 7, 5, 6, 8, 9] },
		{ label: 'Sat', values: [2, 1, 0, 1, 2, 3, 2] },
		{ label: 'Sun', values: [0, 0, 1, 2, 1, 0, 1] }
	];

	export let theme: Theme = 'light';

	const heatmapPalette: Record<Theme, string[]> = {
		light: ['#eaf4ff', '#c8e4ff', '#92c7ff', '#5399ff', '#1b6bff'],
		dark: ['#1f2937', '#1e3a5c', '#214c7f', '#2663b2', '#57a5ff'],
		sunset: ['#fdf6e3', '#e2d8a0', '#d3b76c', '#c1943c', '#8b5b1f']
	};

	let currentPalette = heatmapPalette[theme] ?? heatmapPalette.light;

	const heatmapWeekFilter = ['Mon', 'Wed', 'Fri'];
	const heatmapMonthNames = [
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
		'Jan',
		'Feb',
		'Mar'
	];

	let heatmapColumns = data?.[0]?.values.length ?? 0;
	let heatmapMonthLabels: string[] = [];
	let heatmapMax = 1;

	$: currentPalette = heatmapPalette[theme] ?? heatmapPalette.light;
	$: heatmapColumns = data?.[0]?.values.length ?? 0;
	$: heatmapMonthLabels = Array.from(
		{ length: heatmapColumns },
		(_, idx) => heatmapMonthNames[idx] || ''
	);
	$: heatmapMax = data?.length ? Math.max(...data.flatMap((row) => row.values)) : 1;

	function getHeatColor(value: number, palette: string[]) {
		const bucket = Math.min(
			palette.length - 1,
			Math.floor((value / Math.max(1, heatmapMax)) * (palette.length - 1))
		);
		return palette[bucket] ?? palette[0];
	}
</script>

<section class=" bg-gradient-to-b from-white via-sky-50 to-white">
	<div class="container mx-auto max-w-6xl">
		<div
			class={`cartoon-shadow rounded-none border-3 border-slate-800 p-6 ${
				theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-white'
			}`}
		>
			<div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<!-- <p class="text-xs font-semibold tracking-wide text-slate-500 uppercase">Ops cadence</p> -->
					<h3 class="text-2xl font-black text-slate-800">Operations hits</h3>
					<p class="text-sm text-slate-600">darker squares mean more deploys and webhooks.</p>
				</div>
				<div class="flex items-center gap-2 text-xs font-semibold text-slate-600">
					<span class="inline-block rounded-none border-2 border-slate-300 bg-slate-50 px-2 py-1">
						Live
					</span>
					<span class="inline-flex items-center gap-1">
						<span class="h-3 w-3 rounded-[3px]" style={`background:${currentPalette[0]}`}></span>
						Less
					</span>
					<span class="inline-flex items-center gap-1">
						<span
							class="h-3 w-3 rounded-[3px]"
							style={`background:${currentPalette[currentPalette.length - 1]}`}
						></span>
						More
					</span>
				</div>
			</div>
			<div
				class={`overflow-hidden rounded-none border-2 border-dashed ${
					theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-white'
				} p-4`}
			>
				<div
					class="mb-2 grid gap-2"
					style={`grid-template-columns: auto repeat(${heatmapColumns}, minmax(14px, 1fr));`}
				>
					<div class="text-[11px] font-semibold text-slate-500"></div>
					{#each heatmapMonthLabels as month, mIdx (mIdx)}
						<div class="text-[11px] font-semibold text-slate-500">{month}</div>
					{/each}
				</div>
				<div
					class="grid gap-1"
					style={`grid-template-columns: auto repeat(${heatmapColumns}, minmax(14px, 1fr));`}
				>
					{#each data.filter((row) => heatmapWeekFilter.includes(row.label)) as row (row.label)}
						<div class="text-[11px] font-semibold text-slate-500">{row.label}</div>
						{#each row.values as value, vIdx (`${row.label}-${vIdx}`)}
							<div
								title={`${row.label} · ${value} actions`}
								class="h-[14px] w-full rounded-[3px] transition duration-150 hover:scale-[1.08]"
								style={`background:${getHeatColor(value, currentPalette)};`}
							></div>
						{/each}
					{/each}
				</div>
				<p class="mt-4 text-[11px] text-slate-500">
					Hover any square to see exact counts. Colors update with your current theme.
				</p>
			</div>
		</div>
	</div>
</section>
