-- Add exam_version_id to tickets
ALTER TABLE "tickets" ADD COLUMN "exam_version_id" UUID NOT NULL;

-- Add relation to exam_versions
ALTER TABLE "tickets"
ADD CONSTRAINT "tickets_exam_version_id_fkey"
FOREIGN KEY ("exam_version_id") REFERENCES "exam_versions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
