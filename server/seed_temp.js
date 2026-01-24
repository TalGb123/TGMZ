const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import the models you created in the previous step
const { 
  CPU, CPUCooler, Motherboard, Memory, Storage, 
  VideoCard, Case, PowerSupply, Keyboard 
} = require('./models');

// Connection URL - Change 'pc_shop' to your desired database name
const MONGO_URI = 'mongodb://localhost:27017/pc_shop';

// Mapping filenames to their Mongoose Models
const dataMap = [
  { file: 'cpu.json', model: CPU },
  { file: 'cpu-cooler.json', model: CPUCooler },
  { file: 'motherboard.json', model: Motherboard },
  { file: 'memory.json', model: Memory },
  { file: 'internal-hard-drive.json', model: Storage },
  { file: 'video-card.json', model: VideoCard },
  { file: 'case.json', model: Case },
  { file: 'power-supply.json', model: PowerSupply },
  { file: 'keyboard.json', model: Keyboard },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB...');

    // Loop through each file configuration
    for (const entry of dataMap) {
      const filePath = path.join(__dirname, entry.file);
      
      if (fs.existsSync(filePath)) {
        // 1. Read the JSON file
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(rawData);

        // 2. Clear existing data (Optional: prevents duplicates if you run script twice)
        await entry.model.deleteMany({}); 

        // 3. Insert new data
        await entry.model.insertMany(jsonData);
        
        console.log(`✅ Imported ${jsonData.length} items into ${entry.model.modelName}`);
      } else {
        console.warn(`⚠️  File not found: ${entry.file} (Skipping)`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();