BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[teacher_permissions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [canAddVideo] BIT NOT NULL CONSTRAINT [teacher_permissions_canAddVideo_df] DEFAULT 1,
    [canAddExam] BIT NOT NULL CONSTRAINT [teacher_permissions_canAddExam_df] DEFAULT 1,
    [canEditContent] BIT NOT NULL CONSTRAINT [teacher_permissions_canEditContent_df] DEFAULT 1,
    [canViewStudents] BIT NOT NULL CONSTRAINT [teacher_permissions_canViewStudents_df] DEFAULT 0,
    [canReorder] BIT NOT NULL CONSTRAINT [teacher_permissions_canReorder_df] DEFAULT 1,
    [updatedAt] DATETIME2 NOT NULL,
    [teacherId] INT NOT NULL,
    CONSTRAINT [teacher_permissions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [teacher_permissions_teacherId_key] UNIQUE NONCLUSTERED ([teacherId])
);

-- AddForeignKey
ALTER TABLE [dbo].[teacher_permissions] ADD CONSTRAINT [teacher_permissions_teacherId_fkey] FOREIGN KEY ([teacherId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
