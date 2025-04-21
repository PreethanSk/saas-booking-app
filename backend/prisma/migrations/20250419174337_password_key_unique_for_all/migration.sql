/*
  Warnings:

  - A unique constraint covering the columns `[passwordKey]` on the table `FranchiseManager` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordKey]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordKey]` on the table `SuperAdmin` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FranchiseManager_passwordKey_key" ON "FranchiseManager"("passwordKey");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_passwordKey_key" ON "Staff"("passwordKey");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_passwordKey_key" ON "SuperAdmin"("passwordKey");
