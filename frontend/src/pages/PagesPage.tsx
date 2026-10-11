import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    FileText,
    Loader2,
    Sidebar as SidebarIcon,
    Trash2,
} from "lucide-react";

import {
    getWorkspacePages,
    createPage,
    getPage,
    deletePage,
    type Page,
} from "@/api/page.api";
import { Button } from "@/components/ui/button";
import PageTree from "@/components/page/PageTree";
import BlockEditor from "@/components/page/BlockEditor";

export default function PagesPage() {
    const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId?: string }>();
    const navigate = useNavigate();

    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [loadingTree, setLoadingTree] = useState(true);
    const [loadingPage, setLoadingPage] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Load workspace pages hierarchy
    const loadPages = useCallback(async () => {
        if (!workspaceId) return;
        try {
            setLoadingTree(true);
            const data = await getWorkspacePages(workspaceId);
            setPages(data);

            // If no pageId in URL but pages exist, select first root page
            if (!pageId && data.length > 0) {
                const first = data[0];
                if (first) {
                    navigate(`/workspaces/${workspaceId}/pages/${first.id}`, { replace: true });
                }
            }
        } catch (err) {
            console.error("Failed to load workspace pages:", err);
        } finally {
            setLoadingTree(false);
        }
    }, [workspaceId, pageId, navigate]);

    useEffect(() => {
        loadPages();
    }, [loadPages]);

    // Load single selected page with its blocks
    useEffect(() => {
        if (!pageId) {
            setSelectedPage(null);
            return;
        }

        let isMounted = true;
        setLoadingPage(true);
        getPage(pageId)
            .then((p) => {
                if (isMounted) setSelectedPage(p);
            })
            .catch((err) => {
                console.error("Failed to load page:", err);
                if (isMounted) setSelectedPage(null);
            })
            .finally(() => {
                if (isMounted) setLoadingPage(false);
            });

        return () => {
            isMounted = false;
        };
    }, [pageId]);

    const handleSelectPage = (id: string) => {
        navigate(`/workspaces/${workspaceId}/pages/${id}`);
    };

    const handleCreatePage = async (parentId?: string) => {
        if (!workspaceId) return;
        try {
            const newPage = await createPage(workspaceId, {
                title: "Untitled",
                icon: "📄",
                parentId: parentId || null,
            });

            await loadPages();
            navigate(`/workspaces/${workspaceId}/pages/${newPage.id}`);
        } catch (err) {
            console.error("Failed to create page:", err);
        }
    };

    const handleDeletePage = async (id: string) => {
        try {
            await deletePage(id);
            if (pageId === id) {
                navigate(`/workspaces/${workspaceId}/pages`);
            }
            await loadPages();
        } catch (err) {
            console.error("Failed to delete page:", err);
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Pages Sidebar Tree */}
            <aside
                className={`${
                    sidebarOpen ? "w-64" : "w-0"
                } border-r bg-muted/20 flex flex-col transition-all duration-200 overflow-hidden shrink-0`}
            >
                {/* Header Back & Action */}
                <div className="p-3 border-b flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/workspaces/${workspaceId}`)}
                        className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                        Workspace
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCreatePage()}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="New page"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* Tree List */}
                <div className="flex-1 overflow-y-auto p-3">
                    {loadingTree ? (
                        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading pages...
                        </div>
                    ) : (
                        <PageTree
                            pages={pages}
                            selectedPageId={pageId}
                            onSelectPage={handleSelectPage}
                            onCreatePage={handleCreatePage}
                            onDeletePage={handleDeletePage}
                        />
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Top Nav Header */}
                <header className="h-12 border-b px-4 flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-xs">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Toggle pages sidebar"
                        >
                            <SidebarIcon className="h-4 w-4" />
                        </Button>

                        {selectedPage && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {selectedPage.parent && (
                                    <>
                                        <span
                                            onClick={() => handleSelectPage(selectedPage.parent!.id)}
                                            className="hover:text-foreground cursor-pointer truncate max-w-[120px]"
                                        >
                                            {selectedPage.parent.title}
                                        </span>
                                        <span>/</span>
                                    </>
                                )}
                                <span className="font-semibold text-foreground truncate max-w-[200px]">
                                    {selectedPage.icon} {selectedPage.title}
                                </span>
                            </div>
                        )}
                    </div>

                    {selectedPage && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePage(selectedPage.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Delete this page"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </header>

                {/* Editor Content Body */}
                <div className="flex-1 overflow-y-auto">
                    {loadingPage ? (
                        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                            Loading document...
                        </div>
                    ) : selectedPage ? (
                        <BlockEditor
                            page={selectedPage}
                            onPageUpdated={(updated) => {
                                setSelectedPage(updated);
                                setPages((prev) =>
                                    prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
                                );
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-4 space-y-3">
                            <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-foreground">
                                    No page selected
                                </h3>
                                <p className="text-xs text-muted-foreground max-w-sm">
                                    Select a page from the sidebar or create a new page to start drafting documents and roadmaps.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleCreatePage()}
                                className="shadow-xs text-xs font-semibold mt-2"
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5" />
                                Create First Page
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
