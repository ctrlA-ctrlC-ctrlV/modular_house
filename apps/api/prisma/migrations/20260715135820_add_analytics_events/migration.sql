-- AddAnalyticsEvents
-- Phase 2 analytics pipeline: traffic-source enum + append-only events table +
-- visitors table. Additive only — no existing table, column, or row is touched.
-- Privacy floor (plan §2.7 R2 / M7): no IP, UA, full-referrer-URL, geo, or
-- user-FK columns exist on either table. Rollback = drop both tables + the enum.

-- CreateEnum
CREATE TYPE "AnalyticsSourceGroup" AS ENUM ('direct', 'search', 'social', 'referral', 'campaign');

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" BIGSERIAL NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "path" VARCHAR(512) NOT NULL,
    "visitor_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "source_group" "AnalyticsSourceGroup" NOT NULL,
    "referrer_host" VARCHAR(255),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_visitors" (
    "visitor_id" UUID NOT NULL,
    "first_seen_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "analytics_visitors_pkey" PRIMARY KEY ("visitor_id")
);

-- CreateIndex
CREATE INDEX "analytics_events_occurred_at_idx" ON "analytics_events"("occurred_at");

-- CreateIndex
CREATE INDEX "analytics_events_visitor_id_occurred_at_idx" ON "analytics_events"("visitor_id", "occurred_at");

-- CreateIndex
CREATE INDEX "analytics_events_session_id_occurred_at_idx" ON "analytics_events"("session_id", "occurred_at");
