const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Redis = require('redis');

// Create an Express app
const app = express();
const server = http.createServer(app);

// Create Redis clients for Pub/Sub
const redisPublisher = Redis.createClient();
const redisSubscriber = Redis.createClient();

redisPublisher.on('error', (err) => {
    console.error('Redis Publisher Error:', err);
});
  
redisSubscriber.on('error', (err) => {
    console.error('Redis Subscriber Error:', err);
});
  
// Ensure the Redis client is connected before performing any operations
redisPublisher.connect();
redisSubscriber.connect();

// Create a WebSocket server using the HTTP server
const wss = new WebSocket.Server({ server });

app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

// Track connected clients using a Map with userID as the key
const clients = new Map();

wss.on('connection', (ws, req) => {
  console.log('New client connected');

  // For example, extracting userID from query params or headers
  const userID = req.url.split('?userID=')[1]; // Modify this to suit your logic
  
  // Store the WebSocket connection against the userID
  clients.set(userID, ws);
  
  // Handle incoming messages
  ws.on('message', (message) => {
    console.log(`Received message from ${userID}: ${message}`);
    // Publish message to Redis for further processing if needed
    redisPublisher.publish('chat', message);
  });

  // Clean up when a client disconnects
  ws.on('close', () => {
    console.log(`${userID} disconnected`);
    clients.delete(userID); 
  });
});

// Subscribe to Redis channel
redisSubscriber.subscribe('chat', (message, channel) => {
  console.log(`Received message from Redis: ${message}`);
  
  // Send message only to the intended client(s)
  // Here, assuming the message contains the userID and message for that user.
  const { userID, msg } = JSON.parse(message);

  const client = clients.get(userID);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(msg); // Send the message to the intended client
  }
});

// Start the HTTP server
server.listen(8081, () => {
  console.log('Express server is running on http://localhost:8080');
});
