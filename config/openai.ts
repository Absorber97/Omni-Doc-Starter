export const openAIConfig = {
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
  embeddingModel: process.env.NEXT_PUBLIC_OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
} as const;

// OpenAI client config
export const openAIClientConfig = {
  apiKey: openAIConfig.apiKey,
  dangerouslyAllowBrowser: true,
} as const;