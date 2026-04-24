-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyId" TEXT,
    "position" TEXT NOT NULL,
    "listingDetails" TEXT,
    "location" TEXT,
    "workMode" TEXT NOT NULL DEFAULT 'REMOTE',
    "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "targetSalaryMin" INTEGER,
    "targetSalaryMax" INTEGER,
    "currency" TEXT DEFAULT 'USD',
    "source" TEXT,
    "sourceType" TEXT,
    "referralName" TEXT,
    "jobUrl" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "outcomeReason" TEXT,
    "contactName" TEXT,
    "contactRole" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactProfileUrl" TEXT,
    "resumeVersion" TEXT,
    "coverLetterVersion" TEXT,
    "portfolioUrl" TEXT,
    "needsSponsorship" BOOLEAN,
    "relocationPreference" TEXT,
    "workAuthorizationNote" TEXT,
    "team" TEXT,
    "department" TEXT,
    "companySize" TEXT,
    "industry" TEXT,
    "applicationMethod" TEXT,
    "timezoneOverlapHours" INTEGER,
    "officeDaysPerWeek" INTEGER,
    "notes" TEXT,
    "nextStepAt" TIMESTAMP(3),
    "nextStepNote" TEXT,
    "nextActionType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "legalName" TEXT,
    "aliases" TEXT,
    "description" TEXT,
    "tagline" TEXT,
    "foundedYear" INTEGER,
    "companyType" TEXT,
    "industry" TEXT,
    "subIndustry" TEXT,
    "companySize" TEXT,
    "stockSymbol" TEXT,
    "parentCompany" TEXT,
    "location" TEXT,
    "headquarters" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "officeLocations" TEXT,
    "website" TEXT,
    "careersUrl" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "githubUrl" TEXT,
    "glassdoorUrl" TEXT,
    "crunchbaseUrl" TEXT,
    "blogUrl" TEXT,
    "youtubeUrl" TEXT,
    "revenue" TEXT,
    "fundingStage" TEXT,
    "fundingTotal" TEXT,
    "valuation" TEXT,
    "employeeCount" INTEGER,
    "ceo" TEXT,
    "techStack" TEXT,
    "benefits" TEXT,
    "workCulture" TEXT,
    "remotePolicy" TEXT,
    "hiringStatus" TEXT,
    "glassdoorRating" DOUBLE PRECISION,
    "mainContactName" TEXT,
    "mainContactRole" TEXT,
    "mainContactEmail" TEXT,
    "mainContactPhone" TEXT,
    "mainPhone" TEXT,
    "mainEmail" TEXT,
    "rating" INTEGER,
    "priority" TEXT,
    "trackingStatus" TEXT,
    "pros" TEXT,
    "cons" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyActivityEntry" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyActivityEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyOption" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usdRate" DECIMAL(18,6),
    "rateSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationTag" (
    "applicationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ApplicationTag_pkey" PRIMARY KEY ("applicationId","tagId")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEntry" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "mode" TEXT NOT NULL,
    "label" TEXT,
    "payload" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "baseApplicationUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_priority_idx" ON "Application"("priority");

-- CreateIndex
CREATE INDEX "Application_companySize_idx" ON "Application"("companySize");

-- CreateIndex
CREATE INDEX "Application_applicationMethod_idx" ON "Application"("applicationMethod");

-- CreateIndex
CREATE INDEX "Application_appliedAt_idx" ON "Application"("appliedAt");

-- CreateIndex
CREATE INDEX "Application_companyId_idx" ON "Application"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_normalizedName_key" ON "Company"("normalizedName");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "CompanyActivityEntry_companyId_createdAt_idx" ON "CompanyActivityEntry"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyActivityEntry_createdAt_idx" ON "CompanyActivityEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SourceOption_name_key" ON "SourceOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyOption_code_key" ON "CurrencyOption"("code");

-- CreateIndex
CREATE INDEX "ApplicationTag_tagId_idx" ON "ApplicationTag"("tagId");

-- CreateIndex
CREATE INDEX "Attachment_applicationId_idx" ON "Attachment"("applicationId");

-- CreateIndex
CREATE INDEX "ActivityEntry_applicationId_createdAt_idx" ON "ActivityEntry"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEntry_createdAt_idx" ON "ActivityEntry"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_applicationId_idx" ON "Comment"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationDraft_userId_mode_idx" ON "ApplicationDraft"("userId", "mode");

-- CreateIndex
CREATE INDEX "ApplicationDraft_userId_applicationId_idx" ON "ApplicationDraft"("userId", "applicationId");

-- CreateIndex
CREATE INDEX "ApplicationDraft_updatedAt_idx" ON "ApplicationDraft"("updatedAt");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyActivityEntry" ADD CONSTRAINT "CompanyActivityEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTag" ADD CONSTRAINT "ApplicationTag_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTag" ADD CONSTRAINT "ApplicationTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEntry" ADD CONSTRAINT "ActivityEntry_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDraft" ADD CONSTRAINT "ApplicationDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDraft" ADD CONSTRAINT "ApplicationDraft_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
