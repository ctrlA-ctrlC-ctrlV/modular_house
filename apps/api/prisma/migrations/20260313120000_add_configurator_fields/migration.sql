-- ============================================================================
-- Migration: add_configurator_fields
-- Purpose:   Adds the garden room configurator columns to the customers table.
--            These nullable columns store the product selection, finish choices,
--            add-on list, configured total price, preferred consultation date,
--            and the source page identifier for each submission.
--            Non-configurator rows retain NULLs in all new columns.
-- ============================================================================

-- Source page identifier: "contact", "landing", "garden-room", or "configurator".
-- Defaults to "contact" for existing rows and non-configurator submissions.
ALTER TABLE "customers" ADD COLUMN "source_page" VARCHAR(50) DEFAULT 'contact';

-- Product slug selected in the configurator (e.g. "studio-25").
ALTER TABLE "customers" ADD COLUMN "configurator_product_slug" VARCHAR(50);

-- Name of the selected exterior cladding finish.
ALTER TABLE "customers" ADD COLUMN "configurator_exterior_finish" VARCHAR(50);

-- Name of the selected interior wall finish.
ALTER TABLE "customers" ADD COLUMN "configurator_interior_finish" VARCHAR(50);

-- Comma-separated list of selected add-on slugs.
ALTER TABLE "customers" ADD COLUMN "configurator_addons" TEXT;

-- Total configured price in euro cents (base price + selected add-ons).
ALTER TABLE "customers" ADD COLUMN "configurator_total_cents" INTEGER;

-- Customer's preferred consultation date: "asap" or an ISO date string.
ALTER TABLE "customers" ADD COLUMN "preferred_date" VARCHAR(50);
