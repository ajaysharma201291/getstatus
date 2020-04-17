const mongoose = require('mongoose');
// const metaDataSchema = require('./metaData');
const Schema = mongoose.Schema;

const metaDataSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    }
});

const usersSchema = new Schema({
    routeId: {
        ref: "Routes",
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: { unique: true }
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    cellPhone: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    metadata: [metaDataSchema]
});

module.exports = mongoose.model('Users', usersSchema);
