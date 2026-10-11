import { z } from "zod";

export interface ToolExecutionContext {
    userId: string;
    workspaceId: string;
}

export interface ToolDefinition<TParams = any, TResult = any> {
    name: string;
    description: string;
    parameters: z.ZodType<TParams>;
    requiresConfirmation?: boolean;
    getConfirmationMessage?: (params: TParams) => string;
    execute: (params: TParams, context: ToolExecutionContext) => Promise<TResult>;
}
