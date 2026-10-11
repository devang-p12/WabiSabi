import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FileText,
    Image,
    FileCode,
    File,
    Plus,
    Search,
    Trash2,
    Eye,
    Loader2,
    Calendar,
    ArrowLeft,
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    getWorkspaceDocuments,
    deleteDocument,
    type DocumentItem,
} from "@/api/document.api";
import DocumentUploadDialog from "@/components/document/DocumentUploadDialog";
import DocumentDetailModal from "@/components/document/DocumentDetailModal";

export default function DocumentsPage() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();

    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const loadDocuments = async () => {
        if (!workspaceId) return;
        setLoading(true);
        try {
            const data = await getWorkspaceDocuments(workspaceId);
            setDocuments(data);
        } catch (error) {
            console.error("Failed to load documents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [workspaceId]);

    const handleDelete = async (docId: string) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await deleteDocument(docId);
            setDocuments((prev) => prev.filter((d) => d.id !== docId));
            if (selectedDocId === docId) {
                setSelectedDocId(null);
            }
        } catch (error) {
            console.error("Failed to delete document:", error);
        }
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 gap-1 text-[11px]">
                        <CheckCircle2 className="h-3 w-3" />
                        Processed
                    </Badge>
                );
            case "PROCESSING":
            case "PENDING":
                return (
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1 text-[11px]">
                        <Clock className="h-3 w-3" />
                        Processing
                    </Badge>
                );
            case "FAILED":
                return (
                    <Badge variant="outline" className="text-rose-500 border-rose-500/30 gap-1 text-[11px]">
                        <AlertCircle className="h-3 w-3" />
                        Failed
                    </Badge>
                );
            default:
                return null;
        }
    };

    const filteredDocuments = documents.filter((doc) =>
        doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen w-full flex-col bg-background">
            {/* Top Navigation */}
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
                        <FileText className="h-5 w-5 text-primary" />
                        <h1 className="text-base font-semibold">Documents & Ingestion</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsUploadOpen(true)}
                        size="sm"
                        className="gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        Upload Document
                    </Button>
                </div>
            </header>

            {/* Sub-header / Filters */}
            <div className="flex items-center justify-between border-b px-6 py-3 bg-muted/20">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search ingested documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs"
                    />
                </div>

                <div className="text-xs text-muted-foreground">
                    {filteredDocuments.length} document{filteredDocuments.length === 1 ? "" : "s"}
                </div>
            </div>

            {/* Document List */}
            <main className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm">Loading ingested documents...</p>
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl max-w-xl mx-auto my-8">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                            <FileText className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-medium">No documents yet</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-4">
                            Upload PDFs, DOCX, TXT files or images to extract text and prepare them for Wabi.
                        </p>
                        <Button onClick={() => setIsUploadOpen(true)} size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Attach First Document
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="group border rounded-xl p-4 bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {getDocIcon(doc.documentType)}
                                            <span className="font-medium text-sm truncate" title={doc.originalName}>
                                                {doc.originalName}
                                            </span>
                                        </div>
                                        {getStatusBadge(doc.processingStatus)}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                        <span>{doc.documentType}</span>
                                        <span>•</span>
                                        <span>{formatSize(doc.fileSize)}</span>
                                        {doc.extractedText && (
                                            <>
                                                <span>•</span>
                                                <span className="text-primary font-medium">
                                                    {doc.extractedText.wordCount.toLocaleString()} words
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedDocId(doc.id)}
                                            className="h-7 text-xs gap-1 hover:text-primary"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View Text
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                        >
                                            <a
                                                href={`/api/v1/documents/${doc.id}/download`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(doc.id)}
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Upload Dialog */}
            {workspaceId && (
                <DocumentUploadDialog
                    workspaceId={workspaceId}
                    isOpen={isUploadOpen}
                    onClose={() => setIsUploadOpen(false)}
                    onUploaded={(newDoc) => setDocuments((prev) => [newDoc, ...prev])}
                />
            )}

            {/* Detail Modal */}
            <DocumentDetailModal
                documentId={selectedDocId}
                onClose={() => setSelectedDocId(null)}
                onDelete={handleDelete}
            />
        </div>
    );
}
