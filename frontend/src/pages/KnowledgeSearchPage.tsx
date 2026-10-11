import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Brain,
    Search,
    Sparkles,
    FileText,
    BookOpen,
    ArrowLeft,
    Send,
    Loader2,
    Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    searchWorkspaceKnowledge,
    askWorkspaceKnowledge,
    type SemanticSearchResult,
    type WorkspaceRagAnswer,
} from "@/api/knowledge.api";

export default function KnowledgeSearchPage() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();

    const [mode, setMode] = useState<"search" | "ask">("search");
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
    const [ragAnswer, setRagAnswer] = useState<WorkspaceRagAnswer | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!workspaceId || !query.trim()) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            if (mode === "search") {
                const results = await searchWorkspaceKnowledge(workspaceId, query.trim());
                setSearchResults(results);
            } else {
                const answer = await askWorkspaceKnowledge(workspaceId, query.trim());
                setRagAnswer(answer);
            }
        } catch (error) {
            console.error("Knowledge search failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full flex-col bg-background">
            {/* Top Bar */}
            <header className="flex h-14 items-center justify-between border-b px-6 bg-card">
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
                        <Brain className="h-5 w-5 text-primary" />
                        <h1 className="text-base font-semibold">Workspace Knowledge & RAG</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1.5 text-xs text-muted-foreground">
                        <Database className="h-3 w-3 text-emerald-500" />
                        Vector Store Active
                    </Badge>
                </div>
            </header>

            {/* Main Container */}
            <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto p-6 space-y-6">
                {/* Search / Ask Box */}
                <div className="border rounded-xl bg-card p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div>
                            <h2 className="text-lg font-semibold">Semantic Knowledge Search</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Search meaning and ask questions across all ingested documents and workspace pages
                            </p>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => {
                                    setMode("search");
                                    setRagAnswer(null);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                    mode === "search"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Search className="h-3.5 w-3.5" />
                                Semantic Search
                            </button>
                            <button
                                onClick={() => {
                                    setMode("ask");
                                    setSearchResults([]);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                    mode === "ask"
                                        ? "bg-background text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                Ask Wabi (RAG)
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={
                                    mode === "search"
                                        ? "e.g., What did I write about authentication and database schema?"
                                        : "e.g., How does user authentication work in our system?"
                                }
                                className="pl-10 h-10 text-sm"
                            />
                        </div>
                        <Button type="submit" disabled={isLoading || !query.trim()} className="h-10 px-5 gap-2">
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : mode === "ask" ? (
                                <>
                                    <Send className="h-4 w-4" />
                                    Ask
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />
                                    Search
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Example prompts */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Try asking:</span>
                        {[
                            "authentication design",
                            "project goals",
                            "database requirements",
                        ].map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                    setQuery(suggestion);
                                }}
                                className="border border-border/70 hover:border-primary/50 bg-muted/40 hover:bg-muted px-2.5 py-1 rounded-md transition-colors"
                            >
                                "{suggestion}"
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium">
                            {mode === "ask"
                                ? "Consulting workspace vector embeddings & generating grounded response..."
                                : "Searching vector embeddings across workspace..."}
                        </p>
                    </div>
                )}

                {/* RAG Answer Display */}
                {!isLoading && mode === "ask" && ragAnswer && (
                    <div className="border rounded-xl bg-card p-6 shadow-sm space-y-4 animate-in fade-in">
                        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                            <Sparkles className="h-4 w-4" />
                            <span>Grounded Knowledge Answer</span>
                        </div>

                        <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 border rounded-lg p-5 leading-relaxed text-sm whitespace-pre-wrap">
                            {ragAnswer.answer}
                        </div>

                        {ragAnswer.sources.length > 0 && (
                            <div className="pt-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    Referenced Sources ({ragAnswer.sources.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {ragAnswer.sources.map((s, idx) => (
                                        <div
                                            key={s.id || idx}
                                            className="border rounded-lg p-3 bg-muted/20 text-xs space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between font-medium">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    {s.sourceType === "DOCUMENT" ? (
                                                        <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                    ) : (
                                                        <BookOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                    )}
                                                    <span className="truncate">{s.title}</span>
                                                </div>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {Math.round(s.score * 100)}% match
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-[11px] line-clamp-2">
                                                {s.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Semantic Search Results Display */}
                {!isLoading && mode === "search" && hasSearched && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                            <span>Found {searchResults.length} relevant excerpts</span>
                        </div>

                        {searchResults.length === 0 ? (
                            <div className="border border-dashed rounded-xl py-16 text-center text-muted-foreground space-y-2">
                                <Search className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                                <p className="text-sm font-medium">No semantic matches found</p>
                                <p className="text-xs max-w-sm mx-auto">
                                    Try using broader keywords or ensure documents and pages are saved in this workspace.
                                </p>
                            </div>
                        ) : (
                            searchResults.map((item) => (
                                <div
                                    key={item.id}
                                    className="border rounded-xl p-4 bg-card hover:border-primary/50 transition-colors space-y-2.5"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {item.sourceType === "DOCUMENT" ? (
                                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                            ) : (
                                                <BookOpen className="h-4 w-4 text-amber-500 shrink-0" />
                                            )}
                                            <span className="font-semibold text-sm truncate">
                                                {item.title}
                                            </span>
                                            <Badge variant="outline" className="text-[10px]">
                                                {item.sourceType}
                                            </Badge>
                                        </div>

                                        <Badge
                                            variant="outline"
                                            className="text-xs text-emerald-600 border-emerald-500/30 font-medium"
                                        >
                                            {Math.round(item.score * 100)}% match
                                        </Badge>
                                    </div>

                                    <div className="text-xs text-muted-foreground bg-muted/30 border rounded-md p-3 font-mono leading-relaxed select-text">
                                        {item.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
