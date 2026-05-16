-- AlterTable User
ALTER TABLE `User` ADD COLUMN `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    ADD COLUMN `lastLoginAt` DATETIME(3) NULL;

-- AlterTable AiLog
ALTER TABLE `AiLog` ADD COLUMN `intent` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NULL DEFAULT 'success',
    ADD COLUMN `model` VARCHAR(191) NULL,
    ADD COLUMN `durationMs` INTEGER NULL,
    ADD COLUMN `errorMessage` TEXT NULL,
    ADD COLUMN `prompt` TEXT NULL;

CREATE INDEX `AiLog_status_createdAt_idx` ON `AiLog`(`status`, `createdAt`);

-- AlterTable Article
ALTER TABLE `Article` ADD COLUMN `isPinned` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sort` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable AdminUser
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `nickname` VARCHAR(191) NOT NULL DEFAULT '',
    `role` ENUM('super_admin', 'admin', 'operator') NOT NULL DEFAULT 'admin',
    `status` ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminUser_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable AdminOperationLog
CREATE TABLE `AdminOperationLog` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `detailJson` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdminOperationLog_adminId_createdAt_idx`(`adminId`, `createdAt`),
    INDEX `AdminOperationLog_module_createdAt_idx`(`module`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable AiCorrection
CREATE TABLE `AiCorrection` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `aiLogId` VARCHAR(191) NULL,
    `originalText` TEXT NOT NULL,
    `aiIntent` VARCHAR(191) NULL,
    `aiResultJson` JSON NULL,
    `correctedIntent` VARCHAR(191) NULL,
    `correctedResultJson` JSON NULL,
    `correctionType` ENUM('intent_error', 'category_error', 'amount_error', 'space_error', 'other') NOT NULL DEFAULT 'other',
    `isAddedToPromptExamples` BOOLEAN NOT NULL DEFAULT false,
    `remark` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiCorrection_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `AiCorrection_correctionType_createdAt_idx`(`correctionType`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable PromptExample
CREATE TABLE `PromptExample` (
    `id` VARCHAR(191) NOT NULL,
    `scene` ENUM('bill_parse', 'chat', 'insight', 'greeting') NOT NULL DEFAULT 'bill_parse',
    `inputText` TEXT NOT NULL,
    `expectedJson` JSON NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Announcement
CREATE TABLE `Announcement` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `type` ENUM('popup', 'banner', 'notice') NOT NULL DEFAULT 'notice',
    `position` ENUM('global', 'home', 'ai', 'discover', 'profile') NOT NULL DEFAULT 'global',
    `target` ENUM('all', 'free', 'member', 'specific') NOT NULL DEFAULT 'all',
    `targetUserIds` JSON NULL,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `requireRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable UserAnnouncementRead
CREATE TABLE `UserAnnouncementRead` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `announcementId` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UserAnnouncementRead_userId_announcementId_key`(`userId`, `announcementId`),
    INDEX `UserAnnouncementRead_announcementId_idx`(`announcementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable LifeSpaceTemplate
CREATE TABLE `LifeSpaceTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('daily', 'love', 'family', 'work', 'travel', 'campus', 'couple') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `aiTone` TEXT NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LifeSpaceTemplate_type_key`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable SystemConfig
CREATE TABLE `SystemConfig` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `description` VARCHAR(191) NULL,
    `group` VARCHAR(191) NOT NULL DEFAULT 'general',
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemConfig_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdminOperationLog` ADD CONSTRAINT `AdminOperationLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AiCorrection` ADD CONSTRAINT `AiCorrection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AiCorrection` ADD CONSTRAINT `AiCorrection_aiLogId_fkey` FOREIGN KEY (`aiLogId`) REFERENCES `AiLog`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `UserAnnouncementRead` ADD CONSTRAINT `UserAnnouncementRead_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserAnnouncementRead` ADD CONSTRAINT `UserAnnouncementRead_announcementId_fkey` FOREIGN KEY (`announcementId`) REFERENCES `Announcement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
