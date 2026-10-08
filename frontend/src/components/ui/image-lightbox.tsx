import { useEffect } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
    imageUrl: string | null;
    title?: string;
    onClose: () => void;
}

export default function ImageLightbox({
    imageUrl,
    title,
    onClose,
}: ImageLightboxProps) {
    useEffect(() => {
        if (!imageUrl) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [imageUrl, onClose]);

    if (!imageUrl) return null;

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = title || "image";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            {/* Click backdrop to close */}
            <div className="fixed inset-0 -z-10" onClick={onClose} />

            {/* Top Bar */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                <span className="text-sm font-medium text-white/90 truncate max-w-[60%] drop-shadow-sm">
                    {title || "Image Preview"}
                </span>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        onClick={handleDownload}
                        title="Download image"
                    >
                        <Download className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        onClick={() => window.open(imageUrl, "_blank")}
                        title="Open original"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white ml-1"
                        onClick={onClose}
                        title="Close (ESC)"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Image Container */}
            <div className="relative max-h-[85vh] max-w-[90vw] flex items-center justify-center select-none animate-in zoom-in-95 duration-200">
                <img
                    src={imageUrl}
                    alt={title || "Preview"}
                    className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                />
            </div>
        </div>
    );
}
