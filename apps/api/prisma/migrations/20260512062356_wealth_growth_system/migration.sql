-- AlterTable
ALTER TABLE `SavingGoal` ADD COLUMN `allocPercent` INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN `priority` INTEGER NOT NULL DEFAULT 0,
    MODIFY `icon` VARCHAR(191) NOT NULL DEFAULT '🎯';

-- CreateTable
CREATE TABLE `WealthSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `income` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `expense` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `surplus` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `cumulativeSurplus` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `wealthScore` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WealthSnapshot_userId_idx`(`userId`),
    UNIQUE INDEX `WealthSnapshot_userId_month_key`(`userId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoalProgress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `goalId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `allocated` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `cumulative` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `percent` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GoalProgress_userId_idx`(`userId`),
    UNIQUE INDEX `GoalProgress_userId_goalId_month_key`(`userId`, `goalId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WealthSnapshot` ADD CONSTRAINT `WealthSnapshot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoalProgress` ADD CONSTRAINT `GoalProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoalProgress` ADD CONSTRAINT `GoalProgress_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `SavingGoal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
