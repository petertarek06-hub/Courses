BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[courses] DROP CONSTRAINT [courses_instructorId_fkey];

-- AddForeignKey
ALTER TABLE [dbo].[courses] ADD CONSTRAINT [courses_instructorId_fkey] FOREIGN KEY ([instructorId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
