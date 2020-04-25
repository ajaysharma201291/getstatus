const dynamoose = require('dynamoose');
// const uuidv4 = require('uuid/v4');
const { v4: uuidv4 } = require('uuid');

const Schema = dynamoose.Schema;

const dyanmoStatusSchema = new Schema({
    id: { // here i generate node-uuid v4's
        type: String,
        hashKey: true,
        required: true,
        default: uuidv4
    },
    date: {
        type: String,
        required: true,
        trim: true,
        // unique: true,
        index: {
            global: true,
            throughput: 15 // read and write are both 15 
        }
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
    },
    // assignFlag: Number,
    // created: { type: Date, default: Date.now },
    // lastmsg: { type: String },
    // lasttime: { type: Date, default: Date.now },
}, {
    timestamps: true,
    throughput: { read: 5, write: 5 }
});

module.exports = dynamoose.model('Dynamo_Status', dyanmoStatusSchema);