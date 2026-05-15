-- AlterTable
ALTER TABLE `User` ADD COLUMN `smartGreetingEnabled` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `AiGreetingDaily` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `period` ENUM('midnight', 'morning', 'forenoon', 'noon', 'afternoon', 'evening', 'night') NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `subtitles` JSON NOT NULL,
    `source` ENUM('ai', 'default') NOT NULL DEFAULT 'default',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AiGreetingDaily_userId_date_idx`(`userId`, `date`),
    UNIQUE INDEX `AiGreetingDaily_userId_date_period_key`(`userId`, `date`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AiGreetingDaily` ADD CONSTRAINT `AiGreetingDaily_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
