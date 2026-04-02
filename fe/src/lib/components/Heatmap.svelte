<script lang="ts">
	import type { Theme } from '$lib/stores/theme';

	type ContributionEntry = { date: string; count: number };
	type DayCell = { date: string; count: number; label: string };
	type Grid = { weeks: DayCell[][]; monthLabels: string[]; maxCount: number };

	export let contributions: ContributionEntry[] = [];
	export let theme: Theme = 'light';

	const DAY_MS = 24 * 60 * 60 * 1000;
	const DEFAULT_WEEKS = 53;
	const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const VISIBLE_DAY_LABELS = new Set(['Mon', 'Wed', 'Fri']);

	const heatmapPalette: Record<Theme, string[]> = {
		light: ['#e9edf3', '#cfd8e6', '#97b1d7', '#5b86c5', '#1f5ea8'],
		dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
		sunset: ['#2b1d34', '#5c3658', '#8f4f4f', '#c56e3c', '#f0a53a']
	};

	const containerClassByTheme: Record<Theme, string> = {
		light: 'cartoon-shadow rounded-none border-3 border-slate-800 bg-white p-5 text-slate-900',
		dark: 'cartoon-shadow rounded-none border-3 border-slate-700 bg-slate-900 p-5 text-slate-100',
		sunset:
			'cartoon-shadow rounded-none border-3 border-amber-900/60 bg-[#1f1428] p-5 text-amber-100'
	};

	const labelClassByTheme: Record<Theme, string> = {
		light: 'text-slate-600',
		dark: 'text-slate-300',
		sunset: 'text-amber-200/90'
	};

	let currentPalette = heatmapPalette[theme] ?? heatmapPalette.light;
	let containerClasses = containerClassByTheme.light;
	let labelClasses = labelClassByTheme.light;
	let weeks: DayCell[][] = [];
	let monthLabels: string[] = [];
	let heatmapMax = 1;

	function toUtcDayStart(date: Date): Date {
		return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	}

	function startOfWeekSunday(date: Date): Date {
		const dayStart = toUtcDayStart(date);
		const shift = dayStart.getUTCDay();
		return new Date(dayStart.getTime() - shift * DAY_MS);
	}

	function formatDisplayDate(date: Date): string {
		return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function buildGrid(data: ContributionEntry[]): Grid {
		const counts = new Map<string, number>();
		let maxCount = 0;

		for (const entry of data) {
			const ts = new Date(entry.date);
			if (Number.isNaN(ts.getTime())) continue;
			const day = toUtcDayStart(ts);
			const safeCount =
				typeof entry.count === 'number' && Number.isFinite(entry.count) ? entry.count : 0;
			const iso = day.toISOString();
			const next = (counts.get(iso) ?? 0) + Math.max(0, safeCount);
			counts.set(iso, next);
			maxCount = Math.max(maxCount, next);
		}

		let rangeStart: Date;
		let rangeEnd: Date;

		if (counts.size) {
			const sortedDates = Array.from(counts.keys())
				.map((iso) => new Date(iso))
				.sort((a, b) => a.getTime() - b.getTime());
			rangeStart = startOfWeekSunday(sortedDates[0]);
			const lastWeekStart = startOfWeekSunday(sortedDates[sortedDates.length - 1]);
			rangeEnd = new Date(lastWeekStart.getTime() + 6 * DAY_MS);
		} else {
			const today = toUtcDayStart(new Date());
			rangeStart = startOfWeekSunday(new Date(today.getTime() - (DEFAULT_WEEKS - 1) * 7 * DAY_MS));
			rangeEnd = new Date(rangeStart.getTime() + DEFAULT_WEEKS * 7 * DAY_MS - DAY_MS);
		}

		const builtWeeks: DayCell[][] = [];
		let currentWeek: DayCell[] = [];

		for (
			let cursor = new Date(rangeStart);
			cursor.getTime() <= rangeEnd.getTime();
			cursor = new Date(cursor.getTime() + DAY_MS)
		) {
			const iso = toUtcDayStart(cursor).toISOString();
			const count = counts.get(iso) ?? 0;
			currentWeek.push({ date: iso, count, label: formatDisplayDate(cursor) });
			maxCount = Math.max(maxCount, count);

			if (currentWeek.length === 7) {
				builtWeeks.push(currentWeek);
				currentWeek = [];
			}
		}

		if (currentWeek.length) {
			while (currentWeek.length < 7) {
				const nextDate = new Date(rangeEnd.getTime() - (6 - currentWeek.length) * DAY_MS);
				currentWeek.push({
					date: toUtcDayStart(nextDate).toISOString(),
					count: 0,
					label: formatDisplayDate(nextDate)
				});
			}
			builtWeeks.push(currentWeek);
		}

		const rollingMonthLabels = builtWeeks.map((week, idx) => {
			const first = week?.[0];
			if (!first) return '';
			const month = new Date(first.date).toLocaleString('en', { month: 'short' });
			if (idx === 0) return month;
			const prev = builtWeeks[idx - 1]?.[0];
			const prevMonth = prev ? new Date(prev.date).getUTCMonth() : -1;
			const currentMonth = new Date(first.date).getUTCMonth();
			return prevMonth !== currentMonth ? month : '';
		});

		return {
			weeks: builtWeeks,
			monthLabels: rollingMonthLabels,
			maxCount: Math.max(maxCount, 1)
		};
	}

	$: currentPalette = heatmapPalette[theme] ?? heatmapPalette.light;
	$: containerClasses = containerClassByTheme[theme] ?? containerClassByTheme.light;
	$: labelClasses = labelClassByTheme[theme] ?? labelClassByTheme.light;
	$: ({ weeks, monthLabels, maxCount: heatmapMax } = buildGrid(contributions));

	function getHeatColor(value: number, palette: string[], maxCount: number) {
		if (value <= 0 || maxCount <= 0) return palette[0] ?? '#d0d7e2';
		const buckets = palette.length - 1;
		const bucket = Math.min(buckets, Math.max(1, Math.ceil((value / maxCount) * buckets)));
		return palette[bucket] ?? palette[0];
	}
</script>

<section class="mt-1">
	<div class="container mx-auto max-w-6xl">
		<div class={containerClasses}>
			<div class="mb-4 flex items-center justify-between">
				<div>
					<p class={`text-xs font-semibold tracking-wide uppercase ${labelClasses}`}>Activity</p>
					<h4 class="text-xl font-bold text-inherit">Contribution heatmap</h4>
					<p class={`text-sm ${labelClasses}`}>GitHub-style grid, Sunday-start weeks.</p>
				</div>
			</div>

			<div class="overflow-x-auto">
				<div class="min-w-max">
					<div class="pl-10">
						<div
							class={`grid auto-cols-[12px] grid-flow-col gap-0.5 text-[11px] leading-none ${labelClasses}`}
						>
							{#each monthLabels as month, mIdx (mIdx)}
								<div class="text-left">{month}</div>
							{/each}
						</div>
					</div>
					<div class="mt-1 flex items-start gap-2">
						<div class={`mt-0.5 grid grid-rows-7 gap-0.5 text-[11px] leading-none ${labelClasses}`}>
							{#each DAY_LABELS as day (day)}
								<span>{VISIBLE_DAY_LABELS.has(day) ? day : ''}</span>
							{/each}
						</div>
						<div class="overflow-x-auto">
							<div class="grid auto-cols-[12px] grid-flow-col grid-rows-7 gap-0.5">
								{#each weeks as week, wIdx (wIdx)}
									{#each week as day, dIdx (`${wIdx}-${dIdx}-${day.date}`)}
										<div
											title={`${day.count} contributions on ${day.label}`}
											class="h-3 w-3 rounded-xs border border-black/15 transition duration-150 hover:scale-110"
											style={`background:${getHeatColor(day.count, currentPalette, heatmapMax)};`}
										></div>
									{/each}
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class={`mt-4 flex flex-wrap items-center justify-between gap-3 text-xs ${labelClasses}`}>
				<p>Learn how we count contributions</p>
				<div class="flex items-center gap-2">
					<span>Less</span>
					{#each currentPalette as color, idx (`legend-${idx}`)}
						<span class="h-3 w-3 rounded-xs border border-black/20" style={`background:${color}`}
						></span>
					{/each}
					<span>More</span>
				</div>
			</div>
		</div>
	</div>
</section>
