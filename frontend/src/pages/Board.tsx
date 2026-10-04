import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";

import { getBoard, type Board as BoardType } from "@/api/board.api";
import { Button } from "@/components/ui/button";
import BoardView from "@/components/workspace/BoardView";

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
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading board...</p>
                </div>
            </div>
        );
    }

    if (error || !board) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
                <div className="mx-auto max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <ArrowLeft className="h-6 w-6" />
                    </div>
                    <h1 className="text-xl font-bold">
                        Unable to load board
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {error || "This board could not be found or you don't have access to it."}
                    </p>
                    <Button
                        className="mt-6 shadow-sm"
                        onClick={() => navigate(`/workspaces/${workspaceId}`)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to workspace
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <BoardView
                board={board}
                onBack={() => navigate(`/workspaces/${workspaceId}`)}
            />
        </div>
    );
}