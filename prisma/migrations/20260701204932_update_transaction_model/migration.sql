/*
  Warnings:

  - You are about to drop the column `proofImageUrl` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `senderPhone` on the `transactions` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[transactions] DROP COLUMN [proofImageUrl],
[senderPhone];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
