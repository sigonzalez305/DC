import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Signal } from '../../services/api';

interface Keyword {
  word: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const TopKeywords = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.getSignals({ limit: 500 });
      if (response.success && response.data) {
        const extractedKeywords = extractKeywords(response.data);
        setKeywords(extractedKeywords);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const extractKeywords = (signals: Signal[]): Keyword[] => {
    const keywordMap = new Map<string, { count: number; sentiments: string[] }>();

    signals.forEach(signal => {
      // Use keywords from signal if available, otherwise extract from body
      let words: string[] = [];

      if (signal.keywords && signal.keywords.length > 0) {
        words = signal.keywords;
      } else {
        // Simple keyword extraction from body
        words = signal.body
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 4); // Filter out short words
      }

      words.forEach(word => {
        if (!keywordMap.has(word)) {
          keywordMap.set(word, { count: 0, sentiments: [] });
        }
        const data = keywordMap.get(word)!;
        data.count++;
        data.sentiments.push(signal.sentiment);
      });
    });

    // Convert to array and calculate dominant sentiment
    const keywords: Keyword[] = [];
    keywordMap.forEach((value, word) => {
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

      keywords.push({
        word,
        count: value.count,
        sentiment: dominantSentiment as 'positive' | 'neutral' | 'negative',
      });
    });

    // Sort by count and return top 30
    return keywords.sort((a, b) => b.count - a.count).slice(0, 30);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 hover:text-green-700 hover:bg-green-50';
      case 'negative':
        return 'text-red-600 hover:text-red-700 hover:bg-red-50';
      default:
        return 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50';
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Top Keywords</h2>
        <span className="text-xs text-gray-500">From recent signals</span>
      </div>

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
                className={`inline-block px-3 py-1 rounded-full font-semibold cursor-pointer transition-all ${getSentimentColor(
                  keyword.sentiment
                )}`}
                style={{
                  fontSize: `${getFontSize(keyword.count, maxCount)}rem`,
                  opacity: 0.7 + (keyword.count / maxCount) * 0.3,
                }}
                title={`${keyword.word}: ${keyword.count} mentions (${keyword.sentiment})`}
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
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-gray-400 font-mono text-sm w-6">
                      #{index + 1}
                    </span>
                    <span className={`font-medium ${getSentimentColor(keyword.sentiment)}`}>
                      {keyword.word}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
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
