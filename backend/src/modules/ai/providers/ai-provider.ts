export interface AIChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface AICompletionOptions {
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    systemPrompt?: string | undefined;
    json?: boolean | undefined;
    timeoutMs?: number | undefined;
}

export interface AIProviderHealthCheckResult {
    healthy: boolean;
    provider: string;
    model: string;
    baseUrl: string;
    message: string;
    availableModels?: string[] | undefined;
    responseTimeMs?: number | undefined;
}

export interface AIProvider {
    readonly name: string;
    readonly defaultModel: string;
    readonly baseUrl: string;

    checkHealth(): Promise<AIProviderHealthCheckResult>;
    generateText(prompt: string, options?: AICompletionOptions): Promise<string>;
    chat(messages: AIChatMessage[], options?: AICompletionOptions): Promise<string>;
    generateEmbedding?(text: string): Promise<number[]>;
    generateEmbeddings?(texts: string[]): Promise<number[][]>;
}
