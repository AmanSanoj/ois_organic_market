-- Enable necessary extensions
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; (Not needed in MySQL)

-- Create storage bucket for product images
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('product-images', 'product-images', true); (Handled at application level in MySQL)

-- Create storage policy for public access to product images
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images'); (Handled at application level in MySQL)
-- CREATE POLICY "Authenticated Users Can Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated'); (Handled at application level in MySQL)
-- CREATE POLICY "Owners Can Update and Delete" ON storage.objects USING (bucket_id = 'product-images' AND auth.uid() = owner); (Handled at application level in MySQL)

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id CHAR(36) PRIMARY KEY,
    parent_name VARCHAR(255) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_class ENUM('KG1', 'KG2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'NA') NOT NULL,
    student_section CHAR(1) NOT NULL,
    gems_id_last_six TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'parent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT gems_id_unique UNIQUE (gems_id_last_six)
);

-- Trigger to update timestamp
DELIMITER $$
CREATE TRIGGER before_update_user_profiles
BEFORE UPDATE ON user_profiles
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- Create products table
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    items JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create function to handle user deletion
DELIMITER $$
CREATE PROCEDURE delete_user(IN user_id CHAR(36))
BEGIN
  DELETE FROM user_profiles WHERE id = user_id;
END$$
DELIMITER ;

-- Create RLS policies
-- Note: MySQL does not support Row-Level Security (RLS) like PostgreSQL.

-- Create triggers for updated_at timestamps
DELIMITER $$
CREATE TRIGGER before_update_products
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER before_update_orders
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;
