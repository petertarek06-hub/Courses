BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[courses] DROP CONSTRAINT [courses_teacherId_fkey];

-- AlterTable
ALTER TABLE [dbo].[courses] ALTER COLUMN [teacherId] INT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[courses] ADD CONSTRAINT [courses_teacherId_fkey] FOREIGN KEY ([teacherId]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
