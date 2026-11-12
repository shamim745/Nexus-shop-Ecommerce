-- Password reset flow
ALTER TABLE "users" ADD COLUMN "reset_token_hash" TEXT;
ALTER TABLE "users" ADD COLUMN "reset_token_expires_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_reset_token_hash_key" ON "users"("reset_token_hash");
