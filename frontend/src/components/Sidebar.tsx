import { useState, useEffect } from 'react';
import { api, SentimentStats, Source } from '../services/api';

const Sidebar = () => {
  const [stats, setStats] = useState<SentimentStats>({
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0,
    average_score: 0,
  });
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch sentiment stats
        const sentimentResponse = await api.getCitywideSentiment();
        if (sentimentResponse.success && sentimentResponse.data) {
          setStats(sentimentResponse.data);
        }

        // Fetch active sources
        const sourcesResponse = await api.getSources({ is_active: true });
        if (sourcesResponse.success && sourcesResponse.data) {
          setSources(sourcesResponse.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Dashboard</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Overview</h3>
        <div className="space-y-3">
          <div className="bg-blue-50 rounded p-3">
            <div className="text-xs text-gray-600">Total Signals</div>
            <div className="text-2xl font-bold text-dc-blue">
              {loading ? '...' : stats.total}
            </div>
          </div>
          <div className="bg-green-50 rounded p-3">
            <div className="text-xs text-gray-600">Positive</div>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : stats.positive}
            </div>
          </div>
          <div className="bg-yellow-50 rounded p-3">
            <div className="text-xs text-gray-600">Neutral</div>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? '...' : stats.neutral}
            </div>
          </div>
          <div className="bg-red-50 rounded p-3">
            <div className="text-xs text-gray-600">Negative</div>
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : stats.negative}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Filters</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Ward</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue">
              <option value="">All Wards</option>
              <option value="1">Ward 1</option>
              <option value="2">Ward 2</option>
              <option value="3">Ward 3</option>
              <option value="4">Ward 4</option>
              <option value="5">Ward 5</option>
              <option value="6">Ward 6</option>
              <option value="7">Ward 7</option>
              <option value="8">Ward 8</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sentiment</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue">
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Source Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-dc-blue">
              <option value="">All Sources</option>
              <option value="twitter">Twitter</option>
              <option value="instagram">Instagram</option>
              <option value="reddit">Reddit</option>
              <option value="nextdoor">Nextdoor</option>
              <option value="government">Government</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Sources */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Active Sources</h3>
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : sources.length === 0 ? (
          <div className="text-sm text-gray-500">No sources configured yet</div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-700">{source.name}</div>
                  <div className="text-xs text-gray-500">
                    {source.last_fetched_at
                      ? `Last: ${new Date(source.last_fetched_at).toLocaleTimeString()}`
                      : 'Never fetched'}
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
