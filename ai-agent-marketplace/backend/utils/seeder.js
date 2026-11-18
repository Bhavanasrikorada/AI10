const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Agent = require('../models/Agent');
const User = require('../models/User');
const { AGENTS, SEED_USERS } = require('./seedData');

const seedDB = async (autoDisconnect = false) => {
  try {
    const conn = await connectDB();
    if (!conn) {
      console.warn('[Seeder] Database connection unavailable. Skipping DB seed.');
      return;
    }

    // Upsert/insert each agent from catalog
    let addedCount = 0;
    for (const a of AGENTS) {
      const exists = await Agent.findOne({ id: a.id });
      if (!exists) {
        const agentDoc = new Agent(a);
        agentDoc.calculateTrustScore();
        await agentDoc.save();
        addedCount++;
      }
    }
    if (addedCount > 0) {
      console.log(`[Seeder] Seeded ${addedCount} new AI agents into the catalog.`);
    }

    // Seed demo users if not present
    for (const u of SEED_USERS) {
      const uExists = await User.findOne({ email: u.email.toLowerCase() });
      if (!uExists) {
        await User.create(u);
      }
    }

    const totalAgents = await Agent.countDocuments();
    console.log(`[Seeder] Total agents currently in catalog: ${totalAgents}`);

    if (autoDisconnect) {
      await mongoose.disconnect();
      console.log('[Seeder] Database disconnected.');
    }
  } catch (error) {
    console.error('[Seeder] Error seeding database:', error.message);
  }
};

if (require.main === module) {
  seedDB(true).then(() => process.exit(0));
}

module.exports = seedDB;
