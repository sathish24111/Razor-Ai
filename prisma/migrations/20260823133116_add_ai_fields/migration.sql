-- AlterTable
ALTER TABLE `aidecision` ADD COLUMN `recoverability` VARCHAR(191) NOT NULL DEFAULT 'high',
    ADD COLUMN `requiresCustomerAction` BOOLEAN NOT NULL DEFAULT true;
