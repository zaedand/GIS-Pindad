-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 07, 2025 at 06:55 AM
-- Server version: 8.0.30
-- PHP Version: 8.2.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `admingispindad`
--

-- --------------------------------------------------------

--
-- Table structure for table `nodes`
--

CREATE TABLE `nodes` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('online','offline','partial') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'offline',
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `last_ping` timestamp NULL DEFAULT NULL,
  `uptime_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `response_time` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nodes`
--

INSERT INTO `nodes` (`id`, `name`, `ip_address`, `endpoint`, `status`, `latitude`, `longitude`, `last_ping`, `uptime_percentage`, `response_time`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Gedung awal', '192.168.195.180', '1001', 'offline', '-8.17277200', '112.68504900', '2025-07-15 20:46:31', '99.90', 41, 'lantai 1', 1, '2025-07-15 20:46:31', '2025-07-20 23:01:56'),
(3, 'Gedung 2', '192.168.1.18', '1002', 'offline', '-8.17397200', '112.68491000', '2025-07-16 18:49:05', '99.90', 23, '9 gd', 1, '2025-07-16 18:49:05', '2025-07-17 18:43:15'),
(4, 'Gedung v', '192.168.195.1', '1003', 'offline', '-8.17325000', '112.68546700', '2025-07-16 20:49:10', '99.90', 30, 'kokdd', 1, '2025-07-16 20:49:10', '2025-07-21 00:27:30'),
(6, 'Gedung v2', '192.168.162.1', '1004', 'offline', '-8.17443900', '112.68406400', NULL, '85.20', NULL, '4 lantai', 1, '2025-07-21 00:28:08', '2025-07-29 18:42:48'),
(7, 'Gedung ini', '192.168.162.15', '1005', 'offline', '-8.17296300', '112.68394600', NULL, '85.20', NULL, 'lt-1 samping pintu segaegy', 1, '2025-07-21 00:30:27', '2025-07-23 00:15:05'),
(8, 'Gardu induk', '192.168.160.15', '1088', 'offline', '-8.17258100', '112.68627200', NULL, '85.20', NULL, 'pp', 1, '2025-07-28 20:41:51', '2025-07-28 20:41:51'),
(9, 'Gedung Pojok', '192.168.160.1', '1006', 'offline', '-8.17225200', '112.68369800', NULL, '85.20', NULL, 'ape tu', 1, '2025-07-29 18:45:51', '2025-07-29 18:45:51'),
(10, 'Gedung atau', '192.168.160.3', '1008', 'offline', '-8.17214600', '112.68536000', NULL, '85.20', NULL, 'kirim', 1, '2025-07-30 17:38:50', '2025-07-30 17:38:50'),
(11, 'Gedung qqw', '192.168.160.4', '1009', 'offline', '-8.17379200', '112.68398900', NULL, '85.20', NULL, 'aa', 1, '2025-07-31 18:32:28', '2025-07-31 18:32:28');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `nodes`
--
ALTER TABLE `nodes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nodes_ip_address_unique` (`ip_address`),
  ADD KEY `nodes_status_is_active_index` (`status`,`is_active`),
  ADD KEY `nodes_latitude_longitude_index` (`latitude`,`longitude`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `nodes`
--
ALTER TABLE `nodes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
