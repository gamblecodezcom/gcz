interface StatCardProps {
  label: string;
  value: string | number;
  variant?: 'cyan' | 'pink' | 'yellow' | 'green';
}

export const StatCard = ({ label, value, variant = 'cyan' }: StatCardProps) => {
  const variantStyles = {
    cyan: 'border-neon-cyan/30 bg-gradient-to-br from-neon-cyan/10 to-transparent shadow-glow-cyan',
    pink: 'border-neon-pink/30 bg-gradient-to-br from-neon-pink/10 to-transparent shadow-glow-pink',
    yellow: 'border-neon-yellow/30 bg-gradient-to-br from-neon-yellow/10 to-transparent shadow-glow-yellow',
    green: 'border-neon-green/30 bg-gradient-to-br from-neon-green/10 to-transparent shadow-glow-green',
  };

  const textColors = {
    cyan: 'text-neon-cyan',
    pink: 'text-neon-pink',
    yellow: 'text-neon-yellow',
    green: 'text-neon-green',
  };

  return (
    <div
      className={`glass-sheen rounded-xl p-4 border-2 transition-all duration-300 hover:scale-105 ${variantStyles[variant]}`}
    >
      <div className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2 font-semibold">
        {label}
      </div>
      <div className={`text-2xl md:text-3xl font-bold font-orbitron ${textColors[variant]}`}>
        {value}
      </div>
    </div>
  );
};
