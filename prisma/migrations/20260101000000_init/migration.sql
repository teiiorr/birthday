-- Birthday Team Bot — baseline schema
-- This migration is applied automatically by `prisma migrate deploy` on first boot.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WishStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "telegram_username" TEXT,
    "telegram_user_id" BIGINT,
    "birth_date" DATE NOT NULL,
    "birth_month" INTEGER NOT NULL,
    "birth_day" INTEGER NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "photo_file_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birthday_wishes" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "sender_telegram_id" BIGINT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "WishStatus" NOT NULL DEFAULT 'APPROVED',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_seq" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "birthday_wishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "telegram_user_id" BIGINT NOT NULL,
    "full_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "group_chat_id" BIGINT,
    "reminder_time" TEXT NOT NULL DEFAULT '10:00',
    "morning_birthday_time" TEXT NOT NULL DEFAULT '09:00',
    "publish_interval_minutes" INTEGER NOT NULL DEFAULT 90,
    "evening_summary_time" TEXT NOT NULL DEFAULT '20:00',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tashkent',
    "anonymous_wishes_enabled" BOOLEAN NOT NULL DEFAULT true,
    "require_wish_approval" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birthday_events" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "event_date" DATE NOT NULL,
    "reminder_sent_at" TIMESTAMP(3),
    "announcement_sent_at" TIMESTAMP(3),
    "poll_message_id" INTEGER,
    "poll_sent_at" TIMESTAMP(3),
    "summary_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "birthday_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_telegram_user_id_key" ON "employees"("telegram_user_id");

-- CreateIndex
CREATE INDEX "employees_birth_month_birth_day_idx" ON "employees"("birth_month", "birth_day");

-- CreateIndex
CREATE INDEX "employees_is_active_is_archived_idx" ON "employees"("is_active", "is_archived");

-- CreateIndex
CREATE INDEX "birthday_wishes_employee_id_status_is_published_idx" ON "birthday_wishes"("employee_id", "status", "is_published");

-- CreateIndex
CREATE INDEX "birthday_wishes_employee_id_sender_telegram_id_idx" ON "birthday_wishes"("employee_id", "sender_telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_telegram_user_id_key" ON "admins"("telegram_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "birthday_events_employee_id_event_date_key" ON "birthday_events"("employee_id", "event_date");

-- AddForeignKey
ALTER TABLE "birthday_wishes" ADD CONSTRAINT "birthday_wishes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birthday_events" ADD CONSTRAINT "birthday_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
