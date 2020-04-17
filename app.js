const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const cors = require('cors');
const Status = require('./models/status');
const Users = require('./models/user');
const cron = require('cron').CronJob;
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

require('dotenv').config();

const app = express();
const router = express.Router();

const environment = process.env.NODE_ENV;
const port = process.env.PORT;
const connUri = process.env.MONGO_PATH;

mongoose.connect(connUri, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

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
        Status.count({ date: { $gte: start, $lt: end } }).then(count => {
            if (count <= 0) {
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

//scheduled running
//run jub on 2:30 a every day
var birthDayNotificationJob = new cron('00 30 02 * * 0-6', function () {
    processTodayRecords().then(data => data).then(res => {
        console.log(res);
    }).catch(err => {
        console.log(err);
    })
});

birthDayNotificationJob.start();

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
