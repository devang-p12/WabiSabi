-- CreateEnum
CREATE TYPE "ChunkSourceType" AS ENUM ('DOCUMENT', 'PAGE');

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceType" "ChunkSourceType" NOT NULL,
    "documentId" TEXT,
    "pageId" TEXT,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "embedding" DOUBLE PRECISION[],
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeChunk_workspaceId_idx" ON "KnowledgeChunk"("workspaceId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_sourceType_idx" ON "KnowledgeChunk"("sourceType");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_documentId_idx" ON "KnowledgeChunk"("documentId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_pageId_idx" ON "KnowledgeChunk"("pageId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_workspaceId_sourceType_idx" ON "KnowledgeChunk"("workspaceId", "sourceType");

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
