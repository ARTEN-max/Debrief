-- AlterTable
ALTER TABLE "transcripts" ADD COLUMN "num_speakers" INTEGER;
ALTER TABLE "transcripts" ADD COLUMN "speakers" JSONB;
