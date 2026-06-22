BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[transactions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [amount] FLOAT(53) NOT NULL,
    [type] VARCHAR(20) NOT NULL,
    [method] VARCHAR(20) NOT NULL,
    [status] VARCHAR(20) NOT NULL CONSTRAINT [transactions_status_df] DEFAULT 'completed',
    [notes] NVARCHAR(300),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [transactions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [studentId] INT NOT NULL,
    [processedById] INT,
    [courseId] INT,
    CONSTRAINT [transactions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[transactions] ADD CONSTRAINT [transactions_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[transactions] ADD CONSTRAINT [transactions_processedById_fkey] FOREIGN KEY ([processedById]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[transactions] ADD CONSTRAINT [transactions_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
