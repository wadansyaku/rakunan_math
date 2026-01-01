-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "examType" TEXT,
    "section" INTEGER NOT NULL,
    "sub" TEXT NOT NULL,
    "sectionTitle" TEXT,
    "tag1" TEXT,
    "tag2" TEXT,
    "tag3" TEXT,
    "tagGroup" TEXT,
    "difficulty" INTEGER,
    "estMinutes" DOUBLE PRECISION,
    "points" DOUBLE PRECISION,
    "mustSolve" BOOLEAN,
    "phase" TEXT,
    "problemType" TEXT,
    "sourceUrl" TEXT,
    "fieldKey" TEXT,
    "fieldName" TEXT,
    "fieldType" TEXT,
    "correctText" TEXT,
    "unit" TEXT,
    "answerNote" TEXT,
    "lastResult" TEXT,
    "lastStudyDate" TEXT,
    "reviewInterval" INTEGER,
    "nextReviewDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerLog" (
    "id" TEXT NOT NULL,
    "studyDate" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "missType" TEXT,
    "minutes" DOUBLE PRECISION,
    "cause" TEXT,
    "action" TEXT,
    "memo" TEXT,
    "studentAns" TEXT,
    "correctText" TEXT,
    "autoJudge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnswerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagDictionary" (
    "id" TEXT NOT NULL,
    "tagGroup" TEXT NOT NULL,
    "tagCode" TEXT,
    "tag" TEXT NOT NULL,
    "desc" TEXT,
    "examples" TEXT,
    "note" TEXT,
    CONSTRAINT "TagDictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionDefinition" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "section" INTEGER NOT NULL,
    "order" INTEGER,
    "sectionTitle" TEXT,
    "sectionType" TEXT,
    "defaultPhase" TEXT,
    "typicalTagGroup" TEXT,
    "typicalTags" TEXT,
    "notes" TEXT,
    CONSTRAINT "SectionDefinition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnswerLog" ADD CONSTRAINT "AnswerLog_questionId_fkey"
FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "AnswerLog_questionId_studyDate_idx" ON "AnswerLog"("questionId", "studyDate");

-- CreateIndex
CREATE INDEX "AnswerLog_studyDate_idx" ON "AnswerLog"("studyDate");

-- CreateIndex
CREATE INDEX "Question_nextReviewDate_idx" ON "Question"("nextReviewDate");
