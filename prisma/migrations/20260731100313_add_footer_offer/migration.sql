BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[center_settings] ADD [offerEnabled] BIT NOT NULL CONSTRAINT [center_settings_offerEnabled_df] DEFAULT 0,
[offerImageUrl] NVARCHAR(500),
[offerText] NVARCHAR(500),
[offerTitle] NVARCHAR(200);

-- AlterTable
ALTER TABLE [dbo].[exams] ADD [scheduled_at] DATETIME2;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
