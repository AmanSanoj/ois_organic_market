import { query } from '../config/database';

// Products
export const getProducts = async () => {
  const products = await query(
    'SELECT * FROM products WHERE active = true ORDER BY created_at DESC'
  );
  return products;
};

export const getProductsByCategory = async (category) => {
  const products = await query(
    'SELECT * FROM products WHERE category = ? AND active = true ORDER BY name',
    [category]
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
    'INSERT INTO products (name, price, image_url, category, stock) VALUES (?, ?, ?, ?, ?)',
    [
      productData.name,
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
    'UPDATE products SET name = ?, price = ?, image_url = ?, category = ?, stock = ? WHERE id = ?',
    [
      productData.name,
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

// Categories
export const getCategories = async () => {
  const categories = await query(
    'SELECT * FROM categories WHERE active = true ORDER BY name'
  );
  return categories;
};

export const getCategory = async (id) => {
  const [category] = await query(
    'SELECT * FROM categories WHERE id = ? AND active = true',
    [id]
  );
  return category;
};

// Cart
export const getCartItems = async (userId) => {
  const items = await query(
    `SELECT ci.*, p.name, p.price, p.image_url, p.stock 
     FROM cart_items ci 
     JOIN products p ON ci.product_id = p.id 
     WHERE ci.user_id = ?`,
    [userId]
  );
  return items;
};

export const addToCart = async (userId, productId, quantity = 1) => {
  // Check if item already exists in cart
  const [existingItem] = await query(
    'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );

  if (existingItem) {
    // Update quantity
    await query(
      'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
      [quantity, existingItem.id]
    );
    return existingItem.id;
  } else {
    // Add new item
    const result = await query(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
      [userId, productId, quantity]
    );
    return result.insertId;
  }
};

export const updateCartItem = async (userId, itemId, quantity) => {
  const result = await query(
    'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
    [quantity, itemId, userId]
  );
  return result.affectedRows > 0;
};

export const removeFromCart = async (userId, itemId) => {
  const result = await query(
    'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
    [itemId, userId]
  );
  return result.affectedRows > 0;
};

export const clearCart = async (userId) => {
  const result = await query(
    'DELETE FROM cart_items WHERE user_id = ?',
    [userId]
  );
  return result.affectedRows > 0;
};

// Orders
export const createOrder = async (orderData) => {
  const result = await query(
    'INSERT INTO orders (user_id, total_amount, status, shipping_address, billing_address) VALUES (?, ?, ?, ?, ?)',
    [
      orderData.userId,
      orderData.totalAmount,
      'pending',
      orderData.shippingAddress,
      orderData.billingAddress,
    ]
  );
  
  const orderId = result.insertId;
  
  // Insert order items
  for (const item of orderData.items) {
    await query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [orderId, item.productId, item.quantity, item.price]
    );
    
    // Update product stock
    await query(
      'UPDATE products SET stock = stock - ? WHERE id = ?',
      [item.quantity, item.productId]
    );
  }
  
  // Clear the user's cart
  await clearCart(orderData.userId);
  
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
          'price', oi.price,
          'name', p.name,
          'imageUrl', p.image_url
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
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
          'price', oi.price,
          'name', p.name,
          'imageUrl', p.image_url
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.id = ? AND o.user_id = ?
    GROUP BY o.id`,
    [orderId, userId]
  );
  return order;
};

export const updateOrderStatus = async (orderId, userId, status) => {
  const result = await query(
    'UPDATE orders SET status = ? WHERE id = ? AND user_id = ?',
    [status, orderId, userId]
  );
  return result.affectedRows > 0;
};
