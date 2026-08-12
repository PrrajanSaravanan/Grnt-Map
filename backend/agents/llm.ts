import { GoogleGenAI } from "@google/genai";

/**
 * Provider-agnostic JSON completion for the agent team.
 *
 * Google's free tier meters 20 requests/day *per model per project*, which a
 * six-agent pipeline burns through in a few runs. Groq, OpenRouter, Cerebras and
 * a local Ollama all expose an OpenAI-compatible endpoint with far higher (or
 * unlimited) free ceilings, so any of them can back the agents instead.
 *
 * Selection order:
 *   1. LLM_PROVIDER, if set explicitly
 *   2. whichever provider has credentials configured (Groq preferred — fastest
 *      free tier by a wide margin)
 *   3. Gemini
 *
 * Within a provider the client walks a (key × model) grid, so exhausting one
 * pair falls through to the next rather than failing the run.
 */

type Provider = "groq" | "openrouter" | "cerebras" | "ollama" | "gemini";

interface ProviderConfig {
  name: Provider;
  /** OpenAI-compatible base URL; unused for gemini. */
  baseUrl?: string;
  keys: string[];
  models: string[];
  /** Ollama runs locally and needs no key. */
  keyless?: boolean;
}

const DEFAULTS: Record<Provider, { baseUrl?: string; models: string[]; keyless?: boolean }> = {
  // ~1k–14k requests/day free, and the fastest inference available.
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-120b"],
  },
  // Models suffixed ":free" cost nothing; limits vary per model.
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      "deepseek/deepseek-chat-v3.1:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemini-2.0-flash-exp:free",
    ],
  },
  cerebras: {
    baseUrl: "https://api.cerebras.ai/v1",
    models: ["llama-3.3-70b", "llama3.1-8b"],
  },
  // Fully local: no key, no quota, no network.
  ollama: {
    baseUrl: process.env.OLLAMA_URL || "http://localhost:11434/v1",
    models: (process.env.OLLAMA_MODELS || "llama3.1:8b").split(","),
    keyless: true,
  },
  gemini: {
    models: [
      "gemini-flash-latest",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
    ],
  },
};

function envKeys(...names: string[]): string[] {
  for (const n of names) {
    const raw = process.env[n];
    if (raw) {
      const list = raw.split(",").map((k) => k.trim()).filter(Boolean);
      if (list.length) return list;
    }
  }
  return [];
}

function envModels(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (raw) {
    const list = raw.split(",").map((m) => m.trim()).filter(Boolean);
    if (list.length) return list;
  }
  return fallback;
}

function resolveProvider(): ProviderConfig {
  const explicit = (process.env.LLM_PROVIDER || "").toLowerCase().trim() as Provider;

  const candidates: ProviderConfig[] = [
    {
      name: "groq",
      baseUrl: process.env.GROQ_BASE_URL || DEFAULTS.groq.baseUrl,
      keys: envKeys("GROQ_API_KEYS", "GROQ_API_KEY"),
      models: envModels("GROQ_MODELS", DEFAULTS.groq.models),
    },
    {
      name: "openrouter",
      baseUrl: process.env.OPENROUTER_BASE_URL || DEFAULTS.openrouter.baseUrl,
      keys: envKeys("OPENROUTER_API_KEYS", "OPENROUTER_API_KEY"),
      models: envModels("OPENROUTER_MODELS", DEFAULTS.openrouter.models),
    },
    {
      name: "cerebras",
      baseUrl: process.env.CEREBRAS_BASE_URL || DEFAULTS.cerebras.baseUrl,
      keys: envKeys("CEREBRAS_API_KEYS", "CEREBRAS_API_KEY"),
      models: envModels("CEREBRAS_MODELS", DEFAULTS.cerebras.models),
    },
    {
      name: "ollama",
      baseUrl: DEFAULTS.ollama.baseUrl,
      keys: ["local"],
      models: envModels("OLLAMA_MODELS", DEFAULTS.ollama.models),
      keyless: true,
    },
    {
      name: "gemini",
      keys: envKeys("GEMINI_API_KEYS", "GEMINI_API_KEY"),
      models: envModels("GEMINI_MODELS", DEFAULTS.gemini.models),
    },
  ];

  if (explicit) {
    const chosen = candidates.find((c) => c.name === explicit);
    if (!chosen) throw new Error(`Unknown LLM_PROVIDER "${explicit}"`);
    if (!chosen.keyless && chosen.keys.length === 0) {
      throw new Error(`LLM_PROVIDER=${explicit} but no API key is set for it.`);
    }
    return chosen;
  }

  // Ollama is only auto-selected when explicitly requested — it may not be running.
  const auto = candidates.find((c) => c.name !== "ollama" && c.keys.length > 0);
  if (!auto) {
    throw new Error(
      "No LLM credentials found. Set one of GROQ_API_KEY (free, recommended), " +
        "OPENROUTER_API_KEY, CEREBRAS_API_KEY, or GEMINI_API_KEY in backend/.env — " +
        "or run Ollama locally and set LLM_PROVIDER=ollama."
    );
  }
  return auto;
}

let config: ProviderConfig | null = null;
let keyIndex = 0;
let modelIndex = 0;
const exhausted = new Set<string>();
const geminiClients = new Map<string, GoogleGenAI>();

export function activeProvider(): string {
  if (!config) config = resolveProvider();
  return `${config.name} (${config.models.length} model(s), ${config.keyless ? "local" : `${config.keys.length} key(s)`})`;
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/**
 * Some models wrap JSON in prose. Recover the outermost object or array rather
 * than failing the whole agent step.
 */
function extractJson(text: string): string {
  const cleaned = stripFences(text);
  if (/^[[{]/.test(cleaned)) return cleaned;
  const first = cleaned.search(/[[{]/);
  if (first === -1) return cleaned;
  const open = cleaned[first];
  const close = open === "{" ? "}" : "]";
  const last = cleaned.lastIndexOf(close);
  return last > first ? cleaned.slice(first, last + 1) : cleaned;
}

function isQuotaError(err: unknown): boolean {
  const msg = String((err as Error)?.message || err);
  return /429|quota|rate.?limit|RESOURCE_EXHAUSTED|prepayment|insufficient|too many requests/i.test(msg);
}

function isTransientError(err: unknown): boolean {
  const msg = String((err as Error)?.message || err);
  return /503|502|UNAVAILABLE|overloaded|high demand|500|INTERNAL|deadline|ETIMEDOUT|fetch failed|ECONNRESET/i.test(msg);
}

function isModelUnavailable(err: unknown): boolean {
  const msg = String((err as Error)?.message || err);
  return /404|400|not found|no longer available|not supported|does not exist|decommissioned|invalid model/i.test(msg);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOpenAICompatible(
  cfg: ProviderConfig,
  key: string,
  model: string,
  prompt: string,
  temperature?: number
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!cfg.keyless) headers.Authorization = `Bearer ${key}`;
  if (cfg.name === "openrouter") {
    headers["HTTP-Referer"] = "http://localhost:5173";
    headers["X-Title"] = "GrantWeave";
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a precise assistant. Respond with valid JSON only — no prose, no markdown fences.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      ...(temperature != null ? { temperature } : {}),
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(key: string, model: string, prompt: string, temperature?: number): Promise<string> {
  let client = geminiClients.get(key);
  if (!client) {
    client = new GoogleGenAI({ apiKey: key });
    geminiClients.set(key, client);
  }
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      ...(temperature != null ? { temperature } : {}),
    },
  });
  return response.text ?? "";
}

/** Steps to the next model, wrapping onto the next key. */
function advance(cfg: ProviderConfig): boolean {
  modelIndex++;
  if (modelIndex % cfg.models.length === 0) {
    keyIndex = (keyIndex + 1) % cfg.keys.length;
  }
  return exhausted.size < cfg.keys.length * cfg.models.length;
}

export async function callJSON<T>(prompt: string, opts?: { temperature?: number }): Promise<T> {
  if (!config) {
    config = resolveProvider();
    console.log(`[llm] provider: ${config.name} — models: ${config.models.join(", ")}`);
  }
  const cfg = config;
  const maxAttempts = cfg.keys.length * cfg.models.length + 4;
  let lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = cfg.keys[keyIndex % cfg.keys.length];
    const model = cfg.models[modelIndex % cfg.models.length];
    const pairId = `${keyIndex % cfg.keys.length}:${model}`;

    if (exhausted.has(pairId)) {
      if (!advance(cfg)) break;
      continue;
    }

    try {
      const text =
        cfg.name === "gemini"
          ? await callGemini(key, model, prompt, opts?.temperature)
          : await callOpenAICompatible(cfg, key, model, prompt, opts?.temperature);
      return JSON.parse(extractJson(text)) as T;
    } catch (err) {
      lastErr = err;

      if (isModelUnavailable(err)) {
        for (let k = 0; k < cfg.keys.length; k++) exhausted.add(`${k}:${model}`);
        console.warn(`[llm] ${model} unavailable on ${cfg.name} — dropping from rotation`);
        if (!advance(cfg)) break;
        continue;
      }

      if (isQuotaError(err)) {
        exhausted.add(pairId);
        console.warn(`[llm] quota spent: ${cfg.name} key #${keyIndex % cfg.keys.length} / ${model}`);
        if (!advance(cfg)) break;
        continue;
      }

      if (isTransientError(err)) {
        const delay = Math.min(8000, 1000 * 2 ** attempt) + Math.random() * 400;
        console.warn(`[llm] ${model} unavailable (attempt ${attempt + 1}) — retrying in ${Math.round(delay)}ms`);
        await sleep(delay);
        advance(cfg);
        continue;
      }

      if (err instanceof SyntaxError) {
        console.warn("[llm] malformed JSON — retrying");
        await sleep(400);
        advance(cfg);
        continue;
      }

      throw err;
    }
  }

  if (exhausted.size >= cfg.keys.length * cfg.models.length) {
    throw new Error(
      `Every ${cfg.name} key/model pair is exhausted. Add another key, switch provider ` +
        `(LLM_PROVIDER=groq with a free key from console.groq.com), or run Ollama locally.`
    );
  }
  throw lastErr;
}
