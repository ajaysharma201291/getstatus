const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const statusSchema = new Schema({
    date: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: { unique: true }
    },
    isScanned: {
        type: Boolean,
        required: true,
        enum: [true, false],
        default: true
    },
    result: {
        type: String,
        required: true,
        trim: true
    }
});

module.exports = mongoose.model('Status', statusSchema);