/*
  Warnings:

  - You are about to drop the column `descriptionAr` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `descriptionEn` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `nameAr` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `nameEn` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `subjectAr` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `subjectEn` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `titleAr` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `titleEn` on the `lessons` table. All the data in the column will be lost.
  - You are about to drop the column `textAr` on the `question_bank` table. All the data in the column will be lost.
  - You are about to drop the column `textEn` on the `question_bank` table. All the data in the column will be lost.
  - Added the required column `name` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `lessons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `question_bank` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[courses] DROP COLUMN [descriptionAr],
[descriptionEn],
[nameAr],
[nameEn],
[subjectAr],
[subjectEn];
ALTER TABLE [dbo].[courses] ADD [description] NVARCHAR(500),
[name] NVARCHAR(150) NOT NULL,
[subject] NVARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[exam_questions] ADD [mark] INT NOT NULL CONSTRAINT [exam_questions_mark_df] DEFAULT 1;

-- AlterTable
ALTER TABLE [dbo].[lessons] DROP COLUMN [titleAr],
[titleEn];
ALTER TABLE [dbo].[lessons] ADD [title] NVARCHAR(200) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[question_bank] DROP COLUMN [textAr],
[textEn];
ALTER TABLE [dbo].[question_bank] ADD [text] NVARCHAR(500) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
