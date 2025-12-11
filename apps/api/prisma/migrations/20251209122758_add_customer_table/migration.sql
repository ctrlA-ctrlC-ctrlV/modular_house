-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "customer_number" VARCHAR(20) NOT NULL,
    "first_contact_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer" JSONB NOT NULL,
    "product" VARCHAR(50) NOT NULL,
    "notes" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255) NOT NULL,
    "updated_at" TIMESTAMPTZ,
    "updated_by" VARCHAR(255),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_number_key" ON "customers"("customer_number");
