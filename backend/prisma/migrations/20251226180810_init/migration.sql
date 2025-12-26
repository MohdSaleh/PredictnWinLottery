-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STOCKIST', 'SUBSTOCKIST', 'AGENT', 'SUBAGENT');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WinningStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('DEBIT', 'CREDIT', 'SETTLEMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "draw_time_local" TEXT NOT NULL,
    "cutoff_offset_minutes" INTEGER NOT NULL DEFAULT 5,
    "series_config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_groups" (
    "id" SERIAL NOT NULL,
    "digit_count" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_groups" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_sub_groups" (
    "id" SERIAL NOT NULL,
    "sales_group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "book_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_sub_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schemes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "digit_count" INTEGER NOT NULL,
    "pattern_type" TEXT NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "payout_rate" DECIMAL(10,2) NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "section_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "is_offline" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_entries" (
    "id" SERIAL NOT NULL,
    "bill_id" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stake_per_unit" DECIMAL(10,2) NOT NULL,
    "pattern_flags" INTEGER NOT NULL,
    "expanded_count" INTEGER NOT NULL DEFAULT 1,
    "series" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_ticket_assignments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "section_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "game_group_id" INTEGER NOT NULL,
    "sales_group_id" INTEGER NOT NULL,
    "sales_sub_group_id" INTEGER NOT NULL,
    "is_console" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_ticket_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_books" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "book_code" TEXT NOT NULL,
    "start_no" TEXT NOT NULL,
    "end_no" TEXT NOT NULL,
    "assigned_to" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "winning_number" TEXT NOT NULL,
    "series" TEXT,
    "published_by" INTEGER NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" INTEGER,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "winnings" (
    "id" SERIAL NOT NULL,
    "bill_entry_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "WinningStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "winnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "type" "LedgerType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_numbers" (
    "id" SERIAL NOT NULL,
    "pattern" TEXT NOT NULL,
    "section_id" INTEGER,
    "group_id" INTEGER,
    "max_count" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scope_id" INTEGER,
    "max_amount" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "block_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_limits" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "limit_amount" DECIMAL(12,2) NOT NULL,
    "used_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" INTEGER,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sections_code_key" ON "sections"("code");

-- CreateIndex
CREATE UNIQUE INDEX "game_groups_digit_count_key" ON "game_groups"("digit_count");

-- CreateIndex
CREATE UNIQUE INDEX "section_groups_section_id_group_id_key" ON "section_groups"("section_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_groups_name_key" ON "sales_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sales_sub_groups_sales_group_id_name_key" ON "sales_sub_groups"("sales_group_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "schemes_name_key" ON "schemes"("name");

-- CreateIndex
CREATE INDEX "bills_user_id_date_idx" ON "bills"("user_id", "date");

-- CreateIndex
CREATE INDEX "bills_section_id_date_idx" ON "bills"("section_id", "date");

-- CreateIndex
CREATE INDEX "bill_entries_bill_id_idx" ON "bill_entries"("bill_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_ticket_assignments_user_id_section_id_date_game_group_key" ON "sales_ticket_assignments"("user_id", "section_id", "date", "game_group_id", "sales_sub_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_products_name_key" ON "ticket_products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_books_book_code_key" ON "ticket_books"("book_code");

-- CreateIndex
CREATE UNIQUE INDEX "results_section_id_date_key" ON "results"("section_id", "date");

-- CreateIndex
CREATE INDEX "ledger_user_id_idx" ON "ledger"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_limits_user_id_key" ON "credit_limits"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "section_groups" ADD CONSTRAINT "section_groups_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_groups" ADD CONSTRAINT "section_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "game_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_sub_groups" ADD CONSTRAINT "sales_sub_groups_sales_group_id_fkey" FOREIGN KEY ("sales_group_id") REFERENCES "sales_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_entries" ADD CONSTRAINT "bill_entries_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_ticket_assignments" ADD CONSTRAINT "sales_ticket_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_ticket_assignments" ADD CONSTRAINT "sales_ticket_assignments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_ticket_assignments" ADD CONSTRAINT "sales_ticket_assignments_game_group_id_fkey" FOREIGN KEY ("game_group_id") REFERENCES "game_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_ticket_assignments" ADD CONSTRAINT "sales_ticket_assignments_sales_group_id_fkey" FOREIGN KEY ("sales_group_id") REFERENCES "sales_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_ticket_assignments" ADD CONSTRAINT "sales_ticket_assignments_sales_sub_group_id_fkey" FOREIGN KEY ("sales_sub_group_id") REFERENCES "sales_sub_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_books" ADD CONSTRAINT "ticket_books_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ticket_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winnings" ADD CONSTRAINT "winnings_bill_entry_id_fkey" FOREIGN KEY ("bill_entry_id") REFERENCES "bill_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_limits" ADD CONSTRAINT "credit_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
