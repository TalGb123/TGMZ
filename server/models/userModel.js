import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, 
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: false },
    birthday: { type: String, required: false },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    savedBuilds: { type: [String], default: [] } 
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);