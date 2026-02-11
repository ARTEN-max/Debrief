-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_chat_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "session_date" DATETIME,
    "recording_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chat_sessions_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_chat_sessions" ("created_at", "id", "session_date", "updated_at", "user_id") SELECT "created_at", "id", "session_date", "updated_at", "user_id" FROM "chat_sessions";
DROP TABLE "chat_sessions";
ALTER TABLE "new_chat_sessions" RENAME TO "chat_sessions";
CREATE UNIQUE INDEX "chat_sessions_recording_id_key" ON "chat_sessions"("recording_id");
CREATE INDEX "chat_sessions_user_id_idx" ON "chat_sessions"("user_id");
CREATE INDEX "chat_sessions_session_date_idx" ON "chat_sessions"("session_date");
CREATE INDEX "chat_sessions_recording_id_idx" ON "chat_sessions"("recording_id");
CREATE UNIQUE INDEX "chat_sessions_user_id_session_date_key" ON "chat_sessions"("user_id", "session_date");
CREATE UNIQUE INDEX "chat_sessions_user_id_recording_id_key" ON "chat_sessions"("user_id", "recording_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
