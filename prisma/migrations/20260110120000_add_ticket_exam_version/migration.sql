-- Add exam_version_id to tickets (backfill then set NOT NULL)
ALTER TABLE "tickets" ADD COLUMN "exam_version_id" UUID;

UPDATE "tickets"
SET "exam_version_id" = (
  SELECT "id"
  FROM "exam_versions"
  WHERE "status" = 'PUBLISHED'
  ORDER BY "version_number" DESC, "created_at" DESC
  LIMIT 1
);

ALTER TABLE "tickets" ALTER COLUMN "exam_version_id" SET NOT NULL;

-- Add relation to exam_versions
ALTER TABLE "tickets"
ADD CONSTRAINT "tickets_exam_version_id_fkey"
FOREIGN KEY ("exam_version_id") REFERENCES "exam_versions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
