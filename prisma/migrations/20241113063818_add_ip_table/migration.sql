/*
  Warnings:

  - You are about to drop the column `ip` on the `latency_records` table. All the data in the column will be lost.
  - Added the required column `ip_id` to the `latency_records` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "latency_records_ip_created_at_idx";

-- AlterTable
ALTER TABLE "latency_records" DROP COLUMN "ip",
ADD COLUMN     "ip_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ips" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "ips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ips_address_key" ON "ips"("address");

-- CreateIndex
CREATE INDEX "latency_records_ip_id_created_at_idx" ON "latency_records"("ip_id", "created_at");

-- AddForeignKey
ALTER TABLE "latency_records" ADD CONSTRAINT "latency_records_ip_id_fkey" FOREIGN KEY ("ip_id") REFERENCES "ips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
