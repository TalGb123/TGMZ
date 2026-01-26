import mongoose from 'mongoose';

const BuildSchema = new mongoose.Schema({
    
    // The Parts (We store the whole object so we keep the price/image info)
    cpu: { type: Object, default: null },
    cpu_cooler: { type: Object, default: null },
    motherboard: { type: Object, default: null },
    ram: { type: Object, default: null },
    storage: { type: Object, default: null },
    power_supply: { type: Object, default: null },
    gpu: { type: Object, default: null },
    case: { type: Object, default: null },
    
    // Automatic timestamp (so you know when it was built)
    createdAt: { type: Date, default: Date.now }
});

export const Build = mongoose.model('Build', BuildSchema);