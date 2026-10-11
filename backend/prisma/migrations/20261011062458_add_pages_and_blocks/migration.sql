-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('PARAGRAPH', 'HEADING_1', 'HEADING_2', 'HEADING_3', 'BULLETED_LIST', 'NUMBERED_LIST', 'TODO', 'QUOTE', 'CODE', 'DIVIDER', 'IMAGE', 'LINK', 'CALLOUT');

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "icon" TEXT,
    "workspaceId" TEXT NOT NULL,
    "parentId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "parentId" TEXT,
    "type" "BlockType" NOT NULL DEFAULT 'PARAGRAPH',
    "position" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Page_workspaceId_idx" ON "Page"("workspaceId");

-- CreateIndex
CREATE INDEX "Page_parentId_idx" ON "Page"("parentId");

-- CreateIndex
CREATE INDEX "Block_pageId_idx" ON "Block"("pageId");

-- CreateIndex
CREATE INDEX "Block_parentId_idx" ON "Block"("parentId");

-- CreateIndex
CREATE INDEX "Block_pageId_position_idx" ON "Block"("pageId", "position");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
