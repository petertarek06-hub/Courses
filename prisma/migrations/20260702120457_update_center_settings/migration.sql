BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[center_settings] ADD [copyrightText] NVARCHAR(200),
[email] NVARCHAR(150),
[whatsappButtonLabel] NVARCHAR(100);

-- AlterTable
ALTER TABLE [dbo].[transactions] ADD [proofImageUrl] NVARCHAR(500),
[senderPhone] VARCHAR(20);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
