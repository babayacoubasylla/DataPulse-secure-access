import { useEffect, useRef } from 'react';

export default function RadarMarket({ activeSector, sectors }) {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);

  useEffect(() => {
    pointsRef.current = Array.from({ length: 44 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.12 + Math.random() * 0.82,
      v: 0.001 + Math.random() * 0.004,
      type: Math.floor(Math.random() * 4),
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    let tick = 0;

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      canvas.width = box.width * devicePixelRatio;
      canvas.height = box.height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const draw = () => {
      tick += 0.01;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const max = Math.min(w, h) * 0.43;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx, cy);
      for (let r = 1; r <= 5; r++) {
        ctx.beginPath();
        ctx.arc(0, 0, (max * r) / 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.09)';
        ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(max, 0);
        ctx.strokeStyle = 'rgba(255,255,255,.055)';
        ctx.stroke();
      }
      ctx.rotate(tick * 0.55);
      const gradient = ctx.createLinearGradient(0, 0, max, 0);
      gradient.addColorStop(0, 'rgba(255,207,90,.48)');
      gradient.addColorStop(1, 'rgba(255,207,90,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, max, -0.06, 0.06);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      pointsRef.current.forEach((p) => {
        p.a += p.v;
        const x = cx + Math.cos(p.a) * p.r * max;
        const y = cy + Math.sin(p.a) * p.r * max;
        const active = p.type === activeSector;
        ctx.beginPath();
        ctx.arc(x, y, active ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = active ? sectors[activeSector]?.color || '#ffcf5a' : 'rgba(255,255,255,.32)';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = active ? 18 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [activeSector, sectors]);

  return <canvas ref={canvasRef} className="radar-canvas" />;
}
