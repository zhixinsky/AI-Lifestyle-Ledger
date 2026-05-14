ALTER TABLE `User`
  ADD COLUMN `email` VARCHAR(191) NULL,
  MODIFY COLUMN `phone` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);

CREATE TABLE `UserIdentity` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `provider` ENUM('wechat', 'phone') NOT NULL,
  `identifier` VARCHAR(191) NOT NULL,
  `unionid` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `UserIdentity_provider_identifier_key`(`provider`, `identifier`),
  INDEX `UserIdentity_userId_idx`(`userId`),
  CONSTRAINT `UserIdentity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `UserIdentity` (`id`, `userId`, `provider`, `identifier`, `unionid`, `createdAt`, `updatedAt`)
SELECT CONCAT('wechat_', `id`), `id`, 'wechat', `openid`, NULL, NOW(3), NOW(3)
FROM `User`
WHERE `openid` IS NOT NULL AND `openid` <> '';

INSERT IGNORE INTO `UserIdentity` (`id`, `userId`, `provider`, `identifier`, `unionid`, `createdAt`, `updatedAt`)
SELECT CONCAT('phone_', `id`), `id`, 'phone', `phone`, NULL, NOW(3), NOW(3)
FROM `User`
WHERE `phone` IS NOT NULL AND `phone` <> '' AND `phone` NOT LIKE 'wx\_%';
