/*
  Warnings:

  - You are about to drop the column `scheduledAt` on the `exams` table. All the data in the column will be lost.
  - Made the column `unitId` on table `lessons` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[exams] DROP COLUMN [scheduledAt];

-- AlterTable
ALTER TABLE [dbo].[lessons] ALTER COLUMN [unitId] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[scheduled_exams] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(200) NOT NULL,
    [durationMinutes] INT,
    [passingScore] INT NOT NULL CONSTRAINT [scheduled_exams_passingScore_df] DEFAULT 50,
    [scheduledAt] DATETIME2 NOT NULL,
    [isVisible] BIT NOT NULL CONSTRAINT [scheduled_exams_isVisible_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [scheduled_exams_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [courseId] INT NOT NULL,
    CONSTRAINT [scheduled_exams_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[scheduled_exam_questions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [order] INT NOT NULL CONSTRAINT [scheduled_exam_questions_order_df] DEFAULT 0,
    [mark] INT NOT NULL CONSTRAINT [scheduled_exam_questions_mark_df] DEFAULT 1,
    [isVisible] BIT NOT NULL CONSTRAINT [scheduled_exam_questions_isVisible_df] DEFAULT 1,
    [examId] INT NOT NULL,
    [questionId] INT NOT NULL,
    CONSTRAINT [scheduled_exam_questions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [scheduled_exam_questions_examId_questionId_key] UNIQUE NONCLUSTERED ([examId],[questionId])
);

-- CreateTable
CREATE TABLE [dbo].[scheduled_exam_attempts] (
    [id] INT NOT NULL IDENTITY(1,1),
    [score] FLOAT(53),
    [passed] BIT,
    [startedAt] DATETIME2 NOT NULL CONSTRAINT [scheduled_exam_attempts_startedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [submittedAt] DATETIME2,
    [studentId] INT NOT NULL,
    [examId] INT NOT NULL,
    CONSTRAINT [scheduled_exam_attempts_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[scheduled_exam_attempt_answers] (
    [id] INT NOT NULL IDENTITY(1,1),
    [givenAnswer] NVARCHAR(max) NOT NULL,
    [isCorrect] BIT,
    [gradedScore] FLOAT(53),
    [graderNotes] NVARCHAR(1000),
    [attemptId] INT NOT NULL,
    [examQuestionId] INT NOT NULL,
    CONSTRAINT [scheduled_exam_attempt_answers_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [scheduled_exam_attempt_answers_attemptId_examQuestionId_key] UNIQUE NONCLUSTERED ([attemptId],[examQuestionId])
);

-- AddForeignKey
ALTER TABLE [dbo].[scheduled_exams] ADD CONSTRAINT [scheduled_exams_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[scheduled_exam_questions] ADD CONSTRAINT [scheduled_exam_questions_examId_fkey] FOREIGN KEY ([examId]) REFERENCES [dbo].[scheduled_exams]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[scheduled_exam_questions] ADD CONSTRAINT [scheduled_exam_questions_questionId_fkey] FOREIGN KEY ([questionId]) REFERENCES [dbo].[question_bank]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[scheduled_exam_attempts] ADD CONSTRAINT [scheduled_exam_attempts_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[scheduled_exam_attempts] ADD CONSTRAINT [scheduled_exam_attempts_examId_fkey] FOREIGN KEY ([examId]) REFERENCES [dbo].[scheduled_exams]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[scheduled_exam_attempt_answers] ADD CONSTRAINT [scheduled_exam_attempt_answers_attemptId_fkey] FOREIGN KEY ([attemptId]) REFERENCES [dbo].[scheduled_exam_attempts]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[scheduled_exam_attempt_answers] ADD CONSTRAINT [scheduled_exam_attempt_answers_examQuestionId_fkey] FOREIGN KEY ([examQuestionId]) REFERENCES [dbo].[scheduled_exam_questions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
