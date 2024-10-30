-- CreateTable
CREATE TABLE "latency_records" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "latency" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "latency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "latency_records_ip_created_at_idx" ON "latency_records"("ip", "created_at");
