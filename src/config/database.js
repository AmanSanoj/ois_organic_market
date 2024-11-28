import mysql from 'mysql2/promise';

const dbConfig = {
  host: import.meta.env.VITE_MYSQL_HOST,
  port: import.meta.env.VITE_MYSQL_PORT,
  user: import.meta.env.VITE_MYSQL_USER,
  password: import.meta.env.VITE_MYSQL_PASSWORD,
  database: import.meta.env.VITE_MYSQL_DATABASE,
};

let pool;

export const getConnection = async () => {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
};

export const query = async (sql, params) => {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default {
  getConnection,
  query,
};
