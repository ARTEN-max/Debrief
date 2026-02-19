-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN "recording_id" TEXT;
ALTER TABLE "chat_sessions" ALTER COLUMN "session_date" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "chat_sessions_recording_id_key" ON "chat_sessions"("recording_id");
CREATE INDEX "chat_sessions_recording_id_idx" ON "chat_sessions"("recording_id");
CREATE UNIQUE INDEX "chat_sessions_user_id_recording_id_key" ON "chat_sessions"("user_id", "recording_id");

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
