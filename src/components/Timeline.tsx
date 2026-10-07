import { NOW, TENSES, type Mark, type TenseId } from "../data/tenses";

const W = 320;
const AX = 62; // axis y
const X = (t: number) => 14 + (t / 100) * (W - 28);

function wavePath(from: number, to: number) {
  const x0 = X(from), x1 = X(to);
  const steps = Math.max(2, Math.round((x1 - x0) / 8));
  let d = `M ${x0} ${AX - 14}`;
  for (let i = 1; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    d += ` Q ${x - (x1 - x0) / steps / 2} ${AX - (i % 2 ? 24 : 4)} ${x} ${AX - 14}`;
  }
  return d;
}

function MarkEl({ m }: { m: Mark }) {
  switch (m.k) {
    case "dot":
      return (
        <g>
          <circle cx={X(m.at)} cy={AX} r={7} className={m.hollow ? "tl-hollow" : "tl-accent"} />
          {m.label && <text x={X(m.at)} y={AX + 26} className="tl-label">{m.label}</text>}
        </g>
      );
    case "dots": {
      const xs = [];
      for (let t = m.from; t <= m.to; t += (m.to - m.from) / 6) xs.push(t);
      return <g>{xs.map((t) => <circle key={t} cx={X(t)} cy={AX} r={4.5} className="tl-accent" />)}</g>;
    }
    case "bar":
      return (
        <g>
          <rect
            x={X(m.from)} y={AX - 20} width={X(m.to) - X(m.from)} height={14} rx={7}
            className={m.dashed ? "tl-dashed" : "tl-bar"}
          />
          {m.label && <text x={(X(m.from) + X(m.to)) / 2} y={AX - 28} className="tl-label">{m.label}</text>}
        </g>
      );
    case "wave":
      return (
        <g>
          <path d={wavePath(m.from, m.to)} className="tl-wave" />
          {m.label && <text x={(X(m.from) + X(m.to)) / 2} y={AX - 32} className="tl-label">{m.label}</text>}
        </g>
      );
    case "x":
      return (
        <g className="tl-x">
          <line x1={X(m.at) - 7} y1={AX - 7} x2={X(m.at) + 7} y2={AX + 7} />
          <line x1={X(m.at) + 7} y1={AX - 7} x2={X(m.at) - 7} y2={AX + 7} />
          {m.label && <text x={X(m.at)} y={AX + 26} className="tl-label tl-label-x">{m.label}</text>}
        </g>
      );
    case "arrow": {
      const x0 = X(m.from) + 8, x1 = X(m.to) - 9;
      return (
        <g>
          <line x1={x0} y1={AX} x2={x1} y2={AX} className={m.dashed ? "tl-arrow tl-arrow-dashed" : "tl-arrow"} markerEnd="url(#tl-head)" />
          {m.label && <text x={(x0 + x1) / 2} y={AX - 12} className="tl-label">{m.label}</text>}
        </g>
      );
    }
  }
}

export function Timeline({ tense, compact = false }: { tense: TenseId; compact?: boolean }) {
  const t = TENSES[tense];
  return (
    <figure className={compact ? "timeline" : "timeline card"} style={compact ? undefined : { gap: 4 }}>
      <svg viewBox={`0 0 ${W} 100`} role="img" aria-label={`Timeline: ${t.name}`}>
        <defs>
          <marker id="tl-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="tl-headfill" />
          </marker>
        </defs>
        <line x1={X(0)} y1={AX} x2={X(100)} y2={AX} className="tl-axis" />
        <line x1={X(NOW)} y1={AX - 34} x2={X(NOW)} y2={AX + 8} className="tl-now" />
        <text x={X(NOW)} y={AX + 40} className="tl-now-label">NOW</text>
        <text x={X(0)} y={AX + 40} className="tl-end" textAnchor="start">past</text>
        <text x={X(100)} y={AX + 40} className="tl-end" textAnchor="end">future</text>
        {t.timeline.map((m, i) => <MarkEl key={i} m={m} />)}
      </svg>
      {!compact && (
        <figcaption>
          <span className="title-m">{t.name}</span>
          <span className="label-l primary-text">{t.formula}</span>
          <span className="body-m on-variant">{t.key}</span>
        </figcaption>
      )}
    </figure>
  );
}
