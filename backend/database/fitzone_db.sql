-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3307
-- Généré le : mar. 08 avr. 2025 à 23:25
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `fitzone_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `adresses`
--

CREATE TABLE `adresses` (
  `id_adresse` int(11) NOT NULL AUTO_INCREMENT,
  `id_utilisateur` int(11) DEFAULT NULL,
  `id_commande` int(11) DEFAULT NULL,
  `type` enum('shipping','billing') NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `adresse` varchar(255) NOT NULL,
  `adresse2` varchar(255) DEFAULT NULL,
  `ville` varchar(100) NOT NULL,
  `code_postal` varchar(20) NOT NULL,
  `pays` varchar(100) NOT NULL,
  `est_defaut` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id_adresse`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `adresses`
--

INSERT INTO `adresses` (`id_utilisateur`, `id_commande`, `type`, `prenom`, `nom`, `telephone`, `adresse`, `adresse2`, `ville`, `code_postal`, `pays`, `est_defaut`) VALUES
(1, 8, 'shipping', 'Abdellah', 'SERRHINI', '0660995200', '5 Rue Paul Dautier 78140 Vélizy-Villacoublay', NULL, 'Velizy Villacoublay (78)', '78140', 'FR', 0),
(1, 20, 'shipping', 'filamatra', 'steeve', '056846466', '61 RUE FNIDEK APPT 8 AIT SKATOU2', NULL, 'Fès', '30000', 'GB', 0);

-- --------------------------------------------------------

--
-- Structure de la table `attributs_produit`
--

CREATE TABLE `attributs_produit` (
  `id_attribut` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `nom_attribut` varchar(100) NOT NULL,
  `valeur_attribut` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `avis`
--

CREATE TABLE `avis` (
  `id_avis` int(11) NOT NULL,
  `id_utilisateur` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `note` decimal(2,1) NOT NULL CHECK (`note` between 1 and 5),
  `commentaire` text DEFAULT NULL,
  `date_avis` datetime DEFAULT current_timestamp(),
  `est_approuve` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `avis`
--

INSERT INTO `avis` (`id_avis`, `id_utilisateur`, `id_produit`, `note`, `commentaire`, `date_avis`, `est_approuve`) VALUES
(1, 2, 1, 4.5, 'Excellent produit, bon goût et se mélange facilement. J\'ai constaté de bons gains musculaires après 1 mois.', '2025-04-07 02:31:55', 1),
(2, 3, 1, 5.0, 'La meilleure protéine que j\'ai essayée. Se dissout parfaitement et le goût est délicieux.', '2025-04-07 02:31:55', 1),
(3, 2, 2, 4.0, 'Très efficace pour prendre de la masse. Le goût pourrait être meilleur mais ça fait le travail.', '2025-04-07 02:31:55', 1),
(4, 3, 4, 5.0, 'Excellents haltères, très polyvalents et solides. Parfaits pour mon entraînement à domicile.', '2025-04-07 02:31:55', 1);

-- --------------------------------------------------------

--
-- Structure de la table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `id_utilisateur` int(11) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `id_produit` int(11) NOT NULL,
  `variant_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Structure de la table `categories`
--

CREATE TABLE `categories` (
  `id_categorie` int(11) NOT NULL,
  `nom_categorie` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `date_creation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `categories`
--

INSERT INTO `categories` (`id_categorie`, `nom_categorie`, `description`, `image`, `parent_id`, `date_creation`) VALUES
(1, 'Protéines', 'Poudres et barres protéinées pour la construction musculaire', NULL, NULL, '2025-04-07 02:31:55'),
(2, 'Mass Gainers', 'Suppléments pour la prise de masse musculaire', NULL, NULL, '2025-04-07 02:31:55'),
(3, 'BCAA & Acides Aminés', 'Acides aminés essentiels pour la récupération et la croissance', NULL, NULL, '2025-04-07 02:31:55'),
(4, 'Équipement', 'Équipements de fitness pour l\'entraînement à domicile ou en salle', NULL, NULL, '2025-04-07 02:31:55');

-- --------------------------------------------------------

--
-- Structure de la table `commandes`
--

CREATE TABLE `commandes` (
  `id_commande` int(11) NOT NULL,
  `id_utilisateur` int(11) NOT NULL,
  `id_statut` int(11) DEFAULT 1,
  `sous_total` decimal(10,2) NOT NULL,
  `frais_livraison` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `methode_paiement` varchar(50) NOT NULL,
  `id_transaction` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `date_commande` datetime DEFAULT current_timestamp(),
  `date_paiement` datetime DEFAULT NULL,
  `date_expedition` datetime DEFAULT NULL,
  `date_livraison` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `commandes`
--

INSERT INTO `commandes` (`id_commande`, `id_utilisateur`, `id_statut`, `sous_total`, `frais_livraison`, `total`, `methode_paiement`, `id_transaction`, `notes`, `date_commande`, `date_paiement`, `date_expedition`, `date_livraison`) VALUES
(8, 1, 1, 325.98, 0.00, 325.98, 'credit_card', NULL, NULL, '2025-04-08 14:04:36', NULL, NULL, NULL),
(20, 1, 1, 220.00, 0.00, 220.00, 'credit_card', NULL, NULL, '2025-04-08 15:01:50', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `commande_items`
--

CREATE TABLE `commande_items` (
  `id_item` int(11) NOT NULL,
  `id_commande` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `id_variant` int(11) DEFAULT NULL,
  `quantite` int(11) NOT NULL,
  `prix` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `coupons`
--

CREATE TABLE `coupons` (
  `id_coupon` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `type` enum('percentage','fixed') NOT NULL,
  `valeur` decimal(10,2) NOT NULL,
  `date_debut` datetime DEFAULT NULL,
  `date_fin` datetime DEFAULT NULL,
  `minimum_achat` decimal(10,2) DEFAULT 0.00,
  `usage_maximum` int(11) DEFAULT NULL,
  `usage_courant` int(11) DEFAULT 0,
  `est_actif` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `coupons`
--

INSERT INTO `coupons` (`id_coupon`, `code`, `type`, `valeur`, `date_debut`, `date_fin`, `minimum_achat`, `usage_maximum`, `usage_courant`, `est_actif`) VALUES
(1, 'WELCOME10', 'percentage', 10.00, NULL, NULL, 50.00, 100, 0, 1),
(2, 'SUMMER20', 'percentage', 20.00, NULL, NULL, 100.00, 50, 0, 1),
(3, 'FREESHIP', 'fixed', 7.99, NULL, NULL, 75.00, 200, 0, 1);

-- --------------------------------------------------------

--
-- Structure de la table `images_produit`
--

CREATE TABLE `images_produit` (
  `id_image` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `est_principale` tinyint(1) DEFAULT 0,
  `ordre` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `images_produit`
--

INSERT INTO `images_produit` (`id_image`, `id_produit`, `image_url`, `est_principale`, `ordre`) VALUES
(1, 1, 'img/products/f1.jpg', 1, 0),
(2, 1, 'img/products/details/f1-1.jpg', 0, 0),
(3, 1, 'img/products/details/f1-2.jpg', 0, 0),
(4, 1, 'img/products/details/f1-3.jpg', 0, 0),
(5, 2, 'img/products/f2.jpg', 1, 0),
(6, 2, 'img/products/details/f2-1.jpg', 0, 0),
(7, 3, 'img/products/f3.jpg', 1, 0),
(8, 4, 'img/products/f4.jpg', 1, 0);

-- --------------------------------------------------------

--
-- Structure de la table `liste_souhaits`
--

CREATE TABLE `liste_souhaits` (
  `id` int(11) NOT NULL,
  `id_utilisateur` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `date_ajout` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `produits`
--

CREATE TABLE `produits` (
  `id_produit` int(11) NOT NULL,
  `nom_produit` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `description_courte` varchar(500) DEFAULT NULL,
  `id_categorie` int(11) DEFAULT NULL,
  `prix` decimal(10,2) NOT NULL,
  `prix_avant_reduction` decimal(10,2) DEFAULT NULL,
  `est_promotion` tinyint(1) DEFAULT 0,
  `stock` int(11) DEFAULT 0,
  `poids` decimal(10,2) DEFAULT NULL,
  `unite_poids` varchar(10) DEFAULT 'g',
  `image` varchar(255) DEFAULT NULL,
  `est_actif` tinyint(1) DEFAULT 1,
  `date_creation` datetime DEFAULT current_timestamp(),
  `date_modification` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `featured` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `produits`
--

INSERT INTO `produits` (`id_produit`, `nom_produit`, `description`, `description_courte`, `id_categorie`, `prix`, `prix_avant_reduction`, `est_promotion`, `stock`, `poids`, `unite_poids`, `image`, `est_actif`, `date_creation`, `date_modification`, `featured`) VALUES
(1, 'Whey Protein Premium', 'Notre whey protein premium offre 25g de protéines par dose pour maximiser la croissance et la récupération musculaire.', 'Whey protein de haute qualité avec 25g de protéines par dose', 1, 49.99, NULL, 0, 100, NULL, 'g', 'img/products/f1.jpg', 1, '2025-04-07 02:31:55', '2025-04-07 02:31:55', 1),
(2, 'Mass Gainer 5000', 'Gagnez du poids rapidement avec ce gainer contenant 1250 calories par portion avec un mélange de protéines et de glucides.', 'Gainer avec 1250 calories par portion pour une prise de masse rapide', 2, 59.99, NULL, 1, 75, NULL, 'g', 'img/products/f2.jpg', 1, '2025-04-07 02:31:55', '2025-04-07 02:31:55', 1),
(3, 'BCAA 2:1:1', 'Acides aminés à chaîne ramifiée dans un ratio optimal 2:1:1 pour favoriser la récupération musculaire.', 'Formule BCAA en ratio 2:1:1 pour une récupération optimale', 3, 29.99, NULL, 0, 150, NULL, 'g', 'img/products/f3.jpg', 1, '2025-04-07 02:31:55', '2025-04-07 02:31:55', 0),
(4, 'Haltères Ajustables 20kg', 'Paire d\'haltères ajustables allant jusqu\'à 20kg chacun, idéal pour l\'entraînement à domicile.', 'Haltères ajustables jusqu\'à 20kg pour une flexibilité d\'entraînement maximale', 4, 129.99, NULL, 0, 30, NULL, 'g', 'img/products/f4.jpg', 1, '2025-04-07 02:31:55', '2025-04-07 02:31:55', 1),
(5, 'Protéine Vegan', 'Mélange protéique 100% végétal à base de pois, riz et chanvre offrant un profil complet d\'acides aminés.', 'Protéine végétale complète sans ingrédients animaux', 1, 54.99, NULL, 1, 50, NULL, 'g', 'img/products/f5.jpg', 1, '2025-04-07 02:31:55', '2025-04-07 02:31:55', 0),
(6, 'Corde à Sauter Pro', 'Corde à sauter professionnelle avec poignées ergonomiques et câble ajustable pour un entraînement cardio intense.', 'Corde à sauter de qualité professionnelle pour cardio intense', 4, 19.99, NULL, 0, 200, NULL, 'g', 'img/products/f6.jpg', 1, '2025-04-07 02:31:55', '2025-04-07 02:31:55', 0),
(7, 'Créatine Monohydrate', 'Créatine monohydrate pure à 100% pour augmenter la force, la puissance et la masse musculaire.', 'Créatine pure pour des performances et une force améliorées', 3, 24.99, NULL, 0, 120, NULL, 'g', 'img/products/f7.jpg', 1, '2025-04-07 02:31:55', '2025-04-07 02:31:55', 1),
(8, 'Barre de Protéine', 'Barre protéinée délicieuse contenant 20g de protéines et seulement 1g de sucre, parfaite pour les collations.', 'Barre protéinée savoureuse avec 20g de protéines et peu de sucre', 1, 2.99, NULL, 0, 500, NULL, 'g', 'img/products/f8.jpg', 1, '2025-04-07 02:31:55', '2025-04-07 02:31:55', 0);

-- --------------------------------------------------------

--
-- Structure de la table `statut_commande`
--

CREATE TABLE `statut_commande` (
  `id_statut` int(11) NOT NULL,
  `nom_statut` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `statut_commande`
--

INSERT INTO `statut_commande` (`id_statut`, `nom_statut`) VALUES
(1, 'pending'),
(2, 'processing'),
(3, 'shipped'),
(4, 'delivered'),
(5, 'canceled');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id_utilisateur` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `est_admin` tinyint(1) DEFAULT 0,
  `est_actif` tinyint(1) DEFAULT 1,
  `date_inscription` datetime DEFAULT current_timestamp(),
  `derniere_connexion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id_utilisateur`, `email`, `mot_de_passe`, `nom`, `prenom`, `telephone`, `est_admin`, `est_actif`, `date_inscription`, `derniere_connexion`) VALUES
(1, 'admin@fitzone.com', '$2y$10$1qObO0jghy.zgX7KJYFFvu9sNchVMADzF6TIjsxQh71RUhB.k8tyS', 'SERRHINI', 'Abdellah', '0660995200', 1, 1, '2025-04-07 02:31:55', '2025-04-08 19:26:48'),
(2, 'user@example.com', '$2y$10$eVUIt7cqliKczPEiHOT6we02WJLV7NfLomySJBxPjC9geaIHvnpya', 'John', 'Doe', '06658741', 0, 1, '2025-04-07 02:31:55', NULL),
(10, 'ser.abdellah@gmail.com', '$2y$10$l9.Yd4jPGkcCzSRJooMiAe2MQNfFgjjm5/XqjaKYYFJK3KanxRgcy', 'SERRHINI', 'Abdellah', NULL, 0, 1, '2025-04-07 17:01:26', '2025-04-08 15:06:16'),
(11, 'ser.abdellah80@gmail.com', '$2y$10$WsbPj/ayVP2OGxY7iRhuKO0ZEntge7y5kFtsmSfuIiFz9B79RTy9u', 'SERRHINI', 'Abdellah', NULL, 0, 1, '2025-04-07 17:11:43', NULL),
(12, 'ser.abdellah3@gmail.com', '$2y$10$o/836FqvVR9dv/3rv1ZTgOQa6WFjujkV7ROYG5v2cblFeCNmKoxbm', 'SERRHINI', 'Abdellah', NULL, 0, 1, '2025-04-07 17:23:25', '2025-04-07 18:54:58'),
(14, 'filamatrasteeve2019@gmail.com', '$2y$10$.AWa4WD4NmsLtdRGGbWHX.tzMEtr40JXdzf19z2kuDsdax9CawyxS', 'steeve', 'filamatra', '0568444', 0, 1, '2025-04-08 14:13:19', '2025-04-08 14:13:32');

-- --------------------------------------------------------

--
-- Structure de la table `variants_produit`
--

CREATE TABLE `variants_produit` (
  `id_variant` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `prix` decimal(10,2) DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `variants_produit`
--

INSERT INTO `variants_produit` (`id_variant`, `id_produit`, `nom`, `description`, `prix`, `stock`, `image`) VALUES
(1, 1, 'Chocolat', 'Saveur chocolat', 49.99, 30, NULL),
(2, 1, 'Vanille', 'Saveur vanille', 49.99, 30, NULL),
(3, 1, 'Fraise', 'Saveur fraise', 49.99, 20, NULL),
(4, 1, 'Cookies & Cream', 'Saveur cookies & cream', 52.99, 20, NULL),
(5, 2, 'Chocolat 2kg', 'Saveur chocolat format 2kg', 59.99, 25, NULL),
(6, 2, 'Chocolat 5kg', 'Saveur chocolat format 5kg', 99.99, 15, NULL),
(7, 2, 'Vanille 2kg', 'Saveur vanille format 2kg', 59.99, 20, NULL),
(8, 2, 'Vanille 5kg', 'Saveur vanille format 5kg', 99.99, 15, NULL);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `adresses`
--
ALTER TABLE `adresses`
  ADD KEY `id_utilisateur` (`id_utilisateur`),
  ADD KEY `id_commande` (`id_commande`);

--
-- Index pour la table `attributs_produit`
--
ALTER TABLE `attributs_produit`
  ADD PRIMARY KEY (`id_attribut`),
  ADD KEY `id_produit` (`id_produit`);

--
-- Index pour la table `avis`
--
ALTER TABLE `avis`
  ADD PRIMARY KEY (`id_avis`),
  ADD KEY `id_utilisateur` (`id_utilisateur`),
  ADD KEY `id_produit` (`id_produit`);

--
-- Index pour la table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_product_variant` (`id_utilisateur`,`id_produit`,`variant_id`),
  ADD KEY `id_utilisateur` (`id_utilisateur`),
  ADD KEY `id_produit` (`id_produit`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `idx_cart_user` (`id_utilisateur`),
  ADD KEY `idx_cart_session` (`session_id`);

--
-- Index pour la table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id_categorie`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Index pour la table `commandes`
--
ALTER TABLE `commandes`
  ADD PRIMARY KEY (`id_commande`),
  ADD KEY `id_utilisateur` (`id_utilisateur`),
  ADD KEY `id_statut` (`id_statut`);

--
-- Index pour la table `commande_items`
--
ALTER TABLE `commande_items`
  ADD PRIMARY KEY (`id_item`);

--
-- Index pour la table `produits`
--
ALTER TABLE `produits`
  ADD PRIMARY KEY (`id_produit`),
  ADD KEY `id_categorie` (`id_categorie`);

--
-- Index pour la table `statut_commande`
--
ALTER TABLE `statut_commande`
  ADD PRIMARY KEY (`id_statut`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id_utilisateur`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `categories`
--
ALTER TABLE `categories`
  MODIFY `id_categorie` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `commandes`
--
ALTER TABLE `commandes`
  MODIFY `id_commande` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `commande_items`
--
ALTER TABLE `commande_items`
  MODIFY `id_item` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `produits`
--
ALTER TABLE `produits`
  MODIFY `id_produit` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `statut_commande`
--
ALTER TABLE `statut_commande`
  MODIFY `id_statut` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id_utilisateur` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id_categorie`) ON DELETE SET NULL;

--
-- Contraintes pour la table `commandes`
--
ALTER TABLE `commandes`
  ADD CONSTRAINT `commandes_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id_utilisateur`),
  ADD CONSTRAINT `commandes_ibfk_2` FOREIGN KEY (`id_statut`) REFERENCES `statut_commande` (`id_statut`);

--
-- Contraintes pour la table `produits`
--
ALTER TABLE `produits`
  ADD CONSTRAINT `produits_ibfk_1` FOREIGN KEY (`id_categorie`) REFERENCES `categories` (`id_categorie`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
