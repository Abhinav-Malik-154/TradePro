const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('❌ MONGODB_URI not found in .env');
    return;
  }
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log('✅ MongoDB connected successfully!');
  } catch (err) {
    console.log('❌ MongoDB connection failed:', err.message);
  } finally {
    await client.close();
  }
}
testConnection();
