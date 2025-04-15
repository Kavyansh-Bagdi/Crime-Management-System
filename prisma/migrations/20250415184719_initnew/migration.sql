-- CreateTable
CREATE TABLE `User` (
    `userId` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NULL,
    `dob` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('Civilian', 'Admin', 'Administrative') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `adminId` INTEGER NOT NULL,

    PRIMARY KEY (`adminId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Administrative` (
    `badgeNumber` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `designation` ENUM('Officer', 'Detective', 'Sergeant', 'Lieutenant', 'Captain', 'Major', 'DeputyChief', 'Chief', 'Commissioner', 'Sheriff') NOT NULL,
    `department` ENUM('Homicide', 'Narcotics', 'CyberCrime', 'Traffic', 'Forensics', 'InternalAffairs', 'K9Unit', 'SWAT', 'Vice', 'Patrol', 'Intelligence') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Administrative_userId_key`(`userId`),
    PRIMARY KEY (`badgeNumber`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Location` (
    `locationId` INTEGER NOT NULL AUTO_INCREMENT,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`locationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Crime` (
    `crimeId` INTEGER NOT NULL AUTO_INCREMENT,
    `crimeType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `dateOccurred` DATETIME(3) NOT NULL,
    `locationId` INTEGER NOT NULL,
    `status` ENUM('Accepted', 'Rejected', 'Reported', 'Investigation', 'Closed', 'Pending') NOT NULL,
    `userId` INTEGER NULL,
    `administrativeId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Crime_crimeId_key`(`crimeId`),
    PRIMARY KEY (`crimeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Evidence` (
    `evidenceId` INTEGER NOT NULL AUTO_INCREMENT,
    `crimeId` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `img` LONGBLOB NULL,
    `mime` VARCHAR(191) NULL,
    `filename` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submitedBy` INTEGER NULL,

    PRIMARY KEY (`evidenceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrimeLog` (
    `logId` INTEGER NOT NULL AUTO_INCREMENT,
    `crimeId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `update` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`logId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_Accused` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_Accused_AB_unique`(`A`, `B`),
    INDEX `_Accused_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_Victim` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_Victim_AB_unique`(`A`, `B`),
    INDEX `_Victim_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Administrative` ADD CONSTRAINT `Administrative_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Crime` ADD CONSTRAINT `Crime_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`locationId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Crime` ADD CONSTRAINT `Crime_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Crime` ADD CONSTRAINT `Crime_administrativeId_fkey` FOREIGN KEY (`administrativeId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evidence` ADD CONSTRAINT `Evidence_crimeId_fkey` FOREIGN KEY (`crimeId`) REFERENCES `Crime`(`crimeId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evidence` ADD CONSTRAINT `Evidence_submitedBy_fkey` FOREIGN KEY (`submitedBy`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrimeLog` ADD CONSTRAINT `CrimeLog_crimeId_fkey` FOREIGN KEY (`crimeId`) REFERENCES `Crime`(`crimeId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrimeLog` ADD CONSTRAINT `CrimeLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Accused` ADD CONSTRAINT `_Accused_A_fkey` FOREIGN KEY (`A`) REFERENCES `Crime`(`crimeId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Accused` ADD CONSTRAINT `_Accused_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Victim` ADD CONSTRAINT `_Victim_A_fkey` FOREIGN KEY (`A`) REFERENCES `Crime`(`crimeId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Victim` ADD CONSTRAINT `_Victim_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;
