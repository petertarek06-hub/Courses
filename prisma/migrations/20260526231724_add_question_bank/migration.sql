/*
  Warnings:

  - You are about to drop the column `questionId` on the `attempt_answers` table. All the data in the column will be lost.
  - You are about to drop the `questions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `examQuestionId` to the `attempt_answers` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[attempt_answers] DROP CONSTRAINT [attempt_answers_questionId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[questions] DROP CONSTRAINT [questions_examId_fkey];

-- AlterTable
ALTER TABLE [dbo].[attempt_answers] DROP COLUMN [questionId];
ALTER TABLE [dbo].[attempt_answers] ADD [examQuestionId] INT NOT NULL;

-- DropTable
DROP TABLE [dbo].[questions];

-- CreateTable
CREATE TABLE [dbo].[question_bank] (
    [id] INT NOT NULL IDENTITY(1,1),
    [textAr] NVARCHAR(500) NOT NULL,
    [textEn] NVARCHAR(500),
    [type] VARCHAR(15) NOT NULL,
    [optionsJson] NVARCHAR(1000) NOT NULL,
    [correctAnswer] NVARCHAR(200) NOT NULL,
    [lessonTag] NVARCHAR(200) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [question_bank_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [courseId] INT NOT NULL,
    CONSTRAINT [question_bank_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[exam_questions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [order] INT NOT NULL CONSTRAINT [exam_questions_order_df] DEFAULT 0,
    [examId] INT NOT NULL,
    [questionId] INT NOT NULL,
    CONSTRAINT [exam_questions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [exam_questions_examId_questionId_key] UNIQUE NONCLUSTERED ([examId],[questionId])
);

-- AddForeignKey
ALTER TABLE [dbo].[question_bank] ADD CONSTRAINT [question_bank_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[exam_questions] ADD CONSTRAINT [exam_questions_examId_fkey] FOREIGN KEY ([examId]) REFERENCES [dbo].[exams]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[exam_questions] ADD CONSTRAINT [exam_questions_questionId_fkey] FOREIGN KEY ([questionId]) REFERENCES [dbo].[question_bank]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attempt_answers] ADD CONSTRAINT [attempt_answers_examQuestionId_fkey] FOREIGN KEY ([examQuestionId]) REFERENCES [dbo].[exam_questions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
