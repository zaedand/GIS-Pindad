-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 31, 2025 at 03:15 AM
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
-- Table structure for table `device_history`
--

CREATE TABLE `device_history` (
  `id` bigint UNSIGNED NOT NULL,
  `endpoint` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `node_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_status` enum('online','offline','partial') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_status` enum('online','offline','partial') COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` timestamp NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `duration` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `device_history`
--

INSERT INTO `device_history` (`id`, `endpoint`, `node_name`, `previous_status`, `current_status`, `timestamp`, `description`, `duration`, `created_at`, `updated_at`) VALUES
(1, '1001', 'Gedung awal', 'offline', 'online', '2025-07-28 03:19:03', 'Telepon kembali online', NULL, '2025-07-27 20:19:50', '2025-07-27 20:19:50'),
(2, '1001', 'Gedung awal', 'offline', 'online', '2025-07-28 03:23:03', 'Telepon kembali online', NULL, '2025-07-27 20:23:42', '2025-07-27 20:23:42'),
(3, '1001', 'Gedung awal', 'offline', 'online', '2025-07-28 03:25:03', 'Telepon kembali online', NULL, '2025-07-27 20:25:21', '2025-07-27 20:25:21'),
(4, '1001', 'Gedung awal', 'offline', 'online', '2025-07-28 03:26:03', 'Telepon kembali online', NULL, '2025-07-27 20:26:52', '2025-07-27 20:26:52'),
(5, '1001', 'Gedung awal', 'online', 'offline', '2025-07-28 03:27:03', 'Telepon tidak merespons', NULL, '2025-07-27 20:27:10', '2025-07-27 20:27:10'),
(6, '1003', 'Gedung v', 'offline', 'online', '2025-07-28 03:27:03', 'Telepon kembali online', NULL, '2025-07-27 20:27:11', '2025-07-27 20:27:11'),
(7, '1001', 'Gedung awal', 'offline', 'online', '2025-07-28 03:28:03', 'Telepon kembali online', NULL, '2025-07-27 20:28:07', '2025-07-27 20:28:07'),
(8, '1088', 'Node 1088', 'online', 'offline', '2025-07-28 03:35:04', 'Telepon tidak merespons', NULL, '2025-07-27 20:35:09', '2025-07-27 20:35:09'),
(9, '1001', 'Gedung awal', 'offline', 'online', '2025-07-28 03:55:05', 'Telepon kembali online', NULL, '2025-07-27 20:55:17', '2025-07-27 20:55:17'),
(10, '1003', 'Gedung v', 'offline', 'online', '2025-07-28 03:55:05', 'Telepon kembali online', NULL, '2025-07-27 20:55:18', '2025-07-27 20:55:18'),
(11, '1001', 'Gedung awal', 'offline', 'online', '2025-07-29 03:39:02', 'Telepon kembali online', NULL, '2025-07-28 20:39:59', '2025-07-28 20:39:59'),
(12, '1003', 'Gedung v', 'offline', 'online', '2025-07-29 03:39:02', 'Telepon kembali online', NULL, '2025-07-28 20:40:00', '2025-07-28 20:40:00'),
(13, '1001', 'Gedung awal', 'offline', 'online', '2025-07-29 03:42:03', 'Telepon kembali online', NULL, '2025-07-28 20:42:03', '2025-07-28 20:42:03'),
(14, '1003', 'Gedung v', 'offline', 'online', '2025-07-29 03:42:03', 'Telepon kembali online', NULL, '2025-07-28 20:42:03', '2025-07-28 20:42:03'),
(15, '1001', 'Gedung awal', 'offline', 'online', '2025-07-29 03:42:53', 'Telepon kembali online', NULL, '2025-07-28 20:43:42', '2025-07-28 20:43:42'),
(16, '1003', 'Gedung v', 'offline', 'online', '2025-07-29 03:42:53', 'Telepon kembali online', NULL, '2025-07-28 20:43:42', '2025-07-28 20:43:42'),
(17, '1001', 'Gedung awal', 'offline', 'online', '2025-07-30 01:15:58', 'Telepon kembali online', NULL, '2025-07-29 18:16:27', '2025-07-29 18:16:27'),
(18, '1003', 'Gedung v', 'offline', 'online', '2025-07-30 01:15:58', 'Telepon kembali online', NULL, '2025-07-29 18:16:27', '2025-07-29 18:16:27'),
(19, '1001', 'Gedung awal', 'offline', 'online', '2025-07-30 02:03:57', 'Telepon kembali online', NULL, '2025-07-29 19:05:00', '2025-07-29 19:05:00'),
(20, '1003', 'Gedung v', 'offline', 'online', '2025-07-30 02:03:57', 'Telepon kembali online', NULL, '2025-07-29 19:05:00', '2025-07-29 19:05:00'),
(21, '1001', 'Gedung awal', 'offline', 'online', '2025-07-30 02:06:57', 'Telepon kembali online', NULL, '2025-07-29 19:07:24', '2025-07-29 19:07:24'),
(22, '1003', 'Gedung v', 'offline', 'online', '2025-07-30 02:06:57', 'Telepon kembali online', NULL, '2025-07-29 19:07:24', '2025-07-29 19:07:24'),
(23, '1001', 'Gedung awal', 'offline', 'online', '2025-07-30 02:32:51', 'Telepon kembali online', NULL, '2025-07-29 19:33:04', '2025-07-29 19:33:04'),
(24, '1003', 'Gedung v', 'offline', 'online', '2025-07-30 02:32:51', 'Telepon kembali online', NULL, '2025-07-29 19:33:05', '2025-07-29 19:33:05'),
(25, 'Endpoint 1001', 'Node Endpoint 1001', 'offline', 'online', '2025-07-31 00:41:53', 'Telepon kembali online', NULL, '2025-07-30 17:42:05', '2025-07-30 17:42:05'),
(26, 'Endpoint 1008', 'Node Endpoint 1008', 'online', 'offline', '2025-07-31 02:17:32', 'Telepon tidak merespons', NULL, '2025-07-30 19:17:42', '2025-07-30 19:17:42'),
(27, 'Endpoint 1008', 'Node Endpoint 1008', 'offline', 'online', '2025-07-31 02:19:02', 'Telepon kembali online', NULL, '2025-07-30 19:19:13', '2025-07-30 19:19:13'),
(28, 'Endpoint 1002', 'Node Endpoint 1002', 'online', 'offline', '2025-07-31 02:20:52', 'Telepon tidak merespons', NULL, '2025-07-30 19:21:02', '2025-07-30 19:21:02'),
(29, 'Endpoint 1002', 'Node Endpoint 1002', 'offline', 'online', '2025-07-31 02:21:12', 'Telepon kembali online', NULL, '2025-07-30 19:21:22', '2025-07-30 19:21:22'),
(30, 'Endpoint 1002', 'Node Endpoint 1002', 'online', 'offline', '2025-07-31 02:21:32', 'Telepon tidak merespons', NULL, '2025-07-30 19:21:43', '2025-07-30 19:21:43'),
(31, 'Endpoint 1002', 'Node Endpoint 1002', 'offline', 'online', '2025-07-31 02:22:32', 'Telepon kembali online', NULL, '2025-07-30 19:22:43', '2025-07-30 19:22:43'),
(32, 'Endpoint 1088', 'Node Endpoint 1088', 'online', 'offline', '2025-07-31 02:24:12', 'Telepon tidak merespons', NULL, '2025-07-30 19:24:23', '2025-07-30 19:24:23'),
(33, 'Endpoint 1088', 'Node Endpoint 1088', 'offline', 'online', '2025-07-31 02:25:22', 'Telepon kembali online', NULL, '2025-07-30 19:25:32', '2025-07-30 19:25:32'),
(34, 'Endpoint 1088', 'Node Endpoint 1088', 'online', 'offline', '2025-07-31 02:52:54', 'Telepon tidak merespons', NULL, '2025-07-30 19:53:05', '2025-07-30 19:53:05');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `device_history`
--
ALTER TABLE `device_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `device_history_endpoint_timestamp_index` (`endpoint`,`timestamp`),
  ADD KEY `device_history_current_status_timestamp_index` (`current_status`,`timestamp`),
  ADD KEY `device_history_endpoint_current_status_index` (`endpoint`,`current_status`),
  ADD KEY `device_history_endpoint_index` (`endpoint`),
  ADD KEY `device_history_timestamp_index` (`timestamp`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `device_history`
--
ALTER TABLE `device_history`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
