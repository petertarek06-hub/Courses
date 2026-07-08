/*
  Warnings:

  - You are about to drop the column `durationSec` on the `videos` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[videos] DROP COLUMN [durationSec];
ALTER TABLE [dbo].[videos] ADD [description] NVARCHAR(1000);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
