-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS gems_garden;
USE gems_garden;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    category VARCHAR(100),
    stock INT NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- Supabase user ID
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample data for categories
INSERT INTO categories (name, description) VALUES
    ('Vegetables', 'Fresh hydroponic vegetables'),
    ('Fruits', 'Fresh hydroponic fruits'),
    ('Herbs', 'Fresh hydroponic herbs'),
    ('Microgreens', 'Fresh hydroponic microgreens');

-- Sample data for products
INSERT INTO products (name, description, price, category, stock) VALUES
    ('Lettuce', 'Fresh hydroponic lettuce', 2.99, 'Vegetables', 100),
    ('Tomatoes', 'Fresh hydroponic tomatoes', 3.99, 'Vegetables', 75),
    ('Basil', 'Fresh hydroponic basil', 1.99, 'Herbs', 50),
    ('Strawberries', 'Fresh hydroponic strawberries', 4.99, 'Fruits', 30);
