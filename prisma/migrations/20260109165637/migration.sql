/*
  Warnings:

  - The primary key for the `candidate_slot_assignments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `candidates` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `candidates` table. All the data in the column will be lost.
  - The primary key for the `exam_sections` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `staff_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `name` column on the `staff_roles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `staff_user_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `staff_user_roles` table. All the data in the column will be lost.
  - The primary key for the `staff_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `tickets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `visit_slot_id` column on the `tickets` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `visit_slots` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[code]` on the table `staff_roles` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `id` on the `candidate_slot_assignments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `candidate_id` on the `candidate_slot_assignments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `visit_slot_id` on the `candidate_slot_assignments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `full_name` to the `candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `candidates` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `candidates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `name` to the `exam_sections` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `exam_sections` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `code` to the `staff_roles` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `staff_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `staff_user_id` on the `staff_user_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `staff_role_id` on the `staff_user_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `staff_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `tickets` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `tickets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `candidate_id` on the `tickets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `visit_slots` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `visit_slots` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ExamVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'LOCKED', 'SUBMITTED', 'SCORED', 'ABORTED');

-- CreateEnum
CREATE TYPE "AttemptSessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "StaffRoleCode" AS ENUM ('ADMIN', 'AUTHOR', 'PROCTOR', 'REPORT_VIEWER');

-- CreateEnum
CREATE TYPE "TelemetryEventType" AS ENUM ('VIEW', 'HIDE', 'ANSWER_SELECT', 'IDLE_START', 'IDLE_END', 'VISIBILITY_HIDDEN', 'VISIBILITY_VISIBLE', 'HEARTBEAT');

-- DropForeignKey
ALTER TABLE "candidate_slot_assignments" DROP CONSTRAINT "candidate_slot_assignments_candidate_id_fkey";

-- DropForeignKey
ALTER TABLE "candidate_slot_assignments" DROP CONSTRAINT "candidate_slot_assignments_visit_slot_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_user_roles" DROP CONSTRAINT "staff_user_roles_staff_role_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_user_roles" DROP CONSTRAINT "staff_user_roles_staff_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_candidate_id_fkey";

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_visit_slot_id_fkey";

-- DropIndex
DROP INDEX "staff_roles_name_key";

-- DropIndex
DROP INDEX "staff_user_roles_staff_user_id_staff_role_id_key";

-- AlterTable
ALTER TABLE "candidate_slot_assignments" DROP CONSTRAINT "candidate_slot_assignments_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "candidate_id",
ADD COLUMN     "candidate_id" UUID NOT NULL,
DROP COLUMN "visit_slot_id",
ADD COLUMN     "visit_slot_id" UUID NOT NULL,
ADD CONSTRAINT "candidate_slot_assignments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "candidates" DROP CONSTRAINT "candidates_pkey",
DROP COLUMN "name",
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "birth_date" SET DATA TYPE DATE,
ADD CONSTRAINT "candidates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "exam_sections" DROP CONSTRAINT "exam_sections_pkey",
ADD COLUMN     "name" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "exam_sections_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "staff_roles" DROP CONSTRAINT "staff_roles_pkey",
ADD COLUMN     "code" "StaffRoleCode" NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "name",
ADD COLUMN     "name" TEXT,
ADD CONSTRAINT "staff_roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "staff_user_roles" DROP CONSTRAINT "staff_user_roles_pkey",
DROP COLUMN "id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "staff_user_id",
ADD COLUMN     "staff_user_id" UUID NOT NULL,
DROP COLUMN "staff_role_id",
ADD COLUMN     "staff_role_id" UUID NOT NULL,
ADD CONSTRAINT "staff_user_roles_pkey" PRIMARY KEY ("staff_user_id", "staff_role_id");

-- AlterTable
ALTER TABLE "staff_users" DROP CONSTRAINT "staff_users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "display_name" DROP NOT NULL,
ADD CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_pkey",
ADD COLUMN     "created_by_staff_user_id" UUID,
ADD COLUMN     "replaced_by_ticket_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "candidate_id",
ADD COLUMN     "candidate_id" UUID NOT NULL,
DROP COLUMN "visit_slot_id",
ADD COLUMN     "visit_slot_id" UUID,
ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "visit_slots" DROP CONSTRAINT "visit_slots_pkey",
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "visit_slots_pkey" PRIMARY KEY ("id");

-- DropEnum
DROP TYPE "StaffRoleName";

-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_versions" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "ExamVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_version_sections" (
    "id" UUID NOT NULL,
    "exam_version_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_version_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "stem" TEXT NOT NULL,
    "explanation" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "option_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_category_assignments" (
    "question_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_category_assignments_pkey" PRIMARY KEY ("question_id","category_id")
);

-- CreateTable
CREATE TABLE "exam_version_questions" (
    "id" UUID NOT NULL,
    "exam_version_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_version_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "device_code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "exam_version_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_sessions" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "device_id" UUID,
    "status" "AttemptSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_by_staff_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_section_timers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "time_limit_seconds" INTEGER NOT NULL,
    "remaining_seconds" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attempt_section_timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_items" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "id" UUID NOT NULL,
    "attempt_item_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "answered_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answer_scores" (
    "id" UUID NOT NULL,
    "attempt_item_id" UUID NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_answer_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_section_scores" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "raw_score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_section_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_scores" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "raw_score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_item_events" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "attempt_item_id" UUID,
    "event_type" "TelemetryEventType" NOT NULL,
    "server_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_time" TIMESTAMP(3),
    "metadata_json" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "attempt_item_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_item_metrics" (
    "id" UUID NOT NULL,
    "attempt_item_id" UUID NOT NULL,
    "observed_seconds" INTEGER NOT NULL DEFAULT 0,
    "active_seconds" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "answer_change_count" INTEGER NOT NULL DEFAULT 0,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_item_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_staff_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "server_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata_json" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_exam_versions_exam" ON "exam_versions"("exam_id");

-- CreateIndex
CREATE INDEX "idx_exam_versions_status" ON "exam_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_versions_exam_id_version_number_key" ON "exam_versions"("exam_id", "version_number");

-- CreateIndex
CREATE INDEX "idx_exam_version_sections_version" ON "exam_version_sections"("exam_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_version_sections_exam_version_id_section_id_key" ON "exam_version_sections"("exam_version_id", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_version_sections_exam_version_id_position_key" ON "exam_version_sections"("exam_version_id", "position");

-- CreateIndex
CREATE INDEX "idx_question_categories_parent" ON "question_categories"("parent_id");

-- CreateIndex
CREATE INDEX "idx_question_options_question" ON "question_options"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_question_id_position_key" ON "question_options"("question_id", "position");

-- CreateIndex
CREATE INDEX "idx_question_category_assignments_cat" ON "question_category_assignments"("category_id");

-- CreateIndex
CREATE INDEX "idx_evq_version_section" ON "exam_version_questions"("exam_version_id", "section_id");

-- CreateIndex
CREATE INDEX "idx_evq_question" ON "exam_version_questions"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_version_questions_exam_version_id_question_id_key" ON "exam_version_questions"("exam_version_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_version_questions_exam_version_id_section_id_position_key" ON "exam_version_questions"("exam_version_id", "section_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_code_key" ON "devices"("device_code");

-- CreateIndex
CREATE INDEX "idx_attempts_candidate" ON "attempts"("candidate_id");

-- CreateIndex
CREATE INDEX "idx_attempts_version" ON "attempts"("exam_version_id");

-- CreateIndex
CREATE INDEX "idx_attempts_status" ON "attempts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attempts_ticket_id_key" ON "attempts"("ticket_id");

-- CreateIndex
CREATE INDEX "idx_attempt_sessions_attempt" ON "attempt_sessions"("attempt_id");

-- CreateIndex
CREATE INDEX "idx_attempt_sessions_status" ON "attempt_sessions"("status");

-- CreateIndex
CREATE INDEX "idx_attempt_section_timers_attempt" ON "attempt_section_timers"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_section_timers_attempt_id_section_id_key" ON "attempt_section_timers"("attempt_id", "section_id");

-- CreateIndex
CREATE INDEX "idx_attempt_items_attempt" ON "attempt_items"("attempt_id");

-- CreateIndex
CREATE INDEX "idx_attempt_items_question" ON "attempt_items"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_items_attempt_id_section_id_position_key" ON "attempt_items"("attempt_id", "section_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_answers_attempt_item_id_key" ON "attempt_answers"("attempt_item_id");

-- CreateIndex
CREATE INDEX "idx_attempt_answers_selected_option" ON "attempt_answers"("selected_option_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_answer_scores_attempt_item_id_key" ON "attempt_answer_scores"("attempt_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_section_scores_attempt_id_section_id_key" ON "attempt_section_scores"("attempt_id", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_scores_attempt_id_key" ON "attempt_scores"("attempt_id");

-- CreateIndex
CREATE INDEX "idx_aie_attempt" ON "attempt_item_events"("attempt_id");

-- CreateIndex
CREATE INDEX "idx_aie_item" ON "attempt_item_events"("attempt_item_id");

-- CreateIndex
CREATE INDEX "idx_aie_type_time" ON "attempt_item_events"("event_type", "server_time");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_item_metrics_attempt_item_id_key" ON "attempt_item_metrics"("attempt_item_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor_time" ON "audit_logs"("actor_staff_user_id", "server_time");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action_time" ON "audit_logs"("action", "server_time");

-- CreateIndex
CREATE INDEX "idx_candidate_slot_assignments_slot" ON "candidate_slot_assignments"("visit_slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_slot_assignments_candidate_id_visit_slot_id_key" ON "candidate_slot_assignments"("candidate_id", "visit_slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_roles_code_key" ON "staff_roles"("code");

-- CreateIndex
CREATE INDEX "idx_staff_user_roles_role" ON "staff_user_roles"("staff_role_id");

-- CreateIndex
CREATE INDEX "idx_tickets_candidate" ON "tickets"("candidate_id");

-- CreateIndex
CREATE INDEX "idx_tickets_status" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "idx_visit_slots_starts_at" ON "visit_slots"("starts_at");

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
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_visit_slot_id_fkey" FOREIGN KEY ("visit_slot_id") REFERENCES "visit_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_replaced_by_ticket_id_fkey" FOREIGN KEY ("replaced_by_ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_staff_user_id_fkey" FOREIGN KEY ("created_by_staff_user_id") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_versions" ADD CONSTRAINT "exam_versions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_version_sections" ADD CONSTRAINT "exam_version_sections_exam_version_id_fkey" FOREIGN KEY ("exam_version_id") REFERENCES "exam_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_version_sections" ADD CONSTRAINT "exam_version_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "exam_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_categories" ADD CONSTRAINT "question_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "question_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_category_assignments" ADD CONSTRAINT "question_category_assignments_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_category_assignments" ADD CONSTRAINT "question_category_assignments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "question_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_version_questions" ADD CONSTRAINT "exam_version_questions_exam_version_id_fkey" FOREIGN KEY ("exam_version_id") REFERENCES "exam_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_version_questions" ADD CONSTRAINT "exam_version_questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "exam_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_version_questions" ADD CONSTRAINT "exam_version_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_exam_version_id_fkey" FOREIGN KEY ("exam_version_id") REFERENCES "exam_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_sessions" ADD CONSTRAINT "attempt_sessions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_sessions" ADD CONSTRAINT "attempt_sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_sessions" ADD CONSTRAINT "attempt_sessions_created_by_staff_user_id_fkey" FOREIGN KEY ("created_by_staff_user_id") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_section_timers" ADD CONSTRAINT "attempt_section_timers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_section_timers" ADD CONSTRAINT "attempt_section_timers_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "exam_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_items_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "exam_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_item_id_fkey" FOREIGN KEY ("attempt_item_id") REFERENCES "attempt_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answer_scores" ADD CONSTRAINT "attempt_answer_scores_attempt_item_id_fkey" FOREIGN KEY ("attempt_item_id") REFERENCES "attempt_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_section_scores" ADD CONSTRAINT "attempt_section_scores_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_section_scores" ADD CONSTRAINT "attempt_section_scores_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "exam_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_scores" ADD CONSTRAINT "attempt_scores_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_item_events" ADD CONSTRAINT "attempt_item_events_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_item_events" ADD CONSTRAINT "attempt_item_events_attempt_item_id_fkey" FOREIGN KEY ("attempt_item_id") REFERENCES "attempt_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_item_metrics" ADD CONSTRAINT "attempt_item_metrics_attempt_item_id_fkey" FOREIGN KEY ("attempt_item_id") REFERENCES "attempt_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_staff_user_id_fkey" FOREIGN KEY ("actor_staff_user_id") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
