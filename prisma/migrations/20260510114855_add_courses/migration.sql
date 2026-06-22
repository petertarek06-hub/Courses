BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[courses] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nameAr] NVARCHAR(150) NOT NULL,
    [nameEn] NVARCHAR(150) NOT NULL,
    [descriptionAr] NVARCHAR(500),
    [descriptionEn] NVARCHAR(500),
    [subjectAr] NVARCHAR(100) NOT NULL,
    [subjectEn] NVARCHAR(100) NOT NULL,
    [academicYear] VARCHAR(20) NOT NULL,
    [price] FLOAT(53) NOT NULL CONSTRAINT [courses_price_df] DEFAULT 0,
    [isVisible] BIT NOT NULL CONSTRAINT [courses_isVisible_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [courses_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [instructorId] INT NOT NULL,
    CONSTRAINT [courses_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[courses] ADD CONSTRAINT [courses_instructorId_fkey] FOREIGN KEY ([instructorId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
