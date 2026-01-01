import { useEffect, useRef } from 'react';

export const AnimatedDice = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const dice: Array<{
      x: number;
      y: number;
      size: number;
      rotation: number;
      rotationSpeed: number;
      speedX: number;
      speedY: number;
      color: string;
    }> = [];

    const colors = ['#00F5FF', '#FF007A', '#FFD600', '#00FF85'];
    
    for (let i = 0; i < 8; i++) {
      dice.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 20 + Math.random() * 30,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const drawDice = (d: typeof dice[0]) => {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rotation);
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = d.color;
      
      // Draw dice face
      ctx.beginPath();
      ctx.moveTo(-d.size / 2, -d.size / 2);
      ctx.lineTo(d.size / 2, -d.size / 2);
      ctx.lineTo(d.size / 2, d.size / 2);
      ctx.lineTo(-d.size / 2, d.size / 2);
      ctx.closePath();
      ctx.stroke();
      
      // Draw dots
      const dotSize = d.size / 8;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(-d.size / 4, -d.size / 4, dotSize, 0, Math.PI * 2);
      ctx.arc(d.size / 4, d.size / 4, dotSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      dice.forEach((d) => {
        d.x += d.speedX;
        d.y += d.speedY;
        d.rotation += d.rotationSpeed;
        
        if (d.x < 0 || d.x > canvas.width) d.speedX *= -1;
        if (d.y < 0 || d.y > canvas.height) d.speedY *= -1;
        
        d.x = Math.max(0, Math.min(canvas.width, d.x));
        d.y = Math.max(0, Math.min(canvas.height, d.y));
        
        drawDice(d);
      });
      
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-20 z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
