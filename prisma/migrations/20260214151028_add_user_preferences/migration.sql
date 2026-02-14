-- Add preferences column to user_account table
ALTER TABLE "user_account" ADD COLUMN "preferences" JSONB;

-- Add comment for documentation
COMMENT ON COLUMN "user_account"."preferences" IS 'User preferences: theme, language, notifications, etc.';
