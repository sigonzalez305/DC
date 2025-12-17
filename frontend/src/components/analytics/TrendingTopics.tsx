import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Signal } from '../../services/api';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface TopicTrend {
  topic: string;
  count: number;
  change: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  sparklineData: { value: number }[];
}

const TrendingTopics = () => {
  const [trends, setTrends] = useState<TopicTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.getSignals({ limit: 500 });
      if (response.success && response.data) {
        const trendData = analyzeTrends(response.data);
        setTrends(trendData);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const analyzeTrends = (signals: Signal[]): TopicTrend[] => {
    // Group by category and calculate trends
    const categoryMap = new Map<string, { recent: number; older: number; sentiments: string[]; timeline: number[] }>();

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const twoDaysAgo = now - 48 * 60 * 60 * 1000;

    signals.forEach(signal => {
      const category = signal.category || 'Uncategorized';
      const timestamp = new Date(signal.timestamp).getTime();

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { recent: 0, older: 0, sentiments: [], timeline: [0, 0, 0, 0, 0] });
      }

      const data = categoryMap.get(category)!;
      data.sentiments.push(signal.sentiment);

      // Categorize by time period
      if (timestamp > oneDayAgo) {
        data.recent++;
        data.timeline[4]++;
      } else if (timestamp > twoDaysAgo) {
        data.older++;
        data.timeline[3]++;
      } else {
        data.timeline[Math.floor(Math.random() * 3)]++; // Distribute older data
      }
    });

    // Convert to trend objects
    const trends: TopicTrend[] = [];
    categoryMap.forEach((value, topic) => {
      const change = value.older > 0 ? ((value.recent - value.older) / value.older) * 100 : 100;
      const sentimentCounts = {
        positive: value.sentiments.filter(s => s === 'positive').length,
        neutral: value.sentiments.filter(s => s === 'neutral').length,
        negative: value.sentiments.filter(s => s === 'negative').length,
      };

      const dominantSentiment =
        sentimentCounts.positive > sentimentCounts.negative && sentimentCounts.positive > sentimentCounts.neutral
          ? 'positive'
          : sentimentCounts.negative > sentimentCounts.neutral
          ? 'negative'
          : 'neutral';

      trends.push({
        topic,
        count: value.recent,
        change,
        sentiment: dominantSentiment,
        sparklineData: value.timeline.map(v => ({ value: v })),
      });
    });

    // Sort by absolute change and take top 6
    return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'border-green-500 bg-green-50';
      case 'negative':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-yellow-500 bg-yellow-50';
    }
  };

  const getSentimentTextColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-700';
      case 'negative':
        return 'text-red-700';
      default:
        return 'text-yellow-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">What's New</h2>
        <span className="text-xs text-gray-500">Trending Topics - Last 24 Hours</span>
      </div>

      {trends.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No trending topics yet. Generate more data to see trends.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trends.map((trend, index) => (
            <div
              key={index}
              className={`border-l-4 ${getSentimentColor(trend.sentiment)} rounded-r-lg p-4 transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">{trend.topic}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${getSentimentTextColor(trend.sentiment)}`}>
                      {trend.sentiment}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-600">{trend.count} mentions</span>
                  </div>
                </div>
              </div>

              {/* Mini Sparkline */}
              <div className="h-8 mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend.sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={trend.change > 0 ? '#10b981' : '#ef4444'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Trend Indicator */}
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center text-sm font-bold ${
                    trend.change > 0 ? 'text-green-600' : trend.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {trend.change > 0 ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      +{Math.abs(trend.change).toFixed(0)}%
                    </>
                  ) : trend.change < 0 ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {Math.abs(trend.change).toFixed(0)}%
                    </>
                  ) : (
                    '→ No change'
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingTopics;
