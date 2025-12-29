import { useState, useEffect } from 'react';
import { getBlacklist } from '../utils/api';

interface BlacklistEntry {
  id: string;
  domain: string;
  reason: string;
  status: string;
  added_at: string;
}

export const Blacklist = () => {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlacklist = async () => {
      setLoading(true);
      try {
        const data = await getBlacklist();
        setEntries(data.filter((e: BlacklistEntry) => e.status === 'active'));
      } catch (error) {
        console.error('Failed to fetch blacklist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlacklist();
  }, []);

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-orbitron mb-4 text-red-400">
            Blacklist Safety Board
          </h1>
          <p className="text-text-muted">
            Sites flagged for safety concerns. Avoid these domains.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted text-lg">No blacklisted sites at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-bg-dark-2 border-2 border-red-500/30 rounded-xl p-6 card-hover relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-red-400">{entry.domain}</h3>
                  <span className="px-2 py-1 bg-red-500/20 border border-red-400/50 rounded text-xs text-red-300">
                    BLACKLISTED
                  </span>
                </div>
                <p className="text-text-muted mb-2">{entry.reason}</p>
                <div className="text-xs text-text-muted">
                  Added: {new Date(entry.added_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
