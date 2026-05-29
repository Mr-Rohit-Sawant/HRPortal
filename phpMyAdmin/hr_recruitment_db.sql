-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 18, 2026 at 07:35 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u291193582_hr_recruitment`
--

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

CREATE TABLE `app_settings` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `value` longtext DEFAULT NULL,
  `category` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `updatedBy` varchar(191) DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `app_settings`
--

INSERT INTO `app_settings` (`id`, `key`, `value`, `category`, `description`, `updatedBy`, `updatedAt`) VALUES
('0fd77c5f-277e-4844-9b87-c42e0768fa3e', 'app_name', 'HR Recruitment System', 'general', NULL, '00647314-69c7-40ec-9817-bf0633ed3a9c', '2026-05-18 15:44:16.908'),
('5eca182d-9bf0-4849-8a6b-d25ff8fcae85', 'company_address', '', 'company', NULL, NULL, '2026-05-12 10:21:00.267'),
('6ceb0e22-5320-4151-b1df-766fb7845698', 'invoice_counter', '3', 'invoice', NULL, NULL, '2026-05-13 18:59:43.905'),
('7ce327ed-3f16-4d91-b1ef-d5f09020bd03', 'sidebar_color', '#0F172A', 'theme', NULL, '00647314-69c7-40ec-9817-bf0633ed3a9c', '2026-05-18 15:44:16.908'),
('8b9be932-ecd7-43a9-8880-97ec3b5f9b01', 'company_name', '', 'company', NULL, NULL, '2026-05-12 10:21:00.266'),
('9e6d4a32-0ab6-49be-bf51-6d060de94632', 'invoice_prefix', 'INV', 'invoice', NULL, NULL, '2026-05-12 10:21:00.267'),
('ae5e1f53-98e9-45db-acd9-938839c264d1', 'font_family', 'Inter', 'theme', NULL, '00647314-69c7-40ec-9817-bf0633ed3a9c', '2026-05-18 15:44:16.909'),
('ba921b2f-d615-4383-9475-55304197bec6', 'default_theme', 'light', 'theme', NULL, NULL, '2026-05-12 10:21:00.265'),
('c9eb17b3-9e3f-416e-871c-4c7bdaff1cd9', 'app_logo', '', 'branding', NULL, NULL, '2026-05-12 10:21:00.262'),
('d3d0466a-4567-4ca6-8648-0b29194acc13', 'primary_color', '#1E40AF', 'theme', NULL, '00647314-69c7-40ec-9817-bf0633ed3a9c', '2026-05-18 15:44:16.908'),
('d76c62ca-660b-4b18-9a52-05bcbc35aa4a', 'gstin', '', 'company', NULL, NULL, '2026-05-12 10:21:00.266'),
('e26ccb1f-16d1-47ad-bcc1-181cc770a9fb', 'accent_color', '#3B82F6', 'theme', NULL, NULL, '2026-05-12 10:21:00.263');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

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

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `userId`, `userEmail`, `action`, `module`, `recordId`, `oldValues`, `newValues`, `ipAddress`, `userAgent`, `createdAt`) VALUES
('0671f9e4-9afc-47a6-baae-34373c4b5479', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 19:01:02.973'),
('0a7a5940-c2ed-4ef2-8738-a3d6d32e71fe', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'jobs', 'a7833a9e-bf25-43b7-944a-12069d49e95f', NULL, NULL, NULL, NULL, '2026-05-14 11:06:42.334'),
('114e7179-4414-44c4-abfa-4a8af0172baf', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:51:49.663'),
('12eb43a8-9d79-4834-9bbd-3fb75f589491', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'CREATE', 'invoices', '35bbbb64-2d85-45a3-9453-1cb0c0c7eeb6', NULL, NULL, NULL, NULL, '2026-05-13 18:59:43.906'),
('15a94940-cafe-4f3e-87a0-1ebc866b94d4', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#0F766E\",\"sidebar_color\":\"#042F2E\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-13 19:52:28.206'),
('168530da-6bfc-4817-8412-a406f082c34f', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#475569\",\"sidebar_color\":\"#0F172A\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-13 19:52:42.554'),
('18b3ebd1-4bb3-4c72-93be-381f88a68647', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'CREATE', 'cv', '968e0d2e-6161-4629-bb98-823f903cb56a', NULL, NULL, NULL, NULL, '2026-05-13 12:57:22.470'),
('190a2ca1-1bdc-498d-99bc-06663b3b7425', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 19:01:10.757'),
('1cdcc9d8-c0a8-4a51-b0f8-c7db3fc51e9e', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:52:53.106'),
('1e164b6e-8827-44ca-856f-d312df217fe8', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGIN', 'auth', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-13 18:43:54.143'),
('280404c1-1a58-4cdf-8a5d-5be1a47363d8', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGIN', 'auth', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-13 19:35:04.512'),
('2c5a4bc0-eeb1-45ac-8061-4bdcc55b3c1a', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:55:26.738'),
('2eb94f2a-acf4-42c9-a663-ce42cb5e30aa', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 19:35:33.479'),
('30f43d25-9ca4-4859-a820-286f0cb99fd1', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGOUT', 'auth', NULL, NULL, NULL, '::1', NULL, '2026-05-14 02:44:53.228'),
('379d119e-938b-494e-85b3-471a9d6bea5c', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#6D28D9\",\"sidebar_color\":\"#1E1B4B\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-13 19:52:15.953'),
('48278f8b-43ee-415b-ae16-f262e653a347', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGIN', 'auth', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-12 10:39:27.179'),
('5042344a-28f9-4a9d-a3f6-e9207cc37d76', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'jobs', 'a7833a9e-bf25-43b7-944a-12069d49e95f', NULL, NULL, NULL, NULL, '2026-05-14 11:17:07.095'),
('50bc7b8b-61ae-43c7-842c-02f04162e7e0', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-14 02:29:36.889'),
('53750036-0dad-4b26-9d51-3140b7fea3c0', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGIN', 'auth', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-13 16:59:01.896'),
('5f5742f0-d545-49de-a02c-09a8a98483ed', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:51:50.874'),
('5f8b76eb-2897-4a53-ad78-0d85ffd02eff', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'CREATE', 'cv', '0a29c043-16e6-4629-aeed-33096902f2d6', NULL, NULL, NULL, NULL, '2026-05-13 19:53:11.687'),
('60012d37-6364-4319-8859-1be364e378c1', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:55:26.020'),
('68033e66-aee0-4797-90bc-2574484fffeb', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:55:26.498'),
('69c5ebd1-cf46-40ca-98f1-f2148ffa646a', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGOUT', 'auth', NULL, NULL, NULL, '::1', NULL, '2026-05-12 10:39:05.533'),
('6c68f0c6-417c-4989-96f4-f16e3fdd5378', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:51:50.510'),
('7073b706-8587-4bfe-8a11-ca13a4ec9e26', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 19:35:26.317'),
('76279a36-d5b5-4157-8274-9ccd5991d493', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGIN', 'auth', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-12 10:37:53.143'),
('76292fbf-a066-4682-99f7-7c3f4ecead9b', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#15803D\",\"sidebar_color\":\"#14532D\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-13 19:45:41.919'),
('80a91f29-7e8e-475c-9f9f-9418d9dd6b47', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 19:01:05.513'),
('838ad6b2-88ae-4bf4-9a3a-95b5898196e0', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'CREATE', 'invoices', 'acf7479f-fc84-4c23-a07c-625d8e2ceaf8', NULL, NULL, NULL, NULL, '2026-05-13 17:55:24.938'),
('846f33d5-9da3-4a40-b6af-9cefc253c7cd', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGIN', 'auth', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-14 03:16:44.523'),
('8ac65c2e-9d2f-464a-9cd1-98457e9136e7', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#1E40AF\",\"sidebar_color\":\"#0F172A\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-13 19:45:48.459'),
('8b14aa9b-433b-42e2-b4d5-c161bb4a1a05', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:52:54.252'),
('8b448362-98ba-42af-8399-8b3c05b94f5d', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:51:50.686'),
('8d4d4a6d-7f81-4502-b546-d222bd482c47', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 12:49:06.170'),
('93d66954-5c36-45d0-bfce-6bde015e031b', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGIN', 'auth', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-14 02:45:22.209'),
('94f70c0e-ac32-40c0-860b-49ea670c1ef9', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 12:48:21.935'),
('974b2738-1e51-4c92-856d-f0532ec5854f', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGIN', 'auth', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-13 12:45:09.584'),
('992b749d-f5a2-4c35-8dd3-f70bf71c13fe', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:52:44.210'),
('994eaee0-6a0e-4592-b6b5-9a631a6081d8', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#1E40AF\",\"sidebar_color\":\"#0F172A\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-13 19:52:49.822'),
('9b341c06-ea00-45b3-8987-6d9cd3321dc4', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#B91C1C\",\"sidebar_color\":\"#1C0A0A\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-13 19:52:17.768'),
('9ee19d2a-a2b9-4395-91e6-c6e1d91eee4e', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 19:35:27.677'),
('a61d46a8-d1b2-479a-bba1-a92f9e11d744', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 13:35:19.898'),
('a7b1432a-4243-452d-bd3b-f57d3046b7ef', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:52:54.514'),
('ace8ae49-2304-4e28-bd24-29d3327127a2', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'PASSWORD_CHANGE', 'auth', NULL, NULL, NULL, '::1', NULL, '2026-05-12 10:39:03.081'),
('adedd11e-81f5-4b0b-a218-cf1b8936398e', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#15803D\",\"sidebar_color\":\"#14532D\",\"font_family\":\"Roboto\"}', NULL, NULL, '2026-05-17 10:35:35.733'),
('ae6f32c4-96af-41bc-97a0-a5e214609368', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#1E40AF\",\"sidebar_color\":\"#0F172A\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-13 19:52:38.053'),
('b48bb773-297a-47b5-b355-9764dee348e0', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#6D28D9\",\"sidebar_color\":\"#1E1B4B\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-13 19:45:45.615'),
('bfab65ef-1136-4def-a9c9-255493d89a81', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#1E40AF\",\"sidebar_color\":\"#0F172A\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-18 15:44:16.917'),
('c95de035-85f5-4be0-b695-d0fc3960d8d9', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#15803D\",\"sidebar_color\":\"#14532D\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-14 02:45:35.955'),
('ca31107c-e106-49ab-974d-97d43802a41c', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#15803D\",\"sidebar_color\":\"#14532D\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-13 19:52:12.543'),
('cd02a9c7-781e-4edd-b6b6-f568fa1e208e', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'DELETE', 'cv', '0a29c043-16e6-4629-aeed-33096902f2d6', NULL, NULL, NULL, NULL, '2026-05-18 15:44:24.925'),
('d4514df5-6bec-4d62-a072-3be07b2a7fc3', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:55:26.302'),
('dd580bdf-5c77-4076-b35f-f673887c3f19', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#1E40AF\",\"sidebar_color\":\"#0F172A\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-14 02:45:39.707'),
('df828a98-bb61-42a8-96d3-56084cdf018c', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{\"app_name\":\"HR Recruitment System\",\"primary_color\":\"#15803D\",\"sidebar_color\":\"#14532D\",\"font_family\":\"Inter\"}', NULL, NULL, '2026-05-17 10:35:33.560'),
('e03e77c6-1742-4032-a50c-74e2f07e7edc', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:55:18.646'),
('e0b8ef58-82b6-4697-8a0e-aec3281b5bbe', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'jobs', 'a7833a9e-bf25-43b7-944a-12069d49e95f', NULL, NULL, NULL, NULL, '2026-05-15 05:06:12.261'),
('e2cf530f-e621-4b9d-bade-9d34b9330764', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'CREATE', 'employees', '79330274-e10b-47d0-a724-1afe79cf9bbf', NULL, NULL, NULL, NULL, '2026-05-14 05:49:09.879'),
('e6842453-f013-4ef0-8563-a27ff4fe9de7', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'CREATE', 'jobs', 'a7833a9e-bf25-43b7-944a-12069d49e95f', NULL, NULL, NULL, NULL, '2026-05-12 10:41:25.297'),
('e71b6e32-0454-46d4-b327-5bf30106e602', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-14 02:29:35.178'),
('e74690e0-da72-47d5-9b98-53aaf0902478', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 13:36:41.183'),
('e80aa9fe-ec99-4f8f-a6aa-d85f846a681e', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 13:35:18.483'),
('e960a3d0-f583-4cb8-8c44-353e82517812', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'CREATE', 'clients', '62728473-92d7-43e2-9c5f-d3e19a9fb329', NULL, NULL, NULL, NULL, '2026-05-12 10:40:39.158'),
('f0b24924-675f-4aab-912b-35e218390e91', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 19:01:15.938'),
('f198352d-5eb6-4906-a5c9-6bde45f0db8d', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 18:52:54.692'),
('f644a1a1-5d8f-45a0-95cd-4f3a489db20a', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'LOGIN', 'auth', NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-05-13 13:35:11.422'),
('f70ab28f-c58a-418e-af97-c0d91dd253fe', '00647314-69c7-40ec-9817-bf0633ed3a9c', 'superadmin@hrapp.com', 'UPDATE', 'settings', NULL, NULL, '{}', NULL, NULL, '2026-05-13 19:35:27.470');

-- --------------------------------------------------------

--
-- Table structure for table `candidates`
--

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
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `country` varchar(191) DEFAULT NULL,
  `experienceDetails` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`experienceDetails`)),
  `state` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `candidates`
--

INSERT INTO `candidates` (`id`, `firstName`, `lastName`, `email`, `phone`, `alternatePhone`, `gender`, `dateOfBirth`, `profilePhoto`, `currentLocation`, `preferredLocations`, `religion`, `caste`, `languages`, `nationality`, `currentDesignation`, `currentCompany`, `totalExperience`, `currentCTC`, `expectedCTC`, `noticePeriod`, `currentlyEmployed`, `highestQualification`, `specialization`, `university`, `passingYear`, `educationDetails`, `skills`, `certifications`, `technologyStack`, `keywords`, `status`, `isPriority`, `source`, `notes`, `cvFile`, `cvOriginalName`, `customFields`, `searchVector`, `createdAt`, `updatedAt`, `createdBy`, `city`, `country`, `experienceDetails`, `state`) VALUES
('968e0d2e-6161-4629-bb98-823f903cb56a', 'Rohit', 'Sawant', 'sawantrohit2015@gmail.com', '+917303737236', NULL, 'MALE', NULL, NULL, NULL, '[]', NULL, NULL, '[]', 'Indian', NULL, 'DSRP HR Services', NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, 'null', '[]', '[]', '[]', NULL, 'NEW', 0, NULL, NULL, NULL, NULL, '{\"description\":\"\",\"total_experience\":\"\",\"notice_period\":\"\",\"expected_ctc\":\"1200000\",\"current_ctc\":\"\",\"current_location\":\"\",\"test_column\":\"option 1\",\"status_date\":\"2026-05-12\"}', 'rohit sawant sawantrohit2015@gmail.com +917303737236 dsrp hr services [ ] [ ] [ ] [ ]', '2026-05-13 12:57:22.457', '2026-05-13 20:14:07.795', '00647314-69c7-40ec-9817-bf0633ed3a9c', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `candidate_work_history`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

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
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdBy` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `companyName`, `contactPerson`, `email`, `phone`, `alternatePhone`, `address`, `city`, `state`, `country`, `pincode`, `gstNumber`, `panNumber`, `industry`, `website`, `contractStartDate`, `contractEndDate`, `isActive`, `notes`, `customFields`, `createdAt`, `updatedAt`, `createdBy`) VALUES
('62728473-92d7-43e2-9c5f-d3e19a9fb329', 'DSRP HR Services', 'Rohit Dilip Sawant', 'sawantrohit2015@gmail.com', '07303737236', '', '2/501, Balaji Prangan, Sector - 4, Kharghar, Navi Mumbai - 410210 , Maharashtra , India', 'Panvel', 'Maharashtra', 'India', '410210', '', '', '', '', NULL, NULL, 1, '', NULL, '2026-05-12 10:40:39.155', '2026-05-12 10:40:48.398', '00647314-69c7-40ec-9817-bf0633ed3a9c');

-- --------------------------------------------------------

--
-- Table structure for table `column_definitions`
--

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

--
-- Dumping data for table `column_definitions`
--

INSERT INTO `column_definitions` (`id`, `module`, `name`, `label`, `dataType`, `isVisible`, `isRequired`, `isSortable`, `isFilterable`, `isEditable`, `order`, `width`, `config`, `createdBy`, `createdAt`, `updatedAt`) VALUES
('02d500f1-0c3d-4fe4-94b9-74282faed99b', 'cv', 'status', 'Status', 'STATUS', 1, 0, 1, 1, 1, 1, NULL, NULL, NULL, '2026-05-12 10:21:00.268', '2026-05-12 10:21:00.268'),
('111681c3-3783-429b-9f13-0089e0b0079e', 'jobs', 'priority', 'Priority', 'PRIORITY', 1, 0, 1, 1, 1, 2, NULL, NULL, NULL, '2026-05-12 10:21:00.273', '2026-05-12 10:21:00.273'),
('495f0ec5-a726-4ca7-bd62-664bdf2b3b68', 'cv', 'priority', 'Priority', 'PRIORITY', 1, 0, 1, 1, 1, 2, NULL, NULL, NULL, '2026-05-12 10:21:00.269', '2026-05-12 10:21:00.269'),
('7d90717f-081f-4d51-a571-29e9783fe948', 'jobs', 'closing_date', 'Closing Date', 'DATE', 1, 0, 1, 1, 1, 6, NULL, NULL, NULL, '2026-05-12 10:21:00.275', '2026-05-12 10:21:00.275'),
('810d260f-95a5-43d3-8a13-932af0f82888', 'cv', 'total_experience', 'Experience', 'NUMBER', 1, 0, 1, 1, 1, 7, NULL, NULL, NULL, '2026-05-12 10:21:00.272', '2026-05-12 10:21:00.272'),
('87b8b98d-f346-4698-83df-be51a9f92ce5', 'jobs', 'work_location', 'Location', 'LOCATION', 1, 0, 1, 1, 1, 3, NULL, NULL, NULL, '2026-05-12 10:21:00.274', '2026-05-12 10:21:00.274'),
('8f8d9195-ae82-4a49-9ec0-5241c3dead66', 'cv', 'new_1', 'New 1', 'LABEL', 1, 0, 1, 1, 1, 10, NULL, '{\"options\":[\"Option 2\"]}', '00647314-69c7-40ec-9817-bf0633ed3a9c', '2026-05-14 04:32:23.599', '2026-05-14 04:32:23.599'),
('c06add2d-868b-4549-8c82-3e185c9f4d2d', 'cv', 'expected_ctc', 'Expected CTC', 'NUMBER', 1, 0, 1, 1, 1, 0, NULL, NULL, NULL, '2026-05-12 10:21:00.271', '2026-05-13 17:58:22.535'),
('cb1f4b46-3470-477e-a32e-7ef68ac984ef', 'cv', 'current_location', 'Location', 'LOCATION', 1, 0, 1, 1, 1, 3, NULL, NULL, NULL, '2026-05-12 10:21:00.270', '2026-05-12 10:21:00.270'),
('d075464e-5a77-4075-9c86-fe563c766db5', 'cv', 'new', 'new', 'DROPDOWN', 1, 0, 1, 1, 1, 9, NULL, '{\"options\":[\"Option 1\"]}', '00647314-69c7-40ec-9817-bf0633ed3a9c', '2026-05-14 04:32:09.830', '2026-05-14 04:32:09.830'),
('d63e490e-47ef-4fbb-86b1-7e895c982fca', 'jobs', 'status', 'Status', 'STATUS', 1, 0, 1, 1, 1, 1, NULL, NULL, NULL, '2026-05-12 10:21:00.273', '2026-05-12 10:21:00.273'),
('e68f20b8-24c9-4c68-a198-f170feb13599', 'cv', 'current_ctc', 'Current CTC', 'NUMBER', 1, 0, 1, 1, 1, 4, NULL, NULL, NULL, '2026-05-12 10:21:00.271', '2026-05-12 10:21:00.271');

-- --------------------------------------------------------

--
-- Table structure for table `interview_rounds`
--

CREATE TABLE `interview_rounds` (
  `id` varchar(191) NOT NULL,
  `jobId` varchar(191) NOT NULL,
  `roundNumber` int(11) NOT NULL,
  `roundName` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `customColumns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customColumns`)),
  `processGroup` varchar(191) NOT NULL DEFAULT 'main'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `interview_rounds`
--

INSERT INTO `interview_rounds` (`id`, `jobId`, `roundNumber`, `roundName`, `description`, `createdAt`, `updatedAt`, `customColumns`, `processGroup`) VALUES
('5f0b7001-732a-4ed0-a0f9-4aa69853cb63', 'a7833a9e-bf25-43b7-944a-12069d49e95f', 1, 'Round 1', NULL, '2026-05-15 05:04:20.501', '2026-05-15 05:04:20.501', NULL, 'replacement_2'),
('a95a29b6-0c33-4bc1-85e1-aab0d78e2cee', 'a7833a9e-bf25-43b7-944a-12069d49e95f', 2, 'Round 2', NULL, '2026-05-14 05:49:45.613', '2026-05-14 05:49:45.613', NULL, 'main'),
('bf5adc1d-76a0-4813-9f00-a2139f2a6f2f', 'a7833a9e-bf25-43b7-944a-12069d49e95f', 1, 'Round 1', NULL, '2026-05-14 05:49:24.185', '2026-05-14 05:50:25.281', NULL, 'main');

-- --------------------------------------------------------

--
-- Table structure for table `interview_slots`
--

CREATE TABLE `interview_slots` (
  `id` varchar(191) NOT NULL,
  `roundId` varchar(191) NOT NULL,
  `candidateId` varchar(191) NOT NULL,
  `scheduledDate` datetime(3) DEFAULT NULL,
  `scheduledTime` varchar(191) DEFAULT NULL,
  `status` enum('SCHEDULED','COMPLETED','CANCELLED','RESCHEDULED') NOT NULL DEFAULT 'SCHEDULED',
  `result` enum('PENDING','SELECTED','REJECTED','ON_HOLD') NOT NULL DEFAULT 'PENDING',
  `feedback` text DEFAULT NULL,
  `interviewerIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`interviewerIds`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`)),
  `remark` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `interview_slots`
--

INSERT INTO `interview_slots` (`id`, `roundId`, `candidateId`, `scheduledDate`, `scheduledTime`, `status`, `result`, `feedback`, `interviewerIds`, `createdAt`, `updatedAt`, `customFields`, `remark`) VALUES
('22720d47-6054-4067-8287-c4e59f277e24', '5f0b7001-732a-4ed0-a0f9-4aa69853cb63', '968e0d2e-6161-4629-bb98-823f903cb56a', NULL, NULL, 'SCHEDULED', 'SELECTED', NULL, NULL, '2026-05-15 05:04:26.031', '2026-05-15 05:04:53.468', '{\"customStatus\":null}', NULL),
('fc4fe60e-ceb8-4440-ba8f-08443933d559', 'bf5adc1d-76a0-4813-9f00-a2139f2a6f2f', '968e0d2e-6161-4629-bb98-823f903cb56a', NULL, NULL, 'SCHEDULED', 'SELECTED', NULL, NULL, '2026-05-14 05:49:27.906', '2026-05-14 05:50:13.409', '{\"customStatus\":null}', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

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
  `createdBy` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `invoiceNumber`, `clientId`, `invoiceDate`, `dueDate`, `serviceDescription`, `lineItems`, `subtotal`, `gstType`, `cgstRate`, `sgstRate`, `igstRate`, `cgstAmount`, `sgstAmount`, `igstAmount`, `totalTax`, `totalAmount`, `status`, `paidAmount`, `paidAt`, `paymentMethod`, `paymentReference`, `notes`, `pdfPath`, `createdBy`, `createdAt`, `updatedAt`) VALUES
('35bbbb64-2d85-45a3-9453-1cb0c0c7eeb6', 'INV-2026-0002', '62728473-92d7-43e2-9c5f-d3e19a9fb329', '2026-05-13 18:59:43.899', '2026-05-20 00:00:00.000', 'Recruitment Services', '[{\"description\":\"Recruitment Services\",\"quantity\":1,\"rate\":74457}]', 74457.00, 'CGST_SGST', 9.00, 9.00, NULL, 6701.13, 6701.13, NULL, 13402.26, 87859.26, 'DRAFT', NULL, NULL, NULL, NULL, NULL, 'uploads/invoices/INV-2026-0002.pdf', '00647314-69c7-40ec-9817-bf0633ed3a9c', '2026-05-13 18:59:43.899', '2026-05-13 18:59:43.899');

-- --------------------------------------------------------

--
-- Table structure for table `job_applications`
--

CREATE TABLE `job_applications` (
  `id` varchar(191) NOT NULL,
  `jobId` varchar(191) NOT NULL,
  `candidateId` varchar(191) NOT NULL,
  `status` enum('NEW','SCREENING','SHORTLISTED','INTERVIEWING','OFFERED','HIRED','REJECTED','ON_HOLD','ACTIVE','INACTIVE','HOLD','BLACKLIST') NOT NULL DEFAULT 'NEW',
  `appliedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `notes` text DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_openings`
--

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
  `createdBy` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `job_openings`
--

INSERT INTO `job_openings` (`id`, `jobTitle`, `clientId`, `description`, `requiredSkills`, `preferredSkills`, `experienceMin`, `experienceMax`, `salaryMin`, `salaryMax`, `jobType`, `workLocation`, `workMode`, `numberOfOpenings`, `status`, `priority`, `closingDate`, `jdDocument`, `tags`, `customFields`, `createdBy`, `createdAt`, `updatedAt`) VALUES
('a7833a9e-bf25-43b7-944a-12069d49e95f', 'Senior Software Developer', '62728473-92d7-43e2-9c5f-d3e19a9fb329', 'Great job check now', '[]', '[]', 2, 3, NULL, NULL, 'FULL_TIME', 'Remote', 'On-site', 1, 'CLOSED', 'MEDIUM', NULL, NULL, '[]', '{\"assigned_employees\":\"\",\"candidates\":\"\",\"shortlisted_candidates\":{\"id\":\"968e0d2e-6161-4629-bb98-823f903cb56a\",\"name\":\"Rohit Sawant\"},\"shortlisted_condidates\":{\"id\":\"0a29c043-16e6-4629-aeed-33096902f2d6\",\"name\":\"Mrunal gaikwad\"},\"closedGroups\":{\"main\":{\"candidateIds\":[\"0a29c043-16e6-4629-aeed-33096902f2d6\"],\"closedAt\":\"2026-05-14T11:06:42.326Z\"},\"replacement_1\":{\"candidateIds\":[],\"closedAt\":\"2026-05-14T11:17:07.089Z\"},\"replacement_2\":{\"candidateIds\":[\"0a29c043-16e6-4629-aeed-33096902f2d6\",\"968e0d2e-6161-4629-bb98-823f903cb56a\"],\"closedAt\":\"2026-05-15T05:06:12.254Z\"}},\"replacements\":[{\"id\":\"replacement_1\",\"name\":\"Replacement\",\"status\":\"closed\",\"selectedCandidateIds\":[]},{\"id\":\"replacement_2\",\"name\":\"Replacement 2\",\"status\":\"closed\",\"selectedCandidateIds\":[\"0a29c043-16e6-4629-aeed-33096902f2d6\",\"968e0d2e-6161-4629-bb98-823f903cb56a\"]}],\"closedCandidateIds\":[\"0a29c043-16e6-4629-aeed-33096902f2d6\"],\"closedAt\":\"2026-05-14T11:06:42.326Z\"}', '00647314-69c7-40ec-9817-bf0633ed3a9c', '2026-05-12 10:41:25.292', '2026-05-15 05:06:12.255');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

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

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` varchar(191) NOT NULL,
  `module` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `module`, `action`, `description`, `createdAt`) VALUES
('0f14b342-9148-450b-a2d0-752291590af4', 'dashboard', 'view', NULL, '2026-05-12 10:21:00.012'),
('15080b11-be26-4a2b-936b-aa0e0c346900', 'cv', 'delete', NULL, '2026-05-12 10:21:00.024'),
('1ba5d133-f3c4-419f-ba9f-4b85bb3defa4', 'clients', 'create', NULL, '2026-05-12 10:21:00.021'),
('1ee301d7-5bd9-4e7c-9984-83fd1de5b6f0', 'jobs', 'view', NULL, '2026-05-12 10:21:00.026'),
('234c79cc-23b7-458f-a372-a5ab8ed098e6', 'clients', 'update', NULL, '2026-05-12 10:21:00.022'),
('2bc49652-b60a-4b4d-8c75-8add5d2bc961', 'invoices', 'view', NULL, '2026-05-12 10:21:00.028'),
('2dc6ccdb-2f4c-4432-a3f5-31bb877db0c7', 'cv', 'bulk_import', NULL, '2026-05-12 10:21:00.025'),
('330ae8f0-6060-443f-a923-81b9ddb65761', 'jobs', 'update', NULL, '2026-05-12 10:21:00.027'),
('3e82876d-0bb0-4109-b07d-b5991e8f2ed1', 'cv', 'view', NULL, '2026-05-12 10:21:00.023'),
('3ec405dc-293e-4fe6-a361-d31da4c88ec2', 'invoices', 'send_email', NULL, '2026-05-12 10:21:00.030'),
('49d5c40d-d9eb-40c2-9f0f-d8d8f393e7f9', 'columns', 'manage', NULL, '2026-05-12 10:21:00.033'),
('4a5ba054-823a-47f9-9bc6-b3f24f915a57', 'invoices', 'update', NULL, '2026-05-12 10:21:00.029'),
('4ca60d7f-78a5-436f-9bfd-2fc35d7bbacd', 'cv', 'download', NULL, '2026-05-12 10:21:00.026'),
('5b29a04a-b9a4-41a3-84ed-2ab5ca1006c7', 'employees', 'update', NULL, '2026-05-12 10:21:00.018'),
('5ba393b8-0f63-4988-a4a5-dfa53ea0f460', 'employees', 'create', NULL, '2026-05-12 10:21:00.016'),
('5d93bc52-15e9-445c-ac85-ddecbeb968bd', 'cv', 'update', NULL, '2026-05-12 10:21:00.024'),
('604eac29-5db0-4f8b-be48-3ae41f2f3522', 'invoices', 'create', NULL, '2026-05-12 10:21:00.029'),
('76bab36c-3e57-47e7-8e3a-c7ad71c331fb', 'settings', 'theme', NULL, '2026-05-12 10:21:00.031'),
('7fcafa09-7fbe-45a3-894b-bc7a82ceb4be', 'settings', 'fonts', NULL, '2026-05-12 10:21:00.032'),
('8475223f-5438-42f7-b95b-b6b528e6439d', 'settings', 'roles', NULL, '2026-05-12 10:21:00.031'),
('89c5caad-ad23-4045-a049-6b435fb08619', 'clients', 'view', NULL, '2026-05-12 10:21:00.020'),
('8dde16a5-df43-409a-ad1f-655550099bfc', 'jobs', 'delete', NULL, '2026-05-12 10:21:00.028'),
('8f791532-7c29-464a-a83b-980a10af385f', 'audit', 'view', NULL, '2026-05-12 10:21:00.032'),
('9a8ea18a-3f40-4727-8894-29fba34fbdfc', 'invoices', 'delete', NULL, '2026-05-12 10:21:00.030'),
('9e7efe96-cccc-4628-b96a-ce2bc6b2b526', 'clients', 'delete', NULL, '2026-05-12 10:21:00.022'),
('b781f9de-42cb-414d-988c-3d309d230825', 'dropdown', 'manage_options', NULL, '2026-05-13 18:21:19.484'),
('c19a9791-c386-47d6-a97c-f32645605d36', 'employees', 'view', NULL, '2026-05-12 10:21:00.015'),
('d6404d3b-a042-42ff-8ab1-8a092a96a29c', 'cv', 'create', NULL, '2026-05-12 10:21:00.023'),
('e1fb25c2-d26c-4d77-a3d7-45a612967d07', 'employees', 'delete', NULL, '2026-05-12 10:21:00.018'),
('e4c44e4b-34ba-42e4-927a-00fca2aef3a6', 'employees', 'toggle_status', NULL, '2026-05-12 10:21:00.019'),
('eea493f4-5c05-406a-8f80-8d4744f6f14d', 'settings', 'view', NULL, '2026-05-12 10:21:00.030'),
('f4060517-ea5e-457c-9098-733969f17efd', 'jobs', 'create', NULL, '2026-05-12 10:21:00.027');

-- --------------------------------------------------------

--
-- Table structure for table `post_selection_records`
--

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

--
-- Dumping data for table `post_selection_records`
--

INSERT INTO `post_selection_records` (`id`, `jobId`, `candidateId`, `processGroup`, `status`, `ctcOffered`, `offerLetters`, `customFields`, `createdAt`, `updatedAt`) VALUES
('ffbb8dd3-69c2-4b75-84f6-d04752395acd', 'a7833a9e-bf25-43b7-944a-12069d49e95f', '968e0d2e-6161-4629-bb98-823f903cb56a', 'replacement_2', 'PENDING', NULL, NULL, NULL, '2026-05-15 05:06:12.258', '2026-05-15 05:06:12.258');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isSystem` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `isSystem`, `isActive`, `createdAt`, `updatedAt`) VALUES
('3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', 'recruiter', 'Recruiter with limited access', 1, 1, '2026-05-12 10:21:00.034', '2026-05-12 10:21:00.034'),
('6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'super_admin', 'Super Administrator with full access', 1, 1, '2026-05-12 10:21:00.033', '2026-05-12 10:21:00.033'),
('70fc46a5-6852-4925-a3d7-d8d01ed60306', 'admin', 'Administrator with operational access', 1, 1, '2026-05-12 10:21:00.034', '2026-05-12 10:21:00.034');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `permissionId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`) VALUES
('09c8f0dd-c459-4e8c-b898-c4a0e359ac97', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '2bc49652-b60a-4b4d-8c75-8add5d2bc961', '2026-05-12 10:21:00.051'),
('0a3481d7-ba3c-4f80-8a6f-7b446c800bcd', '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', '5d93bc52-15e9-445c-ac85-ddecbeb968bd', '2026-05-12 10:21:00.054'),
('0d86603b-89a4-4fe4-b659-d8173823a786', '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'd6404d3b-a042-42ff-8ab1-8a092a96a29c', '2026-05-12 10:21:00.050'),
('100f2e70-0ad3-4435-aa36-3e9f3d33282f', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '5b29a04a-b9a4-41a3-84ed-2ab5ca1006c7', '2026-05-12 10:21:00.037'),
('11d2da1d-2cff-4da6-991f-81b96a50d90a', '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', '1ee301d7-5bd9-4e7c-9984-83fd1de5b6f0', '2026-05-12 10:21:00.054'),
('11d3afd1-0eb5-451a-af3f-d9fc8645d5c1', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '8f791532-7c29-464a-a83b-980a10af385f', '2026-05-12 10:21:00.047'),
('1391f99f-86a7-4977-9fca-f917a922c0e1', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '0f14b342-9148-450b-a2d0-752291590af4', '2026-05-12 10:21:00.035'),
('1698b6b0-0985-4bc4-9f9e-19381693c409', '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', '89c5caad-ad23-4045-a049-6b435fb08619', '2026-05-12 10:21:00.054'),
('19a4c8f4-1d9d-404b-8bda-d8167905cf57', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '4a5ba054-823a-47f9-9bc6-b3f24f915a57', '2026-05-12 10:21:00.044'),
('205cba8c-b293-4085-94c8-b94d20a707ce', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '2dc6ccdb-2f4c-4432-a3f5-31bb877db0c7', '2026-05-12 10:21:00.041'),
('2854a836-08b0-402e-8761-3031305d7bac', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '604eac29-5db0-4f8b-be48-3ae41f2f3522', '2026-05-12 10:21:00.044'),
('2b85d948-d932-47e7-8597-547e067eef80', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '76bab36c-3e57-47e7-8e3a-c7ad71c331fb', '2026-05-12 10:21:00.046'),
('2fb9af52-306a-4209-9d26-1efccf16eab8', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '49d5c40d-d9eb-40c2-9f0f-d8d8f393e7f9', '2026-05-12 10:21:00.053'),
('2fc9d9e5-0440-4f50-91fe-847c1b0e81e5', '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'b781f9de-42cb-414d-988c-3d309d230825', '2026-05-13 18:21:19.506'),
('30e81b44-e30c-45fb-bcb4-63595fbfe0c2', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '3ec405dc-293e-4fe6-a361-d31da4c88ec2', '2026-05-12 10:21:00.052'),
('334b2743-b0f6-4caa-8b9e-9e653a5512f2', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '9e7efe96-cccc-4628-b96a-ce2bc6b2b526', '2026-05-12 10:21:00.039'),
('3b634b06-5900-4e87-8b39-b3ebcb9a2769', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '1ee301d7-5bd9-4e7c-9984-83fd1de5b6f0', '2026-05-12 10:21:00.051'),
('3ccd711f-13c3-4efd-992b-c6c7f074b346', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '3e82876d-0bb0-4109-b07d-b5991e8f2ed1', '2026-05-12 10:21:00.039'),
('3cce3adb-228a-47c0-a93b-0605b400e0a6', '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'eea493f4-5c05-406a-8f80-8d4744f6f14d', '2026-05-12 10:21:00.053'),
('3f0533e2-efc0-4307-a1b3-13f83e5d989a', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '49d5c40d-d9eb-40c2-9f0f-d8d8f393e7f9', '2026-05-12 10:21:00.047'),
('41902ae5-eaf1-4452-bc92-e42569aa6fa7', '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'f4060517-ea5e-457c-9098-733969f17efd', '2026-05-12 10:21:00.051'),
('47443e93-4740-477f-8da7-6d8d3382efeb', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '5ba393b8-0f63-4988-a4a5-dfa53ea0f460', '2026-05-12 10:21:00.048'),
('4add2f37-99ac-40a7-b422-82b6a48f78df', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '234c79cc-23b7-458f-a372-a5ab8ed098e6', '2026-05-12 10:21:00.039'),
('56acc91e-fbf9-4f00-92d9-a051d42f4f1b', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'd6404d3b-a042-42ff-8ab1-8a092a96a29c', '2026-05-12 10:21:00.040'),
('586dbea9-6b93-4329-afbb-faa4fe83e990', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '330ae8f0-6060-443f-a923-81b9ddb65761', '2026-05-12 10:21:00.051'),
('5d1ded2c-8ee7-4448-9ed6-17048953413b', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '4ca60d7f-78a5-436f-9bfd-2fc35d7bbacd', '2026-05-12 10:21:00.041'),
('5e6fbcf6-55a9-4651-a2c2-d558b6b87d3f', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '7fcafa09-7fbe-45a3-894b-bc7a82ceb4be', '2026-05-12 10:21:00.046'),
('60ff5f06-f629-4832-bc9a-fd69aa2c1e65', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '89c5caad-ad23-4045-a049-6b435fb08619', '2026-05-12 10:21:00.049'),
('64191b0f-8c93-4e99-bb78-55ef10a75c44', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '5b29a04a-b9a4-41a3-84ed-2ab5ca1006c7', '2026-05-12 10:21:00.048'),
('66c42c3e-f1e2-49ed-927b-c476f671e15f', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '2bc49652-b60a-4b4d-8c75-8add5d2bc961', '2026-05-12 10:21:00.043'),
('6711b451-d6e6-42a8-b4af-dbc36ade95cc', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'c19a9791-c386-47d6-a97c-f32645605d36', '2026-05-12 10:21:00.035'),
('82a48355-8c94-4103-bcba-9d93feaaa518', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '9a8ea18a-3f40-4727-8894-29fba34fbdfc', '2026-05-12 10:21:00.044'),
('8cc9165b-d380-465f-adb4-236c2df0972d', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'b781f9de-42cb-414d-988c-3d309d230825', '2026-05-13 18:21:19.498'),
('8e31d2a3-4cef-492b-8852-abd7ede5d902', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '8475223f-5438-42f7-b95b-b6b528e6439d', '2026-05-12 10:21:00.046'),
('9011e0c6-02ec-4624-a3df-dc94736effb7', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '5d93bc52-15e9-445c-ac85-ddecbeb968bd', '2026-05-12 10:21:00.050'),
('957efd87-5b0e-41ce-a435-7a45f6a8f9c5', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'e1fb25c2-d26c-4d77-a3d7-45a612967d07', '2026-05-12 10:21:00.037'),
('9dd56e24-79b2-45b5-9419-957399540ffa', '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', 'd6404d3b-a042-42ff-8ab1-8a092a96a29c', '2026-05-12 10:21:00.053'),
('a0ac967f-efe3-4bb5-a6e4-27a1b7b6e54f', '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', '0f14b342-9148-450b-a2d0-752291590af4', '2026-05-12 10:21:00.053'),
('a42b9e2d-63f8-426d-8a6c-9dd0a7a0c2f4', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '3e82876d-0bb0-4109-b07d-b5991e8f2ed1', '2026-05-12 10:21:00.049'),
('a5f34503-aa4c-451a-89ca-2ec60c2d19da', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '5ba393b8-0f63-4988-a4a5-dfa53ea0f460', '2026-05-12 10:21:00.036'),
('a7d1beb6-5853-4d75-b296-931c74cfdb55', '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'c19a9791-c386-47d6-a97c-f32645605d36', '2026-05-12 10:21:00.047'),
('a8a41df1-de1b-4762-af2c-071d89801f8a', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '8dde16a5-df43-409a-ad1f-655550099bfc', '2026-05-12 10:21:00.043'),
('a8b35207-5305-4a2a-a746-46c9a4c3cbe7', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '0f14b342-9148-450b-a2d0-752291590af4', '2026-05-12 10:21:00.047'),
('ae15f41b-7e58-4a25-91b5-e0cd8a4a1676', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '1ba5d133-f3c4-419f-ba9f-4b85bb3defa4', '2026-05-12 10:21:00.049'),
('b6aaaa49-3c01-4316-9eab-ef82210040b9', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '3ec405dc-293e-4fe6-a361-d31da4c88ec2', '2026-05-12 10:21:00.045'),
('b7d96fb4-d17d-43c1-adc2-076a4e2bb6b6', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '15080b11-be26-4a2b-936b-aa0e0c346900', '2026-05-12 10:21:00.041'),
('b8bc99ec-d7bd-4b4d-88da-50c992bf1ffe', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '330ae8f0-6060-443f-a923-81b9ddb65761', '2026-05-12 10:21:00.043'),
('b8c35d85-f914-42db-ac81-b42bf7ee6d4a', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'f4060517-ea5e-457c-9098-733969f17efd', '2026-05-12 10:21:00.042'),
('bb0b2b54-e24f-45ce-a74d-b488b72f3a52', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '604eac29-5db0-4f8b-be48-3ae41f2f3522', '2026-05-12 10:21:00.052'),
('c2e6e7e6-9233-49c8-b574-40c786bd8586', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '2dc6ccdb-2f4c-4432-a3f5-31bb877db0c7', '2026-05-12 10:21:00.050'),
('c5d1db86-7717-4c8c-80fc-edbed943ba0b', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '234c79cc-23b7-458f-a372-a5ab8ed098e6', '2026-05-12 10:21:00.049'),
('cc2ccb69-385c-4c36-8aa2-bbdb58b1a6f9', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '4a5ba054-823a-47f9-9bc6-b3f24f915a57', '2026-05-12 10:21:00.052'),
('d6d1557c-b0c6-490b-818e-b9f2878b6660', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '1ee301d7-5bd9-4e7c-9984-83fd1de5b6f0', '2026-05-12 10:21:00.042'),
('d979accb-90b9-463b-b8ea-78b54c631053', '70fc46a5-6852-4925-a3d7-d8d01ed60306', 'e4c44e4b-34ba-42e4-927a-00fca2aef3a6', '2026-05-12 10:21:00.048'),
('ebe6815a-5449-4527-bec3-c99b149f1a8e', '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', '3e82876d-0bb0-4109-b07d-b5991e8f2ed1', '2026-05-12 10:21:00.053'),
('ed773626-d753-4d1a-9ea9-fcfb9d5744eb', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'eea493f4-5c05-406a-8f80-8d4744f6f14d', '2026-05-12 10:21:00.045'),
('ee9459b5-22d8-476e-b45e-13789d50e7bf', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '5d93bc52-15e9-445c-ac85-ddecbeb968bd', '2026-05-12 10:21:00.040'),
('f0004558-f1a4-4f30-bb02-0a7b49c9f052', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', 'e4c44e4b-34ba-42e4-927a-00fca2aef3a6', '2026-05-12 10:21:00.037'),
('f29a7cf3-b1b6-4ff5-a4e7-37dfd769bbaa', '70fc46a5-6852-4925-a3d7-d8d01ed60306', '4ca60d7f-78a5-436f-9bfd-2fc35d7bbacd', '2026-05-12 10:21:00.050'),
('f40f744f-d050-4bab-a439-309f55c9afb9', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '89c5caad-ad23-4045-a049-6b435fb08619', '2026-05-12 10:21:00.038'),
('f51e36f9-7615-41f6-8dc7-59057b71d224', '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', '1ba5d133-f3c4-419f-ba9f-4b85bb3defa4', '2026-05-12 10:21:00.038');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

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
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `customFields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customFields`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `employeeId`, `email`, `username`, `passwordHash`, `firstName`, `lastName`, `phone`, `profilePhoto`, `roleId`, `department`, `designation`, `joiningDate`, `salary`, `address`, `city`, `state`, `country`, `status`, `isSuperAdmin`, `twoFactorEnabled`, `twoFactorSecret`, `lastLoginAt`, `lastLoginIp`, `loginAttempts`, `lockedUntil`, `passwordResetToken`, `passwordResetExpiresAt`, `refreshToken`, `notificationPrefs`, `createdAt`, `updatedAt`, `createdBy`, `customFields`) VALUES
('00647314-69c7-40ec-9817-bf0633ed3a9c', 'EMP-0001', 'superadmin@hrapp.com', 'superadmin', '$2a$12$Q5063dhctxjjkidc3mD/s.rV06cbRTL5biapjRhrVYqjJ6fOZEoW6', 'Super', 'Admin', NULL, NULL, '6bef6bbf-d8dc-4dd7-b1da-f7f705630579', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'India', 'ACTIVE', 1, 0, NULL, '2026-05-14 03:16:44.518', '::1', 0, NULL, NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMDY0NzMxNC02OWM3LTQwZWMtOTgxNy1iZjA2MzNlZDNhOWMiLCJlbWFpbCI6InN1cGVyYWRtaW5AaHJhcHAuY29tIiwicm9sZUlkIjoiNmJlZjZiYmYtZDhkYy00ZGQ3LWIxZGEtZjdmNzA1NjMwNTc5Iiwicm9sZU5hbWUiOiJzdXBlcl9hZG1pbiIsImlzU3VwZXJBZG1pbiI6dHJ1ZSwiaWF0IjoxNzc5MTI1NTY5LCJleHAiOjE3Nzk3MzAzNjl9.Lrs7JhngneNgrHmhx_Peik2aO9V3J8dKu4u9mhs0Ezc', NULL, '2026-05-12 10:21:00.257', '2026-05-18 17:32:49.964', NULL, NULL),
('79330274-e10b-47d0-a724-1afe79cf9bbf', 'EMP-0002', 'testingPooja@yopmail.com', 'Pooja.Parab', '$2a$12$CI94GZArFtWVVGN4uIKzvOvmbovs3//aQa9M2DiCrkIb/d/YNsI7W', 'Pooja', 'Parab', '+919886875575', NULL, '3cd5cf44-d44b-4e60-a04b-e3c4f75ea46b', NULL, NULL, '2026-12-01 00:00:00.000', NULL, '202, B-Wing, Tharwani Heritage, Sector-7, kharghar, Navi-Mumbai, 410210', 'Mumbai', 'Maharashtra', 'India', 'ACTIVE', 0, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-14 05:49:08.131', '2026-05-14 05:49:08.131', '00647314-69c7-40ec-9817-bf0633ed3a9c', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `_AssignedToUser`
--

CREATE TABLE `_AssignedToUser` (
  `A` varchar(191) NOT NULL,
  `B` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_AssignedToUser`
--

INSERT INTO `_AssignedToUser` (`A`, `B`) VALUES
('a7833a9e-bf25-43b7-944a-12069d49e95f', '79330274-e10b-47d0-a724-1afe79cf9bbf');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `app_settings_key_key` (`key`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_userId_idx` (`userId`),
  ADD KEY `audit_logs_module_idx` (`module`),
  ADD KEY `audit_logs_createdAt_idx` (`createdAt`);

--
-- Indexes for table `candidates`
--
ALTER TABLE `candidates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidates_status_idx` (`status`),
  ADD KEY `candidates_isPriority_idx` (`isPriority`);
ALTER TABLE `candidates` ADD FULLTEXT KEY `candidates_firstName_lastName_idx` (`firstName`,`lastName`);

--
-- Indexes for table `candidate_work_history`
--
ALTER TABLE `candidate_work_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `candidate_work_history_candidateId_idx` (`candidateId`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `clients_isActive_idx` (`isActive`);

--
-- Indexes for table `column_definitions`
--
ALTER TABLE `column_definitions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `column_definitions_module_name_key` (`module`,`name`);

--
-- Indexes for table `interview_rounds`
--
ALTER TABLE `interview_rounds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `interview_rounds_jobId_roundNumber_processGroup_key` (`jobId`,`roundNumber`,`processGroup`);

--
-- Indexes for table `interview_slots`
--
ALTER TABLE `interview_slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `interview_slots_roundId_fkey` (`roundId`),
  ADD KEY `interview_slots_candidateId_fkey` (`candidateId`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoices_invoiceNumber_key` (`invoiceNumber`),
  ADD KEY `invoices_status_idx` (`status`),
  ADD KEY `invoices_clientId_idx` (`clientId`),
  ADD KEY `invoices_createdBy_fkey` (`createdBy`);

--
-- Indexes for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `job_applications_jobId_candidateId_key` (`jobId`,`candidateId`),
  ADD KEY `job_applications_candidateId_fkey` (`candidateId`);

--
-- Indexes for table `job_openings`
--
ALTER TABLE `job_openings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `job_openings_status_idx` (`status`),
  ADD KEY `job_openings_priority_idx` (`priority`),
  ADD KEY `job_openings_clientId_idx` (`clientId`),
  ADD KEY `job_openings_createdBy_fkey` (`createdBy`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_userId_isRead_idx` (`userId`,`isRead`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_module_action_key` (`module`,`action`);

--
-- Indexes for table `post_selection_records`
--
ALTER TABLE `post_selection_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `post_selection_records_jobId_candidateId_processGroup_key` (`jobId`,`candidateId`,`processGroup`),
  ADD KEY `post_selection_records_candidateId_fkey` (`candidateId`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_key` (`name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_roleId_permissionId_key` (`roleId`,`permissionId`),
  ADD KEY `role_permissions_permissionId_fkey` (`permissionId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`),
  ADD UNIQUE KEY `users_username_key` (`username`),
  ADD UNIQUE KEY `users_employeeId_key` (`employeeId`),
  ADD KEY `users_email_idx` (`email`),
  ADD KEY `users_status_idx` (`status`),
  ADD KEY `users_roleId_fkey` (`roleId`);

--
-- Indexes for table `_AssignedToUser`
--
ALTER TABLE `_AssignedToUser`
  ADD UNIQUE KEY `_AssignedToUser_AB_unique` (`A`,`B`),
  ADD KEY `_AssignedToUser_B_index` (`B`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `interview_rounds`
--
ALTER TABLE `interview_rounds`
  ADD CONSTRAINT `interview_rounds_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_openings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `interview_slots`
--
ALTER TABLE `interview_slots`
  ADD CONSTRAINT `interview_slots_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `interview_slots_roundId_fkey` FOREIGN KEY (`roundId`) REFERENCES `interview_rounds` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `invoices_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD CONSTRAINT `job_applications_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `job_applications_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_openings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `job_openings`
--
ALTER TABLE `job_openings`
  ADD CONSTRAINT `job_openings_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `job_openings_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `post_selection_records`
--
ALTER TABLE `post_selection_records`
  ADD CONSTRAINT `post_selection_records_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `candidates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `post_selection_records_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `job_openings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `_AssignedToUser`
--
ALTER TABLE `_AssignedToUser`
  ADD CONSTRAINT `_AssignedToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `job_openings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `_AssignedToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
