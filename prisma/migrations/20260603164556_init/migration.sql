-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('SMS', 'WhatsApp', 'Email', 'Web', 'Social');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('New', 'Contacted', 'Qualified', 'Proposal', 'Closed Won', 'Closed Lost');

-- CreateEnum
CREATE TYPE "CustomerSegment" AS ENUM ('VIP', 'Standard', 'At-Risk', 'New');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('Web', 'Social', 'Referral', 'Exhibition', 'Cold Call', 'Campaign');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('Call', 'Message', 'Email', 'Meeting', 'Site Visit', 'Document', 'System');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('Draft', 'Scheduled', 'Active', 'Paused', 'Completed');

-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('Draft', 'Active', 'Paused', 'Completed');

-- CreateEnum
CREATE TYPE "JourneyNodeType" AS ENUM ('trigger', 'action', 'condition', 'delay');

-- CreateEnum
CREATE TYPE "TicketSeverity" AS ENUM ('Critical', 'High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');

-- CreateEnum
CREATE TYPE "SupportLevel" AS ENUM ('L1', 'L2');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('Active', 'Warning', 'Error', 'Inactive');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('Real-time', 'Batch', 'On-demand');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('lead_added', 'stage_changed', 'interaction_logged', 'contract_signed', 'campaign_sent', 'ticket_created', 'score_updated', 'opportunity_created');

-- CreateEnum
CREATE TYPE "LeadGrade" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('Draft', 'Signed', 'Active', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');

-- CreateTable
CREATE TABLE "sales_reps" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "avatarInitials" TEXT NOT NULL,
    "leadsCount" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "region" TEXT NOT NULL,

    CONSTRAINT "sales_reps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nic" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "segment" "CustomerSegment" NOT NULL,
    "city" TEXT NOT NULL,
    "propertyInterest" TEXT NOT NULL,
    "aiScore" INTEGER NOT NULL DEFAULT 0,
    "salesRepId" TEXT NOT NULL,
    "address" TEXT,
    "nationality" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "nameAr" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" "LeadSource" NOT NULL,
    "channel" "Channel" NOT NULL,
    "stage" "PipelineStage" NOT NULL,
    "aiScore" INTEGER NOT NULL DEFAULT 0,
    "salesRepId" TEXT NOT NULL,
    "propertyInterest" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lastContactDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "budget" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "unitId" TEXT,
    "valueRiyal" DOUBLE PRECISION NOT NULL,
    "stage" TEXT NOT NULL,
    "probability" INTEGER NOT NULL,
    "expectedCloseDate" TIMESTAMP(3) NOT NULL,
    "salesRepId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "valueRiyal" DOUBLE PRECISION NOT NULL,
    "status" "ContractStatus" NOT NULL,
    "signedDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "paymentPlan" TEXT NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "priority" "TicketSeverity" NOT NULL,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "channel" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    "salesRepId" TEXT,
    "duration" INTEGER,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scores" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "grade" "LeadGrade" NOT NULL,
    "factors" JSONB NOT NULL,
    "trend" TEXT NOT NULL,
    "topFactors" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "channels" JSONB NOT NULL,
    "audience" JSONB NOT NULL,
    "messageTemplate" JSONB NOT NULL,
    "schedule" JSONB NOT NULL,
    "status" "CampaignStatus" NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journeys" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "status" "JourneyStatus" NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "trigger" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "enrolledCount" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "severity" "TicketSeverity" NOT NULL,
    "status" "TicketStatus" NOT NULL,
    "level" "SupportLevel" NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "customerId" TEXT,
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "slaHours" INTEGER NOT NULL,
    "steps" JSONB NOT NULL,
    "rcaLink" TEXT,
    "escalationHistory" JSONB NOT NULL,
    "comments" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "status" "IntegrationStatus" NOT NULL,
    "lastSync" TIMESTAMP(3) NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "auditLog" JSONB NOT NULL,
    "description" TEXT,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "salesRepId" TEXT,
    "customerId" TEXT,
    "customerNameAr" TEXT,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_reps_email_key" ON "sales_reps"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_nic_key" ON "customers"("nic");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lead_scores_leadId_key" ON "lead_scores"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_nameEn_key" ON "integrations"("nameEn");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "sales_reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "sales_reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "sales_reps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "sales_reps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
