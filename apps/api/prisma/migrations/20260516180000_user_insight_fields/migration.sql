-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `source` ENUM('manual', 'ai') NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE `AiLog` ADD COLUMN `inputType` ENUM('voice', 'text') NULL,
    ADD COLUMN `lifeSpaceId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `AiLog_lifeSpaceId_idx` ON `AiLog`(`lifeSpaceId`);

-- AddForeignKey
ALTER TABLE `AiLog` ADD CONSTRAINT `AiLog_lifeSpaceId_fkey` FOREIGN KEY (`lifeSpaceId`) REFERENCES `LifeSpace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
