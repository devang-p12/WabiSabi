import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CommandTriggerButton() {
    const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

    const handleClick = () => {
        window.dispatchEvent(new CustomEvent("open-command-palette"));
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            className="group relative h-8 w-full max-w-[220px] justify-start rounded-lg border border-border bg-muted/40 px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer shadow-2xs"
        >
            <Search className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="truncate">Search or jump to...</span>
            <kbd className="pointer-events-none ml-auto hidden sm:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-80">
                {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
        </Button>
    );
}
