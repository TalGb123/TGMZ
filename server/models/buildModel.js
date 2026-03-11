import mongoose from 'mongoose';

const BuildSchema = new mongoose.Schema({
    buildID: { type: Number, unique: true },
    cpu: { type: Object, default: null },
    cpu_cooler: { type: Object, default: null },
    motherboard: { type: Object, default: null },
    ram: { type: Object, default: null },
    storage: { type: Object, default: null },
    power_supply: { type: Object, default: null },
    gpu: { type: Object, default: null },
    case: { type: Object, default: null },
    
    createdAt: { type: Date, default: Date.now }
});

BuildSchema.pre('save', async function () {
    if (this.isNew) {
        const last = await this.constructor.findOne().sort({ buildID: -1 }).select('buildID');
        this.buildID = last ? last.buildID + 1 : 1;
    }
});

export const Build = mongoose.model('Build', BuildSchema);