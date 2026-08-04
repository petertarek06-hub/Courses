/*
  Warnings:

  - A unique constraint covering the columns `[subscriptionId]` on the table `enrollments` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[courses] ADD [subscriptionPrice] FLOAT;

-- AlterTable
ALTER TABLE [dbo].[enrollments] ADD [enrollmentType] VARCHAR(20) NOT NULL CONSTRAINT [enrollments_enrollmentType_df] DEFAULT 'full',
[subscriptionId] INT;

-- AlterTable
ALTER TABLE [dbo].[transactions] ADD [subscriptionId] INT;

-- CreateTable
CREATE TABLE [dbo].[subscriptions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [startDate] DATETIME2 NOT NULL CONSTRAINT [subscriptions_startDate_df] DEFAULT CURRENT_TIMESTAMP,
    [nextBillingDate] DATETIME2 NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [subscriptions_isActive_df] DEFAULT 1,
    [cancelledAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [subscriptions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [studentId] INT NOT NULL,
    [courseId] INT NOT NULL,
    CONSTRAINT [subscriptions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
ALTER TABLE [dbo].[enrollments] ADD CONSTRAINT [enrollments_subscriptionId_key] UNIQUE NONCLUSTERED ([subscriptionId]);

-- AddForeignKey
ALTER TABLE [dbo].[enrollments] ADD CONSTRAINT [enrollments_subscriptionId_fkey] FOREIGN KEY ([subscriptionId]) REFERENCES [dbo].[subscriptions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[subscriptions] ADD CONSTRAINT [subscriptions_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[subscriptions] ADD CONSTRAINT [subscriptions_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[courses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[transactions] ADD CONSTRAINT [transactions_subscriptionId_fkey] FOREIGN KEY ([subscriptionId]) REFERENCES [dbo].[subscriptions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
