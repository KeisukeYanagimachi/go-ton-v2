-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_visit_slot_id_fkey";

-- DropTable
DROP TABLE "candidate_slot_assignments";

-- DropTable
DROP TABLE "visit_slots";

-- DropColumn
ALTER TABLE "tickets" DROP COLUMN "visit_slot_id";
