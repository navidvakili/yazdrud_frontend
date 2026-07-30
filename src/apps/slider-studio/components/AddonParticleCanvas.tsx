import React, { useEffect, useRef } from 'react';

interface AddonParticleCanvasProps {
  preset?: 'stars' | 'bubbles' | 'snow' | 'geometric' | 'waves';
  width?: number;
  height?: number;
  opacity?: number;
}

export default function AddonParticleCanvas({
  preset = 'stars',
  opacity = 0.6
}: AddonParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 1240);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 900);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const count = preset === 'stars' ? 70 : preset === 'geometric' ? 30 : 45;
    const particles = Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (preset === 'snow' ? 0.8 : 1.5),
      vy: preset === 'snow' ? Math.random() * 1.5 + 0.5 : (Math.random() - 0.5) * 1.5,
      radius: Math.random() * (preset === 'geometric' ? 12 : 3) + 1,
      alpha: Math.random() * 0.7 + 0.3,
      color:
        preset === 'stars'
          ? '#38bdf8'
          : preset === 'geometric'
          ? '#e11d48'
          : '#a855f7'
    }));

    let waveOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (preset === 'waves') {
        waveOffset += 0.03;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 10) {
          const y = Math.sin(x * 0.005 + waveOffset) * 40 + height * 0.75;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(168, 85, 247, 0.06)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 10) {
          const y = Math.cos(x * 0.008 + waveOffset * 0.8) * 35 + height * 0.8;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.save();
          ctx.globalAlpha = p.alpha * opacity;

          if (preset === 'geometric') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(p.x, p.y, p.radius * 2, p.radius * 2);
          } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [preset, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
    />
  );
}
