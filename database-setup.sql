-- Active: 1743970933967@@127.0.0.1@3307@fitzone_db
-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS fitzone_db;
USE fitzone_db;

-- Users table
CREATE TABLE IF NOT EXISTS utilisateurs (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(50),
    code_postal VARCHAR(20),
    pays VARCHAR(50),
    role ENUM('admin', 'user') DEFAULT 'user',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id_categorie INT AUTO_INCREMENT PRIMARY KEY,
    nom_categorie VARCHAR(100) NOT NULL,
    description TEXT,
    image VARCHAR(255)
);

-- Products table
CREATE TABLE IF NOT EXISTS produits (
    id_produit INT AUTO_INCREMENT PRIMARY KEY,
    nom_produit VARCHAR(255) NOT NULL,
    description TEXT,
    prix DECIMAL(10, 2) NOT NULL,
    prix_promo DECIMAL(10, 2),
    stock INT NOT NULL DEFAULT 0,
    id_categorie INT,
    image VARCHAR(255),
    est_populaire BOOLEAN DEFAULT FALSE,
    est_nouveau BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categorie) REFERENCES categories(id_categorie)
);

-- Orders table
CREATE TABLE IF NOT EXISTS commandes (
    id_commande INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut_commande ENUM('pending', 'processing', 'shipped', 'delivered', 'canceled') DEFAULT 'pending',
    methode_paiement VARCHAR(50),
    total DECIMAL(10, 2) NOT NULL,
    sous_total DECIMAL(10, 2) NOT NULL,
    frais_livraison DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    adresse_livraison TEXT,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

-- Order items table
CREATE TABLE IF NOT EXISTS details_commande (
    id_detail INT AUTO_INCREMENT PRIMARY KEY,
    id_commande INT NOT NULL,
    id_produit INT NOT NULL,
    quantite INT NOT NULL,
    prix_unitaire DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_commande) REFERENCES commandes(id_commande),
    FOREIGN KEY (id_produit) REFERENCES produits(id_produit)
);

-- Insert test data

-- Sample categories
INSERT INTO categories (nom_categorie, description) VALUES
('Protéines', 'Compléments protéinés pour la récupération et la construction musculaire'),
('Mass Gainers', 'Produits pour la prise de masse'),
('BCAA', 'Acides aminés à chaîne ramifiée'),
('Équipement', 'Équipement d\'entraînement');

-- Sample products
INSERT INTO produits (nom_produit, description, prix, stock, id_categorie, est_populaire, est_nouveau) VALUES
('Gold Standard Whey Protein', 'Protéine de lactosérum de haute qualité', 59.99, 100, 1, TRUE, FALSE),
('Serious Mass Gainer', 'Gainer pour la prise de masse - 5kg', 65.00, 50, 2, TRUE, TRUE),
('Essential BCAA 2:1:1', 'BCAA en poudre saveur Berry Blast', 45.00, 75, 3, FALSE, TRUE),
('Pro Resistance Bands Set', 'Set de bandes de résistance - 5 niveaux', 29.99, 30, 4, TRUE, FALSE);

-- Create an admin user (password: admin123) and a regular user (password: user123)
INSERT INTO utilisateurs (prenom, nom, email, mot_de_passe, role) VALUES
('Admin', 'User', 'admin@fitzone.com', '$2y$10$FcJhHm/z.3X5j0QYG1YnAeChLOODRvMxmJXkD0zPUxS3QscKi0b0W', 'admin'),
('Regular', 'User', 'user@fitzone.com', '$2y$10$GYmDkiDlSE6AayOCJ2UELuprK1iX0nVnGTkp.pWnIQJQI9zs5fYha', 'user');
