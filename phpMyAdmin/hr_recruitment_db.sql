-- =========================================================
-- HR & Recruitment Management System — Database Backup
-- Generated: 2025-01-01
-- MySQL 8.0 | XAMPP Compatible
-- =========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+05:30";

-- Create database
CREATE DATABASE IF NOT EXISTS `hr_recruitment_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `hr_recruitment_db`;

-- =========================================================
-- TABLE: _prisma_migrations  (Prisma internal)
-- =========================================================
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id`                    VARCHAR(36)  NOT NULL,
  `checksum`              VARCHAR(64)  NOT NULL,
  `finished_at`           DATETIME(3)  DEFAULT NULL,
  `migration_name`        VARCHAR(255) NOT NULL,
  `logs`                  TEXT         DEFAULT NULL,
  `rolled_back_at`        DATETIME(3)  DEFAULT NULL,
  `started_at`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count`   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- ENUM helper views (MySQL does not support standalone ENUMs;
-- Prisma manages them via ALTER TABLE in migrations)
-- =========================================================

-- =========================================================
-- TABLE: roles
-- =========================================================
CREATE TABLE IF NOT EXISTS `roles` (
  `id`          VARCHAR(36)   NOT NULL,
  `name`        VARCHAR(100)  NOT NULL,
  `description` TEXT          DEFAULT NULL,
  `isSystem`    TINYINT(1)    NOT NULL DEFAULT 0,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: permissions
-- =========================================================
CREATE TABLE IF NOT EXISTS `permissions` (
  `id`          VARCHAR(36)   NOT NULL,
  `module`      VARCHAR(50)   NOT NULL,
  `action`      VARCHAR(50)   NOT NULL,
  `description` TEXT          DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_module_action_key` (`module`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: role_permissions
-- =========================================================
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id`           VARCHAR(36) NOT NULL,
  `roleId`       VARCHAR(36) NOT NULL,
  `permissionId` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_roleId_permissionId_key` (`roleId`, `permissionId`),
  KEY `role_permissions_permissionId_fkey` (`permissionId`),
  CONSTRAINT `role_permissions_permissionId_fkey`
    FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_roleId_fkey`
    FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: users
-- =========================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`             VARCHAR(36)   NOT NULL,
  `employeeId`     VARCHAR(20)   DEFAULT NULL,
  `firstName`      VARCHAR(100)  NOT NULL,
  `lastName`       VARCHAR(100)  DEFAULT NULL,
  `email`          VARCHAR(255)  NOT NULL,
  `username`       VARCHAR(100)  DEFAULT NULL,
  `passwordHash`   VARCHAR(255)  NOT NULL,
  `phone`          VARCHAR(20)   DEFAULT NULL,
  `roleId`         VARCHAR(36)   NOT NULL,
  `department`     VARCHAR(100)  DEFAULT NULL,
  `designation`    VARCHAR(100)  DEFAULT NULL,
  `profilePhoto`   VARCHAR(255)  DEFAULT NULL,
  `salary`         DECIMAL(15,2) DEFAULT NULL,
  `joiningDate`    DATETIME(3)   DEFAULT NULL,
  `address`        TEXT          DEFAULT NULL,
  `city`           VARCHAR(100)  DEFAULT NULL,
  `state`          VARCHAR(100)  DEFAULT NULL,
  `country`        VARCHAR(100)  DEFAULT 'India',
  `status`         ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `refreshToken`   TEXT          DEFAULT NULL,
  `resetToken`     VARCHAR(255)  DEFAULT NULL,
  `resetTokenExp`  DATETIME(3)   DEFAULT NULL,
  `lastLoginAt`    DATETIME(3)   DEFAULT NULL,
  `isSuperAdmin`   TINYINT(1)    NOT NULL DEFAULT 0,
  `createdAt`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`      DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_username_key` (`username`),
  UNIQUE KEY `users_employeeId_key` (`employeeId`),
  KEY `users_roleId_fkey` (`roleId`),
  CONSTRAINT `users_roleId_fkey`
    FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: clients
-- =========================================================
CREATE TABLE IF NOT EXISTS `clients` (
  `id`                VARCHAR(36)   NOT NULL,
  `companyName`       VARCHAR(255)  NOT NULL,
  `contactPerson`     VARCHAR(150)  NOT NULL,
  `email`             VARCHAR(255)  NOT NULL,
  `phone`             VARCHAR(20)   NOT NULL,
  `alternatePhone`    VARCHAR(20)   DEFAULT NULL,
  `address`           TEXT          DEFAULT NULL,
  `city`              VARCHAR(100)  DEFAULT NULL,
  `state`             VARCHAR(100)  DEFAULT NULL,
  `country`           VARCHAR(100)  DEFAULT 'India',
  `pincode`           VARCHAR(10)   DEFAULT NULL,
  `gstNumber`         VARCHAR(20)   DEFAULT NULL,
  `panNumber`         VARCHAR(15)   DEFAULT NULL,
  `industry`          VARCHAR(100)  DEFAULT NULL,
  `website`           VARCHAR(255)  DEFAULT NULL,
  `contractStartDate` DATETIME(3)   DEFAULT NULL,
  `contractEndDate`   DATETIME(3)   DEFAULT NULL,
  `notes`             TEXT          DEFAULT NULL,
  `isActive`          TINYINT(1)    NOT NULL DEFAULT 1,
  `createdAt`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clients_email_key` (`email`),
  FULLTEXT KEY `clients_fulltext` (`companyName`, `contactPerson`, `email`, `phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: candidates
-- =========================================================
CREATE TABLE IF NOT EXISTS `candidates` (
  `id`                  VARCHAR(36)   NOT NULL,
  `firstName`           VARCHAR(100)  NOT NULL,
  `lastName`            VARCHAR(100)  DEFAULT NULL,
  `email`               VARCHAR(255)  DEFAULT NULL,
  `phone`               VARCHAR(20)   NOT NULL,
  `alternatePhone`      VARCHAR(20)   DEFAULT NULL,
  `gender`              ENUM('MALE','FEMALE','OTHER') DEFAULT NULL,
  `dateOfBirth`         DATETIME(3)   DEFAULT NULL,
  `currentLocation`     VARCHAR(150)  DEFAULT NULL,
  `preferredLocations`  JSON          DEFAULT NULL,
  `nationality`         VARCHAR(100)  DEFAULT NULL,
  `religion`            VARCHAR(100)  DEFAULT NULL,
  `caste`               VARCHAR(100)  DEFAULT NULL,
  `maritalStatus`       VARCHAR(50)   DEFAULT NULL,
  `languages`           JSON          DEFAULT NULL,
  `currentDesignation`  VARCHAR(150)  DEFAULT NULL,
  `currentCompany`      VARCHAR(255)  DEFAULT NULL,
  `totalExperience`     FLOAT         DEFAULT NULL,
  `relevantExperience`  FLOAT         DEFAULT NULL,
  `currentCTC`          DECIMAL(15,2) DEFAULT NULL,
  `expectedCTC`         DECIMAL(15,2) DEFAULT NULL,
  `noticePeriod`        INT           DEFAULT NULL,
  `highestQualification`VARCHAR(150)  DEFAULT NULL,
  `specialization`      VARCHAR(150)  DEFAULT NULL,
  `institution`         VARCHAR(255)  DEFAULT NULL,
  `graduationYear`      INT           DEFAULT NULL,
  `skills`              JSON          DEFAULT NULL,
  `techStack`           JSON          DEFAULT NULL,
  `certifications`      JSON          DEFAULT NULL,
  `linkedinUrl`         VARCHAR(255)  DEFAULT NULL,
  `portfolioUrl`        VARCHAR(255)  DEFAULT NULL,
  `cvFilePath`          VARCHAR(255)  DEFAULT NULL,
  `cvOriginalName`      VARCHAR(255)  DEFAULT NULL,
  `status`              ENUM('ACTIVE','INACTIVE','PLACED','BLACKLISTED','DO_NOT_CONTACT') NOT NULL DEFAULT 'ACTIVE',
  `source`              VARCHAR(100)  DEFAULT NULL,
  `notes`               TEXT          DEFAULT NULL,
  `isPriority`          TINYINT(1)    NOT NULL DEFAULT 0,
  `searchVector`        TEXT          DEFAULT NULL,
  `customFields`        JSON          DEFAULT NULL,
  `addedById`           VARCHAR(36)   DEFAULT NULL,
  `createdAt`           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  KEY `candidates_addedById_fkey` (`addedById`),
  KEY `candidates_status_idx` (`status`),
  KEY `candidates_isPriority_idx` (`isPriority`),
  FULLTEXT KEY `candidates_fulltext` (`firstName`, `lastName`, `email`, `phone`, `currentDesignation`, `currentCompany`, `currentLocation`, `searchVector`),
  CONSTRAINT `candidates_addedById_fkey`
    FOREIGN KEY (`addedById`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: candidate_work_history
-- =========================================================
CREATE TABLE IF NOT EXISTS `candidate_work_history` (
  `id`          VARCHAR(36)   NOT NULL,
  `candidateId` VARCHAR(36)   NOT NULL,
  `company`     VARCHAR(255)  NOT NULL,
  `designation` VARCHAR(150)  NOT NULL,
  `startDate`   DATETIME(3)   DEFAULT NULL,
  `endDate`     DATETIME(3)   DEFAULT NULL,
  `isCurrent`   TINYINT(1)    NOT NULL DEFAULT 0,
  `description` TEXT          DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `candidate_work_history_candidateId_fkey` (`candidateId`),
  CONSTRAINT `candidate_work_history_candidateId_fkey`
    FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: job_openings
-- =========================================================
CREATE TABLE IF NOT EXISTS `job_openings` (
  `id`                VARCHAR(36)   NOT NULL,
  `title`             VARCHAR(255)  NOT NULL,
  `clientId`          VARCHAR(36)   NOT NULL,
  `description`       TEXT          DEFAULT NULL,
  `minExperience`     FLOAT         DEFAULT NULL,
  `maxExperience`     FLOAT         DEFAULT NULL,
  `minSalary`         DECIMAL(15,2) DEFAULT NULL,
  `maxSalary`         DECIMAL(15,2) DEFAULT NULL,
  `location`          VARCHAR(150)  DEFAULT NULL,
  `workMode`          ENUM('ONSITE','REMOTE','HYBRID') DEFAULT 'ONSITE',
  `jobType`           ENUM('FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP','FREELANCE') DEFAULT 'FULL_TIME',
  `requiredSkills`    JSON          DEFAULT NULL,
  `preferredSkills`   JSON          DEFAULT NULL,
  `tags`              JSON          DEFAULT NULL,
  `status`            ENUM('OPEN','IN_PROGRESS','ON_HOLD','CLOSED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  `priority`          ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  `openings`          INT           NOT NULL DEFAULT 1,
  `closingDate`       DATETIME(3)   DEFAULT NULL,
  `customFields`      JSON          DEFAULT NULL,
  `createdById`       VARCHAR(36)   DEFAULT NULL,
  `createdAt`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  KEY `job_openings_clientId_fkey` (`clientId`),
  KEY `job_openings_createdById_fkey` (`createdById`),
  KEY `job_openings_status_idx` (`status`),
  CONSTRAINT `job_openings_clientId_fkey`
    FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`),
  CONSTRAINT `job_openings_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: interview_rounds
-- =========================================================
CREATE TABLE IF NOT EXISTS `interview_rounds` (
  `id`          VARCHAR(36)   NOT NULL,
  `jobId`       VARCHAR(36)   NOT NULL,
  `roundNumber` INT           NOT NULL,
  `name`        VARCHAR(150)  NOT NULL,
  `description` TEXT          DEFAULT NULL,
  `scheduledAt` DATETIME(3)   DEFAULT NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `interview_rounds_jobId_roundNumber_key` (`jobId`, `roundNumber`),
  CONSTRAINT `interview_rounds_jobId_fkey`
    FOREIGN KEY (`jobId`) REFERENCES `job_openings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: interview_slots
-- =========================================================
CREATE TABLE IF NOT EXISTS `interview_slots` (
  `id`          VARCHAR(36)   NOT NULL,
  `roundId`     VARCHAR(36)   NOT NULL,
  `candidateId` VARCHAR(36)   NOT NULL,
  `status`      ENUM('PENDING','SCHEDULED','SELECTED','REJECTED','ON_HOLD','NO_SHOW') NOT NULL DEFAULT 'PENDING',
  `scheduledAt` DATETIME(3)   DEFAULT NULL,
  `feedback`    TEXT          DEFAULT NULL,
  `rating`      INT           DEFAULT NULL,
  `result`      ENUM('PASS','FAIL','ON_HOLD') DEFAULT NULL,
  `interviewerId`VARCHAR(36)  DEFAULT NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `interview_slots_roundId_candidateId_key` (`roundId`, `candidateId`),
  KEY `interview_slots_candidateId_fkey` (`candidateId`),
  KEY `interview_slots_interviewerId_fkey` (`interviewerId`),
  CONSTRAINT `interview_slots_candidateId_fkey`
    FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `interview_slots_interviewerId_fkey`
    FOREIGN KEY (`interviewerId`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `interview_slots_roundId_fkey`
    FOREIGN KEY (`roundId`) REFERENCES `interview_rounds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: job_applications  (links candidate ↔ job)
-- =========================================================
CREATE TABLE IF NOT EXISTS `job_applications` (
  `id`          VARCHAR(36)   NOT NULL,
  `jobId`       VARCHAR(36)   NOT NULL,
  `candidateId` VARCHAR(36)   NOT NULL,
  `status`      ENUM('APPLIED','SHORTLISTED','IN_REVIEW','SELECTED','REJECTED','WITHDRAWN','PLACED') NOT NULL DEFAULT 'APPLIED',
  `appliedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes`       TEXT          DEFAULT NULL,
  `updatedAt`   DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_applications_jobId_candidateId_key` (`jobId`, `candidateId`),
  KEY `job_applications_candidateId_fkey` (`candidateId`),
  CONSTRAINT `job_applications_candidateId_fkey`
    FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `job_applications_jobId_fkey`
    FOREIGN KEY (`jobId`) REFERENCES `job_openings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: invoices
-- =========================================================
CREATE TABLE IF NOT EXISTS `invoices` (
  `id`                VARCHAR(36)   NOT NULL,
  `invoiceNumber`     VARCHAR(50)   NOT NULL,
  `clientId`          VARCHAR(36)   NOT NULL,
  `invoiceDate`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `dueDate`           DATETIME(3)   DEFAULT NULL,
  `serviceDescription`VARCHAR(500)  DEFAULT NULL,
  `lineItems`         JSON          NOT NULL,
  `subtotal`          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `gstType`           ENUM('CGST_SGST','IGST') NOT NULL DEFAULT 'CGST_SGST',
  `cgstRate`          FLOAT         DEFAULT NULL,
  `sgstRate`          FLOAT         DEFAULT NULL,
  `igstRate`          FLOAT         DEFAULT NULL,
  `cgstAmount`        DECIMAL(15,2) DEFAULT NULL,
  `sgstAmount`        DECIMAL(15,2) DEFAULT NULL,
  `igstAmount`        DECIMAL(15,2) DEFAULT NULL,
  `totalTax`          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `totalAmount`       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `status`            ENUM('DRAFT','SENT','PAID','OVERDUE','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `paidAmount`        DECIMAL(15,2) DEFAULT NULL,
  `paidAt`            DATETIME(3)   DEFAULT NULL,
  `pdfPath`           VARCHAR(255)  DEFAULT NULL,
  `notes`             TEXT          DEFAULT NULL,
  `createdById`       VARCHAR(36)   DEFAULT NULL,
  `createdAt`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_invoiceNumber_key` (`invoiceNumber`),
  KEY `invoices_clientId_fkey` (`clientId`),
  KEY `invoices_createdById_fkey` (`createdById`),
  KEY `invoices_status_idx` (`status`),
  CONSTRAINT `invoices_clientId_fkey`
    FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`),
  CONSTRAINT `invoices_createdById_fkey`
    FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: column_definitions  (dynamic columns)
-- =========================================================
CREATE TABLE IF NOT EXISTS `column_definitions` (
  `id`           VARCHAR(36)   NOT NULL,
  `module`       VARCHAR(50)   NOT NULL,
  `name`         VARCHAR(100)  NOT NULL,
  `label`        VARCHAR(150)  NOT NULL,
  `dataType`     ENUM('TEXT','NUMBER','DATE','DROPDOWN','STATUS','EMPLOYEE','CANDIDATES',
                      'LOCATION','FILES','PRIORITY','LABEL','CHECKBOX','URL','EMAIL','PHONE')
                               NOT NULL DEFAULT 'TEXT',
  `options`      JSON          DEFAULT NULL,
  `isRequired`   TINYINT(1)    NOT NULL DEFAULT 0,
  `isVisible`    TINYINT(1)    NOT NULL DEFAULT 1,
  `isSystem`     TINYINT(1)    NOT NULL DEFAULT 0,
  `order`        INT           NOT NULL DEFAULT 0,
  `width`        INT           DEFAULT NULL,
  `createdAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`),
  KEY `column_definitions_module_idx` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: app_settings
-- =========================================================
CREATE TABLE IF NOT EXISTS `app_settings` (
  `id`              VARCHAR(36)   NOT NULL,
  `appName`         VARCHAR(100)  NOT NULL DEFAULT 'HR Suite',
  `logo`            VARCHAR(255)  DEFAULT NULL,
  `primaryColor`    VARCHAR(20)   NOT NULL DEFAULT '#1E40AF',
  `sidebarColor`    VARCHAR(20)   NOT NULL DEFAULT '#0F172A',
  `fontFamily`      VARCHAR(100)  NOT NULL DEFAULT 'Inter',
  `invoicePrefix`   VARCHAR(20)   NOT NULL DEFAULT 'INV',
  `invoiceCounter`  INT           NOT NULL DEFAULT 0,
  `currency`        VARCHAR(10)   NOT NULL DEFAULT 'INR',
  `timezone`        VARCHAR(50)   NOT NULL DEFAULT 'Asia/Kolkata',
  `smtpHost`        VARCHAR(255)  DEFAULT NULL,
  `smtpPort`        INT           DEFAULT NULL,
  `smtpUser`        VARCHAR(255)  DEFAULT NULL,
  `smtpPass`        VARCHAR(255)  DEFAULT NULL,
  `smtpFrom`        VARCHAR(255)  DEFAULT NULL,
  `companyName`     VARCHAR(255)  DEFAULT NULL,
  `companyAddress`  TEXT          DEFAULT NULL,
  `companyPhone`    VARCHAR(20)   DEFAULT NULL,
  `companyEmail`    VARCHAR(255)  DEFAULT NULL,
  `companyGST`      VARCHAR(20)   DEFAULT NULL,
  `companyPAN`      VARCHAR(15)   DEFAULT NULL,
  `bankName`        VARCHAR(255)  DEFAULT NULL,
  `bankAccount`     VARCHAR(50)   DEFAULT NULL,
  `bankIFSC`        VARCHAR(20)   DEFAULT NULL,
  `createdAt`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)   NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: audit_logs
-- =========================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`          VARCHAR(36)   NOT NULL,
  `userId`      VARCHAR(36)   DEFAULT NULL,
  `module`      VARCHAR(50)   NOT NULL,
  `action`      ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','IMPORT','SEND','VIEW','OTHER')
                              NOT NULL,
  `description` TEXT          DEFAULT NULL,
  `entityId`    VARCHAR(36)   DEFAULT NULL,
  `metadata`    JSON          DEFAULT NULL,
  `ipAddress`   VARCHAR(45)   DEFAULT NULL,
  `userAgent`   TEXT          DEFAULT NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_userId_fkey` (`userId`),
  KEY `audit_logs_module_idx` (`module`),
  KEY `audit_logs_action_idx` (`action`),
  KEY `audit_logs_createdAt_idx` (`createdAt`),
  CONSTRAINT `audit_logs_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABLE: notifications
-- =========================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`        VARCHAR(36)   NOT NULL,
  `userId`    VARCHAR(36)   NOT NULL,
  `title`     VARCHAR(255)  NOT NULL,
  `message`   TEXT          DEFAULT NULL,
  `type`      ENUM('INFO','SUCCESS','WARNING','ERROR') NOT NULL DEFAULT 'INFO',
  `isRead`    TINYINT(1)    NOT NULL DEFAULT 0,
  `link`      VARCHAR(255)  DEFAULT NULL,
  `createdAt` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_userId_fkey` (`userId`),
  KEY `notifications_isRead_idx` (`isRead`),
  CONSTRAINT `notifications_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- SEED DATA
-- =========================================================

-- Permissions
INSERT INTO `permissions` (`id`, `module`, `action`, `description`) VALUES
('perm-001', 'dashboard', 'view',   'View dashboard'),
('perm-002', 'candidates','view',   'View CV database'),
('perm-003', 'candidates','create', 'Add new candidate'),
('perm-004', 'candidates','update', 'Edit candidate'),
('perm-005', 'candidates','delete', 'Delete candidate'),
('perm-006', 'candidates','export', 'Export candidates'),
('perm-007', 'candidates','import', 'Bulk import CVs'),
('perm-008', 'jobs',      'view',   'View job openings'),
('perm-009', 'jobs',      'create', 'Create job opening'),
('perm-010', 'jobs',      'update', 'Edit job opening'),
('perm-011', 'jobs',      'delete', 'Delete job opening'),
('perm-012', 'jobs',      'export', 'Export jobs'),
('perm-013', 'employees', 'view',   'View employees'),
('perm-014', 'employees', 'create', 'Add employee'),
('perm-015', 'employees', 'update', 'Edit employee'),
('perm-016', 'employees', 'delete', 'Delete employee'),
('perm-017', 'clients',   'view',   'View clients'),
('perm-018', 'clients',   'create', 'Add client'),
('perm-019', 'clients',   'update', 'Edit client'),
('perm-020', 'clients',   'delete', 'Delete client'),
('perm-021', 'invoices',  'view',   'View invoices'),
('perm-022', 'invoices',  'create', 'Generate invoice'),
('perm-023', 'invoices',  'update', 'Update invoice'),
('perm-024', 'invoices',  'delete', 'Delete invoice'),
('perm-025', 'invoices',  'send',   'Send invoice to client'),
('perm-026', 'settings',  'view',   'View settings'),
('perm-027', 'settings',  'update', 'Update settings'),
('perm-028', 'settings',  'roles',  'Manage roles'),
('perm-029', 'settings',  'audit',  'View audit logs'),
('perm-030', 'reports',   'view',   'View reports'),
('perm-031', 'reports',   'export', 'Export reports');

-- Roles
INSERT INTO `roles` (`id`, `name`, `description`, `isSystem`, `updatedAt`) VALUES
('role-super-admin', 'super_admin', 'Full system access', 1, NOW()),
('role-admin',       'admin',       'Admin access without super admin features', 1, NOW()),
('role-recruiter',   'recruiter',   'Recruiter access for day-to-day operations', 1, NOW());

-- Role → Permission mappings for super_admin (all permissions)
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`) VALUES
('rp-sa-001', 'role-super-admin', 'perm-001'),
('rp-sa-002', 'role-super-admin', 'perm-002'),
('rp-sa-003', 'role-super-admin', 'perm-003'),
('rp-sa-004', 'role-super-admin', 'perm-004'),
('rp-sa-005', 'role-super-admin', 'perm-005'),
('rp-sa-006', 'role-super-admin', 'perm-006'),
('rp-sa-007', 'role-super-admin', 'perm-007'),
('rp-sa-008', 'role-super-admin', 'perm-008'),
('rp-sa-009', 'role-super-admin', 'perm-009'),
('rp-sa-010', 'role-super-admin', 'perm-010'),
('rp-sa-011', 'role-super-admin', 'perm-011'),
('rp-sa-012', 'role-super-admin', 'perm-012'),
('rp-sa-013', 'role-super-admin', 'perm-013'),
('rp-sa-014', 'role-super-admin', 'perm-014'),
('rp-sa-015', 'role-super-admin', 'perm-015'),
('rp-sa-016', 'role-super-admin', 'perm-016'),
('rp-sa-017', 'role-super-admin', 'perm-017'),
('rp-sa-018', 'role-super-admin', 'perm-018'),
('rp-sa-019', 'role-super-admin', 'perm-019'),
('rp-sa-020', 'role-super-admin', 'perm-020'),
('rp-sa-021', 'role-super-admin', 'perm-021'),
('rp-sa-022', 'role-super-admin', 'perm-022'),
('rp-sa-023', 'role-super-admin', 'perm-023'),
('rp-sa-024', 'role-super-admin', 'perm-024'),
('rp-sa-025', 'role-super-admin', 'perm-025'),
('rp-sa-026', 'role-super-admin', 'perm-026'),
('rp-sa-027', 'role-super-admin', 'perm-027'),
('rp-sa-028', 'role-super-admin', 'perm-028'),
('rp-sa-029', 'role-super-admin', 'perm-029'),
('rp-sa-030', 'role-super-admin', 'perm-030'),
('rp-sa-031', 'role-super-admin', 'perm-031');

-- admin: all except super admin settings
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`) VALUES
('rp-ad-001', 'role-admin', 'perm-001'),
('rp-ad-002', 'role-admin', 'perm-002'),
('rp-ad-003', 'role-admin', 'perm-003'),
('rp-ad-004', 'role-admin', 'perm-004'),
('rp-ad-005', 'role-admin', 'perm-005'),
('rp-ad-006', 'role-admin', 'perm-006'),
('rp-ad-007', 'role-admin', 'perm-007'),
('rp-ad-008', 'role-admin', 'perm-008'),
('rp-ad-009', 'role-admin', 'perm-009'),
('rp-ad-010', 'role-admin', 'perm-010'),
('rp-ad-011', 'role-admin', 'perm-011'),
('rp-ad-012', 'role-admin', 'perm-012'),
('rp-ad-013', 'role-admin', 'perm-013'),
('rp-ad-014', 'role-admin', 'perm-014'),
('rp-ad-015', 'role-admin', 'perm-015'),
('rp-ad-016', 'role-admin', 'perm-016'),
('rp-ad-017', 'role-admin', 'perm-017'),
('rp-ad-018', 'role-admin', 'perm-018'),
('rp-ad-019', 'role-admin', 'perm-019'),
('rp-ad-020', 'role-admin', 'perm-020'),
('rp-ad-021', 'role-admin', 'perm-021'),
('rp-ad-022', 'role-admin', 'perm-022'),
('rp-ad-023', 'role-admin', 'perm-023'),
('rp-ad-024', 'role-admin', 'perm-024'),
('rp-ad-025', 'role-admin', 'perm-025'),
('rp-ad-026', 'role-admin', 'perm-026'),
('rp-ad-027', 'role-admin', 'perm-027'),
('rp-ad-029', 'role-admin', 'perm-029'),
('rp-ad-030', 'role-admin', 'perm-030'),
('rp-ad-031', 'role-admin', 'perm-031');

-- recruiter: operational permissions only
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`) VALUES
('rp-rc-001', 'role-recruiter', 'perm-001'),
('rp-rc-002', 'role-recruiter', 'perm-002'),
('rp-rc-003', 'role-recruiter', 'perm-003'),
('rp-rc-004', 'role-recruiter', 'perm-004'),
('rp-rc-006', 'role-recruiter', 'perm-006'),
('rp-rc-007', 'role-recruiter', 'perm-007'),
('rp-rc-008', 'role-recruiter', 'perm-008'),
('rp-rc-009', 'role-recruiter', 'perm-009'),
('rp-rc-010', 'role-recruiter', 'perm-010'),
('rp-rc-017', 'role-recruiter', 'perm-017');

-- Default super admin user  (password: SuperAdmin@123)
-- bcrypt hash generated with rounds=12
INSERT INTO `users` (
  `id`, `employeeId`, `firstName`, `lastName`, `email`, `username`,
  `passwordHash`, `roleId`, `isSuperAdmin`, `status`, `updatedAt`
) VALUES (
  'user-superadmin-001',
  'EMP-0001',
  'Super',
  'Admin',
  'superadmin@hrapp.com',
  'superadmin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4t3GGIG',
  'role-super-admin',
  1,
  'ACTIVE',
  NOW()
);

-- App Settings (single row)
INSERT INTO `app_settings` (
  `id`, `appName`, `primaryColor`, `sidebarColor`, `fontFamily`,
  `invoicePrefix`, `invoiceCounter`, `currency`, `timezone`, `updatedAt`
) VALUES (
  'appsettings-001',
  'HR Suite',
  '#1E40AF',
  '#0F172A',
  'Inter',
  'INV',
  0,
  'INR',
  'Asia/Kolkata',
  NOW()
);

-- Default column definitions for CV module
INSERT INTO `column_definitions`
  (`id`, `module`, `name`, `label`, `dataType`, `isSystem`, `order`, `updatedAt`) VALUES
('col-cv-001', 'candidates', 'status',           'Status',           'STATUS',   1, 1,  NOW()),
('col-cv-002', 'candidates', 'currentDesignation','Designation',      'TEXT',     1, 2,  NOW()),
('col-cv-003', 'candidates', 'totalExperience',   'Experience (Yrs)', 'NUMBER',   1, 3,  NOW()),
('col-cv-004', 'candidates', 'currentCTC',        'Current CTC',      'NUMBER',   1, 4,  NOW()),
('col-cv-005', 'candidates', 'expectedCTC',       'Expected CTC',     'NUMBER',   1, 5,  NOW()),
('col-cv-006', 'candidates', 'noticePeriod',      'Notice (Days)',    'NUMBER',   1, 6,  NOW()),
('col-cv-007', 'candidates', 'currentLocation',   'Location',         'LOCATION', 1, 7,  NOW()),
('col-cv-008', 'candidates', 'source',            'Source',           'DROPDOWN', 1, 8,  NOW()),
('col-cv-009', 'candidates', 'isPriority',        'Priority',         'CHECKBOX', 1, 9,  NOW()),
('col-cv-010', 'candidates', 'createdAt',         'Added On',         'DATE',     1, 10, NOW());

-- Default column definitions for Jobs module
INSERT INTO `column_definitions`
  (`id`, `module`, `name`, `label`, `dataType`, `isSystem`, `order`, `updatedAt`) VALUES
('col-jo-001', 'jobs', 'status',        'Status',        'STATUS',   1, 1, NOW()),
('col-jo-002', 'jobs', 'priority',      'Priority',      'PRIORITY', 1, 2, NOW()),
('col-jo-003', 'jobs', 'openings',      'Openings',      'NUMBER',   1, 3, NOW()),
('col-jo-004', 'jobs', 'location',      'Location',      'LOCATION', 1, 4, NOW()),
('col-jo-005', 'jobs', 'workMode',      'Work Mode',     'DROPDOWN', 1, 5, NOW()),
('col-jo-006', 'jobs', 'closingDate',   'Closing Date',  'DATE',     1, 6, NOW()),
('col-jo-007', 'jobs', 'minExperience', 'Min Exp (Yrs)', 'NUMBER',   1, 7, NOW()),
('col-jo-008', 'jobs', 'maxSalary',     'Max Salary',    'NUMBER',   1, 8, NOW());

COMMIT;

-- =========================================================
-- USEFUL VIEWS
-- =========================================================

CREATE OR REPLACE VIEW `v_candidate_summary` AS
SELECT
  c.id,
  CONCAT(c.firstName, ' ', IFNULL(c.lastName,'')) AS fullName,
  c.email,
  c.phone,
  c.currentDesignation,
  c.currentCompany,
  c.totalExperience,
  c.currentCTC,
  c.expectedCTC,
  c.currentLocation,
  c.status,
  c.isPriority,
  c.createdAt,
  CONCAT(u.firstName, ' ', IFNULL(u.lastName,'')) AS addedBy
FROM candidates c
LEFT JOIN users u ON c.addedById = u.id;

CREATE OR REPLACE VIEW `v_invoice_summary` AS
SELECT
  i.id,
  i.invoiceNumber,
  i.invoiceDate,
  i.dueDate,
  i.totalAmount,
  i.status,
  i.paidAmount,
  i.paidAt,
  cl.companyName   AS clientName,
  cl.email         AS clientEmail,
  CONCAT(u.firstName, ' ', IFNULL(u.lastName,'')) AS createdBy
FROM invoices i
LEFT JOIN clients cl ON i.clientId = cl.id
LEFT JOIN users u ON i.createdById = u.id;

CREATE OR REPLACE VIEW `v_job_pipeline` AS
SELECT
  j.id,
  j.title,
  j.status,
  j.priority,
  j.openings,
  j.location,
  j.workMode,
  j.closingDate,
  cl.companyName AS clientName,
  COUNT(DISTINCT ja.candidateId) AS applicantCount,
  COUNT(DISTINCT ir.id) AS roundCount
FROM job_openings j
LEFT JOIN clients cl ON j.clientId = cl.id
LEFT JOIN job_applications ja ON j.id = ja.jobId
LEFT JOIN interview_rounds ir ON j.id = ir.jobId
GROUP BY j.id;
