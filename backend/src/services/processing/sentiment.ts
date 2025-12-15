import Sentiment from 'sentiment';

const analyzer = new Sentiment();

export function analyzeSentiment(text: string): {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
} {
  const result = analyzer.analyze(text);
  const normalizedScore = result.score / 10; // Normalize to roughly -1 to 1

  let sentiment: 'positive' | 'neutral' | 'negative';
  if (result.score > 0) sentiment = 'positive';
  else if (result.score < 0) sentiment = 'negative';
  else sentiment = 'neutral';

  return { sentiment, score: normalizedScore };
}
