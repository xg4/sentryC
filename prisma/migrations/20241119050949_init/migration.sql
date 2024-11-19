-- CreateTable
CREATE TABLE "ips" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "latency_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "latency" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_id" INTEGER NOT NULL,
    CONSTRAINT "latency_records_ip_id_fkey" FOREIGN KEY ("ip_id") REFERENCES "ips" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ips_address_key" ON "ips"("address");

-- CreateIndex
CREATE INDEX "latency_records_ip_id_created_at_idx" ON "latency_records"("ip_id", "created_at");

-- CreateIndex
CREATE INDEX "latency_records_created_at_idx" ON "latency_records"("created_at");
