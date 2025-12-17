import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Keyword } from '../../services/api';

const TopKeywords = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.getKeywords({ limit: 500, top: 30 });
      if (response.success && response.data) {
        setKeywords(response.data);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(keyword);
    console.log(`Filtering signals by keyword: ${keyword}`);
    // TODO: Implement actual signal filtering
    // This could be done by:
    // 1. Updating URL parameters: window.location.search = `?keyword=${keyword}`
    // 2. Using React Router and updating search params
    // 3. Lifting state to App.tsx and passing filter down to signal components
  };

  const getSentimentColor = (sentiment: string, isSelected: boolean = false) => {
    const baseClasses = 'cursor-pointer transition-all';
    const selectedClasses = isSelected ? 'ring-2 ring-offset-2' : '';

    switch (sentiment) {
      case 'positive':
        return `${baseClasses} text-green-600 hover:text-green-700 hover:bg-green-50 ${selectedClasses} ${isSelected ? 'ring-green-500 bg-green-50' : ''}`;
      case 'negative':
        return `${baseClasses} text-red-600 hover:text-red-700 hover:bg-red-50 ${selectedClasses} ${isSelected ? 'ring-red-500 bg-red-50' : ''}`;
      default:
        return `${baseClasses} text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 ${selectedClasses} ${isSelected ? 'ring-yellow-500 bg-yellow-50' : ''}`;
    }
  };

  const getFontSize = (count: number, maxCount: number) => {
    const minSize = 0.75; // rem
    const maxSize = 2.5; // rem
    const ratio = count / maxCount;
    return minSize + ratio * (maxSize - minSize);
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

  const maxCount = keywords.length > 0 ? keywords[0].count : 1;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Top Keywords</h2>
          <p className="text-xs text-gray-500 mt-1">Click any keyword to filter signals</p>
        </div>
        <span className="text-xs text-gray-500">From recent signals</span>
      </div>

      {selectedKeyword && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-800">
              Filtering by: <strong>{selectedKeyword}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedKeyword(null)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear filter
          </button>
        </div>
      )}

      {keywords.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No keywords available. Generate signals to see keyword trends.
        </div>
      ) : (
        <>
          {/* Word Cloud Style Display */}
          <div className="flex flex-wrap gap-2 items-center justify-center p-6 bg-gray-50 rounded-lg min-h-[300px]">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className={`inline-block px-3 py-1 rounded-full font-semibold ${getSentimentColor(
                  keyword.sentiment,
                  selectedKeyword === keyword.word
                )}`}
                style={{
                  fontSize: `${getFontSize(keyword.count, maxCount)}rem`,
                  opacity: 0.7 + (keyword.count / maxCount) * 0.3,
                }}
                title={`${keyword.word}: ${keyword.count} mentions (${keyword.sentiment}) - Click to filter`}
                onClick={() => handleKeywordClick(keyword.word)}
              >
                {keyword.word}
              </span>
            ))}
          </div>

          {/* Top 10 List */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Top 10 Keywords</h3>
            <div className="space-y-2">
              {keywords.slice(0, 10).map((keyword, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors"
                  onClick={() => handleKeywordClick(keyword.word)}
                  title={`Click to filter signals by "${keyword.word}"`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-gray-400 font-mono text-sm w-6">
                      #{index + 1}
                    </span>
                    <span
                      className={`font-medium px-2 py-1 rounded ${getSentimentColor(
                        keyword.sentiment,
                        selectedKeyword === keyword.word
                      )}`}
                    >
                      {keyword.word}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          keyword.sentiment === 'positive'
                            ? 'bg-green-500'
                            : keyword.sentiment === 'negative'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${(keyword.count / maxCount) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {keyword.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TopKeywords;
