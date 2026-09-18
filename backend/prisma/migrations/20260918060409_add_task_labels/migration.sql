/*
  Warnings:

  - A unique constraint covering the columns `[boardId,name]` on the table `Label` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `boardId` to the `Label` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Label" ADD COLUMN     "boardId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Label_boardId_idx" ON "Label"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_boardId_name_key" ON "Label"("boardId", "name");

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
