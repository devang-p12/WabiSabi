import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Bot,
    Send,
    Wrench,
    ArrowLeft,
    Loader2,
    ChevronDown,
    ChevronRight,
    Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    orchestratePrompt,
    getAvailableTools,
    type OrchestrationResult,
    type AIToolInfo,
} from "@/api/ai.api";

interface Message {
    id: string;
    sender: "user" | "assistant";
    text: string;
    data?: OrchestrationResult;
    timestamp: Date;
}

export default function AIToolAssistantPage() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            sender: "assistant",
            text: "Hello! I am Wabi's Intelligent Project Assistant equipped with controlled backend tools. I can check projects, report progress, plan today's schedule, create tasks, inspect blockers, and suggest replans. How can I help you?",
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [tools, setTools] = useState<AIToolInfo[]>([]);
    const [showToolsDrawer, setShowToolsDrawer] = useState(false);
    const [expandedToolDetails, setExpandedToolDetails] = useState<Record<string, boolean>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getAvailableTools()
            .then(setTools)
            .catch((err) => console.error("Failed to load tools:", err));
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!workspaceId || !input.trim() || isLoading) return;

        const userPrompt = input.trim();
        setInput("");

        const userMessage: Message = {
            id: `usr-${Date.now()}`,
            sender: "user",
            text: userPrompt,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const result = await orchestratePrompt(workspaceId, userPrompt);
            const assistantMessage: Message = {
                id: `ast-${Date.now()}`,
                sender: "assistant",
                text: result.response,
                data: result,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
            const errorMessage: Message = {
                id: `err-${Date.now()}`,
                sender: "assistant",
                text: `Sorry, an error occurred while processing your request: ${error?.response?.data?.message || error.message || "Unknown error"}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleToolDetail = (id: string) => {
        setExpandedToolDetails((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <div className="flex h-screen w-full flex-col bg-background">
            {/* Header */}
            <header className="flex h-14 items-center justify-between border-b px-6 bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/workspaces/${workspaceId}`)}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Workspace
                    </Button>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <h1 className="text-base font-semibold">Wabi AI Assistant & Tools</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowToolsDrawer(!showToolsDrawer)}
                        className="gap-1.5 text-xs h-8"
                    >
                        <Wrench className="h-3.5 w-3.5" />
                        <span>Available Tools ({tools.length})</span>
                    </Button>
                </div>
            </header>

            {/* Layout Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Chat Stream Area */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl w-full mx-auto">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex gap-3 ${
                                    m.sender === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                {m.sender === "assistant" && (
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[80%] rounded-xl p-4 space-y-2 text-sm leading-relaxed ${
                                        m.sender === "user"
                                            ? "bg-primary text-primary-foreground ml-12"
                                            : "bg-card border shadow-sm"
                                    }`}
                                >
                                    {/* Tool Execution Callout if tool was used */}
                                    {m.data?.toolUsed && (
                                        <div className="border border-border/80 rounded-lg p-2.5 bg-muted/30 text-xs text-foreground space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="gap-1 font-mono text-[11px]">
                                                        <Terminal className="h-3 w-3 text-primary" />
                                                        {m.data.toolUsed}
                                                    </Badge>
                                                    <span className="text-muted-foreground text-[11px]">
                                                        Executed safely
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => toggleToolDetail(m.id)}
                                                    className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-[11px]"
                                                >
                                                    <span>Details</span>
                                                    {expandedToolDetails[m.id] ? (
                                                        <ChevronDown className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronRight className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>

                                            {m.data.thought && (
                                                <p className="text-[11px] text-muted-foreground italic">
                                                    "{m.data.thought}"
                                                </p>
                                            )}

                                            {expandedToolDetails[m.id] && (
                                                <div className="pt-2 border-t space-y-2 font-mono text-[11px]">
                                                    {m.data.toolInput && (
                                                        <div>
                                                            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                                                                Tool Input
                                                            </span>
                                                            <pre className="bg-muted p-2 rounded mt-0.5 overflow-x-auto text-[10px]">
                                                                {JSON.stringify(m.data.toolInput, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {m.data.toolOutput && (
                                                        <div>
                                                            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                                                                Tool Output
                                                            </span>
                                                            <pre className="bg-muted p-2 rounded mt-0.5 overflow-x-auto text-[10px] max-h-40">
                                                                {JSON.stringify(m.data.toolOutput, null, 2)}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Text content */}
                                    <div className="whitespace-pre-wrap">{m.text}</div>

                                    <div
                                        className={`text-[10px] pt-1 ${
                                            m.sender === "user"
                                                ? "text-primary-foreground/70"
                                                : "text-muted-foreground"
                                        }`}
                                    >
                                        {m.timestamp.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading state indicator */}
                        {isLoading && (
                            <div className="flex gap-3 justify-start animate-in fade-in">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3 text-xs text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span>Understanding request & orchestrating tools...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-4 border-t bg-card shrink-0">
                        <div className="max-w-4xl mx-auto space-y-2">
                            {/* Suggested Quick Prompts */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground pb-1">
                                <span className="font-medium text-foreground">Suggested queries:</span>
                                {[
                                    "What is our today plan?",
                                    "Show me any blocked tasks",
                                    "Create a task titled 'Update API Documentation' with HIGH priority",
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => setInput(suggestion)}
                                        className="border border-border/70 hover:border-primary/50 bg-muted/40 hover:bg-muted px-2.5 py-1 rounded-md transition-colors truncate max-w-xs"
                                    >
                                        "{suggestion}"
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSend} className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask Wabi AI or instruct it to perform a task using backend tools..."
                                    className="h-11 text-sm flex-1"
                                    disabled={isLoading}
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="h-11 px-5 gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            Send
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Available Tools Drawer */}
                {showToolsDrawer && (
                    <aside className="w-80 border-l bg-card flex flex-col p-4 shrink-0 overflow-y-auto animate-in slide-in-from-right duration-150">
                        <div className="flex items-center justify-between pb-3 border-b mb-3">
                            <div className="flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-semibold">Controlled Tools</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowToolsDrawer(false)}
                                className="h-6 w-6 p-0"
                            >
                                ✕
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {tools.map((t) => (
                                <div
                                    key={t.name}
                                    className="p-3 border rounded-lg bg-muted/20 space-y-1 text-xs"
                                >
                                    <div className="font-mono font-semibold text-primary">
                                        {t.name}()
                                    </div>
                                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                                        {t.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
