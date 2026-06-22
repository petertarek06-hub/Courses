BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(100) NOT NULL,
    [phone] VARCHAR(11) NOT NULL,
    [email] NVARCHAR(100),
    [password] NVARCHAR(255) NOT NULL,
    [academicYear] VARCHAR(20),
    [role] VARCHAR(20) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'student',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_phone_key] UNIQUE NONCLUSTERED ([phone])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
