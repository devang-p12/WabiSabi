import { useState, useEffect } from "react";
import {
    FileText,
    Image,
    FileCode,
    File,
    Download,
    Trash2,
    Copy,
    Check,
    Loader2,
    Calendar,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDocument, type DocumentItem } from "@/api/document.api";

interface DocumentDetailModalProps {
    documentId: string | null;
    onClose: () => void;
    onDelete?: (documentId: string) => void;
}

export default function DocumentDetailModal({
    documentId,
    onClose,
    onDelete,
}: DocumentDetailModalProps) {
    const [document, setDocument] = useState<DocumentItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"text" | "metadata">("text");

    useEffect(() => {
        if (!documentId) {
            setDocument(null);
            return;
        }

        let isMounted = true;
        setLoading(true);

        getDocument(documentId)
            .then((doc) => {
                if (isMounted) setDocument(doc);
            })
            .catch((err) => {
                console.error("Failed to load document:", err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [documentId]);

    if (!documentId) return null;

    const copyExtractedText = () => {
        if (!document?.extractedText?.content) return;
        navigator.clipboard.writeText(document.extractedText.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getDocIcon = (type: string) => {
        switch (type) {
            case "PDF":
                return <FileText className="h-5 w-5 text-rose-500" />;
            case "DOCX":
                return <FileText className="h-5 w-5 text-blue-500" />;
            case "TXT":
                return <FileCode className="h-5 w-5 text-amber-500" />;
            case "IMAGE":
                return <Image className="h-5 w-5 text-purple-500" />;
            default:
                return <File className="h-5 w-5 text-muted-foreground" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3 min-w-0">
                        {document && getDocIcon(document.documentType)}
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold truncate">
                                {document?.originalName || "Document Details"}
                            </h3>
                            {document && (
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                    <span>{document.documentType}</span>
                                    <span>•</span>
                                    <span>{formatSize(document.fileSize)}</span>
                                    <span>•</span>
                                    <Badge
                                        variant="outline"
                                        className={
                                            document.processingStatus === "COMPLETED"
                                                ? "text-emerald-500 border-emerald-500/30"
                                                : document.processingStatus === "FAILED"
                                                ? "text-rose-500 border-rose-500/30"
                                                : "text-amber-500 border-amber-500/30"
                                        }
                                    >
                                        {document.processingStatus}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {document && (
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8 gap-1.5"
                            >
                                <a
                                    href={`/api/v1/documents/${document.id}/download`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Download</span>
                                </a>
                            </Button>
                        )}
                        {onDelete && document && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    onDelete(document.id);
                                    onClose();
                                }}
                                className="h-8 text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8">
                            Close
                        </Button>
                    </div>
                </div>

                {/* Subheader / Tabs */}
                <div className="flex items-center justify-between px-6 py-2 border-b bg-muted/20 text-xs">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab("text")}
                            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                                activeTab === "text"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Extracted Text
                        </button>
                        <button
                            onClick={() => setActiveTab("metadata")}
                            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                                activeTab === "metadata"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            File Metadata
                        </button>
                    </div>

                    {activeTab === "text" && document?.extractedText && (
                        <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">
                                {document.extractedText.wordCount.toLocaleString()} words ·{" "}
                                {document.extractedText.characterCount.toLocaleString()} chars
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyExtractedText}
                                className="h-7 text-xs gap-1.5"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-3 w-3 text-emerald-500" />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copy text</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-sm">Loading document contents...</p>
                        </div>
                    ) : activeTab === "text" ? (
                        document?.extractedText?.content ? (
                            <div className="bg-muted/30 border rounded-lg p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text">
                                {document.extractedText.content}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                                <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-3" />
                                <p className="text-sm font-medium">No text extracted</p>
                                <p className="text-xs mt-1 max-w-sm">
                                    {document?.errorMessage ||
                                        "This document could not yield extracted text or is an image with OCR architecture pending."}
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border rounded-lg p-3 bg-muted/20">
                                    <span className="text-muted-foreground block mb-1">MIME Type</span>
                                    <span className="font-mono">{document?.mimeType}</span>
                                </div>
                                <div className="border rounded-lg p-3 bg-muted/20">
                                    <span className="text-muted-foreground block mb-1">Uploaded At</span>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>
                                            {document?.createdAt
                                                ? new Date(document.createdAt).toLocaleString()
                                                : "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {document?.extractedText?.metadata && (
                                <div className="border rounded-lg p-4 bg-muted/10">
                                    <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block mb-2">
                                        Parser Extra Metadata
                                    </span>
                                    <pre className="font-mono text-xs bg-muted/40 p-3 rounded overflow-x-auto">
                                        {JSON.stringify(document.extractedText.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
