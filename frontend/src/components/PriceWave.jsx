import { useMemo } from 'react';

function makePath(seed = 1) {
  const values = Array.from({ length: 18 }, (_, i) => 45 + Math.sin(i * 0.7 + seed) * 24 + ((i * seed * 13) % 35));
  return values.map((v, i) => `${i ? 'L' : 'M'}${i * (700 / (values.length - 1))},${135 - v}`).join(' ');
}

export default function PriceWave({ activeSector }) {
  const paths = useMemo(() => [makePath(activeSector + 1), makePath(activeSector + 3), makePath(activeSector + 5)], [activeSector]);

  return (
    <div className="wave">
      <svg viewBox="0 0 700 150" preserveAspectRatio="none">
        <path d={paths[0]} fill="none" stroke="#ffcf5a" strokeWidth="5" strokeLinecap="round" />
        <path d={paths[1]} fill="none" stroke="#59dcff" strokeWidth="4" strokeLinecap="round" opacity=".8" />
        <path d={paths[2]} fill="none" stroke="#ff4fd8" strokeWidth="3" strokeLinecap="round" opacity=".65" />
      </svg>
    </div>
  );
}
