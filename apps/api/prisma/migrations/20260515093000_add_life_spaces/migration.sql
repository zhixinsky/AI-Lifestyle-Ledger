ALTER TABLE `Transaction` ADD COLUMN `lifeSpaceId` VARCHAR(191) NULL;

ALTER TABLE `SharedBook` MODIFY `type` ENUM('daily', 'love', 'family', 'work', 'travel', 'campus', 'couple') NOT NULL DEFAULT 'family';

CREATE TABLE `LifeSpace` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `type` ENUM('daily', 'love', 'family', 'work', 'travel', 'campus', 'couple') NOT NULL DEFAULT 'daily',
  `name` VARCHAR(191) NOT NULL,
  `icon` VARCHAR(191) NOT NULL,
  `cover` VARCHAR(191) NULL,
  `color` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NOT NULL,
  `sort` INTEGER NOT NULL DEFAULT 0,
  `isVisible` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `LifeSpace_userId_type_key` ON `LifeSpace`(`userId`, `type`);
CREATE INDEX `LifeSpace_userId_sort_idx` ON `LifeSpace`(`userId`, `sort`);
CREATE INDEX `Transaction_lifeSpaceId_idx` ON `Transaction`(`lifeSpaceId`);

ALTER TABLE `LifeSpace` ADD CONSTRAINT `LifeSpace_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_lifeSpaceId_fkey` FOREIGN KEY (`lifeSpaceId`) REFERENCES `LifeSpace`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
