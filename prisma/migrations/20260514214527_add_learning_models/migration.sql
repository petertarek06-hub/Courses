BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[enrollments] (
    [id] INT NOT NULL IDENTITY(1,1),
    [enrolledAt] DATETIME2 NOT NULL CONSTRAINT [enrollments_enrolledAt_df] DEFAULT CURRENT_TIMESTAMP,
    [studentId] INT NOT NULL,
    [courseId] INT NOT NULL,
    CONSTRAINT [enrollments_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [enrollments_studentId_courseId_key] UNIQUE NONCLUSTERED ([studentId],[courseId])
);

-- CreateTable
CREATE TABLE [dbo].[lessons] (
    [id] INT NOT NULL IDENTITY(1,1),
    [titleAr] NVARCHAR(200) NOT NULL,
    [titleEn] NVARCHAR(200) NOT NULL,
    [type] VARCHAR(10) NOT NULL,
    [order] INT NOT NULL,
    [isVisible] BIT NOT NULL CONSTRAINT [lessons_isVisible_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [lessons_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [courseId] INT NOT NULL,
    CONSTRAINT [lessons_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[videos] (
    [id] INT NOT NULL IDENTITY(1,1),
    [vimeoId] NVARCHAR(100) NOT NULL,
    [durationSec] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [videos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [lessonId] INT NOT NULL,
    CONSTRAINT [videos_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [videos_lessonId_key] UNIQUE NONCLUSTERED ([lessonId])
);

-- CreateTable
CREATE TABLE [dbo].[exams] (
    [id] INT NOT NULL IDENTITY(1,1),
    [durationMinutes] INT,
    [passingScore] INT NOT NULL CONSTRAINT [exams_passingScore_df] DEFAULT 50,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [exams_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [lessonId] INT NOT NULL,
    CONSTRAINT [exams_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [exams_lessonId_key] UNIQUE NONCLUSTERED ([lessonId])
);

-- CreateTable
CREATE TABLE [dbo].[questions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [textAr] NVARCHAR(500) NOT NULL,
    [textEn] NVARCHAR(500),
    [type] VARCHAR(15) NOT NULL,
    [optionsJson] NVARCHAR(1000) NOT NULL,
    [correctAnswer] NVARCHAR(200) NOT NULL,
    [order] INT NOT NULL CONSTRAINT [questions_order_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [questions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [examId] INT NOT NULL,
    CONSTRAINT [questions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[exam_attempts] (
    [id] INT NOT NULL IDENTITY(1,1),
    [score] FLOAT(53),
    [passed] BIT,
    [startedAt] DATETIME2 NOT NULL CONSTRAINT [exam_attempts_startedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [submittedAt] DATETIME2,
    [studentId] INT NOT NULL,
    [examId] INT NOT NULL,
    CONSTRAINT [exam_attempts_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[attempt_answers] (
    [id] INT NOT NULL IDENTITY(1,1),
    [givenAnswer] NVARCHAR(200) NOT NULL,
    [isCorrect] BIT NOT NULL,
    [attemptId] INT NOT NULL,
    [questionId] INT NOT NULL,
    CONSTRAINT [attempt_answers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[lesson_progress] (
    [id] INT NOT NULL IDENTITY(1,1),
    [completed] BIT NOT NULL CONSTRAINT [lesson_progress_completed_df] DEFAULT 0,
    [completedAt] DATETIME2,
    [studentId] INT NOT NULL,
    [lessonId] INT NOT NULL,
    CONSTRAINT [lesson_progress_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [lesson_progress_studentId_lessonId_key] UNIQUE NONCLUSTERED ([studentId],[lessonId])
);

-- AddForeignKey
ALTER TABLE [dbo].[enrollments] ADD CONSTRAINT [enrollments_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[enrollments] ADD CONSTRAINT [enrollments_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[lessons] ADD CONSTRAINT [lessons_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[videos] ADD CONSTRAINT [videos_lessonId_fkey] FOREIGN KEY ([lessonId]) REFERENCES [dbo].[lessons]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[exams] ADD CONSTRAINT [exams_lessonId_fkey] FOREIGN KEY ([lessonId]) REFERENCES [dbo].[lessons]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[questions] ADD CONSTRAINT [questions_examId_fkey] FOREIGN KEY ([examId]) REFERENCES [dbo].[exams]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[exam_attempts] ADD CONSTRAINT [exam_attempts_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[exam_attempts] ADD CONSTRAINT [exam_attempts_examId_fkey] FOREIGN KEY ([examId]) REFERENCES [dbo].[exams]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attempt_answers] ADD CONSTRAINT [attempt_answers_attemptId_fkey] FOREIGN KEY ([attemptId]) REFERENCES [dbo].[exam_attempts]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attempt_answers] ADD CONSTRAINT [attempt_answers_questionId_fkey] FOREIGN KEY ([questionId]) REFERENCES [dbo].[questions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[lesson_progress] ADD CONSTRAINT [lesson_progress_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[lesson_progress] ADD CONSTRAINT [lesson_progress_lessonId_fkey] FOREIGN KEY ([lessonId]) REFERENCES [dbo].[lessons]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
