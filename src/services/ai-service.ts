export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface UserContext {
  userName?: string;
  cleanDays?: number;
  rankTitle?: string;
  isUrgeContext?: boolean;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/auto';

const SYSTEM_PROMPT = `You are Barnabas, a faithful, loving, and battle-tested Christian brother and recovery companion.
You are walking alongside a Christian brother on "The Knight's Path" — a sacred journey of freedom from pornography and dopamine addiction, built upon Ephesians 6 (The Armour of God).

CORE PRINCIPLES:
1. Tone: Brotherly, grounded, compassionate, and spiritually resolute. Speak like a trusted brother who has walked through the fire and knows the narrow way.
2. Grace Over Guilt: NEVER induce shame, condemnation, or despair. If the brother has slipped or relapsed, remind him of Romans 8:1 ("There is now no condemnation for those who are in Christ Jesus") and Proverbs 24:16 ("Though the righteous fall seven times, they rise again"). His ranks and armor remain intact.
3. Neurobiology & Urge Surfing: Understand that lust hijacks the dopamine reward pathway. Remind him that urges peak within 10 to 15 minutes and naturally subside if not fed. Always urge physical grounding (splashing cold water on the face, 20 pushups, stepping outside, placing the phone in another room).
4. Scripture Grounding: Quote relevant Scripture with precision (Ephesians 6:11-17, 1 Corinthians 10:13, James 4:7-8, Psalm 51:10, Colossians 3:1-3, 2 Timothy 2:22).
5. Brevity & Action: Keep your responses concise (2 to 3 punchy paragraphs or short bullet points). When a brother is in the heat of battle, he needs clear, urgent clarity, not a theological treatise. Always end with a short 1-sentence prayer he can declare aloud.
6. Crisis Safety: If any message expresses self-harm or severe despair, compassionately encourage reaching out to the 988 Suicide & Crisis Lifeline (call/text 988) or emergency help.`;

export class AIService {
  private static getApiKey(): string {
    return process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
  }

  private static getModel(): string {
    return process.env.EXPO_PUBLIC_OPENROUTER_MODEL || DEFAULT_MODEL;
  }

  /**
   * Sends user message + conversation history to OpenRouter
   */
  static async sendMessage(
    userMessage: string,
    history: ChatMessage[],
    context?: UserContext
  ): Promise<string> {
    const apiKey = this.getApiKey();
    const model = this.getModel();

    if (!apiKey) {
      return this.getLocalFallbackResponse(userMessage, context);
    }

    // Contextual system prompt
    let contextualSystem = SYSTEM_PROMPT;
    if (context) {
      contextualSystem += `\n\nCURRENT BROTHER CONTEXT:
- Name: ${context.userName || 'Brother'}
- Current Clean Time: ${context.cleanDays ?? 0} days
- Spiritual Armor Rank: ${context.rankTitle || 'Initiate'}
- In Active Urge Wave: ${context.isUrgeContext ? 'YES (URGENT: Prioritize immediate physical distraction and calming Word)' : 'No'}`;
    }

    // Format messages for OpenRouter / OpenAI chat format
    const apiMessages = [
      { role: 'system', content: contextualSystem },
      ...history.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://knights-path.recovery',
          'X-Title': "Knight's Path Recovery",
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          max_tokens: 450,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('OpenRouter API error response:', errorText);
        return this.getLocalFallbackResponse(userMessage, context);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        return this.getLocalFallbackResponse(userMessage, context);
      }

      return reply;
    } catch (error) {
      console.warn('Failed to call OpenRouter API:', error);
      return this.getLocalFallbackResponse(userMessage, context);
    }
  }

  /**
   * Reliable Scripture fallback in case of network interruption
   */
  private static getLocalFallbackResponse(
    message: string,
    context?: UserContext
  ): string {
    const lower = message.toLowerCase();

    if (lower.includes('urge') || lower.includes('hard') || context?.isUrgeContext) {
      return `Brother, breathe deeply right now. "No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear" (1 Corinthians 10:13).\n\nYour nervous system is experiencing a temporary dopamine wave. It will peak within 10 minutes and fade. Stand up right now, put your phone across the room, splash cold water on your face, and take 5 slow breaths.\n\nDeclare with me: "Lord Jesus, I submit to You. Strengthen my heart and deliver me from this wave. Amen."`;
    }

    if (lower.includes('slip') || lower.includes('relapse') || lower.includes('shame') || lower.includes('guilt')) {
      return `Brother, hear the Word of God: "There is now no condemnation for those who are in Christ Jesus" (Romans 8:1). A slip does not erase who you are. The enemy wants you isolated in guilt, but Christ offers restoration.\n\nProverbs 24:16 says though the righteous fall seven times, they rise again. Your armor is intact. Stand back up, wash your face, and walk in the light. The journey continues today.`;
    }

    return `Stand firm in the Lord, brother. "Put on the full armor of God, so that you can take your stand against the devil's schemes" (Ephesians 6:11).\n\nKeep your eyes fixed upon Christ today. In every temptation, He has already provided the way of peace. How can I pray for you right now?`;
  }
}

