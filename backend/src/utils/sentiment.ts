import Sentiment from 'sentiment';

const sentimentAnalyzer = new Sentiment();

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  comparative: number;
}

/**
 * Analyzes the sentiment of a given text
 * @param text - The text to analyze
 * @returns Object containing sentiment classification and scores
 */
export function analyzeSentiment(text: string): SentimentResult {
  const result = sentimentAnalyzer.analyze(text);

  // Normalize the comparative score to be between -1 and 1
  // The comparative score is the sentiment score divided by the number of tokens
  // Typical range is around -5 to 5, but we'll cap it at -1 to 1
  let normalizedScore = Math.max(-1, Math.min(1, result.comparative));

  // Round to 2 decimal places
  normalizedScore = Math.round(normalizedScore * 100) / 100;

  // Classify sentiment based on score
  let sentiment: 'positive' | 'neutral' | 'negative';
  if (result.score > 0) {
    sentiment = 'positive';
  } else if (result.score < 0) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  return {
    sentiment,
    score: normalizedScore,
    comparative: result.comparative,
  };
}

/**
 * Analyzes sentiment of title and body together
 * @param title - The title text (optional)
 * @param body - The body text
 * @returns Combined sentiment analysis
 */
export function analyzeCombinedSentiment(title: string | null, body: string): SentimentResult {
  const combinedText = title ? `${title} ${body}` : body;
  return analyzeSentiment(combinedText);
}
