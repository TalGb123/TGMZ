import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    id: { 
        type: String, 
        required: true, 
        unique: true // Ensures no two users have the same ID
    }, 
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        required: false // Optional
    },
    birthday: { 
        type: String, 
        required: false // Storing as String is easiest for simple inputs
    },
    password: { 
        type: String, 
        required: true 
    }
});

export const User = mongoose.model('User', UserSchema);