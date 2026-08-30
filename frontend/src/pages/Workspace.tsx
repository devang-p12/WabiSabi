import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Workspace() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    return (
        <main className="min-h-screen bg-muted/30">
            <header className="border-b bg-background">
                <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>
            </header>

            <div className="mx-auto max-w-7xl p-6">
                <h1 className="text-3xl font-bold">
                    Workspace
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    Workspace ID: {workspaceId}
                </p>
            </div>
        </main>
    );
}