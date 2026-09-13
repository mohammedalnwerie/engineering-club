import React, { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
  size: number;
  pulsePhase: number;
}

export const CanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates tracker
    let mouse = {
      x: -1000,
      y: -1000,
      radius: 180,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initPoints();
    };

    // Initialize Blueprint Grid Nodes
    let points: Point[] = [];
    const spacing = 75;

    const initPoints = () => {
      points = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          points.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            originX: x,
            originY: y,
            size: Math.random() > 0.85 ? 2.5 : 1.5,
            pulsePhase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    initPoints();

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Render loop
    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;

      // Draw active interactive points and vectors
      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Subtle idle movement
        p.pulsePhase += 0.02;
        const idleOffset = Math.sin(p.pulsePhase) * 1.5;

        // Mouse interaction displacement
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let drawX = p.x;
        let drawY = p.y + idleOffset;

        if (dist < mouse.radius && dist > 0) {
          const force = (1 - dist / mouse.radius) * 18;
          const angle = Math.atan2(dy, dx);
          drawX -= Math.cos(angle) * force;
          drawY -= Math.sin(angle) * force;

          // Technical vector line towards mouse
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - dist / mouse.radius)})`;
          ctx.lineWidth = 0.75;
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        // Draw node
        const isNear = dist < mouse.radius;
        ctx.fillStyle = isNear
          ? 'rgba(0, 240, 255, 0.65)'
          : 'rgba(255, 255, 255, 0.12)';

        ctx.beginPath();
        ctx.arc(drawX, drawY, isNear ? p.size * 1.5 : p.size, 0, Math.PI * 2);
        ctx.fill();

        // Crosshairs on selected key points
        if ((i % 11 === 0 || isNear) && dist < mouse.radius * 0.7) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(drawX - 4, drawY);
          ctx.lineTo(drawX + 4, drawY);
          ctx.moveTo(drawX, drawY - 4);
          ctx.lineTo(drawX, drawY + 4);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      {/* CAD Overlay subtle gradient vignettes */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#07090e]/60 to-[#07090e] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#07090e] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#07090e] to-transparent pointer-events-none" />
    </div>
  );
};
