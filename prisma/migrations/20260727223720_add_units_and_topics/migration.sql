/*
  Warnings:

  - You are about to drop the column `lessonTag` on the `question_bank` table. All the data in the column will be lost.
  - Added the required column `topicId` to the `question_bank` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[lessons] ADD [unitId] INT;

-- AlterTable
ALTER TABLE [dbo].[question_bank] DROP COLUMN [lessonTag];
ALTER TABLE [dbo].[question_bank] ADD [topicId] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[units] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(200) NOT NULL,
    [order] INT NOT NULL,
    [isVisible] BIT NOT NULL CONSTRAINT [units_isVisible_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [units_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [courseId] INT NOT NULL,
    CONSTRAINT [units_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[topics] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(200) NOT NULL,
    [order] INT NOT NULL CONSTRAINT [topics_order_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [topics_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [courseId] INT NOT NULL,
    CONSTRAINT [topics_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [topics_courseId_name_key] UNIQUE NONCLUSTERED ([courseId],[name])
);

-- AddForeignKey
ALTER TABLE [dbo].[units] ADD CONSTRAINT [units_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[lessons] ADD CONSTRAINT [lessons_unitId_fkey] FOREIGN KEY ([unitId]) REFERENCES [dbo].[units]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[topics] ADD CONSTRAINT [topics_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[question_bank] ADD CONSTRAINT [question_bank_topicId_fkey] FOREIGN KEY ([topicId]) REFERENCES [dbo].[topics]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
