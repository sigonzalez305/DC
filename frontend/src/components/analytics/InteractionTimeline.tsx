import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Signal } from '../../services/api';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TimelineData {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

const InteractionTimeline = () => {
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'line' | 'area'>('area');

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.getSignals({ limit: 1000 });
      if (response.success && response.data) {
        // Group signals by date and sentiment
        const groupedData = groupByDate(response.data);
        setTimelineData(groupedData);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const groupByDate = (signals: Signal[]): TimelineData[] => {
    const grouped = new Map<string, { positive: number; neutral: number; negative: number }>();

    signals.forEach(signal => {
      const date = new Date(signal.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      const current = grouped.get(date) || { positive: 0, neutral: 0, negative: 0 };
      current[signal.sentiment]++;
      grouped.set(date, current);
    });

    // Convert to array and sort by date
    const result: TimelineData[] = [];
    grouped.forEach((value, date) => {
      result.push({
        date,
        positive: value.positive,
        neutral: value.neutral,
        negative: value.negative,
        total: value.positive + value.neutral + value.negative,
      });
    });

    // Sort by date (most recent last) and take last 7 days
    return result.slice(-7);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Interaction Volume Over Time</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('area')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'area'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setViewMode('line')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'line'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Line
          </button>
        </div>
      </div>

      {timelineData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No data available. Generate mock data to see trends.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          {viewMode === 'area' ? (
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="positive"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Positive"
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
                name="Neutral"
              />
              <Area
                type="monotone"
                dataKey="negative"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Negative"
              />
            </AreaChart>
          ) : (
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="positive"
                stroke="#10b981"
                strokeWidth={2}
                name="Positive"
              />
              <Line
                type="monotone"
                dataKey="neutral"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Neutral"
              />
              <Line
                type="monotone"
                dataKey="negative"
                stroke="#ef4444"
                strokeWidth={2}
                name="Negative"
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Total"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default InteractionTimeline;
