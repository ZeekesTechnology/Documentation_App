import { Activity } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { SystemUsageData } from "../lib/api";

const METRIC_ORDER = [
  "assets",
  "configurations",
  "contacts",
  "documents",
  "domains",
  "locations",
  "organizations",
  "passwords",
  "related_items",
  "certificates",
  "users",
] as const;

type MetricKey = (typeof METRIC_ORDER)[number];

const TOOLTIP_ORDER = [...METRIC_ORDER].reverse();

const SERIES_COLORS: Record<MetricKey, string> = {
  assets: "#1e4a7a",
  configurations: "#2f6496",
  contacts: "#4b82c4",
  documents: "#c46a2a",
  domains: "#d08a3e",
  locations: "#c9a35a",
  organizations: "#6ebe44",
  passwords: "#d97070",
  related_items: "#c87898",
  certificates: "#9470c8",
  users: "#7050a8",
};

const CHART_WIDTH = 920;
const CHART_HEIGHT = 220;
const CHART_LEFT = 56;
const CHART_TOP = 8;

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function formatRelativeAsOf(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  if (hours < 1) return "As of just now";
  if (hours === 1) return "As of about 1 hour ago";
  return `As of about ${hours} hours ago`;
}

function buildChartModel(data: SystemUsageData) {
  const pointCount = data.history.dates.length;
  if (pointCount === 0) {
    return {
      paths: [] as { key: MetricKey; color: string; d: string }[],
      maxTotal: 0,
      yTicks: [0],
      stackTops: [] as Record<MetricKey, number>[],
      xForIndex: (_index: number) => 0,
      yForValue: (_value: number) => CHART_HEIGHT,
    };
  }

  const totals = Array.from({ length: pointCount }, (_, index) =>
    METRIC_ORDER.reduce(
      (sum, key) => sum + (data.history.series[key]?.[index] ?? 0),
      0
    )
  );
  const maxTotal = Math.max(...totals, 1);

  const xForIndex = (index: number) =>
    pointCount === 1 ? CHART_WIDTH / 2 : (index / (pointCount - 1)) * CHART_WIDTH;

  const yForValue = (value: number) =>
    CHART_HEIGHT - (value / maxTotal) * CHART_HEIGHT;

  const stackTops: Record<MetricKey, number>[] = [];
  const paths = METRIC_ORDER.map((key) => {
    const values = data.history.series[key] ?? [];
    const tops: number[] = [];
    const bottoms: number[] = [];

    for (let index = 0; index < pointCount; index += 1) {
      const bottom = METRIC_ORDER.slice(0, METRIC_ORDER.indexOf(key)).reduce(
        (sum, priorKey) => sum + (data.history.series[priorKey]?.[index] ?? 0),
        0
      );
      const top = bottom + (values[index] ?? 0);
      bottoms.push(bottom);
      tops.push(top);

      if (!stackTops[index]) {
        stackTops[index] = {} as Record<MetricKey, number>;
      }
      stackTops[index][key] = top;
    }

    const topPoints = tops
      .map((value, index) => `${xForIndex(index)},${yForValue(value)}`)
      .join(" ");
    const bottomPoints = bottoms
      .map((value, index) => `${xForIndex(index)},${yForValue(value)}`)
      .reverse()
      .join(" ");

    return {
      key,
      color: SERIES_COLORS[key],
      d: `M ${topPoints} L ${bottomPoints} Z`,
    };
  });

  return {
    paths,
    maxTotal,
    yTicks: [0, Math.round(maxTotal / 2), maxTotal],
    stackTops,
    xForIndex,
    yForValue,
  };
}

function seriesAtChartY(
  data: SystemUsageData,
  index: number,
  chartY: number,
  maxTotal: number
): MetricKey | null {
  const valueAtPointer =
    maxTotal * (1 - Math.min(Math.max(chartY, 0), CHART_HEIGHT) / CHART_HEIGHT);
  let cumulative = 0;

  for (const key of METRIC_ORDER) {
    const segment = data.history.series[key]?.[index] ?? 0;
    if (valueAtPointer >= cumulative && valueAtPointer < cumulative + segment) {
      return key;
    }
    cumulative += segment;
  }

  return METRIC_ORDER[METRIC_ORDER.length - 1];
}

type HoverState = {
  index: number;
  chartX: number;
  chartY: number;
  activeSeries: MetricKey | null;
  clientX: number;
  clientY: number;
};

export function SystemUsageSection({ data }: { data: SystemUsageData }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  const chart = useMemo(() => buildChartModel(data), [data]);
  const pointCount = data.history.dates.length;

  const xLabelIndexes = data.history.dates
    .map((_, index) => index)
    .filter((index) => index % 6 === 0 || index === data.history.dates.length - 1);

  const updateHover = useCallback(
    (clientX: number, clientY: number) => {
      const container = chartRef.current;
      if (!container || pointCount === 0) return;

      const rect = container.getBoundingClientRect();
      const viewWidth = CHART_WIDTH + 72;
      const viewHeight = CHART_HEIGHT + 48;
      const scaleX = rect.width / viewWidth;
      const scaleY = rect.height / viewHeight;

      const svgX = (clientX - rect.left) / scaleX;
      const svgY = (clientY - rect.top) / scaleY;

      const chartX = svgX - CHART_LEFT;
      const chartY = svgY - CHART_TOP;

      if (
        chartX < 0 ||
        chartX > CHART_WIDTH ||
        chartY < 0 ||
        chartY > CHART_HEIGHT
      ) {
        setHover(null);
        return;
      }

      const index =
        pointCount === 1
          ? 0
          : Math.round((chartX / CHART_WIDTH) * (pointCount - 1));

      setHover({
        index,
        chartX: chart.xForIndex(index),
        chartY,
        activeSeries: seriesAtChartY(data, index, chartY, chart.maxTotal),
        clientX,
        clientY,
      });
    },
    [chart.maxTotal, chart.xForIndex, data, pointCount]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      updateHover(event.clientX, event.clientY);
    },
    [updateHover]
  );

  const tooltipStyle = useMemo(() => {
    if (!hover || !chartRef.current) return null;

    const rect = chartRef.current.getBoundingClientRect();
    const tooltipWidth = 240;
    const tooltipHeight = 320;
    const offset = 16;

    let left = hover.clientX - rect.left + offset;
    if (left + tooltipWidth > rect.width) {
      left = hover.clientX - rect.left - tooltipWidth - offset;
    }
    left = Math.max(8, Math.min(left, rect.width - tooltipWidth - 8));

    let top = hover.clientY - rect.top - tooltipHeight / 2;
    top = Math.max(8, Math.min(top, rect.height - tooltipHeight - 8));

    return { left, top };
  }, [hover]);

  return (
    <section className="rounded border border-vault-border bg-vault-panel p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Activity className="h-4 w-4 text-gray-500" />
          System Usage (Last 60 Days)
        </h2>
        <span className="text-xs text-gray-500">{formatRelativeAsOf(data.asOf)}</span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11">
        {METRIC_ORDER.map((key) => (
          <div key={key} className="min-w-0 text-center">
            <p className="text-lg font-semibold text-white sm:text-xl">
              {formatCount(data.totals[key] ?? 0)}
            </p>
            <p className="truncate text-xs text-gray-500">
              {data.labels[key] ?? key}
            </p>
          </div>
        ))}
      </div>

      <div
        ref={chartRef}
        className="relative overflow-x-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${CHART_WIDTH + 72} ${CHART_HEIGHT + 48}`}
          className="min-w-[760px] w-full select-none"
          role="img"
          aria-label="System usage stacked area chart for the last 60 days"
        >
          {chart.yTicks.map((tick) => {
            const y = CHART_TOP + CHART_HEIGHT - (tick / chart.maxTotal) * CHART_HEIGHT;
            return (
              <g key={tick}>
                <line
                  x1={CHART_LEFT}
                  x2={CHART_LEFT + CHART_WIDTH}
                  y1={y}
                  y2={y}
                  stroke="#3a3a3a"
                  strokeWidth={1}
                />
                <text x={48} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize={11}>
                  {formatCount(tick)}
                </text>
              </g>
            );
          })}

          <g transform={`translate(${CHART_LEFT}, ${CHART_TOP})`}>
            {chart.paths.map((path) => (
              <path key={path.key} d={path.d} fill={path.color} opacity={0.95} />
            ))}

            {xLabelIndexes.map((index) => (
              <g key={index}>
                <line
                  x1={(index / Math.max(pointCount - 1, 1)) * CHART_WIDTH}
                  x2={(index / Math.max(pointCount - 1, 1)) * CHART_WIDTH}
                  y1={0}
                  y2={CHART_HEIGHT}
                  stroke="#3a3a3a"
                  strokeWidth={1}
                />
                <text
                  x={(index / Math.max(pointCount - 1, 1)) * CHART_WIDTH}
                  y={CHART_HEIGHT + 22}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize={11}
                >
                  {data.history.dates[index]}
                </text>
              </g>
            ))}

            {hover && chart.stackTops[hover.index] && (
              <g pointerEvents="none">
                <line
                  x1={hover.chartX}
                  x2={hover.chartX}
                  y1={0}
                  y2={CHART_HEIGHT}
                  stroke="#ffffff"
                  strokeWidth={1}
                  opacity={0.85}
                />
                {METRIC_ORDER.map((key) => {
                  const topValue = chart.stackTops[hover.index][key];
                  if (topValue === undefined) return null;
                  const y = chart.yForValue(topValue);
                  return (
                    <circle
                      key={key}
                      cx={hover.chartX}
                      cy={y}
                      r={4}
                      fill={SERIES_COLORS[key]}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  );
                })}
              </g>
            )}
          </g>
        </svg>

        {hover && tooltipStyle && (
          <div
            className="pointer-events-none absolute z-10 w-60 rounded border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-xl"
            style={tooltipStyle}
          >
            <p className="mb-2 border-b border-gray-200 pb-2 text-center text-base font-semibold text-gray-900">
              {data.history.dates[hover.index]}
            </p>
            <ul className="space-y-0.5">
              {TOOLTIP_ORDER.map((key) => {
                const value = data.history.series[key]?.[hover.index] ?? 0;
                const active = hover.activeSeries === key;
                return (
                  <li
                    key={key}
                    className={`flex items-center justify-between gap-3 rounded px-1.5 py-1 ${
                      active ? "bg-amber-100" : ""
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-gray-800">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: SERIES_COLORS[key] }}
                      />
                      <span className="truncate">{data.labels[key] ?? key}</span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-gray-900">
                      {formatCount(value)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
