import dotenv from "dotenv";
import type {
    AIChatMessage,
    AICompletionOptions,
    AIProvider,
    AIProviderHealthCheckResult,
} from "./ai-provider.js";

export interface OllamaProviderConfig {
    baseUrl?: string | undefined;
    model?: string | undefined;
    timeoutMs?: number | undefined;
}

export class OllamaProvider implements AIProvider {
    readonly name = "ollama";
    private readonly configuredBaseUrl?: string | undefined;
    private readonly configuredModel?: string | undefined;
    private readonly timeoutMs: number;

    constructor(config?: OllamaProviderConfig) {
        this.configuredBaseUrl = config?.baseUrl;
        this.configuredModel = config?.model;
        this.timeoutMs = config?.timeoutMs ?? 7000;
    }

    get baseUrl(): string {
        dotenv.config();
        const raw =
            this.configuredBaseUrl ||
            process.env.OLLAMA_BASE_URL ||
            "http://localhost:11434";
        return raw.replace(/\/+$/, "");
    }

    get defaultModel(): string {
        dotenv.config();
        return (
            this.configuredModel ||
            process.env.OLLAMA_MODEL ||
            "llama3"
        );
    }

    get embeddingModel(): string {
        dotenv.config();
        return process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
    }

    async checkHealth(): Promise<AIProviderHealthCheckResult> {
        const startTime = Date.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const url = `${this.baseUrl}/api/tags`;
            const response = await fetch(url, {
                method: "GET",
                signal: controller.signal,
            });

            clearTimeout(timer);
            const responseTimeMs = Date.now() - startTime;

            if (!response.ok) {
                return {
                    healthy: false,
                    provider: this.name,
                    model: this.defaultModel,
                    baseUrl: this.baseUrl,
                    message: `Ollama returned HTTP status ${response.status}: ${response.statusText}`,
                    responseTimeMs,
                };
            }

            const data = (await response.json()) as {
                models?: Array<{ name?: string; model?: string }>;
            };

            const availableModels = (data.models || [])
                .map((m) => m.name || m.model || "")
                .filter(Boolean);

            const modelConfiguredIsAvailable = availableModels.some(
                (m) =>
                    m === this.defaultModel ||
                    m.startsWith(`${this.defaultModel}:`)
            );

            return {
                healthy: true,
                provider: this.name,
                model: this.defaultModel,
                baseUrl: this.baseUrl,
                message: modelConfiguredIsAvailable
                    ? `Ollama is reachable and model '${this.defaultModel}' is available.`
                    : `Ollama is reachable. Configured model '${this.defaultModel}' was not found in downloaded tags, but Ollama service is active.`,
                availableModels,
                responseTimeMs,
            };
        } catch (error: any) {
            clearTimeout(timer);
            const responseTimeMs = Date.now() - startTime;
            const isAborted = error.name === "AbortError";
            const message = isAborted
                ? `Connection timed out after ${this.timeoutMs}ms while trying to reach Ollama at ${this.baseUrl}`
                : error.message || "Failed to connect to Ollama service";

            return {
                healthy: false,
                provider: this.name,
                model: this.defaultModel,
                baseUrl: this.baseUrl,
                message,
                responseTimeMs,
            };
        }
    }

    async generateText(
        prompt: string,
        options?: AICompletionOptions
    ): Promise<string> {
        const controller = new AbortController();
        const timeoutMs = options?.timeoutMs ?? (options?.maxTokens ? 120000 : 180000);
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const payload: Record<string, any> = {
                model: this.defaultModel,
                prompt,
                stream: false,
            };

            if (options?.systemPrompt) {
                payload.system = options.systemPrompt;
            }

            if (options?.json) {
                payload.format = "json";
            }

            if (options?.temperature !== undefined || options?.maxTokens !== undefined) {
                payload.options = {
                    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
                    ...(options.maxTokens !== undefined ? { num_predict: options.maxTokens } : {}),
                };
            }

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timer);

            if (!response.ok) {
                const errorBody = await response.text().catch(() => "");
                throw new Error(
                    `Ollama generate request failed with status ${response.status}: ${errorBody || response.statusText}`
                );
            }

            const data = (await response.json()) as { response?: string };
            return data.response ?? "";
        } catch (error: any) {
            clearTimeout(timer);
            if (error.name === "AbortError" || error.code === 20) {
                throw new Error(
                    `AI generation timed out after ${Math.round(timeoutMs / 1000)}s. The local model took too long to complete.`
                );
            }
            throw error;
        }
    }

    async chat(
        messages: AIChatMessage[],
        options?: AICompletionOptions
    ): Promise<string> {
        const controller = new AbortController();
        const timeoutMs = options?.maxTokens ? 60000 : 30000;
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const payload: Record<string, any> = {
                model: this.defaultModel,
                messages,
                stream: false,
            };

            if (options?.json) {
                payload.format = "json";
            }

            if (options?.temperature !== undefined || options?.maxTokens !== undefined) {
                payload.options = {
                    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
                    ...(options.maxTokens !== undefined ? { num_predict: options.maxTokens } : {}),
                };
            }

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timer);

            if (!response.ok) {
                const errorBody = await response.text().catch(() => "");
                throw new Error(
                    `Ollama chat request failed with status ${response.status}: ${errorBody || response.statusText}`
                );
            }

            const data = (await response.json()) as {
                message?: { content?: string };
            };
            return data.message?.content ?? "";
        } catch (error: any) {
            clearTimeout(timer);
            throw error;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const results = await this.generateEmbeddings([text]);
        return results[0] ?? [];
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) return [];
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 60000);

        try {
            const payload = {
                model: this.embeddingModel,
                input: texts.length === 1 ? (texts[0] ?? "") : texts,
            };

            const response = await fetch(`${this.baseUrl}/api/embed`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timer);

            if (!response.ok) {
                const errorBody = await response.text().catch(() => "");
                throw new Error(
                    `Ollama embed request failed with status ${response.status}: ${errorBody || response.statusText}`
                );
            }

            const data = (await response.json()) as { embeddings?: number[][] };
            return data.embeddings || [];
        } catch (error: any) {
            clearTimeout(timer);
            throw error;
        }
    }
}

