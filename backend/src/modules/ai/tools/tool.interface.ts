import { z } from "zod";

export interface ToolExecutionContext {
    userId: string;
    workspaceId: string;
}

export interface ToolDefinition<TParams = any, TResult = any> {
    name: string;
    description: string;
    parameters: z.ZodType<TParams>;
    execute: (params: TParams, context: ToolExecutionContext) => Promise<TResult>;
}
