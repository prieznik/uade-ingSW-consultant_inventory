const express = require('express');
const cors = require('cors');
const path = require('path');

// === App & server port (80 por requerimiento) ===
const app = express();
const PORT = process.env.PORT || 80;

// === Middleware ===
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// === DB (MySQL) ===
const db = require('./database');

// === Crear tabla si no existe + seed si está vacía ===
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;
`;

db.query(createTableSQL, (err) => {
  if (err) {
    console.error('Error creating products table:', err.message);
    return;
  }
  // Insertar datos de ejemplo solo si la tabla está vacía
  db.query('SELECT COUNT(*) AS cnt FROM products', (err2, rows) => {
    if (err2) {
      console.error('Count error:', err2.message);
      return;
    }
    const count = rows[0]?.cnt ?? 0;
    if (count === 0) {
      const sampleProducts = [
        ['Laptop Pro', 'Electronics', 15, 1299.99, 'High-performance laptop'],
        ['Wireless Mouse', 'Electronics', 45, 29.99, 'Ergonomic wireless mouse'],
        ['Office Chair', 'Furniture', 8, 199.99, 'Comfortable office chair'],
        ['Coffee Beans', 'Food', 120, 12.99, 'Premium coffee beans'],
        ['Notebook Set', 'Office Supplies', 200, 8.99, 'Pack of 3 notebooks']
      ];
      db.query(
        'INSERT INTO products (name, category, quantity, price, description) VALUES ?',
        [sampleProducts],
        (err3) => {
          if (err3) console.error('Seed insert error:', err3.message);
        }
      );
    }
  });
});

// === API Routes ===

// Listado
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Detalle
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM products WHERE id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  });
});

// Crear
app.post('/api/products', (req, res) => {
  const { name, category, quantity, price, description } = req.body;

  if (!name || !category || quantity === undefined || price === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.query(
    'INSERT INTO products (name, category, quantity, price, description) VALUES (?, ?, ?, ?, ?)',
    [name, category, quantity, price, description || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, message: 'Product created successfully' });
    }
  );
});

// Actualizar
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, quantity, price, description } = req.body;

  db.query(
    `UPDATE products
     SET name = ?, category = ?, quantity = ?, price = ?, description = ?
     WHERE id = ?`,
    [name, category, quantity, price, description || null, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Eliminar
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// Stats
app.get('/api/stats', (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total_products,
      COALESCE(SUM(quantity), 0) AS total_items,
      COUNT(DISTINCT category) AS categories,
      COALESCE(SUM(quantity * price), 0) AS total_value
    FROM products
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows[0]);
  });
});

// === Start server ===
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
