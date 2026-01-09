interface CasinoBadgeProps {
  status: 'AVAILABLE' | 'LINKED' | 'CRYPTO S' | string;
}

export const CasinoBadge = ({ status }: CasinoBadgeProps) => {
  const getStatusStyles = (status: string) => {
    const upperStatus = status.toUpperCase();

    if (upperStatus === 'AVAILABLE') {
      return {
        bg: 'bg-neon-green/20',
        border: 'border-neon-green/50',
        text: 'text-neon-green',
        shadow: 'shadow-neon-green',
      };
    }

    if (upperStatus === 'LINKED') {
      return {
        bg: 'bg-neon-cyan/20',
        border: 'border-neon-cyan/50',
        text: 'text-neon-cyan',
        shadow: 'shadow-glow-cyan',
      };
    }

    // CRYPTO S or other statuses
    return {
      bg: 'bg-neon-yellow/20',
      border: 'border-neon-yellow/50',
      text: 'text-neon-yellow',
      shadow: 'shadow-glow-yellow',
    };
  };

  const styles = getStatusStyles(status);

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles.bg} ${styles.border} ${styles.text} ${styles.shadow}`}
    >
      {status}
    </span>
  );
};
