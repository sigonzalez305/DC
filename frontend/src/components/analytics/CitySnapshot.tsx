import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { SentimentStats } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TrendData {
  positive: number;
  neutral: number;
  negative: number;
}

const CitySnapshot = () => {
  const [stats, setStats] = useState<SentimentStats>({
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0,
    average_score: 0,
  });
  const [prevStats, setPrevStats] = useState<TrendData>({ positive: 0, neutral: 0, negative: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.getCitywideSentiment();
      if (response.success && response.data) {
        // Store previous stats for trend calculation
        setPrevStats({
          positive: stats.positive,
          neutral: stats.neutral,
          negative: stats.negative,
        });
        setStats(response.data);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const sentimentData = [
    { name: 'Positive', value: stats.positive, color: '#10b981' },
    { name: 'Neutral', value: stats.neutral, color: '#f59e0b' },
    { name: 'Negative', value: stats.negative, color: '#ef4444' },
  ];

  const positiveTrend = calculateTrend(stats.positive, prevStats.positive);
  const negativeTrend = calculateTrend(stats.negative, prevStats.negative);

  const TrendArrow = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const isUp = value > 0;
    return (
      <span className={`ml-2 text-xs ${isUp ? 'text-green-600' : 'text-red-600'}`}>
        {isUp ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">City Snapshot</h2>

      {/* Volume of Interactions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-gray-600 mb-1">Total Interactions</div>
          <div className="text-3xl font-bold text-blue-600">{stats.total.toLocaleString()}</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-gray-600 mb-1">Positive</div>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-green-600">{stats.positive.toLocaleString()}</span>
            <TrendArrow value={positiveTrend} />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.total > 0 ? ((stats.positive / stats.total) * 100).toFixed(1) : 0}% of total
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-sm text-gray-600 mb-1">Negative</div>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-red-600">{stats.negative.toLocaleString()}</span>
            <TrendArrow value={negativeTrend} />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.total > 0 ? ((stats.negative / stats.total) * 100).toFixed(1) : 0}% of total
          </div>
        </div>
      </div>

      {/* Sentiment Analysis Bar Chart */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Sentimental Analysis</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sentimentData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={80} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {sentimentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Average Sentiment Score */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Average Sentiment Score</span>
          <span className={`text-2xl font-bold ${
            stats.average_score > 0.3 ? 'text-green-600' :
            stats.average_score < -0.3 ? 'text-red-600' :
            'text-yellow-600'
          }`}>
            {stats.average_score.toFixed(2)}
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              stats.average_score > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.abs(stats.average_score) * 50}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default CitySnapshot;
