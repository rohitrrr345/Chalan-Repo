/*
  Warnings:

  - The `amount` column on the `Challan` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Challan" DROP COLUMN "amount",
ADD COLUMN     "amount" INTEGER;
