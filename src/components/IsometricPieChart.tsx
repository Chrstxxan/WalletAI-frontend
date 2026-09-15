import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Polygon, Ellipse, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';

type Slice = { label: string; value: number; color: string };

type Props = {
  data: Slice[];
  width?: number;
};

const RX_RATIO = 0.315;
const RY_RATIO = 0.55;
const DEPTH_RATIO = 0.46;
const EXPLODE_RATIO = 0.07;

function shade(hex: string, percent: number) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const channel = (shift: number) => {
    const value = (num >> shift) & 0xff;
    const adjusted = percent >= 0 ? value * (1 - percent) : value + (255 - value) * -percent;
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };
  const r = channel(16);
  const g = channel(8);
  const b = channel(0);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function IsometricPieChart({ data, width = 300 }: Props) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const layout = useMemo(() => {
    if (total <= 0) return null;

    const rx = width * RX_RATIO;
    const ry = rx * RY_RATIO;
    const depth = ry * DEPTH_RATIO;
    const explode = rx * EXPLODE_RATIO;
    const cx = width / 2;
    const height = Math.round(2 * (ry + explode + depth) + 16);
    const cy = height / 2 - depth / 2;

    let cumulative = 0;
    const slices = data.map((item, index) => {
      const fraction = total > 0 ? item.value / total : 0;
      const startAngle = -Math.PI / 2 + cumulative * 2 * Math.PI;
      cumulative += fraction;
      const endAngle = -Math.PI / 2 + cumulative * 2 * Math.PI;
      const midAngle = (startAngle + endAngle) / 2;
      const explodeDx = explode * Math.cos(midAngle);
      const explodeDy = explode * Math.sin(midAngle) * RY_RATIO;
      return {
        key: `${item.label}-${index}`,
        color: item.color,
        pct: Math.round(fraction * 100),
        fraction,
        startAngle,
        endAngle,
        midAngle,
        explodeDx,
        explodeDy,
      };
    });

    const wallPolygons: { points: string; color: string }[] = [];
    const topPaths: { d: string; color: string; gradientId: string }[] = [];
    const labels: { x: number; y: number; text: string }[] = [];

    slices.forEach((s, index) => {
      const steps = Math.max(8, Math.round(90 * s.fraction));
      const angleStep = (s.endAngle - s.startAngle) / steps;
      const rimPts: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const a = s.startAngle + angleStep * i;
        rimPts.push({
          x: cx + s.explodeDx + rx * Math.cos(a),
          y: cy + s.explodeDy + ry * Math.sin(a),
        });
      }
      const centerPt = { x: cx + s.explodeDx, y: cy + s.explodeDy };
      const gradientId = `pieGrad${index}`;
      const topD = `M ${centerPt.x} ${centerPt.y} L ${rimPts.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`;
      topPaths.push({ d: topD, color: s.color, gradientId });

      const wallColor = shade(s.color, 0.34);
      for (let i = 0; i < rimPts.length - 1; i++) {
        const a1 = s.startAngle + angleStep * i;
        const a2 = s.startAngle + angleStep * (i + 1);
        const midA = (a1 + a2) / 2;
        if (Math.sin(midA) > 0.02) {
          const p1 = rimPts[i];
          const p2 = rimPts[i + 1];
          const points = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p2.x},${p2.y + depth} ${p1.x},${p1.y + depth}`;
          wallPolygons.push({ points, color: wallColor });
        }
      }

      if (s.pct >= 6) {
        labels.push({
          x: cx + s.explodeDx + rx * 0.55 * Math.cos(s.midAngle),
          y: cy + s.explodeDy + ry * 0.55 * Math.sin(s.midAngle),
          text: `${s.pct}%`,
        });
      }
    });

    return { rx, ry, depth, cx, cy, height, wallPolygons, topPaths, labels };
  }, [data, total, width]);

  if (!layout) return null;

  const { rx, cx, cy, depth, height, wallPolygons, topPaths, labels } = layout;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {topPaths.map((p) => (
            <LinearGradient key={p.gradientId} id={p.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={shade(p.color, -0.18)} />
              <Stop offset="100%" stopColor={p.color} />
            </LinearGradient>
          ))}
        </Defs>

        <Ellipse cx={cx} cy={cy + depth + 6} rx={rx * 0.88} ry={8} fill="rgba(0,0,0,0.35)" />

        {wallPolygons.map((w, i) => (
          <Polygon key={`wall-${i}`} points={w.points} fill={w.color} />
        ))}

        {topPaths.map((p) => (
          <Path
            key={p.gradientId}
            d={p.d}
            fill={`url(#${p.gradientId})`}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        ))}

        {labels.map((l, i) => (
          <SvgText
            key={`label-${i}`}
            x={l.x}
            y={l.y}
            fontSize={12}
            fontWeight="700"
            fill={Colors.textPrimary}
            textAnchor="middle"
          >
            {l.text}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
