-- CreateSequence
CREATE SEQUENCE "booking_reference_seq" START 1;

-- Add the reference as nullable so existing bookings can be backfilled safely.
ALTER TABLE "Booking" ADD COLUMN "reference" TEXT;

-- Give existing bookings deterministic references in creation order.
WITH "numberedBookings" AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS "referenceNumber"
    FROM "Booking"
)
UPDATE "Booking" AS "booking"
SET "reference" = 'ME-BKG-' || LPAD("numberedBookings"."referenceNumber"::TEXT, 6, '0')
FROM "numberedBookings"
WHERE "booking"."id" = "numberedBookings"."id";

-- Continue numbering after the largest reference assigned during the backfill.
SELECT setval(
    'booking_reference_seq',
    COALESCE(
        (SELECT MAX(SUBSTRING("reference" FROM 8)::BIGINT) FROM "Booking"),
        0
    ) + 1,
    false
);

-- Generate references for all future bookings and enforce uniqueness.
ALTER TABLE "Booking"
    ALTER COLUMN "reference" SET DEFAULT ('ME-BKG-' || LPAD(nextval('booking_reference_seq')::TEXT, 6, '0')),
    ALTER COLUMN "reference" SET NOT NULL;

CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");
