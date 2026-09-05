import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import { getBoard, type Board as BoardType } from "@/api/board.api";
import { Button } from "@/components/ui/button";

export default function Board() {
    const { workspaceId, boardId } = useParams();
    const navigate = useNavigate();

    const [board, setBoard] = useState<BoardType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!boardId) return;

        const loadBoard = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getBoard(boardId);
                setBoard(data);
            } catch (error: any) {
                setError(
                    error.response?.data?.error?.message ??
                        "Unable to load board."
                );
            } finally {
                setLoading(false);
            }
        };

        loadBoard();
    }, [boardId]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !board) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center">
                <h1 className="text-lg font-semibold">
                    Unable to load board
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    {error || "Board not found."}
                </p>

                <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() =>
                        navigate(`/workspaces/${workspaceId}`)
                    }
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to workspace
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <header className="border-b bg-background">
                <div className="flex h-16 items-center gap-4 px-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            navigate(`/workspaces/${workspaceId}`)
                        }
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Workspace
                    </Button>

                    <div className="h-5 w-px bg-border" />

                    <div>
                        <h1 className="font-semibold">
                            {board.name}
                        </h1>

                        {board.description && (
                            <p className="text-xs text-muted-foreground">
                                {board.description}
                            </p>
                        )}
                    </div>
                </div>
            </header>

            <main className="p-6">
                <h2 className="text-2xl font-bold">
                    {board.name}
                </h2>

                <p className="mt-1 text-muted-foreground">
                    Lists and tasks will appear here.
                </p>
            </main>
        </div>
    );
}