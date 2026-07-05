BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[center_settings] (
    [id] INT NOT NULL IDENTITY(1,1),
    [siteName] NVARCHAR(150) NOT NULL CONSTRAINT [center_settings_siteName_df] DEFAULT 'EduCenter',
    [siteDescription] NVARCHAR(500),
    [phone] VARCHAR(20),
    [whatsappNumber] VARCHAR(20),
    [address] NVARCHAR(300),
    [facebookUrl] NVARCHAR(300),
    [instagramUrl] NVARCHAR(300),
    [youtubeUrl] NVARCHAR(300),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [center_settings_pkey] PRIMARY KEY CLUSTERED ([id])
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
