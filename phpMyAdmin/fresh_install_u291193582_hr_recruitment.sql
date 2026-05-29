-- ============================================================
-- HR RECRUITMENT SYSTEM — FRESH INSTALL SQL
-- Database : u291193582_hr_recruitment
-- Generated: 2026-05-29
-- Import this into a completely empty MySQL database.
-- Default login: superadmin@hrapp.com / SuperAdmin@123
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;
SET time_zone = "+00:00";
/*!40101 SET NAMES utf8mb4 */;

-- ============================================================
-- TABLE STRUCTURES
-- ============================================================

CREATE TABLE `app_settings` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `value` longtext DEFAULT NULL,
  `category` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `userEmail` varchar(191) DEFAULT NULL,
  `action` enum('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','IMPORT','PASSWORD_CHANGE','ROLE_CHANGE','STATUS_CHANGE') NOT NULL,
  `module` varchar(191) NOT NULL,
  `recordId` varchar(191) DEFAULT NULL,
  `oldValues` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`oldValues`)),
  `newValues` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`newValues`)),
  `ipAddress` varchar(191) DEFAULT NULL,
  `userAgent` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `businesses` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `adminEmail` varchar(191) DEFAULT NULL,
  `logo` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ACTIVE',
  `deleteScheduledAt` datetime(3) DEFAULT NULL,
  `deletedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bug_reports` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) DEFAULT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'Bug',
  `description` text NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'open',
  `priority` varchar(191) NOT NULL DEFAULT 'medium',
  `severity` varchar(191) DEFAULT NULL,
  `module` varchar(191) DEFAULT NULL,
  `browser` varchar(191) DEFAULT NULL,
  `environment` varchar(191) DEFAULT NULL,
  `device` varchar(191) DEFAULT NULL,
  `reproducibility` varchar(191) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `resolution` text DEFAULT NULL,
  `assignedToId` varchar(191) DEFAULT NULL,
  `reportedByEmail` varchar(191) NOT NULL,
  `reportedByName` varchar(191) DEFAULT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `businessId` varchar(191) DEFAULT NULL,
  `businessName` varchar(191) DEFAULT NULL,
  `files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`files`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bug_status_labels` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `color` varchar(191) NOT NULL DEFAULT '#6B7280',
  `order` int(11) NOT NULL DEFAULT 0,
  `isArchived` tinyint(1) NOT NULL DEFAULT 0,
  `businessId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `candidates` (
  `id` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `alternatePhone` varchar(191) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') DEFAULT NULL,
  `dateOfBirth` datetime(3) DEFAULT NULL,
  `profilePhoto` varchar(191) DEFAULT NULL,
  `currentLocation` varchar(191) DEFAULT NULL,
  `preferredLocations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferredLocations`)),
  `religion` varchar(191) DEFAULT NULL,
  `caste` varchar(191) DEFAULT NULL,
  `languages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`languages`)),
  `nationality` varchar(191) DEFAULT 'Indian',
  `currentDesignation` varchar(191) DEFAULT NULL,
  `currentCompany` varchar(191) DEFAULT NULL,
  `totalExperience` double DEFAULT NULL,
  `currentCTC` decimal(12,2) DEFAULT NULL,
  `expectedCTC` decimal(12,2) DEFAULT NULL,
  `noticePeriod` int(11) DEFAULT NULL,
  `currentlyEmployed` tinyint(1) DEFAULT 1,
  `highestQualification` varchar(191) DEFAULT NULL,
  `specialization` varchar(191) DEFAULT NULL,
  `university` varchar(191) DEFAULT NULL,
  `passingYear` int(11) DEFAULT NULL,
  `educationDetails` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`educationDetails`)),
  `experienceDetails` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`experienceDetails`)),
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `certifications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`certifications`)),
  `technologyStack` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`technologyStack`)),
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`keywords`)),
  `status` enum('NEW','SCREENING','SHORTLISTED','INTERVIEWING','OFFERED','HIRED','REJECTED','ON_HOLD','ACTIVE','INACTIVE','HOLD','BLACKLIST') NOT NULL DEFAULT 'NEW',
  `isPriority` tinyint(1) NOT NULL DEFAULT 0,
  `source` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `cvFile` varchar(191) DEFAULT NULL,
  `cvOriginalName` varchar(191) DEFAULT NULL,
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `searchVector` text DEFAULT NULL,
  `rawText` longtext DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `businessId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdBy` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `candidate_work_history` (
  `id` varchar(191) NOT NULL,
  `candidateId` varchar(191) NOT NULL,
  `company` varchar(191) NOT NULL,
  `designation` varchar(191) NOT NULL,
  `startDate` datetime(3) DEFAULT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `isCurrent` tinyint(1) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `location` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `clients` (
  `id` varchar(191) NOT NULL,
  `companyName` varchar(191) NOT NULL,
  `contactPerson` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `alternatePhone` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT 'India',
  `pincode` varchar(191) DEFAULT NULL,
  `gstNumber` varchar(191) DEFAULT NULL,
  `panNumber` varchar(191) DEFAULT NULL,
  `industry` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `contractStartDate` datetime(3) DEFAULT NULL,
  `contractEndDate` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `businessId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdBy` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `column_definitions` (
  `id` varchar(191) NOT NULL,
  `module` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `label` varchar(191) NOT NULL,
  `dataType` enum('STATUS','DROPDOWN','TEXT','DATE','EMPLOYEE','CANDIDATES','LOCATION','FILES','PRIORITY','LABEL','NUMBER','CHECKBOX','URL','EMAIL','PHONE') NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT 1,
  `isRequired` tinyint(1) NOT NULL DEFAULT 0,
  `isSortable` tinyint(1) NOT NULL DEFAULT 1,
  `isFilterable` tinyint(1) NOT NULL DEFAULT 1,
  `isEditable` tinyint(1) NOT NULL DEFAULT 1,
  `order` int(11) NOT NULL DEFAULT 0,
  `width` int(11) DEFAULT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `createdBy` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `interview_rounds` (
  `id` varchar(191) NOT NULL,
  `jobId` varchar(191) NOT NULL,
  `roundNumber` int(11) NOT NULL,
  `roundName` varchar(191) NOT NULL,
  `processGroup` varchar(191) NOT NULL DEFAULT 'main',
  `description` text DEFAULT NULL,
  `customColumns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customColumns`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `interview_slots` (
  `id` varchar(191) NOT NULL,
  `roundId` varchar(191) NOT NULL,
  `candidateId` varchar(191) NOT NULL,
  `scheduledDate` datetime(3) DEFAULT NULL,
  `scheduledTime` varchar(191) DEFAULT NULL,
  `status` enum('SCHEDULED','COMPLETED','CANCELLED','RESCHEDULED') NOT NULL DEFAULT 'SCHEDULED',
  `result` enum('PENDING','SELECTED','REJECTED','ON_HOLD') NOT NULL DEFAULT 'PENDING',
  `feedback` text DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `interviewerIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`interviewerIds`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoices` (
  `id` varchar(191) NOT NULL,
  `invoiceNumber` varchar(191) NOT NULL,
  `clientId` varchar(191) NOT NULL,
  `invoiceDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `dueDate` datetime(3) DEFAULT NULL,
  `serviceDescription` text DEFAULT NULL,
  `lineItems` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`lineItems`)),
  `subtotal` decimal(12,2) NOT NULL,
  `gstType` varchar(191) DEFAULT NULL,
  `cgstRate` decimal(5,2) DEFAULT NULL,
  `sgstRate` decimal(5,2) DEFAULT NULL,
  `igstRate` decimal(5,2) DEFAULT NULL,
  `cgstAmount` decimal(12,2) DEFAULT NULL,
  `sgstAmount` decimal(12,2) DEFAULT NULL,
  `igstAmount` decimal(12,2) DEFAULT NULL,
  `totalTax` decimal(12,2) DEFAULT NULL,
  `totalAmount` decimal(12,2) NOT NULL,
  `status` enum('DRAFT','SENT','PAID','OVERDUE','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `paidAmount` decimal(12,2) DEFAULT NULL,
  `paidAt` datetime(3) DEFAULT NULL,
  `paymentMethod` varchar(191) DEFAULT NULL,
  `paymentReference` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `pdfPath` varchar(191) DEFAULT NULL,
  `businessId` varchar(191) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_applications` (
  `id` varchar(191) NOT NULL,
  `jobId` varchar(191) NOT NULL,
  `candidateId` varchar(191) NOT NULL,
  `status` enum('NEW','SCREENING','SHORTLISTED','INTERVIEWING','OFFERED','HIRED','REJECTED','ON_HOLD','ACTIVE','INACTIVE','HOLD','BLACKLIST') NOT NULL DEFAULT 'NEW',
  `appliedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `notes` text DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_openings` (
  `id` varchar(191) NOT NULL,
  `jobTitle` varchar(191) NOT NULL,
  `clientId` varchar(191) NOT NULL,
  `description` longtext DEFAULT NULL,
  `requiredSkills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`requiredSkills`)),
  `preferredSkills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferredSkills`)),
  `experienceMin` double DEFAULT NULL,
  `experienceMax` double DEFAULT NULL,
  `salaryMin` decimal(12,2) DEFAULT NULL,
  `salaryMax` decimal(12,2) DEFAULT NULL,
  `jobType` enum('FULL_TIME','PART_TIME','CONTRACT','FREELANCE','INTERNSHIP') NOT NULL DEFAULT 'FULL_TIME',
  `workLocation` varchar(191) DEFAULT NULL,
  `workMode` varchar(191) DEFAULT NULL,
  `numberOfOpenings` int(11) NOT NULL DEFAULT 1,
  `status` enum('ACTIVE','CLOSED','ON_HOLD','DRAFT') NOT NULL DEFAULT 'ACTIVE',
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  `closingDate` datetime(3) DEFAULT NULL,
  `jdDocument` varchar(191) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `businessId` varchar(191) NOT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(191) NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
  `id` varchar(191) NOT NULL,
  `module` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `post_selection_records` (
  `id` varchar(191) NOT NULL,
  `jobId` varchar(191) NOT NULL,
  `candidateId` varchar(191) NOT NULL,
  `processGroup` varchar(191) NOT NULL DEFAULT 'main',
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `ctcOffered` decimal(12,2) DEFAULT NULL,
  `offerLetters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`offerLetters`)),
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `roles` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isSystem` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `businessId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
  `id` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `permissionId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_notifications` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `sendTo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`sendTo`)),
  `files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`files`)),
  `clientId` varchar(191) DEFAULT NULL,
  `businessId` varchar(191) DEFAULT NULL,
  `readBy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`readBy`)),
  `createdById` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `employeeId` varchar(191) DEFAULT NULL,
  `email` varchar(191) NOT NULL,
  `username` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `profilePhoto` varchar(191) DEFAULT NULL,
  `roleId` varchar(191) NOT NULL,
  `department` varchar(191) DEFAULT NULL,
  `designation` varchar(191) DEFAULT NULL,
  `joiningDate` datetime(3) DEFAULT NULL,
  `salary` decimal(12,2) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT 'India',
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `isSuperAdmin` tinyint(1) NOT NULL DEFAULT 0,
  `twoFactorEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `twoFactorSecret` varchar(191) DEFAULT NULL,
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `lastLoginIp` varchar(191) DEFAULT NULL,
  `loginAttempts` int(11) NOT NULL DEFAULT 0,
  `lockedUntil` datetime(3) DEFAULT NULL,
  `passwordResetToken` varchar(191) DEFAULT NULL,
  `passwordResetExpiresAt` datetime(3) DEFAULT NULL,
  `refreshToken` text DEFAULT NULL,
  `notificationPrefs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notificationPrefs`)),
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `businessId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdBy` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Permissions (all modules)
INSERT INTO `permissions` (`id`, `module`, `action`, `description`, `createdAt`) VALUES
('0f14b342-9148-450b-a2d0-752291590af4', 'dashboard',  'view',           NULL, NOW()),
('c19a9791-c386-47d6-a97c-f32645605d36', 'employees',  'view',           NULL, NOW()),
('5ba393b8-0f63-4988-a4a5-dfa53ea0f460', 'employees',  'create',         NULL, NOW()),
('5b29a04a-b9a4-41a3-84ed-2ab5ca1006c7', 'employees',  'update',         NULL, NOW()),
('e1fb25c2-d26c-4d77-a3d7-45a612967d07', 'employees',  'delete',         NULL, NOW()),
('e4c44e4b-34ba-42e4-927a-00fca2aef3a6', 'employees',  'toggle_status',  NULL, NOW()),
('89c5caad-ad23-4045-a049-6b435fb08619', 'clients',    'view',           NULL, NOW()),
('1ba5d133-f3c4-419f-ba9f-4b85bb3defa4', 'clients',    'create',         NULL, NOW()),
('234c79cc-23b7-458f-a372-a5ab8ed098e6', 'clients',    'update',         NULL, NOW()),
('9e7efe96-cccc-4628-b96a-ce2bc6b2b526', 'clients',    'delete',         NULL, NOW()),
('a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'clients',    'view_contacts',  NULL, NOW()),
('3e82876d-0bb0-4109-b07d-b5991e8f2ed1', 'cv',         'view',           NULL, NOW()),
('d6404d3b-a042-42ff-8ab1-8a092a96a29c', 'cv',         'create',         NULL, NOW()),
('5d93bc52-15e9-445c-ac85-ddecbeb968bd', 'cv',         'update',         NULL, NOW()),
('15080b11-be26-4a2b-936b-aa0e0c346900', 'cv',         'delete',         NULL, NOW()),
('2dc6ccdb-2f4c-4432-a3f5-31bb877db0c7', 'cv',         'bulk_import',    NULL, NOW()),
('4ca60d7f-78a5-436f-9bfd-2fc35d7bbacd', 'cv',         'download',       NULL, NOW()),
('1ee301d7-5bd9-4e7c-9984-83fd1de5b6f0', 'jobs',       'view',           NULL, NOW()),
('f4060517-ea5e-457c-9098-733969f17efd', 'jobs',       'create',         NULL, NOW()),
('330ae8f0-6060-443f-a923-81b9ddb65761', 'jobs',       'update',         NULL, NOW()),
('8dde16a5-df43-409a-ad1f-655550099bfc', 'jobs',       'delete',         NULL, NOW()),
('2bc49652-b60a-4b4d-8c75-8add5d2bc961', 'invoices',   'view',           NULL, NOW()),
('604eac29-5db0-4f8b-be48-3ae41f2f3522', 'invoices',   'create',         NULL, NOW()),
('4a5ba054-823a-47f9-9bc6-b3f24f915a57', 'invoices',   'update',         NULL, NOW()),
('9a8ea18a-3f40-4727-8894-29fba34fbdfc', 'invoices',   'delete',         NULL, NOW()),
('3ec405dc-293e-4fe6-a361-d31da4c88ec2', 'invoices',   'send_email',     NULL, NOW()),
('eea493f4-5c05-406a-8f80-8d4744f6f14d', 'settings',   'view',           NULL, NOW()),
('76bab36c-3e57-47e7-8e3a-c7ad71c331fb', 'settings',   'theme',          NULL, NOW()),
('8475223f-5438-42f7-b95b-b6b528e6439d', 'settings',   'roles',          NULL, NOW()),
('7fcafa09-7fbe-45a3-894b-bc7a82ceb4be', 'settings',   'fonts',          NULL, NOW()),
('f1e2d3c4-b5a6-4789-9876-543210fedcba', 'settings',   'language',       NULL, NOW()),
('a9b8c7d6-e5f4-4321-8765-fedcba987654', 'settings',   'manage_roles',   NULL, NOW()),
('b1c2d3e4-f5a6-4789-abcd-ef0123456780', 'settings',   'roles_view',     NULL, NOW()),
('c2d3e4f5-a6b7-4890-bcde-f01234567891', 'settings',   'roles_create',   NULL, NOW()),
('d3e4f5a6-b7c8-4901-cdef-012345678912', 'settings',   'roles_edit',     NULL, NOW()),
('e4f5a6b7-c8d9-4012-def0-123456789123', 'settings',   'roles_delete',   NULL, NOW()),
('8f791532-7c29-464a-a83b-980a10af385f', 'audit',      'view',           NULL, NOW()),
('49d5c40d-d9eb-40c2-9f0f-d8d8f393e7f9', 'columns',    'manage',         NULL, NOW()),
('b781f9de-42cb-414d-988c-3d309d230825', 'dropdown',   'manage_options', NULL, NOW());

-- Roles
INSERT INTO `roles` (`id`, `name`, `description`, `isSystem`, `isActive`, `businessId`, `createdAt`, `updatedAt`) VALUES
('6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'super_admin', 'Super Administrator with full access',    1, 1, NULL, NOW(), NOW()),
('70fc46a5-6852-4925-a3d7-d8d01ed60306', 'admin',       'Administrator with operational access',   1, 1, NULL, NOW(), NOW()),
('3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', 'recruiter',   'Recruiter with limited access',           1, 1, NULL, NOW(), NOW());

-- Role Permissions — Super Admin (all permissions)
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`) VALUES
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '0f14b342-9148-450b-a2d0-752291590af4', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'c19a9791-c386-47d6-a97c-f32645605d36', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '5ba393b8-0f63-4988-a4a5-dfa53ea0f460', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '5b29a04a-b9a4-41a3-84ed-2ab5ca1006c7', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'e1fb25c2-d26c-4d77-a3d7-45a612967d07', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'e4c44e4b-34ba-42e4-927a-00fca2aef3a6', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '89c5caad-ad23-4045-a049-6b435fb08619', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '1ba5d133-f3c4-419f-ba9f-4b85bb3defa4', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '234c79cc-23b7-458f-a372-a5ab8ed098e6', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '9e7efe96-cccc-4628-b96a-ce2bc6b2b526', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '3e82876d-0bb0-4109-b07d-b5991e8f2ed1', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'd6404d3b-a042-42ff-8ab1-8a092a96a29c', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '5d93bc52-15e9-445c-ac85-ddecbeb968bd', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '15080b11-be26-4a2b-936b-aa0e0c346900', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '2dc6ccdb-2f4c-4432-a3f5-31bb877db0c7', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '4ca60d7f-78a5-436f-9bfd-2fc35d7bbacd', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '1ee301d7-5bd9-4e7c-9984-83fd1de5b6f0', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'f4060517-ea5e-457c-9098-733969f17efd', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '330ae8f0-6060-443f-a923-81b9ddb65761', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '8dde16a5-df43-409a-ad1f-655550099bfc', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '2bc49652-b60a-4b4d-8c75-8add5d2bc961', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '604eac29-5db0-4f8b-be48-3ae41f2f3522', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '4a5ba054-823a-47f9-9bc6-b3f24f915a57', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '9a8ea18a-3f40-4727-8894-29fba34fbdfc', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '3ec405dc-293e-4fe6-a361-d31da4c88ec2', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'eea493f4-5c05-406a-8f80-8d4744f6f14d', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '76bab36c-3e57-47e7-8e3a-c7ad71c331fb', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '8475223f-5438-42f7-b95b-b6b528e6439d', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '7fcafa09-7fbe-45a3-894b-bc7a82ceb4be', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'f1e2d3c4-b5a6-4789-9876-543210fedcba', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'a9b8c7d6-e5f4-4321-8765-fedcba987654', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'b1c2d3e4-f5a6-4789-abcd-ef0123456780', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'c2d3e4f5-a6b7-4890-bcde-f01234567891', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'd3e4f5a6-b7c8-4901-cdef-012345678912', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'e4f5a6b7-c8d9-4012-def0-123456789123', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '8f791532-7c29-464a-a83b-980a10af385f', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '49d5c40d-d9eb-40c2-9f0f-d8d8f393e7f9', NOW()),
(UUID(), '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'b781f9de-42cb-414d-988c-3d309d230825', NOW());

-- Role Permissions — Admin (operational, no delete/audit/language)
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`) VALUES
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '0f14b342-9148-450b-a2d0-752291590af4', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'c19a9791-c386-47d6-a97c-f32645605d36', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '5ba393b8-0f63-4988-a4a5-dfa53ea0f460', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '5b29a04a-b9a4-41a3-84ed-2ab5ca1006c7', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'e4c44e4b-34ba-42e4-927a-00fca2aef3a6', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '89c5caad-ad23-4045-a049-6b435fb08619', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '1ba5d133-f3c4-419f-ba9f-4b85bb3defa4', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '234c79cc-23b7-458f-a372-a5ab8ed098e6', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '3e82876d-0bb0-4109-b07d-b5991e8f2ed1', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'd6404d3b-a042-42ff-8ab1-8a092a96a29c', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '5d93bc52-15e9-445c-ac85-ddecbeb968bd', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '2dc6ccdb-2f4c-4432-a3f5-31bb877db0c7', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '4ca60d7f-78a5-436f-9bfd-2fc35d7bbacd', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '1ee301d7-5bd9-4e7c-9984-83fd1de5b6f0', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'f4060517-ea5e-457c-9098-733969f17efd', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '330ae8f0-6060-443f-a923-81b9ddb65761', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '2bc49652-b60a-4b4d-8c75-8add5d2bc961', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '604eac29-5db0-4f8b-be48-3ae41f2f3522', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '4a5ba054-823a-47f9-9bc6-b3f24f915a57', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '3ec405dc-293e-4fe6-a361-d31da4c88ec2', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'eea493f4-5c05-406a-8f80-8d4744f6f14d', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', '49d5c40d-d9eb-40c2-9f0f-d8d8f393e7f9', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'b781f9de-42cb-414d-988c-3d309d230825', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'a9b8c7d6-e5f4-4321-8765-fedcba987654', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'b1c2d3e4-f5a6-4789-abcd-ef0123456780', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'c2d3e4f5-a6b7-4890-bcde-f01234567891', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'd3e4f5a6-b7c8-4901-cdef-012345678912', NOW()),
(UUID(), '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'e4f5a6b7-c8d9-4012-def0-123456789123', NOW());

-- Role Permissions — Recruiter (basic read/create)
INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`) VALUES
(UUID(), '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', '0f14b342-9148-450b-a2d0-752291590af4', NOW()),
(UUID(), '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', '3e82876d-0bb0-4109-b07d-b5991e8f2ed1', NOW()),
(UUID(), '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', 'd6404d3b-a042-42ff-8ab1-8a092a96a29c', NOW()),
(UUID(), '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', '5d93bc52-15e9-445c-ac85-ddecbeb968bd', NOW()),
(UUID(), '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', '1ee301d7-5bd9-4e7c-9984-83fd1de5b6f0', NOW()),
(UUID(), '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', '89c5caad-ad23-4045-a049-6b435fb08619', NOW());

-- Super Admin User (password: SuperAdmin@123)
INSERT INTO `users` (`id`, `employeeId`, `email`, `username`, `passwordHash`, `firstName`, `lastName`, `roleId`, `isSuperAdmin`, `status`, `country`, `loginAttempts`, `twoFactorEnabled`, `createdAt`, `updatedAt`) VALUES
('00647314-69c7-40ec-9817-bf0633ed3a9c', 'EMP-0001', 'superadmin@hrapp.com', 'superadmin',
 '$2a$12$Q5063dhctxjjkidc3mD/s.rV06cbRTL5biapjRhrVYqjJ6fOZEoW6',
 'Super', 'Admin', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 1, 'ACTIVE', 'India', 0, 0, NOW(), NOW());

-- Default App Settings
INSERT INTO `app_settings` (`id`, `key`, `value`, `category`, `updatedAt`) VALUES
(UUID(), 'app_name',        'HR Recruitment System', 'general', NOW()),
(UUID(), 'app_logo',        '',                      'branding', NOW()),
(UUID(), 'primary_color',   '#1E40AF',               'theme',   NOW()),
(UUID(), 'accent_color',    '#3B82F6',               'theme',   NOW()),
(UUID(), 'sidebar_color',   '#0F172A',               'theme',   NOW()),
(UUID(), 'font_family',     'Inter',                 'theme',   NOW()),
(UUID(), 'default_theme',   'light',                 'theme',   NOW()),
(UUID(), 'gstin',           '',                      'company', NOW()),
(UUID(), 'company_name',    '',                      'company', NOW()),
(UUID(), 'company_address', '',                      'company', NOW()),
(UUID(), 'invoice_prefix',  'INV',                   'invoice', NOW()),
(UUID(), 'invoice_counter', '1',                     'invoice', NOW());

-- Default Column Definitions (CV module)
INSERT INTO `column_definitions` (`id`, `module`, `name`, `label`, `dataType`, `isVisible`, `order`, `createdAt`, `updatedAt`) VALUES
(UUID(), 'cv', 'status',           'Status',       'STATUS',   1, 1, NOW(), NOW()),
(UUID(), 'cv', 'priority',         'Priority',     'PRIORITY', 1, 2, NOW(), NOW()),
(UUID(), 'cv', 'current_location', 'Location',     'LOCATION', 1, 3, NOW(), NOW()),
(UUID(), 'cv', 'current_ctc',      'Current CTC',  'NUMBER',   1, 4, NOW(), NOW()),
(UUID(), 'cv', 'expected_ctc',     'Expected CTC', 'NUMBER',   1, 5, NOW(), NOW()),
(UUID(), 'cv', 'notice_period',    'Notice Period','NUMBER',   1, 6, NOW(), NOW()),
(UUID(), 'cv', 'total_experience', 'Experience',   'NUMBER',   1, 7, NOW(), NOW());

-- Default Column Definitions (Jobs module)
INSERT INTO `column_definitions` (`id`, `module`, `name`, `label`, `dataType`, `isVisible`, `order`, `createdAt`, `updatedAt`) VALUES
(UUID(), 'jobs', 'status',             'Status',      'STATUS',     1, 1, NOW(), NOW()),
(UUID(), 'jobs', 'priority',           'Priority',    'PRIORITY',   1, 2, NOW(), NOW()),
(UUID(), 'jobs', 'work_location',      'Location',    'LOCATION',   1, 3, NOW(), NOW()),
(UUID(), 'jobs', 'assigned_employees', 'Assigned To', 'EMPLOYEE',   1, 4, NOW(), NOW()),
(UUID(), 'jobs', 'candidates',         'Candidates',  'CANDIDATES', 1, 5, NOW(), NOW()),
(UUID(), 'jobs', 'closing_date',       'Closing Date','DATE',       1, 6, NOW(), NOW());

-- ============================================================
-- PRIMARY KEYS & INDEXES
-- ============================================================

ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `app_settings_key_key` (`key`);

ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_userId_idx` (`userId`),
  ADD KEY `audit_logs_module_idx` (`module`),
  ADD KEY `audit_logs_createdAt_idx` (`createdAt`);

ALTER TABLE `businesses`
  ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `businesses_code_key` (`code`),
  ADD KEY `businesses_status_idx` (`status`);

ALTER TABLE `bug_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bug_reports_createdAt_idx` (`createdAt`),
  ADD KEY `bug_reports_priority_idx` (`priority`),
  ADD KEY `bug_reports_status_idx` (`status`),
  ADD KEY `bug_reports_businessId_idx` (`businessId`);

ALTER TABLE `bug_status_labels`
  ADD PRIMARY KEY (`id`), ADD KEY `bug_status_labels_businessId_idx` (`businessId`);

ALTER TABLE `candidates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidates_status_idx` (`status`),
  ADD KEY `candidates_isPriority_idx` (`isPriority`),
  ADD KEY `candidates_businessId_idx` (`businessId`),
  ADD KEY `candidates_businessId_createdAt_idx` (`businessId`, `createdAt`),
  ADD FULLTEXT KEY `candidates_firstName_lastName_idx` (`firstName`, `lastName`);

ALTER TABLE `candidate_work_history`
  ADD PRIMARY KEY (`id`), ADD KEY `candidate_work_history_candidateId_idx` (`candidateId`);

ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `clients_isActive_idx` (`isActive`),
  ADD KEY `clients_businessId_idx` (`businessId`);

ALTER TABLE `column_definitions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `column_definitions_module_name_key` (`module`, `name`);

ALTER TABLE `interview_rounds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `interview_rounds_jobId_roundNumber_processGroup_key` (`jobId`, `roundNumber`, `processGroup`);

ALTER TABLE `interview_slots`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `invoices_invoiceNumber_key` (`invoiceNumber`),
  ADD KEY `invoices_status_idx` (`status`),
  ADD KEY `invoices_clientId_idx` (`clientId`),
  ADD KEY `invoices_businessId_idx` (`businessId`);

ALTER TABLE `job_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `job_applications_jobId_candidateId_key` (`jobId`, `candidateId`);

ALTER TABLE `job_openings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `job_openings_status_idx` (`status`),
  ADD KEY `job_openings_priority_idx` (`priority`),
  ADD KEY `job_openings_clientId_idx` (`clientId`),
  ADD KEY `job_openings_businessId_idx` (`businessId`);

ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`), ADD KEY `notifications_userId_isRead_idx` (`userId`, `isRead`);

ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_module_action_key` (`module`, `action`);

ALTER TABLE `post_selection_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `post_selection_records_jobId_candidateId_processGroup_key` (`jobId`, `candidateId`, `processGroup`);

ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `roles_name_key` (`name`);

ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_roleId_permissionId_key` (`roleId`, `permissionId`);

ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_notifications_createdById_idx` (`createdById`),
  ADD KEY `user_notifications_businessId_idx` (`businessId`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_employeeId_key` (`employeeId`),
  ADD UNIQUE KEY `users_email_key` (`email`),
  ADD UNIQUE KEY `users_username_key` (`username`),
  ADD KEY `users_email_idx` (`email`),
  ADD KEY `users_status_idx` (`status`),
  ADD KEY `users_businessId_idx` (`businessId`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- ============================================================
-- Login: superadmin@hrapp.com  |  Password: SuperAdmin@123
-- Change password immediately after first login!
-- ============================================================
