-- CreateTable
CREATE TABLE "home_invite_token" (
    "id" SERIAL NOT NULL,
    "token" UUID NOT NULL,
    "home_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_invite_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "home_invite_token_token_key" ON "home_invite_token"("token");

-- CreateIndex
CREATE INDEX "home_invite_token_home_id_user_id_created_at_idx" ON "home_invite_token"("home_id", "user_id", "created_at");

-- CreateIndex
CREATE INDEX "home_invite_token_expires_at_idx" ON "home_invite_token"("expires_at");

-- AddForeignKey
ALTER TABLE "home_invite_token" ADD CONSTRAINT "home_invite_token_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_invite_token" ADD CONSTRAINT "home_invite_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
