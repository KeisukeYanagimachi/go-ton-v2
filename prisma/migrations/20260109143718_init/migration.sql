-- CreateEnum
CREATE TYPE "ExamSectionCode" AS ENUM ('VERBAL', 'NONVERBAL', 'ENGLISH', 'STRUCTURAL', 'PERSONALITY');

-- CreateEnum
CREATE TYPE "StaffRoleName" AS ENUM ('ADMIN', 'AUTHOR', 'PROCTOR', 'REPORT_VIEWER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ACTIVE', 'REVOKED', 'USED');

-- CreateTable
CREATE TABLE "exam_sections" (
    "id" TEXT NOT NULL,
    "code" "ExamSectionCode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_roles" (
    "id" TEXT NOT NULL,
    "name" "StaffRoleName" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_user_roles" (
    "id" TEXT NOT NULL,
    "staff_user_id" TEXT NOT NULL,
    "staff_role_id" TEXT NOT NULL,

    CONSTRAINT "staff_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_slots" (
    "id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_slot_assignments" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "visit_slot_id" TEXT NOT NULL,

    CONSTRAINT "candidate_slot_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "ticket_code" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "visit_slot_id" TEXT NOT NULL,
    "pin_hash" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_sections_code_key" ON "exam_sections"("code");

-- CreateIndex
CREATE UNIQUE INDEX "staff_roles_name_key" ON "staff_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_roles_staff_user_id_staff_role_id_key" ON "staff_user_roles"("staff_user_id", "staff_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_slot_assignments_candidate_id_visit_slot_id_key" ON "candidate_slot_assignments"("candidate_id", "visit_slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_code_key" ON "tickets"("ticket_code");

-- AddForeignKey
ALTER TABLE "staff_user_roles" ADD CONSTRAINT "staff_user_roles_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_user_roles" ADD CONSTRAINT "staff_user_roles_staff_role_id_fkey" FOREIGN KEY ("staff_role_id") REFERENCES "staff_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_slot_assignments" ADD CONSTRAINT "candidate_slot_assignments_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_slot_assignments" ADD CONSTRAINT "candidate_slot_assignments_visit_slot_id_fkey" FOREIGN KEY ("visit_slot_id") REFERENCES "visit_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_visit_slot_id_fkey" FOREIGN KEY ("visit_slot_id") REFERENCES "visit_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
