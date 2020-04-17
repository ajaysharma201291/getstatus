const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const routesSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: { unique: true }
    }
});

module.exports = mongoose.model('Routes', routesSchema);