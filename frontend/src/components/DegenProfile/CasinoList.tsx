import { CasinoBadge } from './CasinoBadge';

interface LinkedCasino {
  name: string;
  status: 'AVAILABLE' | 'LINKED' | 'CRYPTO S' | string;
}

interface CasinoListProps {
  casinos: LinkedCasino[];
}

export const CasinoList = ({ casinos = [] }: CasinoListProps) => {
  if (!casinos || casinos.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        No linked casino accounts yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {casinos.map((casino, index) => (
        <div
          key={`${casino.name}-${index}`}
          className="flex items-center justify-between p-4 rounded-xl bg-bg-dark border border-white/10 hover:border-neon-cyan/40 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-pink/20 flex items-center justify-center border border-white/10">
              <span className="text-xl">🎰</span>
            </div>
            <span className="font-semibold text-text-primary group-hover:text-neon-cyan transition-colors">
              {casino.name}
            </span>
          </div>
          <CasinoBadge status={casino.status} />
        </div>
      ))}
    </div>
  );
};
