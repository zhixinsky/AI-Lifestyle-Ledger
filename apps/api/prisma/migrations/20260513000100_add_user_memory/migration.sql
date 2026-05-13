-- CreateTable
CREATE TABLE `UserMemory` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('finance_state', 'preference', 'goal', 'warning', 'profile') NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0.7,
    `source` VARCHAR(191) NOT NULL DEFAULT 'chat',
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserMemory_userId_type_idx`(`userId`, `type`),
    INDEX `UserMemory_userId_expiresAt_idx`(`userId`, `expiresAt`),
    UNIQUE INDEX `UserMemory_userId_key_key`(`userId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserMemory` ADD CONSTRAINT `UserMemory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
