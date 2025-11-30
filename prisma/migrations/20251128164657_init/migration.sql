-- CreateTable
CREATE TABLE "Users" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "credit" INTEGER DEFAULT 0,
    "role" TEXT,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "permission_id" SERIAL NOT NULL,
    "permission_name" TEXT NOT NULL,
    "allow_pages" JSONB NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_permission_name_key" ON "Permissions"("permission_name");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_role_fkey" FOREIGN KEY ("role") REFERENCES "Permissions"("permission_name") ON DELETE SET NULL ON UPDATE CASCADE;
