import mongoose from 'mongoose';

const PerformanceProfileSchema = new mongoose.Schema({
    id_name: { type: String, required: true, unique: true },
    category: { type: String, enum: ['CPU', 'GPU'], required: true },
    
    tiers: {
        gaming: { type: Number, default: 0 },
        productivity: { type: Number, default: 0 },
        ai_workload: { type: Number, default: 0 } 
    },

    specific_benchmarks: {
        type: Map, 
        of: Number 
    }
});

export const PerformanceProfile = mongoose.model('PerformanceProfile', PerformanceProfileSchema);