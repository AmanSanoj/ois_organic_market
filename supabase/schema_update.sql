-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create products table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0) DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add trigger for updated_at on products
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can view products"
    ON products FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can insert products"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'email' LIKE '%@gemsdaa.net');

DROP POLICY IF EXISTS "Only admins can update products" ON products;
DROP POLICY IF EXISTS "Stock updates and admin changes" ON products;

CREATE POLICY "Allow all authenticated users to update stock"
    ON products FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can delete products"
    ON products FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'email' LIKE '%@gemsdaa.net');

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    parent_name TEXT NOT NULL,
    parent_email TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL CHECK (student_class IN ('KG1', 'KG2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12')),
    student_section CHAR(1) NOT NULL CHECK (student_section ~ '^[A-Z]$'),
    gems_id_last_six CHAR(6) NOT NULL CHECK (gems_id_last_six ~ '^[0-9]{6}$'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (gems_id_last_six)
);

-- Add trigger for updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' LIKE '%@gemsdaa.net');

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create orders table with proper foreign key reference
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'delivered')) DEFAULT 'pending',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_profile
        FOREIGN KEY (user_id)
        REFERENCES user_profiles (id)
        ON DELETE CASCADE
);

-- Recreate order_items table
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10,2) NOT NULL CHECK (price_at_time >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Recreate updated_at trigger for orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Recreate RLS policies for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admin users can view all orders"
    ON orders FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' LIKE '%@gemsdaa.net');

CREATE POLICY "Users can create their own orders"
    ON orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can update orders"
    ON orders FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' LIKE '%@gemsdaa.net');

-- Order items policies
CREATE POLICY "Users can view their own order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admin users can view all order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' LIKE '%@gemsdaa.net');

CREATE POLICY "Users can create order items with their orders"
    ON order_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_order_with_stock_update(UUID, TEXT, TEXT, TEXT, DECIMAL, JSONB);
DROP FUNCTION IF EXISTS create_order_with_stock_update(UUID, DECIMAL, JSONB);

-- Create function for handling order creation and stock updates
CREATE OR REPLACE FUNCTION create_order_with_stock_update(
    p_user_id UUID,
    p_total_amount DECIMAL,
    p_items JSONB
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_current_stock INTEGER;
    v_requested_quantity INTEGER;
BEGIN
    -- Start transaction
    BEGIN
        -- First, verify stock availability for all items
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            -- Get current stock level
            SELECT id, stock_quantity 
            INTO v_product_id, v_current_stock
            FROM products 
            WHERE id = (v_item->>'id')::UUID;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Product not found: %', v_item->>'name';
            END IF;

            -- Get requested quantity
            v_requested_quantity := (v_item->>'quantity')::INTEGER;

            -- Check if enough stock
            IF v_current_stock < v_requested_quantity THEN
                RAISE EXCEPTION 'Not enough stock for %: have %, need %',
                    v_item->>'name', v_current_stock, v_requested_quantity;
            END IF;
        END LOOP;

        -- Create order
        INSERT INTO orders (
            user_id,
            total_amount,
            items,
            status
        ) VALUES (
            p_user_id,
            p_total_amount,
            p_items,
            'pending'
        ) RETURNING id INTO v_order_id;

        -- Update stock levels
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            UPDATE products
            SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER
            WHERE id = (v_item->>'id')::UUID;
        END LOOP;

        -- Commit transaction
        RETURN v_order_id;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction on any error
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_order_with_stock_update TO authenticated;

-- Add this at the end of schema_update.sql

CREATE OR REPLACE FUNCTION update_stock(product_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE products 
    SET stock_quantity = stock_quantity - quantity
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION update_stock TO authenticated;
