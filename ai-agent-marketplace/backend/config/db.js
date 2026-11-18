const mongoose = require('mongoose');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let mongodProcess = null;

/**
 * Attempts to launch local mongod if not already running
 */
function tryStartLocalMongod() {
  return new Promise((resolve) => {
    const mongoBin = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
    if (!fs.existsSync(mongoBin)) {
      return resolve(false);
    }
    const dbPath = path.join(__dirname, '..', 'data', 'db');
    try {
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }
    } catch (e) {
      // ignore
    }

    try {
      const child = spawn(mongoBin, ['--dbpath', dbPath, '--port', '27017'], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      mongodProcess = child;
      // Allow a brief moment for mongod to bind port
      setTimeout(() => resolve(true), 2000);
    } catch (err) {
      console.warn('Could not auto-start mongod:', err.message);
      resolve(false);
    }
  });
}

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_agent_marketplace';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB] Initial connection attempt failed: ${err.message}. Checking local daemon...`);
    await tryStartLocalMongod();
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000
      });
      console.log(`[MongoDB] Connected after daemon start: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (secondErr) {
      console.error(`[MongoDB] Connection error: ${secondErr.message}`);
      console.warn('[MongoDB] Running in offline/disconnected state until MongoDB daemon becomes available.');
      return null;
    }
  }
};

module.exports = connectDB;
