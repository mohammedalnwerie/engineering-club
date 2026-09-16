import React, { useEffect, useRef } from 'react';

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

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    // Calm architectural grid nodes
    interface Node {
      x: number;
      y: number;
      baseAlpha: number;
      pulseSpeed: number;
      pulsePhase: number;
    }

    let nodes: Node[] = [];
    const spacing = 90;

    const initNodes = () => {
      nodes = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          nodes.push({
            x: i * spacing,
            y: j * spacing,
            baseAlpha: Math.random() * 0.05 + 0.02,
            pulseSpeed: Math.random() * 0.01 + 0.005,
            pulsePhase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    initNodes();
    window.addEventListener('resize', handleResize, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle architectural grid points
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulsePhase += n.pulseSpeed;
        const currentAlpha = n.baseAlpha + Math.sin(n.pulsePhase) * 0.02;

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.01, currentAlpha)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      
      {/* Soft, warm architectural gradient ambient orbs */}
      <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-[#0B2D5B]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-emerald-950/25 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-[#0B2D5B]/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Top and bottom subtle darkening */}
      <div className="absolute inset-0 bg-[#07090e]/70 pointer-events-none" />
    </div>
  );
};
