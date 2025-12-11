/*
  Warnings:

  - You are about to drop the column `customer` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `customer_number` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `first_contact_date` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `customers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[quote_number]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quote_number` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "customers_customer_number_key";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "customer",
DROP  COLUMN "customer_number",
DROP  COLUMN "first_contact_date",
DROP  COLUMN "notes",
ADD COLUMN  "address" TEXT,
ADD COLUMN  "eircode" VARCHAR(20),
ADD COLUMN  "email" VARCHAR(255) NOT NULL,
ADD COLUMN  "first_name" VARCHAR(100) NOT NULL,
ADD COLUMN  "phone" VARCHAR(50),
ADD COLUMN  "quote_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN  "quote_number" VARCHAR(20) NOT NULL,
ADD COLUMN  "surname" VARCHAR(100);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_quote_number_key" ON "customers"("quote_number");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
