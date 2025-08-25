-- AlterTable
ALTER TABLE `Feedback` ADD COLUMN `meta` VARCHAR(191) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'submitted';
