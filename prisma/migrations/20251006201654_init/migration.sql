-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "access_code" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "author_name" TEXT,
    "is_answered" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "session_id" INTEGER NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_access_code_key" ON "sessions"("access_code");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
