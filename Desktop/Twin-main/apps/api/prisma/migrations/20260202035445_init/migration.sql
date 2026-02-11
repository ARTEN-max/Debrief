-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "recordings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "object_key" TEXT,
    "original_filename" TEXT,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "duration" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "recordings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recording_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "segments" JSONB,
    "language" TEXT NOT NULL DEFAULT 'en',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transcripts_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "debriefs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recording_id" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "debriefs_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recording_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "jobs_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "recordings_user_id_idx" ON "recordings"("user_id");

-- CreateIndex
CREATE INDEX "recordings_status_idx" ON "recordings"("status");

-- CreateIndex
CREATE INDEX "recordings_created_at_idx" ON "recordings"("created_at");

-- CreateIndex
CREATE INDEX "recordings_user_id_created_at_idx" ON "recordings"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_recording_id_key" ON "transcripts"("recording_id");

-- CreateIndex
CREATE INDEX "transcripts_recording_id_idx" ON "transcripts"("recording_id");

-- CreateIndex
CREATE UNIQUE INDEX "debriefs_recording_id_key" ON "debriefs"("recording_id");

-- CreateIndex
CREATE INDEX "debriefs_recording_id_idx" ON "debriefs"("recording_id");

-- CreateIndex
CREATE INDEX "jobs_recording_id_idx" ON "jobs"("recording_id");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_type_status_idx" ON "jobs"("type", "status");

-- CreateIndex
CREATE INDEX "jobs_created_at_idx" ON "jobs"("created_at");
