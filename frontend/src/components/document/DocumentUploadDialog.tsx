import React, { useState, useRef } from "react";
import {
    UploadCloud,
    FileText,
    Image,
    FileCode,
    File,
    Loader2,
    X,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadDocument, type DocumentItem } from "@/api/document.api";

interface DocumentUploadDialogProps {
    workspaceId: string;
    isOpen: boolean;
    onClose: () => void;
    onUploaded: (doc: DocumentItem) => void;
}

export default function DocumentUploadDialog({
    workspaceId,
    isOpen,
    onClose,
    onUploaded,
}: DocumentUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const doc = await uploadDocument(workspaceId, file);
            onUploaded(doc);
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || err.message || "Failed to upload document");
        } finally {
            setIsUploading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.endsWith(".pdf")) return <FileText className="h-8 w-8 text-rose-500" />;
        if (lower.endsWith(".docx") || lower.endsWith(".doc")) return <FileText className="h-8 w-8 text-blue-500" />;
        if (lower.endsWith(".txt") || lower.endsWith(".md")) return <FileCode className="h-8 w-8 text-amber-500" />;
        if (lower.match(/\.(png|jpg|jpeg|webp|gif)$/)) return <Image className="h-8 w-8 text-purple-500" />;
        return <File className="h-8 w-8 text-muted-foreground" />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h3 className="text-base font-semibold">Upload Document</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Attach PDF, DOCX, TXT, or Image files for ingestion
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Dropzone */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 ${
                            dragActive
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-muted/30"
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp,.csv,.json"
                            onChange={handleFileChange}
                        />

                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <UploadCloud className="h-6 w-6" />
                        </div>

                        <div>
                            <p className="text-sm font-medium">
                                Click to browse or drag & drop files
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Supported formats: PDF, DOCX, TXT, Markdown, PNG, JPG (up to 50MB)
                            </p>
                        </div>
                    </div>

                    {/* Selected File Card */}
                    {file && (
                        <div className="flex items-center justify-between p-3.5 border rounded-lg bg-muted/40">
                            <div className="flex items-center gap-3 min-w-0">
                                {getFileIcon(file.name)}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFile(null)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Error display */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 bg-muted/20 border-t">
                    <Button variant="outline" onClick={onClose} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="min-w-24 gap-2"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Ingesting...
                            </>
                        ) : (
                            "Upload & Ingest"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
