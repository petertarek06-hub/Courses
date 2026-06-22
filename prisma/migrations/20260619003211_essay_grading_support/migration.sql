BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[attempt_answers] ALTER COLUMN [givenAnswer] NVARCHAR(max) NOT NULL;
ALTER TABLE [dbo].[attempt_answers] ALTER COLUMN [isCorrect] BIT NULL;
ALTER TABLE [dbo].[attempt_answers] ADD [gradedScore] FLOAT(53),
[graderNotes] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[question_bank] ALTER COLUMN [correctAnswer] NVARCHAR(2000) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
