import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { 
  CPU, CPUCooler, Motherboard, Memory, Storage, 
  VideoCard, Case, PowerSupply 
} from './models/productModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataMap = [
  { file: 'cpu.json', model: CPU },
  { file: 'cpu-cooler.json', model: CPUCooler },
  { file: 'motherboard.json', model: Motherboard },
  { file: 'memory.json', model: Memory },
  { file: 'internal-hard-drive.json', model: Storage },
  { file: 'video-card.json', model: VideoCard },
  { file: 'case.json', model: Case },
  { file: 'power-supply.json', model: PowerSupply },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to MongoDB...');

    for (const entry of dataMap) {
      const filePath = path.join(__dirname, 'data', entry.file);
      
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(rawData);

        await entry.model.deleteMany({}); 
        await entry.model.insertMany(jsonData);
        
        console.log(`✅ Imported ${jsonData.length} items into ${entry.model.modelName}`);
      }
      else {
        console.warn(`⚠️  File not found: ${entry.file}`);
      }
    }
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } 
  catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();