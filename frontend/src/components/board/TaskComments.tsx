import { useState, useEffect } from "react";
import { commentApi } from "@/api/comment.api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function TaskComments({ taskId }: { taskId: string }) {
    const [comments, setComments] = useState<Awaited<ReturnType<typeof commentApi.getTaskComments>>>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        loadComments();
    }, [taskId]);

    const loadComments = async () => {
        try {
            const data = await commentApi.getTaskComments(taskId);
            setComments(data);
        } catch (error) {
            console.error("Failed to load comments", error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            const comment = await commentApi.createComment(taskId, newComment);
            setComments([comment, ...comments]);
            setNewComment("");
        } catch (error) {
            console.error("Failed to add comment", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await commentApi.deleteComment(commentId);
            setComments(comments.filter((c) => c.id !== commentId));
        } catch (error) {
            console.error("Failed to delete comment", error);
        }
    };

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium">Comments</h4>
            <div className="flex flex-col gap-2">
                <Textarea
                    placeholder="Write a comment... (use @name to mention a teammate)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                />
                <Button 
                    onClick={handleAddComment} 
                    disabled={loading || !newComment.trim()} 
                    className="self-end"
                    size="sm"
                >
                    Post Comment
                </Button>
            </div>
            
            <div className="space-y-3 mt-4">
                {comments.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            No comments yet.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Start the conversation by adding a comment above.
                        </p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 text-sm p-3 border rounded-md bg-muted/10">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{comment.user.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="whitespace-pre-wrap text-foreground/90">
                                    {comment.text.split(/(@[a-zA-Z0-9_\-\.]+)/g).map((part, i) =>
                                        part.startsWith("@") ? (
                                            <span
                                                key={i}
                                                className="font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded-sm"
                                            >
                                                {part}
                                            </span>
                                        ) : (
                                            part
                                        )
                                    )}
                                </p>
                            </div>
                            {user?.id === comment.userId && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(comment.id)}
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
