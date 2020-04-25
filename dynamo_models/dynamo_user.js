const dynamoose = require('dynamoose');
// const uuidv4 = require('uuid/v4');
const { v4: uuidv4 } = require('uuid');

const Schema = dynamoose.Schema;

// const dynamoMetaDataSchema = new Schema({
//     // id: { // here i generate node-uuid v1's
//     //     type: String,
//     //     hashKey: true,
//     // },
//     name: {
//         type: String,
//         required: true,
//         trim: true,
//         // unique: true,
//         index: { global: true }
//     },
//     value: {
//         type: String,
//         required: true,
//         trim: true
//     }
// }, {
//     timestamps: true
// });

const dynamoUsersSchema = new Schema({
    id: { // here i generate node-uuid v4's
        type: String,
        hashKey: true,
        required: true,
        default: uuidv4
    },
    routeId: {
        // ref: "Dynamo_Routes",
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        // unique: true,
        index: {
            global: true,
            throughput: 15 // read and write are both 15 
        }
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
        // unique: true,
        index: {
            global: true,
            throughput: 15 // read and write are both 15 
        }
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    // metadata: [dynamoMetaDataSchema]
    // metadata: [{
    //     // id: { // here i generate node-uuid v4's
    //     //     type: String,
    //     //     hashKey: true,
    //     //     required: true,
    //     //     default: uuidv4
    //     // },
    //     name: {
    //         type: String,
    //         required: true,
    //         trim: true,
    //         // unique: true,
    //         index: {
    //             global: true,
    //             throughput: 15 // read and write are both 15 
    //         }
    //     },
    //     value: {
    //         type: String,
    //         required: true,
    //         trim: true
    //     }
    //     // metadataName: {
    //     //     type: String,
    //     //     required: true,
    //     //     trim: true,
    //     //     // unique: true,
    //     //     index: {
    //     //         global: true,
    //     //         throughput: 15 // read and write are both 15 
    //     //     }
    //     // },
    //     // metadataValue: {
    //     //     type: String,
    //     //     required: true,
    //     //     trim: true
    //     // }
    // }
    // ]
    metadata: {
        type: 'list',
        list: [{
            name: {
                type: String,
                required: true,
                trim: true,
                // unique: true,
                index: {
                    global: true,
                    throughput: 15 // read and write are both 15 
                }
            },
            value: {
                type: String,
                required: true,
                trim: true
            }
        }]
    }
}, {
    timestamps: true,
    throughput: { read: 25, write: 15 }
});

module.exports = dynamoose.model('Dynamo_Users', dynamoUsersSchema);