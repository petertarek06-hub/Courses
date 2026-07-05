/*
  Warnings:

  - You are about to drop the column `processedById` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `proofImageUrl` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `senderPhone` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[topUpRequestId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[transactions]
DROP CONSTRAINT [transactions_processedById_fkey];

-- Drop default constraint on status (if it exists)
IF EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
        ON dc.parent_object_id = c.object_id
       AND dc.parent_column_id = c.column_id
    INNER JOIN sys.tables t
        ON t.object_id = c.object_id
    WHERE t.name = 'transactions'
      AND c.name = 'status'
)
BEGIN
    ALTER TABLE [dbo].[transactions]
    DROP CONSTRAINT [transactions_status_df];
END;

-- AlterTable
ALTER TABLE [dbo].[transactions]
DROP COLUMN
    [processedById],
    [proofImageUrl],
    [senderPhone],
    [status];

ALTER TABLE [dbo].[transactions]
ADD [topUpRequestId] INT;

-- CreateTable
CREATE TABLE [dbo].[topup_requests] (
    [id] INT NOT NULL IDENTITY(1,1),
    [amount] FLOAT(53) NOT NULL,
    [method] VARCHAR(20) NOT NULL,
    [status] VARCHAR(20) NOT NULL CONSTRAINT [topup_requests_status_df] DEFAULT 'pending',
    [senderPhone] VARCHAR(20),
    [proofImageUrl] NVARCHAR(500),
    [notes] NVARCHAR(300),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [topup_requests_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [processedAt] DATETIME2,
    [studentId] INT NOT NULL,
    [processedById] INT,
    CONSTRAINT [topup_requests_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
ALTER TABLE [dbo].[transactions]
ADD CONSTRAINT [transactions_topUpRequestId_key]
UNIQUE NONCLUSTERED ([topUpRequestId]);

-- AddForeignKey
ALTER TABLE [dbo].[topup_requests]
ADD CONSTRAINT [topup_requests_studentId_fkey]
FOREIGN KEY ([studentId]) REFERENCES [dbo].[users]([id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[topup_requests]
ADD CONSTRAINT [topup_requests_processedById_fkey]
FOREIGN KEY ([processedById]) REFERENCES [dbo].[users]([id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[transactions]
ADD CONSTRAINT [transactions_topUpRequestId_fkey]
FOREIGN KEY ([topUpRequestId]) REFERENCES [dbo].[topup_requests]([id])
ON DELETE NO ACTION
ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;

THROW;

END CATCH;