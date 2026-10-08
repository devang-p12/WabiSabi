import { useEffect, useRef, useState, useCallback } from "react";
import {
    Paperclip,
    Upload,
    Link as LinkIcon,
    Trash2,
    Image as ImageIcon,
    FileText,
    FileArchive,
    FileCode,
    File as FileIcon,
    Download,
    Eye,
    Loader2,
} from "lucide-react";
import {
    getTaskAttachments,
    uploadTaskAttachment,
    createUrlAttachment,
    deleteTaskAttachment,
    setTaskCover,
    resolveAssetUrl,
    type TaskAttachment,
} from "@/api/attachment.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageLightbox from "@/components/ui/image-lightbox";
import { cn } from "cn";

interface TaskAttachmentsProps {
    taskId: string;
    coverUrl?: string | null;
    onCoverChange?: (newCoverUrl: string | null) => void;
}

function formatBytes(bytes: number, decimals = 1): string {
    if (!+bytes) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function TaskAttachments({
    taskId,
    coverUrl,
    onCoverChange,
}: TaskAttachmentsProps) {
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [urlInputOpen, setUrlInputOpen] = useState(false);
    const [customUrl, setCustomUrl] = useState("");
    const [customName, setCustomName] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [lightboxTitle, setLightboxTitle] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadAttachments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTaskAttachments(taskId);
            setAttachments(data);
        } catch (err) {
            console.error("Failed to load task attachments:", err);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        loadAttachments();
    }, [loadAttachments]);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file) continue;
                const created = await uploadTaskAttachment(taskId, file);
                setAttachments((prev) => [created, ...prev]);

                // If cover was set on backend, update local
                if (created.type.startsWith("image/") && !coverUrl) {
                    onCoverChange?.(created.url);
                }
            }
        } catch (err) {
            console.error("Failed to upload attachment:", err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleAddUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customUrl.trim()) return;

        try {
            setUploading(true);
            const created = await createUrlAttachment(taskId, {
                url: customUrl.trim(),
                name: customName.trim() || customUrl.trim().split("/").pop() || "Linked Asset",
            });
            setAttachments((prev) => [created, ...prev]);
            setCustomUrl("");
            setCustomName("");
            setUrlInputOpen(false);

            if (created.type.startsWith("image/") && !coverUrl) {
                onCoverChange?.(created.url);
            }
        } catch (err) {
            console.error("Failed to add link attachment:", err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, url: string) => {
        try {
            await deleteTaskAttachment(id);
            setAttachments((prev) => prev.filter((a) => a.id !== id));
            if (coverUrl === url) {
                onCoverChange?.(null);
            }
        } catch (err) {
            console.error("Failed to delete attachment:", err);
        }
    };

    const handleToggleCover = async (url: string) => {
        try {
            const nextCover = coverUrl === url ? null : url;
            await setTaskCover(taskId, nextCover);
            onCoverChange?.(nextCover);
        } catch (err) {
            console.error("Failed to set task cover:", err);
        }
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-purple-500" />;
        if (type.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
        if (type.includes("zip") || type.includes("tar") || type.includes("rar")) {
            return <FileArchive className="h-4 w-4 text-amber-500" />;
        }
        if (type.includes("javascript") || type.includes("json") || type.includes("html") || type.includes("typescript")) {
            return <FileCode className="h-4 w-4 text-blue-500" />;
        }
        return <FileIcon className="h-4 w-4 text-zinc-500" />;
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium text-foreground">
                        Attachments
                        {attachments.length > 0 && (
                            <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                                ({attachments.length})
                            </span>
                        )}
                    </h4>
                </div>

                <div className="flex items-center gap-1.5">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 text-xs px-2.5 cursor-pointer"
                    >
                        {uploading ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Upload className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Upload file
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUrlInputOpen((prev) => !prev)}
                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                        <LinkIcon className="mr-1 h-3.5 w-3.5" />
                        Add link
                    </Button>
                </div>
            </div>

            {/* URL Input Form */}
            {urlInputOpen && (
                <form
                    onSubmit={handleAddUrl}
                    className="p-3 rounded-lg border bg-muted/20 space-y-2 animate-in fade-in duration-150"
                >
                    <div className="text-xs font-medium text-foreground">Attach from link</div>
                    <Input
                        placeholder="https://example.com/image.png or asset URL..."
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        className="h-8 text-xs bg-background"
                        autoFocus
                    />
                    <Input
                        placeholder="Display title (optional)"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="h-8 text-xs bg-background"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setUrlInputOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!customUrl.trim() || uploading}
                            className="h-7 text-xs"
                        >
                            {uploading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                            Attach link
                        </Button>
                    </div>
                </form>
            )}

            {/* Drag & Drop Zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    handleFileUpload(e.dataTransfer.files);
                }}
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition-colors",
                    dragActive
                        ? "border-primary bg-primary/5"
                        : "border-border/70 hover:border-border hover:bg-muted/10",
                    attachments.length === 0 ? "py-6" : "py-3"
                )}
            >
                {loading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading attachments...
                    </div>
                ) : attachments.length === 0 ? (
                    <div className="flex flex-col items-center gap-1.5">
                        <Upload className="h-6 w-6 text-muted-foreground/60" />
                        <p className="text-xs text-muted-foreground">
                            Drop files here to upload, or paste an image link.
                        </p>
                    </div>
                ) : (
                    <p className="text-[11px] text-muted-foreground">
                        Drop more files here or click Upload file above
                    </p>
                )}
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {attachments.map((att) => {
                        const isImage = att.type.startsWith("image/");
                        const fullUrl = resolveAssetUrl(att.url);
                        const isCover = coverUrl === att.url;

                        return (
                            <div
                                key={att.id}
                                className={cn(
                                    "group relative flex items-center gap-3 p-2.5 rounded-lg border transition-all hover:shadow-xs",
                                    isCover
                                        ? "border-primary/50 bg-primary/5"
                                        : "border-border bg-card/60 hover:bg-muted/30"
                                )}
                            >
                                {/* Thumbnail / File Icon */}
                                <div
                                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted/60 overflow-hidden cursor-pointer"
                                    onClick={() => {
                                        if (isImage) {
                                            setLightboxUrl(fullUrl);
                                            setLightboxTitle(att.name);
                                        } else {
                                            window.open(fullUrl, "_blank");
                                        }
                                    }}
                                >
                                    {isImage ? (
                                        <img
                                            src={fullUrl}
                                            alt={att.name}
                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        getFileIcon(att.type)
                                    )}

                                    {isImage && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                            <Eye className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                {/* Meta details */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                        <p className="truncate text-xs font-medium text-foreground" title={att.name}>
                                            {att.name}
                                        </p>
                                        {isCover && (
                                            <span className="shrink-0 text-[10px] font-semibold text-primary bg-primary/10 px-1 py-0.2 rounded-xs">
                                                Cover
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {formatBytes(att.size)} • {new Date(att.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {isImage && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-7 w-7 rounded-md cursor-pointer",
                                                isCover
                                                    ? "text-primary hover:bg-primary/20"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            )}
                                            onClick={() => handleToggleCover(att.url)}
                                            title={isCover ? "Remove card cover" : "Set as card cover"}
                                        >
                                            <ImageIcon className="h-3.5 w-3.5" />
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                        onClick={() => {
                                            const link = document.createElement("a");
                                            link.href = fullUrl;
                                            link.download = att.name;
                                            link.target = "_blank";
                                            link.click();
                                        }}
                                        title="Download"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                        onClick={() => handleDelete(att.id, att.url)}
                                        title="Delete attachment"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Lightbox for Image Previews */}
            <ImageLightbox
                imageUrl={lightboxUrl}
                title={lightboxTitle}
                onClose={() => setLightboxUrl(null)}
            />
        </div>
    );
}
