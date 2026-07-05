/*
  Warnings:

  - You are about to drop the column `instructorId` on the `courses` table. All the data in the column will be lost.
  - Added the required column `teacherId` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[courses] DROP CONSTRAINT [courses_instructorId_fkey];

-- AlterTable
ALTER TABLE [dbo].[courses] DROP COLUMN [instructorId];
ALTER TABLE [dbo].[courses] ADD [teacherId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[exams] ADD [scheduledAt] DATETIME2;

-- AddForeignKey
ALTER TABLE [dbo].[courses] ADD CONSTRAINT [courses_teacherId_fkey] FOREIGN KEY ([teacherId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
