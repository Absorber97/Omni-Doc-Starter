import { type Concept } from '@/lib/store/concepts-store';

// Map of keywords to emojis
const emojiMap = new Map([
  ['policy', '📜'],
  ['rule', '📋'],
  ['housing', '🏠'],
  ['student', '👨‍🎓'],
  ['safety', '🛡️'],
  ['community', '👥'],
  ['academic', '📚'],
  ['deadline', '⏰'],
  ['requirement', '✅'],
  ['facility', '🏢'],
  ['service', '🛠️'],
  ['support', '🤝'],
]);

export type ImportanceLevel = 'high' | 'medium' | 'low';

export const importanceLevelConfig = {
  high: { 
    label: 'High Priority', 
    color: 'bg-red-500',
    range: [0.7, 1.0]
  },
  medium: { 
    label: 'Important', 
    color: 'bg-yellow-500',
    range: [0.4, 0.7]
  },
  low: { 
    label: 'Good to Know', 
    color: 'bg-green-500',
    range: [0, 0.4]
  },
} as const;

export function getImportanceLevel(importance: number): ImportanceLevel {
  if (importance >= importanceLevelConfig.high.range[0]) return 'high';
  if (importance >= importanceLevelConfig.medium.range[0]) return 'medium';
  return 'low';
}

export function getImportanceColor(importance: number): string {
  return `hsl(${Math.round(importance * 120)}, 70%, 45%)`;
}

export function getConceptEmoji(text: string): string {
  const lowercaseText = text.toLowerCase();
  
  for (const [keyword, emoji] of emojiMap) {
    if (lowercaseText.includes(keyword)) {
      return emoji;
    }
  }
  
  return '💡'; // Default emoji
}

export function generateTags(text: string): string[] {
  // Extract key terms as tags
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/); // Split on whitespace
  
  const tags = new Set<string>();
  
  // Add relevant words as tags
  words.forEach(word => {
    if (word.length > 4 && !commonWords.has(word)) {
      tags.add(word);
    }
  });
  
  return Array.from(tags).slice(0, 5); // Limit to 5 tags
} 