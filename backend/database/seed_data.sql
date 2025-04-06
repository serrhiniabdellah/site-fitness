-- Seed data for FitZone database
USE fitzone_db;

-- Clear existing data (if needed)
DELETE FROM ligne_panier;
DELETE FROM panier;
DELETE FROM produits;
DELETE FROM categories;
DELETE FROM utilisateurs;

-- Reset auto-increment counters using SQL Server syntax
DBCC CHECKIDENT('ligne_panier', RESEED, 0);
DBCC CHECKIDENT('panier', RESEED, 0);
DBCC CHECKIDENT('produits', RESEED, 0);
DBCC CHECKIDENT('categories', RESEED, 0);
DBCC CHECKIDENT('utilisateurs', RESEED, 0);

-- Insert categories
INSERT INTO categories (nom_categorie, description) VALUES 
('Protéines', 'Compléments protéinés pour la musculation et la récupération'),
('Vêtements', 'Vêtements de sport performants et confortables'),
('Équipement', 'Matériel de fitness pour la salle ou la maison'),
('Accessoires', 'Accessoires de fitness et de nutrition sportive');

-- Insert products - Proteins category (id_categorie = 1)
INSERT INTO produits (nom_produit, description, prix, stock, id_categorie, image, est_promotion, pourcentage_promotion) VALUES 
('Whey Protein Premium', 'Protéine de lactosérum de haute qualité, 2kg - Parfum chocolat', 49.99, 50, 1, 'whey_protein_premium.jpg', 0, 0),
('Whey Isolate', 'Isolat de protéines de whey, absorption rapide - Parfum vanille, 1kg', 39.99, 35, 1, 'whey_isolate.jpg', 1, 15.00),
('Caséine Micellaire', 'Protéine à digestion lente, idéale avant le coucher - Parfum fraise, 1kg', 45.99, 25, 1, 'caseine.jpg', 0, 0),
('Vegan Protein', 'Mélange de protéines végétales (pois, riz, chanvre) - Sans lactose, 750g', 34.99, 40, 1, 'vegan_protein.jpg', 0, 0),
('Protein Bar (Boîte de 12)', 'Barres protéinées à 20g de protéines - Parfum cookie', 24.99, 100, 1, 'protein_bar.jpg', 1, 10.00);

-- Insert products - Clothing category (id_categorie = 2)
INSERT INTO produits (nom_produit, description, prix, stock, id_categorie, image, est_promotion, pourcentage_promotion) VALUES 
('T-shirt Performance', 'T-shirt respirant anti-transpiration - Technologie DryFit', 29.99, 75, 2, 'tshirt_performance.jpg', 0, 0),
('Legging Compression', 'Legging de compression pour femme - Maintien musculaire optimal', 39.99, 50, 2, 'legging_compression.jpg', 0, 0),
('Short Running', 'Short léger avec poche intérieure pour clés - Homme', 24.99, 60, 2, 'short_running.jpg', 0, 0),
('Brassière Sport', 'Brassière de maintien niveau 3 - Impact élevé', 34.99, 45, 2, 'brassiere_sport.jpg', 1, 20.00),
('Chaussettes Techniques', 'Pack de 3 paires - Anti-ampoules, respirantes', 14.99, 100, 2, 'chaussettes.jpg', 0, 0);

-- Insert products - Equipment category (id_categorie = 3)
INSERT INTO produits (nom_produit, description, prix, stock, id_categorie, image, est_promotion, pourcentage_promotion) VALUES 
('Haltères Vinyle 2x5kg', 'Paire d''haltères en vinyle - Grip confortable', 29.99, 30, 3, 'halteres_5kg.jpg', 0, 0),
('Tapis de Yoga Premium', 'Tapis antidérapant écologique - Épaisseur 6mm', 45.99, 40, 3, 'tapis_yoga.jpg', 0, 0),
('Kettlebell 12kg', 'Kettlebell en fonte avec poignée ergonomique', 59.99, 20, 3, 'kettlebell.jpg', 1, 15.00),
('Élastiques de Résistance', 'Set de 5 élastiques de différentes résistances', 24.99, 50, 3, 'elastiques.jpg', 0, 0),
('Corde à Sauter Pro', 'Corde à sauter avec roulements à billes et poignées en mousse', 19.99, 60, 3, 'corde_sauter.jpg', 0, 0);

-- Insert products - Accessories category (id_categorie = 4)
INSERT INTO produits (nom_produit, description, prix, stock, id_categorie, image, est_promotion, pourcentage_promotion) VALUES 
('Shaker 700ml', 'Shaker avec filtre anti-grumeaux et compartiment pour poudre', 9.99, 100, 4, 'shaker.jpg', 0, 0),
('Gourde Isotherme 1L', 'Maintient les boissons froides 24h ou chaudes 12h', 19.99, 70, 4, 'gourde.jpg', 1, 10.00),
('Ceinture de Musculation', 'Ceinture lombaire pour sécuriser le dos pendant les exercices lourds', 49.99, 25, 4, 'ceinture.jpg', 0, 0),
('Gants Fitness', 'Gants de protection avec renforcement aux paumes', 19.99, 60, 4, 'gants.jpg', 0, 0),
('Serviette Microfibre', 'Serviette ultra-absorbante et compacte - 100x50cm', 14.99, 80, 4, 'serviette.jpg', 0, 0);

-- Insert sample user (admin user)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES
('Admin', 'FitZone', 'admin@fitzone.com', '$2y$10$iIKgD1J.6W.M1ruIZ.wy5ONrbINNLxYm9yG7vjYQsw2SLqJkUZnua', 'admin');
-- Note: the password is 'admin123' hashed with bcrypt
