CREATE DATABASE IF NOT EXISTS fitzone_db;
USE fitzone_db;

CREATE TABLE IF NOT EXISTS utilisateurs (
    id_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id_categorie INT PRIMARY KEY AUTO_INCREMENT,
    nom_categorie VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS produits (
    id_produit INT PRIMARY KEY AUTO_INCREMENT,
    nom_produit VARCHAR(100) NOT NULL,
    description TEXT,
    prix DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    id_categorie INT,
    image VARCHAR(255),
    est_promotion BOOLEAN DEFAULT FALSE,
    pourcentage_promotion DECIMAL(5,2) DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categorie) REFERENCES categories(id_categorie)
);

CREATE TABLE IF NOT EXISTS panier (
    id_panier INT PRIMARY KEY AUTO_INCREMENT,
    id_utilisateur INT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_actif BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur)
);

CREATE TABLE IF NOT EXISTS ligne_panier (
    id_ligne_panier INT PRIMARY KEY AUTO_INCREMENT,
    id_panier INT,
    id_produit INT,
    quantite INT DEFAULT 1,
    FOREIGN KEY (id_panier) REFERENCES panier(id_panier),
    FOREIGN KEY (id_produit) REFERENCES produits(id_produit)
);
