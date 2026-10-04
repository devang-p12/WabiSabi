import { Columns3, Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BoardEmptyStateProps {
    onCreateList: () => void;
    onAddStarterColumns?: () => void;
    isCreatingStarters?: boolean;
}

export default function BoardEmptyState({
    onCreateList,
    onAddStarterColumns,
    isCreatingStarters = false,
}: BoardEmptyStateProps) {
    return (
        <div className="flex w-full items-center justify-center p-6">
            <div className="w-full max-w-lg rounded-2xl border border-dashed border-border/80 bg-card/60 p-8 text-center shadow-xs backdrop-blur-xs">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                    <Columns3 className="h-7 w-7" />
                </div>

                <h2 className="text-xl font-bold tracking-tight">
                    Set up your board columns
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Columns represent stages in your workflow (like <span className="font-medium text-foreground">To Do</span>, <span className="font-medium text-foreground">In Progress</span>, and <span className="font-medium text-foreground">Done</span>). Tasks move across columns as work progresses.
                </p>

                {/* Primary Quick Setup CTA */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    {onAddStarterColumns && (
                        <Button
                            size="default"
                            onClick={onAddStarterColumns}
                            disabled={isCreatingStarters}
                            className="w-full sm:w-auto font-medium shadow-xs"
                        >
                            {isCreatingStarters ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Columns...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
                                    Add Starter Columns (To Do, In Progress, Done)
                                </>
                            )}
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        size="default"
                        onClick={onCreateList}
                        disabled={isCreatingStarters}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="mr-1.5 h-4 w-4" />
                        Custom Column
                    </Button>
                </div>

                {/* 3 Step Guide */}
                <div className="mt-8 grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-muted/40 p-4 text-left sm:grid-cols-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px]">1</span>
                            Columns
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Organize stages of work like To Do, Doing & Done.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px]">2</span>
                            Tasks
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Add cards with priorities, deadlines, and labels.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px]">3</span>
                            Drag & Drop
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Drag tasks across columns as you complete work.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}