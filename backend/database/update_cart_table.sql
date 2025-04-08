-- Make sure we're using the correct database
USE `fitzone_db`;

-- Update cart table to fix primary key issue
ALTER TABLE `cart` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Add a unique index to prevent duplicate products for the same user
ALTER TABLE `cart` 
  ADD UNIQUE INDEX `unique_user_product_variant` (`id_utilisateur`, `id_produit`, `variant_id`);
