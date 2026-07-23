BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[guardians] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(100) NOT NULL,
    [phone] VARCHAR(11) NOT NULL,
    [password] NVARCHAR(255) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [guardians_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [studentId] INT NOT NULL,
    CONSTRAINT [guardians_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [guardians_phone_key] UNIQUE NONCLUSTERED ([phone])
);

-- AddForeignKey
ALTER TABLE [dbo].[guardians] ADD CONSTRAINT [guardians_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
