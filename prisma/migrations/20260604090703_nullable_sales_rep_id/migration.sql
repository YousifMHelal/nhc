-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_salesRepId_fkey";

-- DropForeignKey
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_salesRepId_fkey";

-- AlterTable
ALTER TABLE "leads" ALTER COLUMN "salesRepId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "opportunities" ALTER COLUMN "salesRepId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "sales_reps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "sales_reps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
