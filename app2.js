const express = require('express');
const bodyParser = require('body-parser');
const dynamoose = require("dynamoose");
const cors = require('cors');
const AWS = require('aws-sdk');
const AWSXRay = require('aws-xray-sdk');

require('dotenv').config();

const environment = process.env.NODE_ENV;
const port = process.env.PORT;

const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    regionId: process.env.AWS_REGION
}

const useLocal = process.env.NODE_ENV !== 'production';

const dynamodb = new AWS.DynamoDB({
    credentials,
    /**
   * When working locally, we'll use the Localstack endpoints. This is the one for S3.
   * A full list of endpoints for each service can be found in the Localstack docs.
   */
    //'host.docker.internal:4569'
    endpoint: useLocal ? 'http://localhost:4569' : undefined,
});

dynamoose.setDDB(dynamodb);
// dynamoose.revertDDB();

process.env.NODE_ENV === 'production' ? dynamoose.setDefaults({ create: false }) : null;

// dynamoose.AWS = AWSXRay.captureAWS(require('aws-sdk'));

const createDynamooseInstance = () => {
    // console.log(process.env);
    // dynamoose.AWS.config.update({
    //     // dynamodb: {
    //     //     endpoint: environment !== 'production' ? "http://localhost:4569" : undefined
    //     // },
    //     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //     secretAccessKey: process.env.AWS_SECRET_KEY,
    //     region: process.env.AWS_REGION
    // });

    // dynamoose.AWS.config.region = process.env.AWS_REGION;

    // This defaults to "http://localhost:8000"

    dynamoose.local(environment !== 'production' ? "http://localhost:4569" : undefined);
}

createDynamooseInstance();

// console.log(dynamoose.ddb());

const Status = require('./dynamo_models/dynamo_status');
const Users = require('./dynamo_models/dynamo_user');
const Routes = require('./dynamo_models/dynamo_routes');

// let start = new Date();
// start.setHours(0, 0, 0, 0);

// let end = new Date();
// end.setHours(23, 59, 59, 999);

// Status.scan().where('date').between(start, end).exec()
//     .then(res => {
//         console.log(res)
//     }).catch(err => console.log(err))
// let filter = {
//     TableName: "Dynamo_Users",
//     FilterExpression: '#metadata.name = :metadataValue',
//     ExpressionAttributeNames: {
//         "#metadata.name": "metadata.name"
//     },
//     ExpressionAttributeValues: {
//         ':metadataValue': 'birthday_date'
//     }
// }

let filter = {
    TableName: "Dynamo_Users",
    // ConditionExpression: 'attribute_exists(#metadata.#metadataName)',
    FilterExpression: '#metadata.#metadataName = :metadataValue',
    ExpressionAttributeNames: {
        '#metadata': 'metadata',
        '#metadataName': 'name'
    },
    ExpressionAttributeValues: {
        ':metadataValue': 'birthday_date'
    }
    // FilterExpression: '#metadata = :metadataValue',
    // ExpressionAttributeNames: {
    //     '#metadata': 'metadata',
    //     // '#metadataName': 'name'
    // },
    // ExpressionAttributeValues: {
    //     ':metadataValue': {
    //         "name": 'birthday_date'
    //     }
    // }
}

Users.scan(filter).exec().then(res => {
    console.log(res)
}).catch(err => console.log(err))

// let dat = new Routes({ name: 'Route1' });
// dat.save();

// console.log(Routes.length);

// console.log(Routes.scan().exec().then(res => {
//     console.log(res.count)
// }))
// console.log(Users.scan().exec().then(res => {
//     console.log(res.count)
// }))
// console.log(Status.scan().exec().then(res => {
//     console.log(res.count)
// }))

// var Schema = dynamoose.Schema;
// var Table = dynamoose.Table;

// var table = new Table('Dynamo_Routes', null, null, dynamoose);

// table.describe(function(err, data) {
//     if (err) {
//         console.log(JSON.stringify(err));

//     } else {
//         console.log(JSON.stringify(data, null, 2));
//         console.log("Number of item =====>", JSON.stringify(data.Table.ItemCount, null, 2));
//     }
// });

// console.log(Routes.query({}, (err, data) => {
//     console.log(data);
// }))

const initializeData = async () => {

    let routes = await Routes.scan().exec();
    const users = await Users.scan().exec();

    if (routes.count == 0) {
        // const routesArray = [];
        for (let i = 0; i < 100; i++) {
            let newRoute = new Routes({ name: `Route${i + 1}` });
            await newRoute.save();
            // routesArray.push(newRoute);
        }
        // await Routes.batchPut(routesArray);
    }

    if (users.count == 0) {
        // const usersArray = [];
        routes = await Routes.scan().exec();

        for (let i = 0; i < routes.count; i++) {

            // for (let j = 0; j < 100; j++) {
            for (let j = 0; j < 10; j++) {

                let newUser = new Users({
                    routeId: routes[i].id,
                    email: `${routes[i].name}_user${j + 1}@test.com`,
                    firstName: `${routes[i].name}_firstName${j + 1}`,
                    lastName: `${routes[i].name}_lastName${j + 1}`,
                    cellPhone: `${routes[i].name}_cellPhone${j + 1}`,
                    country: `${routes[i].name}_country${j + 1}`,
                    // metadata: (j % 7 == 0) ? [{
                    //     metadataName: 'birthday_date',
                    //     metadataValue: randomDate()
                    // }] : []
                    metadata: (j % 7 == 0) ? [{
                        name: 'birthday_date',
                        value: randomDate()
                    }] : []
                });

                await newUser.save();

                // usersArray.push(newUser);

            }
        }

        // console.log(usersArray);

        // await Users.batchPut(usersArray);
    }
}

initializeData().then(() => { console.log("Initialized"); })
    .catch(() => { console.log("error in initialization"); })

const randomDate = (date1, date2) => {

    function randomValueBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    date1 = date1 || '01-01-1900';
    date2 = date2 || new Date().toLocaleDateString();
    date1 = new Date(date1).getTime();
    date2 = new Date(date2).getTime();

    if (date1 > date2) {
        return new Date(randomValueBetween(date2, date1)).toLocaleDateString();
    } else {
        return new Date(randomValueBetween(date1, date2)).toLocaleDateString();

    }
}

const cron = require('cron').CronJob;
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const app = express();
const router = express.Router();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

let resultString = "";

const getAndProcessCollection = (skip) => {
    var currentDate = new Date(),
        date = currentDate.getDate(),
        month = currentDate.getMonth() + 1; // getMonth returns (0-11)

    return (
        Users.aggregate([
            { $unwind: "$metadata" },
            { $match: { "metadata.name": "birthday_date" } },
            {
                $lookup: {
                    from: "routes",// other table name
                    localField: "routeId",   // name of users table field
                    foreignField: "_id", // name of userinfo table field
                    as: "route_name"         // alias for userinfo table
                }
            },
            { $unwind: "$route_name" },
            {
                $project: {
                    _id: 1,
                    email: 1,
                    firstName: 1,
                    lastName: 1,
                    cellPhone: 1,
                    routename: "$route_name.name",
                    date: {
                        $dayOfMonth: '$metadata.value'
                    },
                    month: {
                        $month: '$metadata.value'
                    }
                }
            },
            {
                $match: {
                    date: date, // Current date of the month
                    month: month // Current month
                }
            },
            { $skip: skip },
            { $limit: 50 }]).then(collection => {
                processCollection(collection).then(results => {
                    resultString += results.join(',');
                    if (collection.length < 50) {
                        const todayResult = new Status({ date: new Date(), result: resultString });
                        todayResult.save().then(tod => {
                            //send email using result
                            sendEmail("admin@test.com", `${new Date()} Status Report`, resultString);
                            return new Promise((resolve, reject) => {
                                return resolve(resultString);
                            });
                        }).catch(err => {
                            resultString = err.message;
                            return new Promise((resolve, reject) => {
                                return reject(resultString);
                            });
                        });
                    } else {
                        skip += 50;
                        return getAndProcessCollection(skip);
                    }
                }).catch(err => {
                    console.log(err.message);
                    return new Promise((resolve, reject) => {
                        return reject(err.message);
                    });
                });
            })
    );
};

const sendEmail = (mto, subject, textBody) => {
    const EmailKeys = {
        from: '"Support Team" <support.test@test.com>',
        host: "smtp.gmail.com",
        port: 465,
        logger: true,
        debug: true,
        tls: {
            rejectUnauthorized: false
        },
        secure: true,
        companyName: "Dummy",
    }
    const transporter = nodemailer.createTransport(
        smtpTransport({
            host: EmailKeys.host,
            port: EmailKeys.port,
            logger: EmailKeys.logger,
            debug: EmailKeys.debug,
            tls: EmailKeys.tls,
            secure: EmailKeys.secure,
            auth: {
                user: process.env.EMAIL_USERNAME, // your smtp username
                pass: process.env.EMAIL_PASSWORD // your smtp password
            }
        })
    );

    var mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: mto,
        subject: subject,
        text: textBody,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            return 0;
        } else {
            console.log(info);
            return 1;
        }
    });
}


const processCollection = (coll) => {
    const promises = [];
    coll.forEach(x => {
        promises.push(sendMessage(x));
    });
    return Promise.all(promises);
};

const sendMessage = (detail) => {
    return new Promise((resolve, reject) => {
        (val => {
            setTimeout(() => {
                console.log(JSON.stringify(val));
                resolve(JSON.stringify(val));
            }, 300);
        })(detail);
    });
}



const processTodayRecords = () => {
    return new Promise((resolve, reject) => {
        let start = new Date();
        start.setHours(0, 0, 0, 0);

        let end = new Date();
        end.setHours(23, 59, 59, 999);
        //check to allow only one time execution for the given day
        // Status.count({ date: { $gte: start, $lt: end } }).then(count => {
        Status.scan().where('date').between(start, end).exec().then(res => {
            if (res.count <= 0) {
                var skip = 0;
                return getAndProcessCollection(skip).then(resultData => {
                    resolve(resultData);
                }).catch(err => {
                    reject(err.message);
                });
            } else {
                resolve(`Records already processed for ${new Date()}`);
            }
        }).catch(err => {
            reject(err.message);
        });
    })
}

//manuall running
router.get('/users', (req, res) => {
    processTodayRecords().then(data => data).then(result => {
        res.status(200).send(result);
    }).catch(err => {
        console.log(err);
        res.status(500).send(err.message);
    });
});

app.use('/api', router);

// //scheduled running
// //run jub on 2:30 a every day
// var birthDayNotificationJob = new cron('00 30 02 * * 0-6', function () {
//     processTodayRecords().then(data => data).then(res => {
//         console.log(res);
//     }).catch(err => {
//         console.log(err);
//     })
// });

// birthDayNotificationJob.start();

app.use((err, req, res, next) => {
    return res.status(err.status || 500).send({
        error: err.code,
        description: err.message,
    });
});

app.listen(`${port}`, () => {
    console.log(`Server up and listening on port :${port}`);
});

app.on('error', (err) => {
    return res.status(err.status || 500).send({
        error: err.code,
        description: err.message,
    });
});
