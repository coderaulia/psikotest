-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Mar 31, 2026 at 09:10 AM
-- Server version: 11.8.6-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u425041055_psikotest`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','psychologist_reviewer') NOT NULL DEFAULT 'admin',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `last_login_at` datetime DEFAULT NULL,
  `session_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `full_name`, `email`, `password_hash`, `role`, `status`, `last_login_at`, `session_version`, `created_at`, `updated_at`) VALUES
(1, 'System Administrator', 'care@vanaila.com', 'scrypt$c45595c06023b0770be99e0f8b8529c5$29dda238fe8e44a9c20592c02ea61cb6b511aa1a1d0f1069e6b01fbdc875cc81772bfcd96b2473efcf8f046b5fc230873d29541d926f6fdda859f4a23871a8f5', 'super_admin', 'active', '2026-03-30 11:28:18', 2, '2026-03-11 12:43:20', '2026-03-30 11:28:18'),
(2, 'System Administrator', 'admin@psikotest.local', 'hostinger-demo-password-not-used', 'super_admin', 'active', NULL, 1, '2026-03-28 14:54:11', '2026-03-28 14:54:11');

-- --------------------------------------------------------

--
-- Table structure for table `answers`
--

CREATE TABLE `answers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `submission_id` bigint(20) UNSIGNED NOT NULL,
  `question_id` bigint(20) UNSIGNED NOT NULL,
  `answer_role` enum('single','most','least','scale') NOT NULL DEFAULT 'single',
  `selected_option_id` bigint(20) UNSIGNED DEFAULT NULL,
  `value_number` decimal(10,2) DEFAULT NULL,
  `value_text` varchar(255) DEFAULT NULL,
  `answer_payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`answer_payload_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `answers`
--

INSERT INTO `answers` (`id`, `submission_id`, `question_id`, `answer_role`, `selected_option_id`, `value_number`, `value_text`, `answer_payload_json`, `created_at`, `updated_at`) VALUES
(49, 1, 1, 'most', 4, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(50, 1, 1, 'least', 2, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(51, 1, 2, 'most', 8, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(52, 1, 2, 'least', 7, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(53, 1, 3, 'most', 11, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(54, 1, 3, 'least', 12, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(55, 1, 4, 'most', 14, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(56, 1, 4, 'least', 15, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(57, 1, 5, 'most', 19, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(58, 1, 5, 'least', 18, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(59, 1, 6, 'most', 22, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(60, 1, 6, 'least', 23, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(61, 1, 7, 'most', 26, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(62, 1, 7, 'least', 27, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(63, 1, 8, 'most', 29, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(64, 1, 8, 'least', 30, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(65, 1, 9, 'most', 34, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(66, 1, 9, 'least', 35, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(67, 1, 10, 'most', 40, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(68, 1, 10, 'least', 37, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(69, 1, 11, 'most', 44, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(70, 1, 11, 'least', 43, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(71, 1, 12, 'most', 47, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(72, 1, 12, 'least', 46, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(73, 1, 13, 'most', 51, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(74, 1, 13, 'least', 50, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(75, 1, 14, 'most', 55, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(76, 1, 14, 'least', 54, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(77, 1, 15, 'most', 59, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(78, 1, 15, 'least', 58, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(79, 1, 16, 'most', 63, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(80, 1, 16, 'least', 62, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(81, 1, 17, 'most', 68, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(82, 1, 17, 'least', 66, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(83, 1, 18, 'most', 70, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(84, 1, 18, 'least', 72, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(85, 1, 19, 'most', 73, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(86, 1, 19, 'least', 75, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(87, 1, 20, 'most', 78, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(88, 1, 20, 'least', 79, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(89, 1, 21, 'most', 81, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(90, 1, 21, 'least', 82, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(91, 1, 22, 'most', 85, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(92, 1, 22, 'least', 88, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(93, 1, 23, 'most', 92, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(94, 1, 23, 'least', 89, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(95, 1, 24, 'most', 95, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(96, 1, 24, 'least', 96, NULL, NULL, '{\"source\":\"api\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34');

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

CREATE TABLE `app_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`setting_value_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `actor_type` enum('admin','participant','system') NOT NULL DEFAULT 'system',
  `actor_admin_id` bigint(20) UNSIGNED DEFAULT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ACTION` varchar(100) NOT NULL,
  `metadata_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `actor_type`, `actor_admin_id`, `entity_type`, `entity_id`, `ACTION`, `metadata_json`, `created_at`) VALUES
(1, 'participant', NULL, 'submission', 2, 'submission.started', '{\"participantId\":2,\"testType\":\"disc\",\"token\":\"disc-batch-a\"}', '2026-03-17 03:01:04'),
(2, 'system', NULL, 'customer_assessment', 1, 'customer_assessment.created', '{\"customerAccountId\":1,\"sessionId\":6,\"testType\":\"disc\",\"purpose\":\"recruitment\",\"administrationMode\":\"remote_unsupervised\",\"resultVisibility\":\"participant_summary\",\"participantLimit\":25}', '2026-03-17 03:04:17'),
(3, 'system', NULL, 'customer_assessment', 1, 'customer_assessment.activated', '{\"customerAccountId\":1,\"sessionId\":6,\"participantLink\":\"https://psikotest.vanaila.com/t/disc-recruitment-selection-a3ec5f\",\"sessionStatus\":\"active\"}', '2026-03-17 03:04:41'),
(4, 'participant', NULL, 'submission', 3, 'submission.started', '{\"participantId\":2,\"testType\":\"disc\",\"token\":\"disc-recruitment-selection-a3ec5f\"}', '2026-03-17 03:04:59'),
(5, 'system', NULL, 'customer_assessment', 2, 'customer_assessment.created', '{\"customerAccountId\":1,\"sessionId\":7,\"testType\":\"iq\",\"purpose\":\"academic_evaluation\",\"administrationMode\":\"supervised\",\"resultVisibility\":\"participant_summary\",\"participantLimit\":25}', '2026-03-17 03:06:37'),
(6, 'system', NULL, 'customer_assessment', 2, 'customer_assessment.activated', '{\"customerAccountId\":1,\"sessionId\":7,\"participantLink\":\"https://psikotest.vanaila.com/t/iq-iq-test-8cf176\",\"sessionStatus\":\"active\"}', '2026-03-17 03:06:49'),
(7, 'participant', NULL, 'submission', 4, 'submission.started', '{\"participantId\":2,\"testType\":\"iq\",\"token\":\"iq-iq-test-8cf176\"}', '2026-03-17 03:06:58'),
(8, 'system', NULL, 'customer_workspace', 2, 'customer_workspace.settings_updated', '{\"customerAccountId\":2,\"organizationName\":\"Vanaila Demo Company\",\"defaultAssessmentPurpose\":\"recruitment\",\"defaultAdministrationMode\":\"remote_unsupervised\",\"defaultResultVisibility\":\"review_required\",\"defaultParticipantLimit\":25,\"defaultTimeLimitMinutes\":20}', '2026-03-28 14:55:48');

-- --------------------------------------------------------

--
-- Table structure for table `billing_checkout_sessions`
--

CREATE TABLE `billing_checkout_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_account_id` bigint(20) UNSIGNED NOT NULL,
  `workspace_subscription_id` bigint(20) UNSIGNED NOT NULL,
  `session_key` varchar(120) NOT NULL,
  `billing_provider` enum('dummy','manual','stripe') NOT NULL DEFAULT 'dummy',
  `plan_code` enum('starter','growth','research') NOT NULL,
  `billing_cycle` enum('monthly','annual') NOT NULL,
  `STATUS` enum('open','completed','expired','failed') NOT NULL DEFAULT 'open',
  `checkout_url` varchar(255) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `metadata_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billing_invoices`
--

CREATE TABLE `billing_invoices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_account_id` bigint(20) UNSIGNED NOT NULL,
  `workspace_subscription_id` bigint(20) UNSIGNED NOT NULL,
  `checkout_session_id` bigint(20) UNSIGNED DEFAULT NULL,
  `external_invoice_id` varchar(120) DEFAULT NULL,
  `invoice_number` varchar(120) DEFAULT NULL,
  `STATUS` enum('draft','open','paid','void','uncollectible') NOT NULL DEFAULT 'draft',
  `currency_code` char(3) NOT NULL DEFAULT 'USD',
  `amount_subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `amount_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `hosted_invoice_url` varchar(255) DEFAULT NULL,
  `invoice_pdf_url` varchar(255) DEFAULT NULL,
  `issued_at` datetime DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `metadata_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billing_webhook_events`
--

CREATE TABLE `billing_webhook_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `billing_provider` enum('dummy','manual','stripe') NOT NULL,
  `event_type` varchar(120) NOT NULL,
  `external_event_id` varchar(160) NOT NULL,
  `processing_status` enum('pending','processed','failed') NOT NULL DEFAULT 'pending',
  `payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload_json`)),
  `processed_at` datetime DEFAULT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_accounts`
--

CREATE TABLE `customer_accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `account_type` enum('business','researcher') NOT NULL DEFAULT 'business',
  `organization_name` varchar(190) NOT NULL,
  `settings_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings_json`)),
  `STATUS` enum('active','inactive') NOT NULL DEFAULT 'active',
  `last_login_at` datetime DEFAULT NULL,
  `session_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_accounts`
--

INSERT INTO `customer_accounts` (`id`, `full_name`, `email`, `password_hash`, `account_type`, `organization_name`, `settings_json`, `STATUS`, `last_login_at`, `session_version`, `created_at`, `updated_at`) VALUES
(1, 'Aulia Satrio', 'auliasw89@gmail.com', 'scrypt$02e8483b6a1cf2dec829147fb352752c$38d8ed07d056bd0062a403ca4c7001bd4b0eccfe5462b722048bbc8ee114fc6a5eda45e9f1e2a71f0fb64622ed70275f7433d08e4c754b0f42f29017317ede8a', 'business', 'Vanaila', NULL, 'active', '2026-03-17 03:03:23', 2, '2026-03-17 03:03:23', '2026-03-17 03:07:32'),
(2, 'Demo Workspace Owner', 'demo.business@vanaila.test', 'scrypt$cab12dcf8199658d72ae6e73970059f0$7bc03d8b51fd27411c895ea626bde6c831b8a98bd87c4d86f0a2985bcf030fd84b0f662ac938dda3e15bbbdd005d4641bb1328429978290bb6e58a942fcbec79', 'business', 'Vanaila Demo Company', '{\"brandName\":\"Vanaila Demo Company\",\"brandTagline\":\"Structured assessment workspace\",\"supportEmail\":\"demo.business@vanaila.test\",\"contactPerson\":\"Demo Workspace Owner\",\"defaultAssessmentPurpose\":\"recruitment\",\"defaultAdministrationMode\":\"remote_unsupervised\",\"defaultResultVisibility\":\"review_required\",\"defaultParticipantLimit\":25,\"defaultTimeLimitMinutes\":20,\"defaultConsentStatement\":\"I agree to participate in the assessment conducted by {{organizationName}}.\",\"defaultPrivacyStatement\":\"Your responses will be handled as confidential assessment data for {{organizationName}}.\"}', 'active', '2026-03-29 14:25:12', 2, '2026-03-28 14:52:59', '2026-03-29 14:25:13'),
(3, 'Demo Research Owner', 'demo.research@vanaila.test', 'scrypt$cab12dcf8199658d72ae6e73970059f0$7bc03d8b51fd27411c895ea626bde6c831b8a98bd87c4d86f0a2985bcf030fd84b0f662ac938dda3e15bbbdd005d4641bb1328429978290bb6e58a942fcbec79', 'researcher', 'Vanaila Research Lab', '{\"brandName\": \"Vanaila Research Lab\", \"brandTagline\": \"Structured psychological research workspace\", \"supportEmail\": \"demo.research@vanaila.test\", \"contactPerson\": \"Demo Research Owner\", \"defaultAssessmentPurpose\": \"research\", \"defaultAdministrationMode\": \"remote_unsupervised\", \"defaultResultVisibility\": \"participant_summary\", \"defaultParticipantLimit\": 100, \"defaultTimeLimitMinutes\": 15, \"defaultConsentStatement\": \"I agree to participate in this assessment or questionnaire managed by {{organizationName}}.\", \"defaultPrivacyStatement\": \"Your responses will be stored as confidential research data for {{organizationName}}.\"}', 'active', '2026-03-28 14:52:59', 1, '2026-03-28 14:52:59', '2026-03-28 14:52:59');

-- --------------------------------------------------------

--
-- Table structure for table `customer_assessments`
--

CREATE TABLE `customer_assessments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_account_id` bigint(20) UNSIGNED NOT NULL,
  `test_session_id` bigint(20) UNSIGNED NOT NULL,
  `organization_name_snapshot` varchar(190) NOT NULL,
  `onboarding_status` enum('draft','ready') NOT NULL DEFAULT 'ready',
  `plan_status` enum('trial','upgraded') NOT NULL DEFAULT 'trial',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_assessments`
--

INSERT INTO `customer_assessments` (`id`, `customer_account_id`, `test_session_id`, `organization_name_snapshot`, `onboarding_status`, `plan_status`, `created_at`, `updated_at`) VALUES
(1, 1, 6, 'Vanaila', 'ready', 'upgraded', '2026-03-17 03:04:17', '2026-03-17 03:04:41'),
(2, 1, 7, 'Vanaila', 'ready', 'upgraded', '2026-03-17 03:06:37', '2026-03-17 03:06:49');

-- --------------------------------------------------------

--
-- Table structure for table `customer_assessment_participants`
--

CREATE TABLE `customer_assessment_participants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_assessment_id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `employee_code` varchar(100) DEFAULT NULL,
  `department` varchar(120) DEFAULT NULL,
  `position_title` varchar(120) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `invitation_status` enum('draft','invited') NOT NULL DEFAULT 'draft',
  `invited_via` enum('email','link') DEFAULT NULL,
  `invited_at` datetime DEFAULT NULL,
  `reminder_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `last_reminder_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_workspace_members`
--

CREATE TABLE `customer_workspace_members` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_account_id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('admin','operator','reviewer') NOT NULL DEFAULT 'operator',
  `invitation_status` enum('active','invited') NOT NULL DEFAULT 'invited',
  `activation_token` varchar(120) DEFAULT NULL,
  `activation_expires_at` datetime DEFAULT NULL,
  `invited_at` datetime DEFAULT NULL,
  `activated_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `last_notified_at` datetime DEFAULT NULL,
  `session_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `participants`
--

CREATE TABLE `participants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `employee_code` varchar(100) DEFAULT NULL,
  `department` varchar(120) DEFAULT NULL,
  `position_title` varchar(120) DEFAULT NULL,
  `metadata_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `participants`
--

INSERT INTO `participants` (`id`, `full_name`, `email`, `employee_code`, `department`, `position_title`, `metadata_json`, `created_at`, `updated_at`) VALUES
(1, 'asdasd', 'asd@gmail.com', 'asdasd', 'asdasd', 'asdasd', '{\"source\":\"public_session\"}', '2026-03-11 14:34:20', '2026-03-11 14:34:20'),
(2, 'Aulia', 'coderaulia@gmail.com', NULL, 'HR', 'HR Business partner', '{\"source\":\"public_session\",\"age\":24,\"educationLevel\":\"Bachelor Degree\",\"appliedPosition\":\"HRBP\",\"currentPosition\":\"HR Business partner\",\"latestConsentAcceptedAt\":\"2026-03-17T03:06:55.751Z\"}', '2026-03-17 03:01:04', '2026-03-17 03:06:58');

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `test_type_id` smallint(5) UNSIGNED NOT NULL,
  `question_code` varchar(50) NOT NULL,
  `instruction_text` text DEFAULT NULL,
  `prompt` text DEFAULT NULL,
  `question_group_key` varchar(50) DEFAULT NULL,
  `dimension_key` varchar(50) DEFAULT NULL,
  `question_type` enum('single_choice','forced_choice','likert') NOT NULL,
  `question_order` int(10) UNSIGNED NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('draft','active','archived') NOT NULL DEFAULT 'active',
  `question_meta_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`question_meta_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `test_type_id`, `question_code`, `instruction_text`, `prompt`, `question_group_key`, `dimension_key`, `question_type`, `question_order`, `is_required`, `status`, `question_meta_json`, `created_at`, `updated_at`) VALUES
(1, 2, 'DISC_Q001', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 1, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(2, 2, 'DISC_Q002', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 2, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(3, 2, 'DISC_Q003', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 3, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(4, 2, 'DISC_Q004', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 4, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(5, 2, 'DISC_Q005', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 5, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(6, 2, 'DISC_Q006', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 6, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(7, 2, 'DISC_Q007', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 7, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(8, 2, 'DISC_Q008', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 8, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(9, 2, 'DISC_Q009', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 9, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(10, 2, 'DISC_Q010', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 10, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(11, 2, 'DISC_Q011', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 11, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(12, 2, 'DISC_Q012', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 12, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(13, 2, 'DISC_Q013', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 13, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(14, 2, 'DISC_Q014', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 14, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(15, 2, 'DISC_Q015', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 15, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(16, 2, 'DISC_Q016', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 16, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(17, 2, 'DISC_Q017', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 17, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(18, 2, 'DISC_Q018', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 18, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(19, 2, 'DISC_Q019', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 19, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(20, 2, 'DISC_Q020', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 20, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(21, 2, 'DISC_Q021', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 21, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(22, 2, 'DISC_Q022', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 22, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(23, 2, 'DISC_Q023', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 23, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(24, 2, 'DISC_Q024', 'Pilih pernyataan yang paling dan paling tidak menggambarkan diri Anda.', NULL, NULL, NULL, 'forced_choice', 24, 1, 'active', NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(32, 1, 'IQ_Q001', 'Pilih satu jawaban yang paling tepat.', 'Angka berikutnya dalam pola 2, 4, 6, 8, ... adalah?', 'iq_dummy', 'numerical', 'single_choice', 1, 1, 'active', '{\"difficulty\": \"easy\"}', '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(33, 1, 'IQ_Q002', 'Pilih satu jawaban yang paling tepat.', 'Manakah bentuk hubungan yang benar: Buku : Membaca = Garpu : ?', 'iq_dummy', 'verbal', 'single_choice', 2, 1, 'active', '{\"difficulty\": \"easy\"}', '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(34, 1, 'IQ_Q003', 'Pilih satu jawaban yang paling tepat.', 'Jika semua mawar adalah bunga dan beberapa bunga cepat layu, maka pernyataan yang benar adalah?', 'iq_dummy', 'logical', 'single_choice', 3, 1, 'active', '{\"difficulty\": \"medium\"}', '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(35, 1, 'IQ_Q004', 'Pilih satu jawaban yang paling tepat.', 'Pilih angka yang tidak sesuai dengan kelompok: 3, 5, 7, 10, 11', 'iq_dummy', 'numerical', 'single_choice', 4, 1, 'active', '{\"difficulty\": \"medium\"}', '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(36, 1, 'IQ_Q005', 'Pilih satu jawaban yang paling tepat.', 'Jika sebuah rapat dimulai pukul 09:15 dan berlangsung selama 95 menit, rapat selesai pukul?', 'iq_dummy', 'analytical', 'single_choice', 5, 1, 'active', '{\"difficulty\": \"medium\"}', '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(37, 1, 'IQ_Q006', 'Pilih satu jawaban yang paling tepat.', 'Pilih pasangan kata yang paling mirip maknanya dengan “teliti”.', 'iq_dummy', 'verbal', 'single_choice', 6, 1, 'active', '{\"difficulty\": \"easy\"}', '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(38, 1, 'IQ_Q007', 'Pilih satu jawaban yang paling tepat.', 'Jika 5 mesin membuat 5 komponen dalam 5 menit, berapa menit yang dibutuhkan 100 mesin untuk membuat 100 komponen?', 'iq_dummy', 'numerical', 'single_choice', 7, 1, 'active', '{\"difficulty\": \"hard\"}', '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(39, 1, 'IQ_Q008', 'Pilih satu jawaban yang paling tepat.', 'Semua analis menyukai data. Bima adalah analis. Kesimpulan yang tepat adalah?', 'iq_dummy', 'logical', 'single_choice', 8, 1, 'active', '{\"difficulty\": \"easy\"}', '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(47, 3, 'WORKLOAD_Q001', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.', 'Seberapa besar tuntutan mental yang Anda rasakan saat mengerjakan tugas utama?', 'workload_core', 'mental_demand', 'likert', 1, 1, 'active', '{\"scaleMin\": 1, \"scaleMax\": 5}', '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(48, 3, 'WORKLOAD_Q002', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.', 'Seberapa sering Anda merasa harus berpikir cepat saat bekerja?', 'workload_core', 'mental_demand', 'likert', 2, 1, 'active', '{\"scaleMin\": 1, \"scaleMax\": 5}', '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(49, 3, 'WORKLOAD_Q003', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.', 'Seberapa kuat tekanan waktu yang Anda rasakan dalam pekerjaan harian?', 'workload_core', 'time_pressure', 'likert', 3, 1, 'active', '{\"scaleMin\": 1, \"scaleMax\": 5}', '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(50, 3, 'WORKLOAD_Q004', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.', 'Seberapa sering tenggat waktu membuat Anda harus terburu-buru?', 'workload_core', 'time_pressure', 'likert', 4, 1, 'active', '{\"scaleMin\": 1, \"scaleMax\": 5}', '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(51, 3, 'WORKLOAD_Q005', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.', 'Seberapa sulit tugas yang Anda kerjakan dibanding kemampuan Anda saat ini?', 'workload_core', 'task_difficulty', 'likert', 5, 1, 'active', '{\"scaleMin\": 1, \"scaleMax\": 5}', '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(52, 3, 'WORKLOAD_Q006', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.', 'Seberapa sering Anda merasa tugas memerlukan usaha ekstra untuk diselesaikan?', 'workload_core', 'task_difficulty', 'likert', 6, 1, 'active', '{\"scaleMin\": 1, \"scaleMax\": 5}', '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(53, 3, 'WORKLOAD_Q007', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.', 'Seberapa tinggi tingkat stres yang Anda rasakan selama bekerja?', 'workload_core', 'stress_level', 'likert', 7, 1, 'active', '{\"scaleMin\": 1, \"scaleMax\": 5}', '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(54, 3, 'WORKLOAD_Q008', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.', 'Seberapa sering pekerjaan membuat Anda tegang secara emosional?', 'workload_core', 'stress_level', 'likert', 8, 1, 'active', '{\"scaleMin\": 1, \"scaleMax\": 5}', '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(55, 3, 'WORKLOAD_Q009', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.', 'Seberapa lelah Anda setelah menyelesaikan pekerjaan harian?', 'workload_core', 'fatigue', 'likert', 9, 1, 'active', '{\"scaleMin\": 1, \"scaleMax\": 5}', '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(56, 3, 'WORKLOAD_Q010', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.', 'Seberapa sering Anda merasa energi menurun sebelum pekerjaan selesai?', 'workload_core', 'fatigue', 'likert', 10, 1, 'active', '{\"scaleMin\": 1, \"scaleMax\": 5}', '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(62, 4, 'CUSTOM_Q001', 'Rate each statement based on how closely it matches your current experience.', 'I stay focused on academic tasks even when distractions are present.', 'RESEARCH_PILOT_A', 'self_regulation', 'likert', 801, 1, 'active', '{\"instrument\": \"research_pilot_scale\", \"responseScale\": \"1_to_5_agreement\"}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(63, 4, 'CUSTOM_Q002', 'Rate each statement based on how closely it matches your current experience.', 'I postpone important work until the deadline is close.', 'RESEARCH_PILOT_A', 'procrastination', 'likert', 802, 1, 'active', '{\"instrument\": \"research_pilot_scale\", \"responseScale\": \"1_to_5_agreement\"}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(64, 4, 'CUSTOM_Q003', 'Rate each statement based on how closely it matches your current experience.', 'I feel confident that I can handle difficult academic demands.', 'RESEARCH_PILOT_A', 'self_efficacy', 'likert', 803, 1, 'active', '{\"instrument\": \"research_pilot_scale\", \"responseScale\": \"1_to_5_agreement\"}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(65, 4, 'CUSTOM_Q004', 'Rate each statement based on how closely it matches your current experience.', 'I feel mentally fatigued after a full day of study or research activity.', 'RESEARCH_PILOT_A', 'mental_fatigue', 'likert', 804, 1, 'active', '{\"instrument\": \"research_pilot_scale\", \"responseScale\": \"1_to_5_agreement\"}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(66, 4, 'CUSTOM_Q005', 'Rate each statement based on how closely it matches your current experience.', 'I can rely on support from others when academic pressure increases.', 'RESEARCH_PILOT_A', 'social_support', 'likert', 805, 1, 'active', '{\"instrument\": \"research_pilot_scale\", \"responseScale\": \"1_to_5_agreement\"}', '2026-03-12 11:20:19', '2026-03-28 14:53:33');

-- --------------------------------------------------------

--
-- Table structure for table `question_options`
--

CREATE TABLE `question_options` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `question_id` bigint(20) UNSIGNED NOT NULL,
  `option_key` varchar(20) NOT NULL,
  `option_text` varchar(500) NOT NULL,
  `dimension_key` varchar(50) DEFAULT NULL,
  `value_number` decimal(10,2) DEFAULT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `option_order` int(10) UNSIGNED NOT NULL,
  `score_payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`score_payload_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `question_options`
--

INSERT INTO `question_options` (`id`, `question_id`, `option_key`, `option_text`, `dimension_key`, `value_number`, `is_correct`, `option_order`, `score_payload_json`, `created_at`, `updated_at`) VALUES
(1, 1, 'D', 'Saya memperhatikan detail sebelum mengambil keputusan', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(2, 1, 'C', 'Saya lebih nyaman bekerja dalam suasana stabil', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(3, 1, 'B', 'Saya mudah bergaul dan berbicara dengan banyak orang', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(4, 1, 'A', 'Saya suka mengambil keputusan dengan cepat', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(5, 2, 'D', 'Saya teliti dan mengikuti prosedur dengan baik', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(6, 2, 'C', 'Saya sabar dan konsisten dalam bekerja', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(7, 2, 'B', 'Saya suka membuat suasana kerja menjadi menyenangkan', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(8, 2, 'A', 'Saya suka memimpin dan mengarahkan orang lain', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(9, 3, 'D', 'Saya menyukai data dan analisis', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(10, 3, 'C', 'Saya pendengar yang baik', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(11, 3, 'B', 'Saya mudah membangun hubungan dengan orang baru', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(12, 3, 'A', 'Saya fokus pada hasil dan target', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(13, 4, 'D', 'Saya berhati-hati dalam mengambil keputusan', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(14, 4, 'C', 'Saya setia dan dapat diandalkan', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(15, 4, 'B', 'Saya suka memotivasi orang lain', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(16, 4, 'A', 'Saya berani menghadapi tantangan', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(17, 5, 'D', 'Saya memastikan pekerjaan dilakukan dengan benar', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(18, 5, 'C', 'Saya menghargai kerja tim yang harmonis', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(19, 5, 'B', 'Saya suka berbicara di depan banyak orang', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(20, 5, 'A', 'Saya ingin menyelesaikan masalah dengan cepat', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(21, 6, 'D', 'Saya sistematis dan terstruktur', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(22, 6, 'C', 'Saya stabil dan tidak mudah berubah', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(23, 6, 'B', 'Saya optimis dan penuh energi', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(24, 6, 'A', 'Saya tegas dalam mengambil keputusan', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(25, 7, 'D', 'Saya memperhatikan akurasi', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(26, 7, 'C', 'Saya menjaga hubungan jangka panjang', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(27, 7, 'B', 'Saya suka berinteraksi dengan banyak orang', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(28, 7, 'A', 'Saya menyukai kompetisi', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(29, 8, 'D', 'Saya mengikuti standar kerja dengan ketat', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(30, 8, 'C', 'Saya tenang dan sabar', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(31, 8, 'B', 'Saya ekspresif dan komunikatif', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(32, 8, 'A', 'Saya fokus mencapai tujuan', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(33, 9, 'D', 'Saya memeriksa detail sebelum menyelesaikan pekerjaan', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(34, 9, 'C', 'Saya mendukung anggota tim lain', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(35, 9, 'B', 'Saya suka menjadi pusat perhatian', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(36, 9, 'A', 'Saya cepat bertindak', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(37, 10, 'D', 'Saya fokus pada kualitas', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(38, 10, 'C', 'Saya bekerja dengan ritme stabil', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(39, 10, 'B', 'Saya mudah mempengaruhi orang lain', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(40, 10, 'A', 'Saya percaya diri dalam mengambil keputusan', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(41, 11, 'D', 'Saya memastikan semua aturan dipatuhi', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(42, 11, 'C', 'Saya loyal terhadap tim', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(43, 11, 'B', 'Saya suka membangun jaringan pertemanan', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(44, 11, 'A', 'Saya ingin memimpin proyek penting', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(45, 12, 'D', 'Saya mengutamakan ketelitian', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(46, 12, 'C', 'Saya menghargai stabilitas kerja', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(47, 12, 'B', 'Saya suka suasana kerja yang dinamis', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(48, 12, 'A', 'Saya suka tantangan besar', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(49, 13, 'D', 'Saya bekerja secara metodis', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(50, 13, 'C', 'Saya menjaga keharmonisan tim', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(51, 13, 'B', 'Saya suka menyampaikan ide dengan antusias', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(52, 13, 'A', 'Saya ingin mengontrol situasi', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(53, 14, 'D', 'Saya memperhatikan prosedur', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(54, 14, 'C', 'Saya pendukung yang baik', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(55, 14, 'B', 'Saya pandai membujuk orang lain', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(56, 14, 'A', 'Saya fokus pada pencapaian', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(57, 15, 'D', 'Saya teliti terhadap kesalahan', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(58, 15, 'C', 'Saya konsisten dalam pekerjaan', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(59, 15, 'B', 'Saya mudah membangun koneksi', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(60, 15, 'A', 'Saya cepat mengambil tindakan', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(61, 16, 'D', 'Saya menyukai aturan yang jelas', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(62, 16, 'C', 'Saya sabar menghadapi perubahan', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(63, 16, 'B', 'Saya energik dan komunikatif', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(64, 16, 'A', 'Saya ingin menjadi pengambil keputusan', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(65, 17, 'D', 'Saya fokus pada akurasi', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(66, 17, 'C', 'Saya kooperatif dengan tim', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(67, 17, 'B', 'Saya ekspresif dalam menyampaikan ide', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(68, 17, 'A', 'Saya menyukai kontrol terhadap situasi', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(69, 18, 'D', 'Saya logis dan analitis', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(70, 18, 'C', 'Saya tenang dalam tekanan', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(71, 18, 'B', 'Saya suka menghibur orang lain', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(72, 18, 'A', 'Saya berorientasi pada kemenangan', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(73, 19, 'D', 'Saya memperhatikan detail kecil', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(74, 19, 'C', 'Saya menjaga stabilitas kerja', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(75, 19, 'B', 'Saya mudah beradaptasi dengan orang baru', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(76, 19, 'A', 'Saya suka memimpin diskusi', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(77, 20, 'D', 'Saya memastikan kualitas kerja', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(78, 20, 'C', 'Saya setia pada proses', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(79, 20, 'B', 'Saya komunikatif dan terbuka', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(80, 20, 'A', 'Saya berani mengambil risiko', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(81, 21, 'D', 'Saya sistematis dalam berpikir', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(82, 21, 'C', 'Saya sabar dalam bekerja', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(83, 21, 'B', 'Saya suka mempengaruhi orang lain', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(84, 21, 'A', 'Saya fokus menyelesaikan target', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(85, 22, 'D', 'Saya memperhatikan aturan kerja', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(86, 22, 'C', 'Saya menjaga hubungan kerja yang baik', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(87, 22, 'B', 'Saya suka berbicara dengan banyak orang', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(88, 22, 'A', 'Saya menyukai tantangan baru', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(89, 23, 'D', 'Saya berhati-hati terhadap kesalahan', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(90, 23, 'C', 'Saya stabil dan konsisten', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(91, 23, 'B', 'Saya antusias terhadap ide baru', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(92, 23, 'A', 'Saya ingin mencapai hasil terbaik', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(93, 24, 'D', 'Saya analitis dalam bekerja', 'C', 1.00, 0, 4, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(94, 24, 'C', 'Saya dapat diandalkan', 'S', 1.00, 0, 3, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(95, 24, 'B', 'Saya suka membangun relasi', 'I', 1.00, 0, 2, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(96, 24, 'A', 'Saya fokus pada kemenangan', 'D', 1.00, 0, 1, NULL, '2026-03-11 12:54:10', '2026-03-28 14:53:49'),
(128, 32, 'D', '14', NULL, NULL, 0, 4, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(129, 32, 'C', '12', NULL, NULL, 0, 3, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(130, 32, 'B', '10', NULL, NULL, 1, 2, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(131, 32, 'A', '9', NULL, NULL, 0, 1, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(132, 33, 'D', 'Menggambar', NULL, NULL, 0, 4, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(133, 33, 'C', 'Menyapu', NULL, NULL, 0, 3, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(134, 33, 'B', 'Makan', NULL, NULL, 1, 2, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(135, 33, 'A', 'Menulis', NULL, NULL, 0, 1, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(136, 34, 'D', 'Tidak ada bunga yang cepat layu', NULL, NULL, 0, 4, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(137, 34, 'C', 'Sebagian yang cepat layu bisa jadi mawar', NULL, NULL, 1, 3, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(138, 34, 'B', 'Semua bunga adalah mawar', NULL, NULL, 0, 2, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(139, 34, 'A', 'Beberapa mawar cepat layu', NULL, NULL, 0, 1, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(140, 35, 'E', '11', NULL, NULL, 0, 5, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(141, 35, 'D', '10', NULL, NULL, 1, 4, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(142, 35, 'C', '7', NULL, NULL, 0, 3, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(143, 35, 'B', '5', NULL, NULL, 0, 2, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(144, 35, 'A', '3', NULL, NULL, 0, 1, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(145, 36, 'D', '11:00', NULL, NULL, 0, 4, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(146, 36, 'C', '10:50', NULL, NULL, 1, 3, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(147, 36, 'B', '10:45', NULL, NULL, 0, 2, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(148, 36, 'A', '10:30', NULL, NULL, 0, 1, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(149, 37, 'D', 'Lugas', NULL, NULL, 0, 4, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(150, 37, 'C', 'Berani', NULL, NULL, 0, 3, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(151, 37, 'B', 'Cepat', NULL, NULL, 0, 2, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(152, 37, 'A', 'Cermat', NULL, NULL, 1, 1, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(153, 38, 'D', '100 menit', NULL, NULL, 0, 4, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(154, 38, 'C', '20 menit', NULL, NULL, 0, 3, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(155, 38, 'B', '5 menit', NULL, NULL, 1, 2, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(156, 38, 'A', '1 menit', NULL, NULL, 0, 1, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(157, 39, 'D', 'Tidak ada kesimpulan yang dapat diambil', NULL, NULL, 0, 4, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(158, 39, 'C', 'Bima tidak menyukai data', NULL, NULL, 0, 3, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(159, 39, 'B', 'Semua yang suka data adalah analis', NULL, NULL, 0, 2, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(160, 39, 'A', 'Bima menyukai data', NULL, NULL, 1, 1, NULL, '2026-03-11 12:54:29', '2026-03-28 14:53:57'),
(191, 47, '1', 'Sangat Rendah', 'mental_demand', 1.00, 0, 1, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(192, 48, '1', 'Sangat Rendah', 'mental_demand', 1.00, 0, 1, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(193, 49, '1', 'Sangat Rendah', 'time_pressure', 1.00, 0, 1, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(194, 50, '1', 'Sangat Rendah', 'time_pressure', 1.00, 0, 1, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(195, 51, '1', 'Sangat Rendah', 'task_difficulty', 1.00, 0, 1, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(196, 52, '1', 'Sangat Rendah', 'task_difficulty', 1.00, 0, 1, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(197, 53, '1', 'Sangat Rendah', 'stress_level', 1.00, 0, 1, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(198, 54, '1', 'Sangat Rendah', 'stress_level', 1.00, 0, 1, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(199, 55, '1', 'Sangat Rendah', 'fatigue', 1.00, 0, 1, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(200, 56, '1', 'Sangat Rendah', 'fatigue', 1.00, 0, 1, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(201, 47, '2', 'Rendah', 'mental_demand', 2.00, 0, 2, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(202, 48, '2', 'Rendah', 'mental_demand', 2.00, 0, 2, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(203, 49, '2', 'Rendah', 'time_pressure', 2.00, 0, 2, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(204, 50, '2', 'Rendah', 'time_pressure', 2.00, 0, 2, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(205, 51, '2', 'Rendah', 'task_difficulty', 2.00, 0, 2, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(206, 52, '2', 'Rendah', 'task_difficulty', 2.00, 0, 2, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(207, 53, '2', 'Rendah', 'stress_level', 2.00, 0, 2, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(208, 54, '2', 'Rendah', 'stress_level', 2.00, 0, 2, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(209, 55, '2', 'Rendah', 'fatigue', 2.00, 0, 2, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(210, 56, '2', 'Rendah', 'fatigue', 2.00, 0, 2, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(211, 47, '3', 'Sedang', 'mental_demand', 3.00, 0, 3, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(212, 48, '3', 'Sedang', 'mental_demand', 3.00, 0, 3, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(213, 49, '3', 'Sedang', 'time_pressure', 3.00, 0, 3, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(214, 50, '3', 'Sedang', 'time_pressure', 3.00, 0, 3, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(215, 51, '3', 'Sedang', 'task_difficulty', 3.00, 0, 3, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(216, 52, '3', 'Sedang', 'task_difficulty', 3.00, 0, 3, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(217, 53, '3', 'Sedang', 'stress_level', 3.00, 0, 3, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(218, 54, '3', 'Sedang', 'stress_level', 3.00, 0, 3, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(219, 55, '3', 'Sedang', 'fatigue', 3.00, 0, 3, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(220, 56, '3', 'Sedang', 'fatigue', 3.00, 0, 3, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(221, 47, '4', 'Tinggi', 'mental_demand', 4.00, 0, 4, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(222, 48, '4', 'Tinggi', 'mental_demand', 4.00, 0, 4, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(223, 49, '4', 'Tinggi', 'time_pressure', 4.00, 0, 4, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(224, 50, '4', 'Tinggi', 'time_pressure', 4.00, 0, 4, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(225, 51, '4', 'Tinggi', 'task_difficulty', 4.00, 0, 4, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(226, 52, '4', 'Tinggi', 'task_difficulty', 4.00, 0, 4, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(227, 53, '4', 'Tinggi', 'stress_level', 4.00, 0, 4, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(228, 54, '4', 'Tinggi', 'stress_level', 4.00, 0, 4, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(229, 55, '4', 'Tinggi', 'fatigue', 4.00, 0, 4, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(230, 56, '4', 'Tinggi', 'fatigue', 4.00, 0, 4, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(231, 47, '5', 'Sangat Tinggi', 'mental_demand', 5.00, 0, 5, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(232, 48, '5', 'Sangat Tinggi', 'mental_demand', 5.00, 0, 5, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(233, 49, '5', 'Sangat Tinggi', 'time_pressure', 5.00, 0, 5, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(234, 50, '5', 'Sangat Tinggi', 'time_pressure', 5.00, 0, 5, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(235, 51, '5', 'Sangat Tinggi', 'task_difficulty', 5.00, 0, 5, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(236, 52, '5', 'Sangat Tinggi', 'task_difficulty', 5.00, 0, 5, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(237, 53, '5', 'Sangat Tinggi', 'stress_level', 5.00, 0, 5, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(238, 54, '5', 'Sangat Tinggi', 'stress_level', 5.00, 0, 5, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(239, 55, '5', 'Sangat Tinggi', 'fatigue', 5.00, 0, 5, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(240, 56, '5', 'Sangat Tinggi', 'fatigue', 5.00, 0, 5, NULL, '2026-03-11 12:54:47', '2026-03-28 14:54:04'),
(254, 62, '1', 'Strongly disagree', 'self_regulation', 1.00, 0, 1, '{\"weight\": 1}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(255, 63, '1', 'Strongly disagree', 'procrastination', 1.00, 0, 1, '{\"weight\": 1}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(256, 64, '1', 'Strongly disagree', 'self_efficacy', 1.00, 0, 1, '{\"weight\": 1}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(257, 65, '1', 'Strongly disagree', 'mental_fatigue', 1.00, 0, 1, '{\"weight\": 1}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(258, 66, '1', 'Strongly disagree', 'social_support', 1.00, 0, 1, '{\"weight\": 1}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(259, 62, '2', 'Disagree', 'self_regulation', 2.00, 0, 2, '{\"weight\": 2}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(260, 63, '2', 'Disagree', 'procrastination', 2.00, 0, 2, '{\"weight\": 2}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(261, 64, '2', 'Disagree', 'self_efficacy', 2.00, 0, 2, '{\"weight\": 2}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(262, 65, '2', 'Disagree', 'mental_fatigue', 2.00, 0, 2, '{\"weight\": 2}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(263, 66, '2', 'Disagree', 'social_support', 2.00, 0, 2, '{\"weight\": 2}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(264, 62, '3', 'Neutral', 'self_regulation', 3.00, 0, 3, '{\"weight\": 3}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(265, 63, '3', 'Neutral', 'procrastination', 3.00, 0, 3, '{\"weight\": 3}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(266, 64, '3', 'Neutral', 'self_efficacy', 3.00, 0, 3, '{\"weight\": 3}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(267, 65, '3', 'Neutral', 'mental_fatigue', 3.00, 0, 3, '{\"weight\": 3}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(268, 66, '3', 'Neutral', 'social_support', 3.00, 0, 3, '{\"weight\": 3}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(269, 62, '4', 'Agree', 'self_regulation', 4.00, 0, 4, '{\"weight\": 4}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(270, 63, '4', 'Agree', 'procrastination', 4.00, 0, 4, '{\"weight\": 4}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(271, 64, '4', 'Agree', 'self_efficacy', 4.00, 0, 4, '{\"weight\": 4}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(272, 65, '4', 'Agree', 'mental_fatigue', 4.00, 0, 4, '{\"weight\": 4}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(273, 66, '4', 'Agree', 'social_support', 4.00, 0, 4, '{\"weight\": 4}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(274, 62, '5', 'Strongly agree', 'self_regulation', 5.00, 0, 5, '{\"weight\": 5}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(275, 63, '5', 'Strongly agree', 'procrastination', 5.00, 0, 5, '{\"weight\": 5}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(276, 64, '5', 'Strongly agree', 'self_efficacy', 5.00, 0, 5, '{\"weight\": 5}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(277, 65, '5', 'Strongly agree', 'mental_fatigue', 5.00, 0, 5, '{\"weight\": 5}', '2026-03-12 11:20:19', '2026-03-28 14:53:33'),
(278, 66, '5', 'Strongly agree', 'social_support', 5.00, 0, 5, '{\"weight\": 5}', '2026-03-12 11:20:19', '2026-03-28 14:53:33');

-- --------------------------------------------------------

--
-- Table structure for table `report_access_logs`
--

CREATE TABLE `report_access_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `result_id` bigint(20) UNSIGNED NOT NULL,
  `accessor_type` enum('admin','customer','participant','hr_user') NOT NULL,
  `accessor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `access_action` enum('view','download','export') NOT NULL DEFAULT 'view',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `results`
--

CREATE TABLE `results` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `submission_id` bigint(20) UNSIGNED NOT NULL,
  `test_type_id` smallint(5) UNSIGNED NOT NULL,
  `score_total` decimal(10,2) DEFAULT NULL,
  `score_band` varchar(100) DEFAULT NULL,
  `primary_type` varchar(50) DEFAULT NULL,
  `secondary_type` varchar(50) DEFAULT NULL,
  `profile_code` varchar(50) DEFAULT NULL,
  `interpretation_key` varchar(100) DEFAULT NULL,
  `result_payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`result_payload_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `results`
--

INSERT INTO `results` (`id`, `submission_id`, `test_type_id`, `score_total`, `score_band`, `primary_type`, `secondary_type`, `profile_code`, `interpretation_key`, `result_payload_json`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 24.00, NULL, 'I', 'D', 'I/D', 'disc_i', '{\"participantId\":1,\"scores\":{\"D\":6,\"I\":8,\"S\":6,\"C\":4},\"leastScores\":{\"D\":4,\"I\":8,\"S\":10,\"C\":2},\"balanceScores\":{\"D\":2,\"I\":0,\"S\":-4,\"C\":2},\"primaryType\":\"I\",\"secondaryType\":\"D\",\"profileCode\":\"I/D\",\"note\":\"Dummy DISC scoring for MVP reporting. This is not a clinical diagnosis.\"}', '2026-03-11 14:35:34', '2026-03-11 14:35:34');

-- --------------------------------------------------------

--
-- Table structure for table `result_summaries`
--

CREATE TABLE `result_summaries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `result_id` bigint(20) UNSIGNED NOT NULL,
  `metric_key` varchar(50) NOT NULL,
  `metric_label` varchar(100) NOT NULL,
  `metric_type` enum('dimension','category','band','summary') NOT NULL DEFAULT 'dimension',
  `score` decimal(10,2) DEFAULT NULL,
  `band` varchar(100) DEFAULT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `summary_text` text DEFAULT NULL,
  `chart_payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`chart_payload_json`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `result_summaries`
--

INSERT INTO `result_summaries` (`id`, `result_id`, `metric_key`, `metric_label`, `metric_type`, `score`, `band`, `sort_order`, `summary_text`, `chart_payload_json`, `created_at`, `updated_at`) VALUES
(1, 1, 'D', 'D', 'dimension', 6.00, NULL, 1, NULL, NULL, '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(2, 1, 'I', 'I', 'dimension', 8.00, NULL, 2, NULL, NULL, '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(3, 1, 'S', 'S', 'dimension', 6.00, NULL, 3, NULL, NULL, '2026-03-11 14:35:34', '2026-03-11 14:35:34'),
(4, 1, 'C', 'C', 'dimension', 4.00, NULL, 4, NULL, NULL, '2026-03-11 14:35:34', '2026-03-11 14:35:34');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `test_session_id` bigint(20) UNSIGNED NOT NULL,
  `participant_id` bigint(20) UNSIGNED NOT NULL,
  `attempt_no` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `status` enum('not_started','in_progress','submitted','scored') NOT NULL DEFAULT 'in_progress',
  `started_at` datetime DEFAULT NULL,
  `consent_given_at` datetime DEFAULT NULL,
  `consent_payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`consent_payload_json`)),
  `identity_snapshot_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`identity_snapshot_json`)),
  `answer_sequence` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `submitted_at` datetime DEFAULT NULL,
  `time_spent_seconds` int(10) UNSIGNED DEFAULT NULL,
  `raw_score` decimal(10,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `test_session_id`, `participant_id`, `attempt_no`, `status`, `started_at`, `consent_given_at`, `consent_payload_json`, `identity_snapshot_json`, `answer_sequence`, `submitted_at`, `time_spent_seconds`, `raw_score`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'scored', '2026-03-11 14:34:20', NULL, NULL, NULL, 0, '2026-03-11 14:35:34', NULL, 24.00, '2026-03-11 14:34:20', '2026-03-11 14:35:34'),
(2, 1, 2, 1, 'in_progress', '2026-03-17 03:01:04', '2026-03-17 03:00:19', '{\"accepted\":true,\"acceptedAt\":\"2026-03-17T03:00:19.025Z\",\"assessmentPurpose\":\"self_assessment\",\"administrationMode\":\"remote_unsupervised\",\"contactPerson\":\"Assessment administrator\"}', '{\"fullName\":\"Aulia\",\"email\":\"coderaulia@gmail.com\",\"employeeCode\":null,\"department\":\"HR\",\"position\":\"HR Business partner\",\"appliedPosition\":\"HRBP\",\"age\":24,\"educationLevel\":\"Bachelor Degree\"}', 0, NULL, NULL, NULL, '2026-03-17 03:01:04', '2026-03-17 03:01:04'),
(3, 6, 2, 1, 'in_progress', '2026-03-17 03:04:59', '2026-03-17 03:04:53', '{\"accepted\":true,\"acceptedAt\":\"2026-03-17T03:04:53.327Z\",\"assessmentPurpose\":\"recruitment\",\"administrationMode\":\"remote_unsupervised\",\"contactPerson\":\"Aulia Satrio\"}', '{\"fullName\":\"Aulia\",\"email\":\"coderaulia@gmail.com\",\"employeeCode\":null,\"department\":\"HR\",\"position\":\"HR Business partner\",\"appliedPosition\":\"HRBP\",\"age\":24,\"educationLevel\":\"Bachelor Degree\"}', 0, NULL, NULL, NULL, '2026-03-17 03:04:59', '2026-03-17 03:04:59'),
(4, 7, 2, 1, 'in_progress', '2026-03-17 03:06:58', '2026-03-17 03:06:55', '{\"accepted\":true,\"acceptedAt\":\"2026-03-17T03:06:55.751Z\",\"assessmentPurpose\":\"academic_evaluation\",\"administrationMode\":\"supervised\",\"contactPerson\":\"Aulia Satrio\"}', '{\"fullName\":\"Aulia\",\"email\":\"coderaulia@gmail.com\",\"employeeCode\":null,\"department\":\"HR\",\"position\":\"HR Business partner\",\"appliedPosition\":\"HRBP\",\"age\":24,\"educationLevel\":\"Bachelor Degree\"}', 0, NULL, NULL, NULL, '2026-03-17 03:06:58', '2026-03-17 03:06:58');

-- --------------------------------------------------------

--
-- Table structure for table `test_sessions`
--

CREATE TABLE `test_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `test_type_id` smallint(5) UNSIGNED NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `access_token` varchar(80) NOT NULL,
  `instructions` text DEFAULT NULL,
  `settings_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings_json`)),
  `distribution_policy` enum('hr_only','participant_summary','full_report_with_consent') NOT NULL DEFAULT 'participant_summary',
  `protected_delivery_mode` tinyint(1) NOT NULL DEFAULT 0,
  `participant_result_access` enum('none','summary','full_released') NOT NULL DEFAULT 'summary',
  `hr_result_access` enum('none','summary','full') NOT NULL DEFAULT 'full',
  `time_limit_minutes` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('draft','active','completed','archived') NOT NULL DEFAULT 'draft',
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `created_by_admin_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `test_sessions`
--

INSERT INTO `test_sessions` (`id`, `test_type_id`, `title`, `description`, `access_token`, `instructions`, `settings_json`, `distribution_policy`, `protected_delivery_mode`, `participant_result_access`, `hr_result_access`, `time_limit_minutes`, `status`, `starts_at`, `ends_at`, `created_by_admin_id`, `created_at`, `updated_at`) VALUES
(1, 2, 'Graduate Hiring Batch A', 'Demo DISC session for participant flow and result scoring.', 'disc-batch-a', 'Pilih satu pernyataan yang paling menggambarkan diri Anda.\nPilih satu pernyataan yang paling tidak menggambarkan diri Anda.\nJawab secara spontan, tidak ada jawaban benar atau salah.', '{\"source\": \"demo_seed\"}', 'participant_summary', 0, 'summary', 'full', 15, 'active', '2026-03-11 12:55:01', NULL, 2, '2026-03-11 12:55:01', '2026-03-28 14:54:11'),
(2, 1, 'Leadership IQ Screening', 'Demo IQ screening session with dummy questions.', 'iq-screening', 'Pilih satu jawaban yang paling tepat untuk setiap soal.\nUtamakan ketepatan jawaban dalam batas waktu yang tersedia.', '{\"source\": \"demo_seed\"}', 'participant_summary', 0, 'summary', 'full', 20, 'active', '2026-03-11 12:55:01', NULL, 2, '2026-03-11 12:55:01', '2026-03-28 14:54:11'),
(3, 3, 'Operations Workload Check', 'Demo workload assessment session for operational teams.', 'workload-check', 'Nilai tingkat beban kerja yang Anda rasakan untuk setiap pernyataan.\nGunakan skala dari sangat rendah hingga sangat tinggi.', '{\"source\": \"demo_seed\"}', 'participant_summary', 0, 'summary', 'full', 10, 'active', '2026-03-11 12:55:01', NULL, 2, '2026-03-11 12:55:01', '2026-03-28 14:54:11'),
(5, 4, 'Research Scale Pilot', 'Demo custom research questionnaire session for academic data collection workflows.', 'research-scale-pilot', 'Read each statement carefully before responding.\nUse the full response scale and answer based on your current experience.\nYour responses will be stored as structured research data for analysis.', '{\"assessmentPurpose\": \"research\", \"administrationMode\": \"remote_unsupervised\", \"interpretationMode\": \"self_assessment\", \"participantLimit\": 100, \"consentStatement\": \"I agree to participate in this psychological research questionnaire and understand that my responses will be collected for academic or research analysis.\", \"privacyStatement\": \"Your responses will be stored as confidential research data and used only by authorized lecturers, students, or research supervisors.\", \"contactPerson\": \"Research coordinator\"}', 'participant_summary', 0, 'summary', 'full', 15, 'active', '2026-03-12 11:20:28', NULL, 1, '2026-03-12 11:20:28', '2026-03-28 14:54:52'),
(6, 2, 'Recruitment & Selection', 'Draft DISC assessment for Vanaila (recruitment).', 'disc-recruitment-selection-a3ec5f', 'Choose the statements that are most and least like you in your current context.\nAnswer honestly rather than selecting what seems ideal.\nProfile output is indicative and may require professional review for formal decisions.', '{\"assessmentPurpose\":\"recruitment\",\"administrationMode\":\"remote_unsupervised\",\"interpretationMode\":\"self_assessment\",\"participantLimit\":25,\"consentStatement\":\"I agree to participate in this psychological assessment for Vanaila and understand that my responses will be used for the stated assessment purpose.\",\"privacyStatement\":\"Your personal information and responses will be treated as confidential assessment data for Vanaila and accessed only by authorized reviewers.\",\"contactPerson\":\"Aulia Satrio\"}', 'participant_summary', 0, 'summary', 'full', 15, 'active', NULL, NULL, 1, '2026-03-17 03:04:17', '2026-03-17 03:04:41'),
(7, 1, 'IQ Test', 'Draft IQ assessment for Vanaila (academic evaluation).', 'iq-iq-test-8cf176', 'Read each multiple-choice question carefully before choosing one answer.\nWork steadily and avoid leaving the session before you submit.\nThe result is indicative and should be reviewed in the context of the stated assessment purpose.', '{\"assessmentPurpose\":\"academic_evaluation\",\"administrationMode\":\"supervised\",\"interpretationMode\":\"self_assessment\",\"participantLimit\":25,\"consentStatement\":\"I agree to participate in this psychological assessment for Vanaila and understand that my responses will be used for the stated assessment purpose.\",\"privacyStatement\":\"Your personal information and responses will be treated as confidential assessment data for Vanaila and accessed only by authorized reviewers.\",\"contactPerson\":\"Aulia Satrio\"}', 'participant_summary', 0, 'summary', 'full', 15, 'active', NULL, NULL, 1, '2026-03-17 03:06:37', '2026-03-17 03:06:49');

-- --------------------------------------------------------

--
-- Table structure for table `test_types`
--

CREATE TABLE `test_types` (
  `id` smallint(5) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `question_style` enum('single_choice','forced_choice','likert') NOT NULL,
  `scoring_strategy` varchar(100) NOT NULL,
  `status` enum('draft','active','archived') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `test_types`
--

INSERT INTO `test_types` (`id`, `code`, `name`, `description`, `question_style`, `scoring_strategy`, `status`, `created_at`, `updated_at`) VALUES
(1, 'iq', 'IQ Test', 'Multiple-choice cognitive assessment with one correct answer per question.', 'single_choice', 'iq_standard', 'active', '2026-03-11 12:53:48', '2026-03-28 14:53:41'),
(2, 'disc', 'DISC Personality Test', 'Forced-choice personality questionnaire using most/least selections across D, I, S, and C dimensions.', 'forced_choice', 'disc_forced_choice', 'active', '2026-03-11 12:53:48', '2026-03-28 14:53:41'),
(3, 'workload', 'Workload Assessment', 'Likert-scale workload assessment covering demand, pressure, stress, and fatigue dimensions.', 'likert', 'workload_likert_sum', 'active', '2026-03-11 12:53:48', '2026-03-28 14:53:41'),
(4, 'custom', 'Custom Psychological Research Test', 'Research-configured questionnaire or scale instrument for academic studies, surveys, and new scale development.', 'likert', 'custom_questionnaire', 'active', '2026-03-12 11:19:57', '2026-03-28 14:53:41');

-- --------------------------------------------------------

--
-- Table structure for table `workspace_plan_features`
--

CREATE TABLE `workspace_plan_features` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `plan_code` enum('starter','growth','research') NOT NULL,
  `feature_key` varchar(80) NOT NULL,
  `feature_label` varchar(120) NOT NULL,
  `feature_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `hard_limit_value` int(10) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workspace_subscriptions`
--

CREATE TABLE `workspace_subscriptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_account_id` bigint(20) UNSIGNED NOT NULL,
  `plan_code` enum('starter','growth','research') NOT NULL DEFAULT 'starter',
  `STATUS` enum('trial','active','past_due','suspended') NOT NULL DEFAULT 'trial',
  `billing_cycle` enum('monthly','annual') NOT NULL DEFAULT 'monthly',
  `billing_provider` enum('dummy','manual','stripe') NOT NULL DEFAULT 'dummy',
  `provider_customer_id` varchar(120) DEFAULT NULL,
  `provider_subscription_id` varchar(120) DEFAULT NULL,
  `provider_price_id` varchar(120) DEFAULT NULL,
  `assessment_limit` int(10) UNSIGNED NOT NULL,
  `participant_limit` int(10) UNSIGNED NOT NULL,
  `team_member_limit` int(10) UNSIGNED NOT NULL,
  `started_at` datetime NOT NULL DEFAULT current_timestamp(),
  `trial_ends_at` datetime DEFAULT NULL,
  `renews_at` datetime DEFAULT NULL,
  `current_period_start` datetime DEFAULT NULL,
  `current_period_end` datetime DEFAULT NULL,
  `cancel_at_period_end` tinyint(1) NOT NULL DEFAULT 0,
  `canceled_at` datetime DEFAULT NULL,
  `past_due_at` datetime DEFAULT NULL,
  `suspended_at` datetime DEFAULT NULL,
  `plan_version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `billing_contact_email` varchar(190) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `workspace_subscriptions`
--

INSERT INTO `workspace_subscriptions` (`id`, `customer_account_id`, `plan_code`, `STATUS`, `billing_cycle`, `billing_provider`, `provider_customer_id`, `provider_subscription_id`, `provider_price_id`, `assessment_limit`, `participant_limit`, `team_member_limit`, `started_at`, `trial_ends_at`, `renews_at`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `canceled_at`, `past_due_at`, `suspended_at`, `plan_version`, `billing_contact_email`, `created_at`, `updated_at`) VALUES
(1, 2, 'starter', 'trial', 'monthly', 'dummy', NULL, NULL, NULL, 3, 5, 3, '2026-03-29 14:24:43', '2026-04-12 14:24:43', NULL, NULL, NULL, 0, NULL, NULL, NULL, 1, 'demo.business@vanaila.test', '2026-03-29 14:24:43', '2026-03-29 14:24:43');

-- --------------------------------------------------------

--
-- Table structure for table `workspace_usage_events`
--

CREATE TABLE `workspace_usage_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_account_id` bigint(20) UNSIGNED NOT NULL,
  `workspace_subscription_id` bigint(20) UNSIGNED DEFAULT NULL,
  `metric_key` enum('assessment_created','participant_added','team_member_added','result_exported') NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `reference_type` varchar(80) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `metadata_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata_json`)),
  `occurred_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workspace_usage_snapshots`
--

CREATE TABLE `workspace_usage_snapshots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_account_id` bigint(20) UNSIGNED NOT NULL,
  `workspace_subscription_id` bigint(20) UNSIGNED DEFAULT NULL,
  `period_start` datetime DEFAULT NULL,
  `period_end` datetime DEFAULT NULL,
  `assessment_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `participant_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `team_member_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `export_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `workspace_usage_snapshots`
--

INSERT INTO `workspace_usage_snapshots` (`id`, `customer_account_id`, `workspace_subscription_id`, `period_start`, `period_end`, `assessment_count`, `participant_count`, `team_member_count`, `export_count`, `created_at`, `updated_at`) VALUES
(1, 2, 1, NULL, NULL, 0, 0, 1, 0, '2026-03-29 14:24:43', '2026-03-29 14:24:43'),
(2, 2, 1, NULL, NULL, 0, 0, 1, 0, '2026-03-29 14:24:49', '2026-03-29 14:24:49'),
(3, 2, 1, NULL, NULL, 0, 0, 1, 0, '2026-03-29 14:24:54', '2026-03-29 14:24:54'),
(4, 2, 1, NULL, NULL, 0, 0, 1, 0, '2026-03-29 14:24:58', '2026-03-29 14:24:58'),
(5, 2, 1, NULL, NULL, 0, 0, 1, 0, '2026-03-29 14:25:12', '2026-03-29 14:25:12');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_admins_email` (`email`);

--
-- Indexes for table `answers`
--
ALTER TABLE `answers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_answers_submission_question_role` (`submission_id`,`question_id`,`answer_role`),
  ADD KEY `idx_answers_question` (`question_id`),
  ADD KEY `idx_answers_selected_option` (`selected_option_id`);

--
-- Indexes for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_logs_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_audit_logs_action` (`ACTION`),
  ADD KEY `idx_audit_logs_created_at` (`created_at`),
  ADD KEY `idx_audit_logs_actor_admin` (`actor_admin_id`);

--
-- Indexes for table `billing_checkout_sessions`
--
ALTER TABLE `billing_checkout_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_billing_checkout_sessions_key` (`session_key`),
  ADD KEY `idx_billing_checkout_sessions_account` (`customer_account_id`),
  ADD KEY `idx_billing_checkout_sessions_subscription` (`workspace_subscription_id`);

--
-- Indexes for table `billing_invoices`
--
ALTER TABLE `billing_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_billing_invoices_account` (`customer_account_id`),
  ADD KEY `idx_billing_invoices_subscription` (`workspace_subscription_id`),
  ADD KEY `idx_billing_invoices_checkout` (`checkout_session_id`);

--
-- Indexes for table `billing_webhook_events`
--
ALTER TABLE `billing_webhook_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_billing_webhook_events_external` (`billing_provider`,`external_event_id`),
  ADD KEY `idx_billing_webhook_events_status` (`processing_status`,`created_at`);

--
-- Indexes for table `customer_accounts`
--
ALTER TABLE `customer_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_customer_accounts_email` (`email`),
  ADD KEY `idx_customer_accounts_org` (`organization_name`);

--
-- Indexes for table `customer_assessments`
--
ALTER TABLE `customer_assessments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_customer_assessments_session` (`test_session_id`),
  ADD KEY `idx_customer_assessments_customer` (`customer_account_id`);

--
-- Indexes for table `customer_assessment_participants`
--
ALTER TABLE `customer_assessment_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_customer_assessment_participants_email` (`customer_assessment_id`,`email`),
  ADD KEY `idx_customer_assessment_participants_status` (`customer_assessment_id`,`invitation_status`);

--
-- Indexes for table `customer_workspace_members`
--
ALTER TABLE `customer_workspace_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_customer_workspace_members_email` (`customer_account_id`,`email`),
  ADD UNIQUE KEY `uq_customer_workspace_members_activation_token` (`activation_token`),
  ADD KEY `idx_customer_workspace_members_status` (`customer_account_id`,`invitation_status`);

--
-- Indexes for table `participants`
--
ALTER TABLE `participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_participants_name` (`full_name`),
  ADD KEY `idx_participants_email` (`email`),
  ADD KEY `idx_participants_employee_code` (`employee_code`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_questions_code` (`question_code`),
  ADD UNIQUE KEY `uq_questions_type_order` (`test_type_id`,`question_order`),
  ADD KEY `idx_questions_type_status` (`test_type_id`,`status`);

--
-- Indexes for table `question_options`
--
ALTER TABLE `question_options`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_question_options_key` (`question_id`,`option_key`),
  ADD UNIQUE KEY `uq_question_options_order` (`question_id`,`option_order`),
  ADD KEY `idx_question_options_dimension` (`dimension_key`);

--
-- Indexes for table `report_access_logs`
--
ALTER TABLE `report_access_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_report_access_result` (`result_id`),
  ADD KEY `idx_report_access_created` (`created_at`);

--
-- Indexes for table `results`
--
ALTER TABLE `results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_results_submission` (`submission_id`),
  ADD KEY `idx_results_test_type` (`test_type_id`),
  ADD KEY `idx_results_profile_code` (`profile_code`);

--
-- Indexes for table `result_summaries`
--
ALTER TABLE `result_summaries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_result_summaries_metric` (`result_id`,`metric_key`),
  ADD KEY `idx_result_summaries_metric_type` (`metric_type`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_submissions_session_participant_attempt` (`test_session_id`,`participant_id`,`attempt_no`),
  ADD KEY `idx_submissions_status` (`status`),
  ADD KEY `idx_submissions_submitted_at` (`submitted_at`),
  ADD KEY `fk_submissions_participant` (`participant_id`);

--
-- Indexes for table `test_sessions`
--
ALTER TABLE `test_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_test_sessions_access_token` (`access_token`),
  ADD KEY `idx_test_sessions_type_status` (`test_type_id`,`status`),
  ADD KEY `idx_test_sessions_created_by` (`created_by_admin_id`);

--
-- Indexes for table `test_types`
--
ALTER TABLE `test_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_test_types_code` (`code`);

--
-- Indexes for table `workspace_plan_features`
--
ALTER TABLE `workspace_plan_features`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_workspace_plan_features` (`plan_code`,`feature_key`);

--
-- Indexes for table `workspace_subscriptions`
--
ALTER TABLE `workspace_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_workspace_subscriptions_account` (`customer_account_id`);

--
-- Indexes for table `workspace_usage_events`
--
ALTER TABLE `workspace_usage_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_workspace_usage_events_account` (`customer_account_id`,`occurred_at`),
  ADD KEY `idx_workspace_usage_events_subscription` (`workspace_subscription_id`);

--
-- Indexes for table `workspace_usage_snapshots`
--
ALTER TABLE `workspace_usage_snapshots`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_workspace_usage_snapshots_period` (`customer_account_id`,`period_start`,`period_end`),
  ADD KEY `idx_workspace_usage_snapshots_subscription` (`workspace_subscription_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `answers`
--
ALTER TABLE `answers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `billing_checkout_sessions`
--
ALTER TABLE `billing_checkout_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `billing_invoices`
--
ALTER TABLE `billing_invoices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `billing_webhook_events`
--
ALTER TABLE `billing_webhook_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_accounts`
--
ALTER TABLE `customer_accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `customer_assessments`
--
ALTER TABLE `customer_assessments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `customer_assessment_participants`
--
ALTER TABLE `customer_assessment_participants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_workspace_members`
--
ALTER TABLE `customer_workspace_members`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `participants`
--
ALTER TABLE `participants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `question_options`
--
ALTER TABLE `question_options`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=283;

--
-- AUTO_INCREMENT for table `report_access_logs`
--
ALTER TABLE `report_access_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `results`
--
ALTER TABLE `results`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `result_summaries`
--
ALTER TABLE `result_summaries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `test_sessions`
--
ALTER TABLE `test_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `test_types`
--
ALTER TABLE `test_types`
  MODIFY `id` smallint(5) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `workspace_plan_features`
--
ALTER TABLE `workspace_plan_features`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `workspace_subscriptions`
--
ALTER TABLE `workspace_subscriptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `workspace_usage_events`
--
ALTER TABLE `workspace_usage_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `workspace_usage_snapshots`
--
ALTER TABLE `workspace_usage_snapshots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `answers`
--
ALTER TABLE `answers`
  ADD CONSTRAINT `fk_answers_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`),
  ADD CONSTRAINT `fk_answers_selected_option` FOREIGN KEY (`selected_option_id`) REFERENCES `question_options` (`id`),
  ADD CONSTRAINT `fk_answers_submission` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_logs_admin` FOREIGN KEY (`actor_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `billing_checkout_sessions`
--
ALTER TABLE `billing_checkout_sessions`
  ADD CONSTRAINT `fk_billing_checkout_sessions_account` FOREIGN KEY (`customer_account_id`) REFERENCES `customer_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_billing_checkout_sessions_subscription` FOREIGN KEY (`workspace_subscription_id`) REFERENCES `workspace_subscriptions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `billing_invoices`
--
ALTER TABLE `billing_invoices`
  ADD CONSTRAINT `fk_billing_invoices_account` FOREIGN KEY (`customer_account_id`) REFERENCES `customer_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_billing_invoices_checkout` FOREIGN KEY (`checkout_session_id`) REFERENCES `billing_checkout_sessions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_billing_invoices_subscription` FOREIGN KEY (`workspace_subscription_id`) REFERENCES `workspace_subscriptions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customer_assessments`
--
ALTER TABLE `customer_assessments`
  ADD CONSTRAINT `fk_customer_assessments_customer` FOREIGN KEY (`customer_account_id`) REFERENCES `customer_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_customer_assessments_session` FOREIGN KEY (`test_session_id`) REFERENCES `test_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customer_assessment_participants`
--
ALTER TABLE `customer_assessment_participants`
  ADD CONSTRAINT `fk_customer_assessment_participants_assessment` FOREIGN KEY (`customer_assessment_id`) REFERENCES `customer_assessments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `customer_workspace_members`
--
ALTER TABLE `customer_workspace_members`
  ADD CONSTRAINT `fk_customer_workspace_members_account` FOREIGN KEY (`customer_account_id`) REFERENCES `customer_accounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `questions`
--
ALTER TABLE `questions`
  ADD CONSTRAINT `fk_questions_test_type` FOREIGN KEY (`test_type_id`) REFERENCES `test_types` (`id`);

--
-- Constraints for table `question_options`
--
ALTER TABLE `question_options`
  ADD CONSTRAINT `fk_question_options_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `report_access_logs`
--
ALTER TABLE `report_access_logs`
  ADD CONSTRAINT `fk_report_access_result` FOREIGN KEY (`result_id`) REFERENCES `results` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `results`
--
ALTER TABLE `results`
  ADD CONSTRAINT `fk_results_submission` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_results_test_type` FOREIGN KEY (`test_type_id`) REFERENCES `test_types` (`id`);

--
-- Constraints for table `result_summaries`
--
ALTER TABLE `result_summaries`
  ADD CONSTRAINT `fk_result_summaries_result` FOREIGN KEY (`result_id`) REFERENCES `results` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `fk_submissions_participant` FOREIGN KEY (`participant_id`) REFERENCES `participants` (`id`),
  ADD CONSTRAINT `fk_submissions_test_session` FOREIGN KEY (`test_session_id`) REFERENCES `test_sessions` (`id`);

--
-- Constraints for table `test_sessions`
--
ALTER TABLE `test_sessions`
  ADD CONSTRAINT `fk_test_sessions_admin` FOREIGN KEY (`created_by_admin_id`) REFERENCES `admins` (`id`),
  ADD CONSTRAINT `fk_test_sessions_test_type` FOREIGN KEY (`test_type_id`) REFERENCES `test_types` (`id`);

--
-- Constraints for table `workspace_subscriptions`
--
ALTER TABLE `workspace_subscriptions`
  ADD CONSTRAINT `fk_workspace_subscriptions_account` FOREIGN KEY (`customer_account_id`) REFERENCES `customer_accounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `workspace_usage_events`
--
ALTER TABLE `workspace_usage_events`
  ADD CONSTRAINT `fk_workspace_usage_events_account` FOREIGN KEY (`customer_account_id`) REFERENCES `customer_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_workspace_usage_events_subscription` FOREIGN KEY (`workspace_subscription_id`) REFERENCES `workspace_subscriptions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `workspace_usage_snapshots`
--
ALTER TABLE `workspace_usage_snapshots`
  ADD CONSTRAINT `fk_workspace_usage_snapshots_account` FOREIGN KEY (`customer_account_id`) REFERENCES `customer_accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_workspace_usage_snapshots_subscription` FOREIGN KEY (`workspace_subscription_id`) REFERENCES `workspace_subscriptions` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
