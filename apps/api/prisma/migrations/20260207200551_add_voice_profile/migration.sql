-- AlterTable
ALTER TABLE "users" ADD COLUMN "voice_embedding" JSONB;
ALTER TABLE "users" ADD COLUMN "has_voice_profile" BOOLEAN NOT NULL DEFAULT false;
