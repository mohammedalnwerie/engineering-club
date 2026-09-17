import React, { useEffect, useRef } from 'react';

export const CanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    // Static background on touch devices and for reduced-motion users; animate only on desktop.
    const isStatic =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(pointer: coarse)').matches;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
      if (isStatic) render();
    };

    // Subtle architectural grid nodes with engineering details
    interface Node {
      x: number;
      y: number;
      baseAlpha: number;
      pulseSpeed: number;
      pulsePhase: number;
      isTurquoise: boolean;
      hasRing: boolean;
    }

    let nodes: Node[] = [];
    const spacing = 84;

    const initNodes = () => {
      nodes = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          nodes.push({
            x: i * spacing,
            y: j * spacing,
            baseAlpha: Math.random() * 0.04 + 0.02,
            pulseSpeed: Math.random() * 0.008 + 0.004,
            pulsePhase: Math.random() * Math.PI * 2,
            isTurquoise: (i + j) % 5 === 0,
            hasRing: (i * 7 + j * 11) % 19 === 0,
          });
        }
      }
    };

    initNodes();
    window.addEventListener('resize', handleResize, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Thin Architectural Circular Orbit Paths (CAD drafting inspiration)
      const centerX = width * 0.75;
      const centerY = height * 0.35;
      ctx.save();
      ctx.strokeStyle = 'rgba(63, 231, 227, 0.035)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 320, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(127, 26, 178, 0.03)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 520, 0, Math.PI * 2);
      ctx.stroke();

      // Small orbit crosshairs
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(63, 231, 227, 0.04)';
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY);
      ctx.lineTo(centerX + 12, centerY);
      ctx.moveTo(centerX, centerY - 12);
      ctx.lineTo(centerX, centerY + 12);
      ctx.stroke();
      ctx.restore();

      // 2. Faint Horizontal/Vertical Circuit Links between occasional adjacent nodes
      ctx.strokeStyle = 'rgba(127, 26, 178, 0.025)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const cols = Math.ceil(width / spacing) + 1;
      for (let i = 0; i < nodes.length; i++) {
        if (i % 4 === 0 && i + 1 < nodes.length && (i + 1) % cols !== 0) {
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
        }
      }
      ctx.stroke();

      // 3. Grid Nodes & Micro Rings
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulsePhase += n.pulseSpeed;
        const currentAlpha = Math.max(0.015, n.baseAlpha + Math.sin(n.pulsePhase) * 0.02);

        if (n.isTurquoise) {
          ctx.fillStyle = `rgba(63, 231, 227, ${currentAlpha * 1.4})`;
        } else {
          ctx.fillStyle = `rgba(162, 108, 198, ${currentAlpha})`;
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Subtle node ring for selected technical nodes
        if (n.hasRing) {
          ctx.strokeStyle = `rgba(63, 231, 227, ${currentAlpha * 0.75})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (!isStatic && !document.hidden) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleVisibility = () => {
      cancelAnimationFrame(animationFrameId);
      if (!document.hidden && !isStatic) render();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      
      {/* Soft, architectural gradient ambient orbs in University of Palestine palette */}
      <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-[#7F1AB2]/18 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-[#3FE7E3]/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-[#35BC2B]/08 rounded-full blur-[150px] pointer-events-none" />

      {/* Top and bottom subtle darkening */}
      <div className="absolute inset-0 bg-[#08041D]/75 pointer-events-none" />
    </div>
  );
};
