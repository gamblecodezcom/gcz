import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DashboardStats } from '../../types';

interface AnalyticsChartsProps {
  stats?: DashboardStats;
}

const COLORS = {
  neonCyan: '#00ffff',
  neonPink: '#ff00ff',
  neonYellow: '#ffff00',
  neonGreen: '#00ff00',
};

export const AnalyticsCharts = ({}: AnalyticsChartsProps) => {
  const [chartData, setChartData] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch analytics data
    fetch('/api/analytics/admin/overview')
      .then(res => res.json())
      .then(data => {
        setChartData(data);
        // Generate time series data for charts
        setTimeSeriesData([
          { name: 'Users', value: data.users.total, color: COLORS.neonCyan },
          { name: 'Spins', value: data.spins.total, color: COLORS.neonYellow },
          { name: 'Raffles', value: data.raffles.totalEntries, color: COLORS.neonPink },
          { name: 'Giveaways', value: data.giveaways.totalEntries, color: COLORS.neonGreen },
        ]);
      })
      .catch(console.error);
  }, []);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  const segmentData = chartData.segments.map((seg: any) => ({
    name: seg.segment.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value: seg.count,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-bg-dark-2 rounded-xl border border-neon-cyan/30 p-6 shadow-lg shadow-neon-cyan/10">
          <h3 className="text-lg font-bold text-neon-cyan mb-4">User Growth</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Total Users</span>
              <span className="text-neon-green font-bold">{chartData.users.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">New (7d)</span>
              <span className="text-neon-yellow">{chartData.users.new7d}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">New (30d)</span>
              <span className="text-neon-pink">{chartData.users.new30d}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-dark-2 rounded-xl border border-neon-yellow/30 p-6 shadow-lg shadow-neon-yellow/10">
          <h3 className="text-lg font-bold text-neon-yellow mb-4">Wheel Activity</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Total Spins</span>
              <span className="text-neon-green font-bold">{chartData.spins.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Last 24h</span>
              <span className="text-neon-cyan">{chartData.spins.last24h}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Jackpots</span>
              <span className="text-neon-pink">{chartData.spins.jackpots}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-dark-2 rounded-xl border border-neon-pink/30 p-6 shadow-lg shadow-neon-pink/10">
          <h3 className="text-lg font-bold text-neon-pink mb-4">Raffle Engagement</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Total Entries</span>
              <span className="text-neon-green font-bold">{chartData.raffles.totalEntries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Participants</span>
              <span className="text-neon-cyan">{chartData.raffles.uniqueParticipants}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Entries (24h)</span>
              <span className="text-neon-yellow">{chartData.raffles.entries24h}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-dark-2 rounded-xl border border-neon-green/30 p-6 shadow-lg shadow-neon-green/10">
          <h3 className="text-lg font-bold text-neon-green mb-4">Giveaways</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Total Entries</span>
              <span className="text-neon-green font-bold">{chartData.giveaways.totalEntries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Participants</span>
              <span className="text-neon-cyan">{chartData.giveaways.uniqueParticipants}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Entries (24h)</span>
              <span className="text-neon-yellow">{chartData.giveaways.entries24h}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Segments Pie Chart */}
        <div className="bg-bg-dark-2 rounded-xl border border-neon-cyan/30 p-6 shadow-lg shadow-neon-cyan/10">
          <h3 className="text-lg font-bold text-neon-cyan mb-4">User Segments Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {segmentData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % 4]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #00ffff',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Overview Bar Chart */}
        <div className="bg-bg-dark-2 rounded-xl border border-neon-pink/30 p-6 shadow-lg shadow-neon-pink/10">
          <h3 className="text-lg font-bold text-neon-pink mb-4">Activity Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#00ffff" />
              <YAxis stroke="#00ffff" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #00ffff',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="#00ffff" radius={[8, 8, 0, 0]}>
                {timeSeriesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
