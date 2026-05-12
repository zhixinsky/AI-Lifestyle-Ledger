-- AlterTable
ALTER TABLE `SavingGoal` MODIFY `icon` VARCHAR(191) NOT NULL DEFAULT '🎯';

-- AlterTable
ALTER TABLE `WealthSnapshot` ADD COLUMN `adviceJson` JSON NULL;
