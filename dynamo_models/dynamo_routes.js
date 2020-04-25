const dynamoose = require('dynamoose');
// const uuidv4 = require('uuid/v4');
const { v4: uuidv4 } = require('uuid');

const Schema = dynamoose.Schema;

const expiresConfig = {
    expires: {
        // ttl (time to live) set in seconds
        ttl: 15 * 24 * 60 * 60,
        // This is the name of our attribute to be stored in DynamoDB
        attribute: 'ttl'
    }
}

const dynamoRoutesSchema = new Schema({
    id: { // here i generate node-uuid v4's
        type: String,
        hashKey: true,
        required: true,
        default: uuidv4
    },
    name: {
        type: String,
        required: true,
        trim: true,
        // unique: true,
        index: {
            global: true,
            throughput: 5 // read and write are both 5 
        }
    }
}, {
    timestamps: true,
    throughput: { read: 15, write: 5 }
});

module.exports = dynamoose.model('Dynamo_Routes', dynamoRoutesSchema, expiresConfig);