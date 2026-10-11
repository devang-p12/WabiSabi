import { useState, useEffect, useRef } from "react";
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
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    runWabiAgent,
    confirmAgentAction,
    getAvailableTools,
    type WabiAgentResponse,
    type AIToolInfo,
} from "@/api/ai.api";

interface Message {
    id: string;
    sender: "user" | "assistant";
    text: string;
    agentData?: WabiAgentResponse;
    confirmed?: boolean;
    confirmationResult?: any;
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
            text: "Hello! I am Wabi, your controlled AI assistant. I reason across your projects, tasks, dependencies, Today's schedule, and workspace knowledge to help you stay on track.\n\nAll mutations run safely through explicit backend tools, and major plan revisions will always ask for your explicit confirmation.",
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [tools, setTools] = useState<AIToolInfo[]>([]);
    const [showToolsDrawer, setShowToolsDrawer] = useState(false);
    const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getAvailableTools()
            .then(setTools)
            .catch((err) => console.error("Failed to load tools:", err));
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSend = async (customPrompt?: string) => {
        const userPrompt = (customPrompt || input).trim();
        if (!workspaceId || !userPrompt || isLoading) return;

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
            const agentResponse = await runWabiAgent(workspaceId, userPrompt);
            const assistantMessage: Message = {
                id: `ast-${Date.now()}`,
                sender: "assistant",
                text: agentResponse.answer,
                agentData: agentResponse,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error: any) {
            const errorMessage: Message = {
                id: `err-${Date.now()}`,
                sender: "assistant",
                text: `Sorry, an error occurred while processing your request: ${
                    error?.response?.data?.message || error.message || "Unknown error"
                }`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmAction = async (msgId: string, confirmationId: string) => {
        if (!workspaceId || confirmingId) return;

        setConfirmingId(confirmationId);
        try {
            const res = await confirmAgentAction(workspaceId, confirmationId);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === msgId
                        ? {
                              ...m,
                              confirmed: true,
                              confirmationResult: res,
                          }
                        : m
                )
            );
        } catch (error: any) {
            alert(
                `Failed to execute confirmed action: ${
                    error?.response?.data?.message || error.message || "Unknown error"
                }`
            );
        } finally {
            setConfirmingId(null);
        }
    };

    const toggleSteps = (id: string) => {
        setExpandedSteps((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const quickQueries = [
        "What should I work on today?",
        "Why is my project delayed?",
        "What is blocking the AI analysis milestone?",
        "I finished authentication. What should I do next?",
        "Move the documentation task to next week.",
        "I can't finish this task today. Replan my project.",
    ];

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
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold flex items-center gap-2">
                                Wabi Controlled Agent
                                <Badge variant="outline" className="text-[10px] h-4 font-normal gap-1">
                                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                    Safe Backend Tools
                                </Badge>
                            </h1>
                        </div>
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
                        <span>Registered Tools ({tools.length})</span>
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
                                    className={`max-w-[85%] rounded-xl p-4 space-y-3 text-sm leading-relaxed ${
                                        m.sender === "user"
                                            ? "bg-primary text-primary-foreground ml-12"
                                            : "bg-card border shadow-sm"
                                    }`}
                                >
                                    {/* Reasoning & Tool Steps Accordion (for debug & transparency) */}
                                    {m.agentData && m.agentData.steps && m.agentData.steps.length > 0 && (
                                        <div className="border border-border/80 rounded-lg p-2.5 bg-muted/30 text-xs text-foreground space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="gap-1 font-mono text-[11px]">
                                                        <Terminal className="h-3 w-3 text-primary" />
                                                        Reasoning ({m.agentData.steps.length}{" "}
                                                        {m.agentData.steps.length === 1 ? "step" : "steps"})
                                                    </Badge>
                                                    {m.agentData.toolLogs?.length > 0 && (
                                                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                                            {m.agentData.toolLogs.length} tool{" "}
                                                            {m.agentData.toolLogs.length === 1 ? "call" : "calls"} logged
                                                        </Badge>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => toggleSteps(m.id)}
                                                    className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-[11px]"
                                                >
                                                    <span>{expandedSteps[m.id] ? "Hide Details" : "View Debug Log"}</span>
                                                    {expandedSteps[m.id] ? (
                                                        <ChevronDown className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronRight className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>

                                            {expandedSteps[m.id] && (
                                                <div className="pt-2 border-t space-y-3 font-mono text-[11px]">
                                                    {m.agentData.steps.map((st) => (
                                                        <div
                                                            key={st.stepNumber}
                                                            className="p-2 rounded bg-muted/60 border border-border/50 space-y-1.5"
                                                        >
                                                            <div className="text-primary font-semibold flex items-center justify-between">
                                                                <span>Step {st.stepNumber}: Thought</span>
                                                                {st.durationMs !== undefined && (
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {st.durationMs}ms
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="font-sans text-xs text-muted-foreground whitespace-pre-wrap">
                                                                {st.thought}
                                                            </p>
                                                            {st.action && (
                                                                <div className="mt-1 pt-1 border-t border-border/40">
                                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                                                        ACTION: {st.action}()
                                                                    </span>
                                                                    {st.actionInput && (
                                                                        <pre className="bg-background/80 p-1.5 rounded mt-1 overflow-x-auto text-[10px]">
                                                                            {JSON.stringify(st.actionInput, null, 2)}
                                                                        </pre>
                                                                    )}
                                                                    {st.observation && (
                                                                        <div className="mt-1">
                                                                            <span className="text-[10px] text-muted-foreground block font-bold">
                                                                                OBSERVATION:
                                                                            </span>
                                                                            <pre className="bg-background/80 p-1.5 rounded mt-0.5 overflow-x-auto text-[10px] max-h-36">
                                                                                {JSON.stringify(st.observation, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Main Synthesized Text Response */}
                                    <div className="whitespace-pre-wrap font-sans leading-relaxed">{m.text}</div>

                                    {/* Major/Destructive Action Confirmation Card */}
                                    {m.agentData?.requiresConfirmation && m.agentData.confirmation && !m.confirmed && (
                                        <div className="mt-3 p-4 rounded-lg border-2 border-amber-500/40 bg-amber-500/10 space-y-3">
                                            <div className="flex items-start gap-2.5">
                                                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                        Major Plan Change Requires Confirmation
                                                    </h4>
                                                    <p className="text-xs text-foreground/90">
                                                        {m.agentData.confirmation.message}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    disabled={confirmingId === m.agentData.confirmation.confirmationId}
                                                    onClick={() =>
                                                        handleConfirmAction(
                                                            m.id,
                                                            m.agentData!.confirmation!.confirmationId
                                                        )
                                                    }
                                                    className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs h-8"
                                                >
                                                    {confirmingId === m.agentData.confirmation.confirmationId ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                    )}
                                                    Confirm & Apply Changes
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setMessages((prev) =>
                                                            prev.map((msg) =>
                                                                msg.id === m.id
                                                                    ? { ...msg, confirmed: true, confirmationResult: { cancelled: true } }
                                                                    : msg
                                                            )
                                                        )
                                                    }
                                                    className="text-xs h-8 text-muted-foreground"
                                                >
                                                    Dismiss
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Successful confirmation banner */}
                                    {m.confirmed && (
                                        <div className="mt-2 p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            <span>
                                                {m.confirmationResult?.cancelled
                                                    ? "Action was dismissed without making database changes."
                                                    : "Confirmed action was successfully applied to your workspace!"}
                                            </span>
                                        </div>
                                    )}

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
                                    <span>Wabi Agent reasoning over tasks, progress & workspace context...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-4 border-t bg-card shrink-0">
                        <div className="max-w-4xl mx-auto space-y-2.5">
                            {/* Suggested Quick Prompts */}
                            <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground text-[11px] mr-1">
                                    Quick Prompts:
                                </span>
                                {quickQueries.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() => handleSend(suggestion)}
                                        className="border border-border/80 hover:border-primary/60 bg-muted/40 hover:bg-muted text-[11px] px-2.5 py-1 rounded-md transition-colors truncate max-w-sm disabled:opacity-50"
                                    >
                                        "{suggestion}"
                                    </button>
                                ))}
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask Wabi: 'What should I work on today?', 'Why is my project delayed?', etc."
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
                                <h3 className="text-sm font-semibold">Registered Tools</h3>
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

