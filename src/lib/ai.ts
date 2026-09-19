/**
 * AI Service Abstraction Layer
 *
 * Decouples the rest of the application from any specific AI provider.
 * The provider is selected at runtime via the AI_PROVIDER env var.
 *
 * Supported providers:
 *   - openai  (requires OPENAI_API_KEY)
 *   - anthropic (requires ANTHROPIC_API_KEY)
 *   - groq   (requires GROQ_API_KEY — OpenAI-compatible endpoint)
 *   - mock   (no API key, returns deterministic responses — for testing)
 *
 * Both ChatProvider and TranslationProvider are server-side only.
 * Never import this module from client components.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatProvider {
  chat(messages: ChatMessage[], systemPrompt: string): Promise<string>;
}

export interface TranslationProvider {
  translate(content: string, targetLanguage: string): Promise<string>;
}

// ---------------------------------------------------------------------------
// OpenAI Provider
// ---------------------------------------------------------------------------

class OpenAIChatProvider implements ChatProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 600,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}

class OpenAITranslationProvider implements TranslationProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(content: string, targetLanguage: string): Promise<string> {
    const systemPrompt = `You are a precise, faithful translator. 
Translate the following HTML content from English to ${targetLanguage}.

RULES (strictly follow):
- Translate ONLY the visible text — do NOT modify any HTML tags, attributes, class names, or structure.
- Preserve all headings, paragraphs, lists, links, emphasis, and code blocks exactly.
- Do NOT summarize, rewrite, embellish, add, or remove any content.
- Translate the LANGUAGE of the text only — preserve meaning, order, and author's voice.
- Technical terms, proper nouns, names, and numbers must remain unchanged.
- Return only the translated HTML. No preamble, no explanation.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI Translation API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? content;
  }
}

// ---------------------------------------------------------------------------
// Groq Provider (OpenAI-compatible API)
// ---------------------------------------------------------------------------

const GROQ_CHAT_MODEL = "llama-3.1-8b-instant";
const GROQ_TRANSLATION_MODEL = "llama-3.1-8b-instant";

class GroqChatProvider implements ChatProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_CHAT_MODEL,
        max_tokens: 600,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}

class GroqTranslationProvider implements TranslationProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(content: string, targetLanguage: string): Promise<string> {
    const systemPrompt = `You are a precise, faithful translator.
Translate the following HTML content from English to ${targetLanguage}.

RULES (strictly follow):
- Translate ONLY the visible text — do NOT modify any HTML tags, attributes, class names, or structure.
- Preserve all headings, paragraphs, lists, links, emphasis, and code blocks exactly.
- Do NOT summarize, rewrite, embellish, add, or remove any content.
- Translate the LANGUAGE of the text only — preserve meaning, order, and author's voice.
- Technical terms, proper nouns, names, and numbers must remain unchanged.
- Return only the translated HTML. No preamble, no explanation.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_TRANSLATION_MODEL,
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq Translation API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? content;
  }
}

// ---------------------------------------------------------------------------
// Anthropic Provider
// ---------------------------------------------------------------------------

class AnthropicChatProvider implements ChatProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 600,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text ?? "";
  }
}

class AnthropicTranslationProvider implements TranslationProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async translate(content: string, targetLanguage: string): Promise<string> {
    const systemPrompt = `You are a precise, faithful translator. 
Translate the following HTML content from English to ${targetLanguage}.
RULES: Translate ONLY visible text — preserve all HTML tags/attributes. Do NOT summarize or rewrite. Return only translated HTML.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic Translation API error: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text ?? content;
  }
}

// ---------------------------------------------------------------------------
// Mock Provider (for testing/dev without API keys)
// ---------------------------------------------------------------------------

class MockChatProvider implements ChatProvider {
  async chat(_messages: ChatMessage[], _systemPrompt: string): Promise<string> {
    return "I'm a mock AI — configure AI_PROVIDER and the corresponding API key to enable real AI responses.";
  }
}

class MockTranslationProvider implements TranslationProvider {
  async translate(content: string, _targetLanguage: string): Promise<string> {
    return content; // Return original — no translation without keys
  }
}

// ---------------------------------------------------------------------------
// Factory — lazy singleton
// ---------------------------------------------------------------------------

let _chat: ChatProvider | null = null;
let _translation: TranslationProvider | null = null;

export function getChatProvider(): ChatProvider {
  if (_chat) return _chat;

  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
    _chat = new OpenAIChatProvider(key);
  } else if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic");
    _chat = new AnthropicChatProvider(key);
  } else if (provider === "groq") {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY is required when AI_PROVIDER=groq");
    _chat = new GroqChatProvider(key);
  } else {
    _chat = new MockChatProvider();
  }

  return _chat;
}

export function getTranslationProvider(): TranslationProvider {
  if (_translation) return _translation;

  const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
    _translation = new OpenAITranslationProvider(key);
  } else if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic");
    _translation = new AnthropicTranslationProvider(key);
  } else {
    _translation = new MockTranslationProvider();
  }

  return _translation;
}
