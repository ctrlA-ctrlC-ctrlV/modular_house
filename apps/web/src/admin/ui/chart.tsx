/**
 * Chart primitive — Phase 2 admin design system.
 *
 * recharts wrapper ported from the Studio Admin template
 * `src/components/ui/chart.tsx` to the project's Vite/React 18.3 setup
 * (ui-components.md §1 compatibility rules 1–10, §1 rule 9, §3). Provides
 * `ChartContainer` (the CSS-variable color plumbing host), `ChartTooltip`,
 * `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, and the
 * `ChartConfig` type — the sole recharts entry point for Phase 2 widgets
 * (TrafficChart, T023). Series colors resolve to `var(--chart-N)` design
 * tokens, never literal hex/rgb values (rule 9, template DESIGN.md §2).
 *
 * Port adaptations (rule-bound, no taste):
 * - `"use client"` stripped (rule 1); the whole admin app is client-rendered.
 * - `@/lib/utils` (`cn`) rewritten to the relative `../lib/cn.js` (rule 2).
 * - `recharts` is already a project dependency (§3: no new package) and is
 *   imported as the `RechartsPrimitive` namespace (rule 9 — widgets reach
 *   recharts only through this wrapper; the wrapper itself may import it).
 * - No `next/*` modules present (rule 3); no `lucide-react` (rule 4).
 * - `data-slot="chart"` and `data-chart` attributes preserved (rule 5); all
 *   Tailwind token class strings preserved verbatim (rule 6).
 *
 * Type adaptation (recharts 3.7.0 compatibility):
 * - The template imports `type { TooltipValueType } from "recharts"`, which
 *   recharts 3.7.0 no longer exports (its internal `ValueType` is
 *   `number | string | ReadonlyArray<number | string>`). It is defined locally
 *   as `number | string` — the historical shape the template relied on and the
 *   value range the tooltip content formats via `toLocaleString()`/`String()`.
 *   Runtime behavior is unchanged; only the type plumbing is adapted.
 */
import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '../lib/cn.js';

// recharts 3.7.0 no longer exports `TooltipValueType`; the historical shape is
// `number | string`, matching `TooltipNameType` below and the values the tooltip
// content renders (numeric → toLocaleString, otherwise String()).
type TooltipValueType = number | string;
type TooltipNameType = number | string;

// Theme selector for the injected CSS-variable style block: light rules apply
// unconditionally, dark rules are scoped under `.dark` (the admin theme token).
const THEMES = { light: '', dark: '.dark' } as const;

// Initial dimensions used by recharts ResponsiveContainer when no layout has
// been measured yet (jsdom/SSR), so a chart renders deterministically without
// a live ResizeObserver notification.
const INITIAL_DIMENSION = { width: 320, height: 200 } as const;

// Per-series chart configuration. Each entry optionally carries a `label` and
// exactly one color source: a single `color` (token string, e.g.
// `var(--chart-1)`) or a `theme` map keyed by the THEMES entries. The wrapper's
// ChartStyle emits these as `--color-<key>` CSS variables the series reference.
export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>;

type ChartContextProps = {
  config: ChartConfig;
};

// Chart context carries the config so ChartTooltipContent/ChartLegendContent can
// resolve series labels and colors without re-passing them as props.
const ChartContext = React.createContext<ChartContextProps | null>(null);

// Access the chart config; throws if used outside a ChartContainer so misuse
// fails fast rather than rendering an unstyled tooltip/legend.
function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

/**
 * ChartContainer — the recharts host frame.
 *
 * Renders a `data-slot="chart"` div, injects the per-series CSS-variable style
 * block (ChartStyle), and wraps a recharts ResponsiveContainer that hosts the
 * caller's chart. The `config` is published via context for tooltip/legend use.
 */
function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children'];
  initialDimension?: {
    width: number;
    height: number;
  };
}) {
  // Stable chart id: caller-supplied or derived from React's useId (colons
  // stripped, which are invalid in CSS selectors).
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke=\'#ccc\']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke=\'#fff\']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke=\'#ccc\']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke=\'#ccc\']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke=\'#fff\']]:stroke-transparent [&_.recharts-surface]:outline-hidden',
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer
          initialDimension={initialDimension}
        >
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

/**
 * ChartStyle — injects the per-series CSS-variable style block.
 *
 * For each config entry that has a color (single or per-theme), emits a
 * `--color-<key>: <color>` declaration scoped to `[data-chart=<id>]`, under the
 * light root and `.dark` respectively. This is the token-plumbing layer: series
 * colors are `var(--chart-N)` tokens, never literal values (rule 9).
 */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme ?? config.color,
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ??
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  );
};

// Re-export the recharts Tooltip under the chart namespace so widgets import
// tooltip machinery through this wrapper only (rule 9).
const ChartTooltip = RechartsPrimitive.Tooltip;

/**
 * ChartTooltipContent — accessible, token-styled tooltip content.
 *
 * Renders the active series' label (resolved from config via context) and
 * numeric value, with a color indicator (dot/line/dashed) whose color binds to
 * the series CSS variable. The indicator color is always a `var(--color-*)`
 * reference, never a literal (rule 9).
 */
function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
  } & Omit<
    RechartsPrimitive.DefaultTooltipContentProps<
      TooltipValueType,
      TooltipNameType
    >,
    'accessibilityLayer'
  >) {
  const { config } = useChart();

  // Resolve the tooltip heading: look up the first payload item's config label
  // (via labelKey/dataKey/name), fall back to the raw label, and apply an
  // optional labelFormatter. Returns null when there is nothing to show.
  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === 'string'
        ? (config[label]?.label ?? label)
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn('font-medium', labelClassName)}>{value}</div>;
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (!active || !payload?.length) {
    return null;
  }

  // When a single series uses a non-dot indicator, the label is nested inside
  // the item row rather than rendered as a standalone heading.
  const nestLabel = payload.length === 1 && indicator !== 'dot';

  return (
    <div
      className={cn(
        'grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            // Indicator color: an explicit `color` prop wins, then the data
            // point's fill, then the series color — all expected to be
            // var(--color-*) references emitted by ChartStyle.
            const indicatorColor = color ?? item.payload?.fill ?? item.color;

            return (
              <div
                key={index}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && 'items-center',
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            'shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)',
                            {
                              'h-2.5 w-2.5': indicator === 'dot',
                              'w-1': indicator === 'line',
                              'w-0 border-[1.5px] border-dashed bg-transparent':
                                indicator === 'dashed',
                              'my-0.5': nestLabel && indicator === 'dashed',
                            },
                          )}
                          style={
                            {
                              '--color-bg': indicatorColor,
                              '--color-border': indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        'flex flex-1 justify-between leading-none',
                        nestLabel ? 'items-end' : 'items-center',
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label ?? item.name}
                        </span>
                      </div>
                      {item.value != null && (
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {typeof item.value === 'number'
                            ? item.value.toLocaleString()
                            : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

// Re-export the recharts Legend under the chart namespace (rule 9).
const ChartLegend = RechartsPrimitive.Legend;

/**
 * ChartLegendContent — token-styled legend mirroring the tooltip's label/color
 * resolution. Indicator color comes from the recharts payload `item.color`,
 * which the series sets from the wrapper's CSS variables.
 */
function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: React.ComponentProps<'div'> & {
  hideIcon?: boolean;
  nameKey?: string;
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? 'value'}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground',
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
}

// Resolve a config entry from a recharts payload item by key, checking both the
// item's own properties and its nested `payload` (recharts nests the raw datum
// under `payload`). Falls back to the raw key if no config-specific key matches.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const payloadPayload =
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === 'string'
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

// Structural recharts components re-exported under the chart namespace so
// widgets satisfy rule 9 ("recharts through chart.tsx only — widgets never
// import recharts directly") without reaching the `recharts` module
// themselves. This is an additive change to the T017 port — no existing
// export or behavior is modified; the re-exports give widgets a single import
// surface for both the wrapper infrastructure (ChartContainer, tooltip
// machinery) and the structural chart components (axes, grids, series types).
// Future widgets add their needed structural components here (Open-Closed).
const {
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} = RechartsPrimitive;

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  // Structural recharts components (rule 9 re-exports, T023-nit fix).
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
};
