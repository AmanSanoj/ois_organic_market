import { createClient } from '@supabase/supabase-js';
import { query } from '../config/database';

// Initialize Supabase client for auth and storage
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions (using Supabase)
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Image upload function (using Supabase Storage)
export const uploadImage = async (file, path) => {
  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, file);
  if (error) throw error;
  return data;
};

// Database functions (using MySQL)
export const getProducts = async () => {
  const products = await query(
    'SELECT * FROM products WHERE active = true ORDER BY created_at DESC'
  );
  return products;
};

export const getProduct = async (id) => {
  const [product] = await query(
    'SELECT * FROM products WHERE id = ? AND active = true',
    [id]
  );
  return product;
};

export const createProduct = async (productData) => {
  const result = await query(
    'INSERT INTO products (name, description, price, image_url, category, stock, active) VALUES (?, ?, ?, ?, ?, ?, true)',
    [
      productData.name,
      productData.description,
      productData.price,
      productData.imageUrl,
      productData.category,
      productData.stock,
    ]
  );
  return result.insertId;
};

export const updateProduct = async (id, productData) => {
  const result = await query(
    'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category = ?, stock = ? WHERE id = ?',
    [
      productData.name,
      productData.description,
      productData.price,
      productData.imageUrl,
      productData.category,
      productData.stock,
      id,
    ]
  );
  return result.affectedRows > 0;
};

export const deleteProduct = async (id) => {
  const result = await query(
    'UPDATE products SET active = false WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
};

// Orders
export const createOrder = async (orderData) => {
  const result = await query(
    'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
    [orderData.userId, orderData.totalAmount, 'pending']
  );
  
  const orderId = result.insertId;
  
  // Insert order items
  for (const item of orderData.items) {
    await query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [orderId, item.productId, item.quantity, item.price]
    );
  }
  
  return orderId;
};

export const getOrders = async (userId) => {
  const orders = await query(
    `SELECT o.*, 
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', oi.id,
          'productId', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC`,
    [userId]
  );
  return orders;
};

export const getOrder = async (orderId, userId) => {
  const [order] = await query(
    `SELECT o.*, 
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', oi.id,
          'productId', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = ? AND o.user_id = ?
    GROUP BY o.id`,
    [orderId, userId]
  );
  return order;
};

export const updateOrderStatus = async (orderId, status) => {
  const result = await query(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, orderId]
  );
  return result.affectedRows > 0;
};
