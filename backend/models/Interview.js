const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    role: { type: String, required: true },
    techStack: { type: String, required: true },
    messages: [{
        sender: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    feedback: { type: String, default: '' },
    // THIS IS THE CRITICAL FIX:
    // We are adding a field to store the ID of the user who took the interview.
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
