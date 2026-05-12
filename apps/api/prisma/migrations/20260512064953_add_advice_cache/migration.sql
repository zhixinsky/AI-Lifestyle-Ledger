-- AlterTable
ALTER TABLE `savinggoal` MODIFY `icon` VARCHAR(191) NOT NULL DEFAULT '🎯';

-- AlterTable
ALTER TABLE `wealthsnapshot` ADD COLUMN `adviceJson` JSON NULL;
