// app.js
require('./otel-setup'); // Initialize OpenTelemetry before anything else

const express = require('express');
const app = express();

app.use(express.json());

// Mock database
const products = [
  { id: 1, name: 'Laptop', price: 1000 },
  { id: 2, name: 'Phone', price: 500 },
];

const orders = [];

// Fetch all products
app.get('/products', (req, res) => {
  console.log('Fetching products...');
  res.json(products);
});

// Place an order
app.post('/order', (req, res) => {
  const { productId, quantity } = req.body;

  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const order = {
    id: orders.length + 1,
    productId,
    quantity,
    total: product.price * quantity,
  };
  orders.push(order);

  console.log('Order processed:', order);
  res.status(201).json(order);
});

// Start the server
app.listen(3000, () => {
  console.log('E-commerce API running at http://localhost:3000');
});
