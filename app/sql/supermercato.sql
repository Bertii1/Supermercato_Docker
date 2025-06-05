-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Creato il: Giu 05, 2025 alle 20:31
-- Versione del server: 8.0.42
-- Versione PHP: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `supermercato`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `carts`
--

CREATE TABLE `carts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `prodotti`
--

CREATE TABLE `prodotti` (
  `codice` int NOT NULL,
  `descrizione` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prezzo` decimal(10,2) NOT NULL,
  `tipo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `categoria` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `calorie` int DEFAULT NULL,
  `image_filename` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'default-product.png'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `prodotti`
--

INSERT INTO `prodotti` (`codice`, `descrizione`, `prezzo`, `tipo`, `categoria`, `calorie`, `image_filename`) VALUES
(2, 'Mele Fuji', 0.36, 'fresco', 'alimentari', 200, 'default-product.png'),
(3, 'Latte Intero 1L', 1.20, 'fresco', 'alimentari', 200, 'default-product.png'),
(4, 'Petto di Pollo 500G', 3.50, 'fresco', 'alimentari', 200, 'default-product.png'),
(5, 'Mozzarella 125g', 1.30, 'fresco', 'alimentari', 200, 'default-product.png'),
(6, 'Pane Integrale 500g', 1.80, 'fresco', 'alimentari', 200, 'default-product.png'),
(7, 'Tonno in Scatola 80g', 1.10, 'conservato', 'alimentari', 200, 'default-product.png'),
(8, 'Pasta Penne 500g', 1.30, 'conservato', 'alimentari', 200, 'default-product.png'),
(9, 'vestito lungo', 34.99, 'donna', 'abbigliamento', NULL, 'default-product.png'),
(21, 'muller yogurt bianco 500g', 2.70, 'confezionato', 'alimentari', 130, 'default-product.png');

-- --------------------------------------------------------

--
-- Struttura della tabella `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dump dei dati per la tabella `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `created_at`) VALUES
(1, 'filippo', '$2y$10$0pKDhW.1hg/BkmEC91tnTe2490mOfa20nGp6hHgeSxuSvWPV09S32', 'user', '2025-06-05 08:55:47'),
(2, 'nicolas', '$2y$10$rBWCTWf24H6t2Jqv7mfpb.Pdn/fuIb/cXuPTsaDo1PY/rtxwtvWFi', 'user', '2025-06-05 09:14:09'),
(3, 'admin', '$2y$10$5vJfN7fCFpMoVheKdA2H/.elDn3F83UDDcHAMUjo0DPRUSYPKv/3O', 'admin', '2025-06-05 09:17:16');

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indici per le tabelle `prodotti`
--
ALTER TABLE `prodotti`
  ADD UNIQUE KEY `codice` (`codice`);

--
-- Indici per le tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT per la tabella `prodotti`
--
ALTER TABLE `prodotti`
  MODIFY `codice` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT per la tabella `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `carts_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `prodotti` (`codice`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
