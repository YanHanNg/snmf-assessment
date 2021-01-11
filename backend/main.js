require('dotenv').config();

//Library
const express = require('express');
const mysql = require('mysql2/promise');

const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

//Email
const { sendEmail } = require('./mail.js');

//MySQL
const { makeQuery, makeQueryForBulkInsert, pool } = require('./mysql_db.js');

//Telegram Bot
const { bot, sendRemindersViaTelegram } = require('./telegrambot.js');

//Passport core
const passport = require('passport');
//Passport Strategy
const LocalStrategy = require('passport-local').Strategy;

//Cron
const cron = require('node-cron');

//Token Secret for Login
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'abcd1234';

const app = express();
const PORT = process.env.APP_PORT || 3000;

// DATABASE  
// Create the Database Connection Pool  
// const pool = mysql.createPool({   
//     host: process.env.MYSQL_SERVER || 'localhost',   
//     port: parseInt(process.env.MYSQL_SVR_PORT) || 3306,   
//     database: process.env.MYSQL_SCHEMA,   
//     user: process.env.MYSQL_USERNAME,   
//     password: process.env.MYSQL_PASSWORD,   
//     connectionLimit: parseInt(process.env.MYSQL_CONN_LIMIT) || 4,   
//     timezone: process.env.DB_TIMEZONE || '+08:00'   
// })

//Make a Closure, Take in SQLStatement and ConnPool  
// const makeQuery = (sql, pool) => {  
//     return (async (args) => {  
//         const conn = await pool.getConnection();  
//         try {  
//             let results = await conn.query(sql, args || []);  
//             //Only need first array as it contains the query results.  
//             //index 0 => data, index 1 => metadata  
//             return results[0];  
//         }  
//         catch(err) {  
//             console.error('Error Occurred during Query', err);  
//             throw new Error(err);
//         }  
//         finally{  
//             conn.release();  
//         }  
//     })  
// }  

//Morgan
app.use(morgan('combined'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());

//Get User information from DB
const SQL_GET_USER_INFO = "SELECT user_id, name, email, reward_pts, notification, notification_token from user where user_id = ?";
const getUserInfo = makeQuery(SQL_GET_USER_INFO, pool);

// configure passport with a strategy
passport.use(
    new LocalStrategy(
        { usernameField: 'username', passwordField: 'password', passReqToCallback: true },
        ( req, user, password, done ) => {
            //perform the authentication
            console.info(`user_id: ${user} and password: ${password}`);
            
            getUserInfo( [ user, password ] )
                .then(results => {
                    if(results.length > 0)
                    {
                        done(null, 
                            {
                                user: {
                                    user_id: results[0].user_id,
                                    name: results[0].name,
                                    email: results[0].email,
                                    reward_pts: results[0].reward_pts,
                                    notification: results[0].notification,
                                },
                                loginTime: (new Date().toString())
                            }
                        )
                        return
                    }
                    else{
                        done('Incorrect username and password', false);
                        return
                    }
                })
                .catch(error => {
                    done('Error Occurred', false);
                })
        }
    )
)

//passport initialize after json and formurlencoded
app.use(passport.initialize());

const mkAuth = (passport) => {
    return (req, res, next) => {
        const f = passport.authenticate('local', 
            (err, user, info) => {
                if((null != err) || (!user)) {
                    res.status(401).json({ error: err })
                    return
                }
                req.user = user;
                next();
            }
        )
        // Add this to call yourself
        f(req, res, next)
    }
}

const localAuth = mkAuth(passport);

app.post('/login', 
    //passport.authenticate('local', { session: false }),
    localAuth,
    (req, res) => {
        //do smth
        console.info('user: ', req.user);

        //generate JWT token
        const token = jwt.sign({
            sub: req.user.user_id,
            iss: 'YLYC',
            iat: (new Date()).getTime() / 1000, 
            exp: ((new Date()).getTime() / 1000) + (60 * 60),
            nbf: ((new Date()).getTime() / 1000) + 15,
            data: {
                loginTime: req.user.loginTime
            }
        }, TOKEN_SECRET)

        res.status(200);
        res.type('application/json');
        res.json({ message: `Login at ${new Date()}` , token, user: req.user });
    })


app.use(express.static(__dirname + '/public'));

//Start Express
pool.getConnection()
    .then(conn => {
        let p0 = Promise.resolve(conn);
        let p1 = conn.ping;
        return Promise.all( [ p0, p1 ]);
    })
    .then(results => {
        //Start Express
        app.listen(PORT, ()=> {
            console.info(`Server Started on PORT ${PORT} at ${new Date()}`);
        })

        let conn = results[0];
        conn.release();
    })
    .catch(error => {
        console.error('Error Occurred: ', error);
    })


//---------------------------------START Reminders-------------------------------------------------------------------

const REMINDER_TYPE_WATER = 1;
const REMINDER_TYPE_BREAKFAST = 2;
const REMINDER_TYPE_LUNCH = 3;
const REMINDER_TYPE_DINNER = 4;
const REMINDER_TYPE_EXERCISE = 5;
const REMINDER_TYPE_SLEEP = 6;

//Get all the user info
const SQL_GET_ALL_USER = "SELECT user_id, name, email, reward_pts, notification, notification_token from user";
const getAllUser = makeQuery(SQL_GET_ALL_USER, pool);

const SQL_GET_REMINDER_TYPE = "SELECT * from reminder_type where id = ?";
const getReminderType = makeQuery(SQL_GET_REMINDER_TYPE, pool);

//Insert a Reminder to Drink Water
const SQL_INSERT_REMINDERS = "Insert into Reminders (reminder_type_id, title, image, message, reminder_date, user_id) values ?";
const insertReminders = makeQueryForBulkInsert(SQL_INSERT_REMINDERS, pool);

let taskWaterNotification = cron.schedule('30 7-21 * * *', () => {
    console.info(`Running Task every 30mins between 7am to 10pm ${new Date()}`);
    createReminders(REMINDER_TYPE_WATER);
})
taskWaterNotification.start();

let taskBreakfastNotification = cron.schedule('0 8 * * *', () => {
    console.info(`Running Task every day at 8am ${new Date()}`);
    createReminders(REMINDER_TYPE_BREAKFAST);
})
taskBreakfastNotification.start();

let taskLunchNotification = cron.schedule('0 12 * * *', () => {
    console.info(`Running Task every day at 12pm ${new Date()}`);
    createReminders(REMINDER_TYPE_LUNCH);
})
taskLunchNotification.start();

let taskDinnerNotification = cron.schedule('0 18 * * *', () => {
    console.info(`Running Task every day at 6pm ${new Date()}`);
    createReminders(REMINDER_TYPE_DINNER);
})
taskDinnerNotification.start();

let taskExerciseNotification = cron.schedule('0 20 * * *', () => {
    console.info(`Running Task every day at 8pm ${new Date()}`);
    createReminders(REMINDER_TYPE_EXERCISE);
})
taskExerciseNotification.start();

let taskSleepNotification = cron.schedule('0 22 * * *', () => {
    console.info(`Running Task every day at 10pm ${new Date()}`);
    createReminders(REMINDER_TYPE_SLEEP);
})
taskSleepNotification.start();

//TESTING PURPOSE
// let testNotification = cron.schedule('30 58 * * * *', async () => {
//     console.info(`Running Task every 5mins ${new Date()}`);
//     createReminders(REMINDER_TYPE_SLEEP);
// })
// testNotification.start();

const createReminders = (type) => {
    //Create a Reminder for all the users and send notification
    return Promise.all([getAllUser(), getReminderType([type])])
        .then(results => {
            //Get user and ReminderType
            let user = results[0];
            let reminderType = results[1][0];

            //Set Reminder Date
            let reminderDate = new Date();

            console.info(type);
            switch(type) {
                case REMINDER_TYPE_WATER: 
                    reminderDate.setMinutes('30', '00', '00');
                    console.info('execute 30 mins');
                    break;
                default: 
                    reminderDate.setMinutes('00', '00', '00');
                    console.info('execute 00min');
                    break;
            }

            let values = [];
            for(let u of user)
            {
                let v = [ reminderType.id, reminderType.title, reminderType.image, reminderType.message, reminderDate, u.user_id ];
                values.push(v);
            }
            return Promise.all([insertReminders(values), Promise.resolve(user), Promise.resolve(reminderType)]);
        })
        .then(results => {

            //After Insert Successfully.
            //Send Push Notification to User
            let user = results[1];
            let reminderType = results[2];
            for(let u of user)
            {
                //Check if user is Subscribed for Notification if so do a push
                if(u.notification && u.notification_token != null)
                {
                    let payload = getNotificationPayLoad(reminderType, u);

                    fetch('https://fcm.googleapis.com/fcm/send', {
                    method: 'post',
                    body: payload,
                    headers : { 'Authorization': `key=${process.env.FCM_AUTHORIZATION_KEY}`,
                                'Content-Type': 'application/json'
                        },
                     })
                    .then(res => res)
                    .then(json => console.log(json));
                }
            }

            //Send Reminders Via Telegram
            sendRemindersViaTelegram(reminderType);

        })
        .catch(err => {
            console.error("Error Occured During Inserting Reminders", err);
        })
}

const getNotificationPayLoad = (reminderType, user) => {
    const payload = JSON.stringify({
        notification: {
        title: reminderType.title,
        body: reminderType.message,
        icon: reminderType.image,
        vibrate: [100, 50, 100],
        },
        to: user.notification_token
    });

    return payload;
}


//-------------------------------------------------------------------------------------------------------------------

//--------------------------------------START USER NOTIFICATIONS-----------------------------------------------------

//Update the user with the Sub
const SQL_UPDATE_USER_SUB = "Update user set notification = ?, notification_token = ? where user_id = ?";
const updateUserSubSQL = makeQuery(SQL_UPDATE_USER_SUB, pool);

//webPush.setVapidDetails('127.0.0.1:8080', publicVapidKey, privateVapidKey);
app.post('/notificationsSub', (req, res) => {
    const token = req.body.token;
    const user = req.body.user;
    console.info(`Notification Token received >> ${token} for User >> ${user}`);

    //Update the user with the Subscription
    updateUserSubSQL( [ true, token, user ] )
        .then(result => {
            if(null != result)
                return res.status(200).json({ message: 'Updated Notification Token', notification: true });
        })
        .catch(err => {
            return res.status(500).json({ message: err });
        })
});

app.post('/notificationsUnSub', (req, res) => {
    const user = req.body.user;
    console.info(`Unsubscribe to Notification for User >> ${user}`);

    //Update the user with the Subscription
    updateUserSubSQL( [ false, '', user ] )
        .then(result => {
            if(null != result)
                return res.status(200).json({ message: 'Updated Notification Token', notification: false });
        })
        .catch(err => {
            return res.status(500).json({ message: err });
        })
});

app.get('/getNotification', (req, res) => {
    getUserInfo( [ 'nyh' ])
        .then(results => {
            console.info(results);
            res.status(201).json({});
            const payload = JSON.stringify({
                notification: {
                title: 'Notifications are cool',
                body: 'Know how to send notifications through Angular with this article!',
                icon: 'https://nyh.sfo2.digitaloceanspaces.com/images/water-reminder.png',
                vibrate: [100, 50, 100],
                data: {
                    url: 'https://medium.com/@arjenbrandenburgh/angulars-pwa-swpush-and-swupdate-15a7e5c154ac'
                    }
                },
                to: 'fqO9z0mrYY-cvoHLplPxSv:APA91bH1nMehSfGvrPUIz_WPW8oKNstpymm9uVQHdqcK5gbb1hq3-6f7F9zdWeq7QxhS2-_OqC8If8dwfl7zcJfKP-mV7n7UN-eW6c03QaTlKsNWFt8Tud6D-e6GUSlqE_DY0m3_LLjG'
            });
            fetch('https://fcm.googleapis.com/fcm/send', {
                method: 'post',
                body: payload,
                headers : { 'Authorization': 'key=AAAA9MKvjkU:APA91bFrLYe8uBli6w0IB-l3pYXWjuOOMq8Y2xHgxy5yzkE9D3zEMV0ApXzRJqbRDIzd_jYOLxw3FEVj_npO3N5pBBV_UITs3BlVhPbTrmOgd3W5Mlm-b9VDKDEq_P62dRcE7-e7QQM2',
                    'Content-Type': 'application/json'
                },
            })
            .then(res => res)
            .then(json => console.log(json));
        })
})

//---------------------------END NOTIFICATION-----------------------------------------------------------

//---------------------------User Sign Up---------------------------------------------------------------

const SQL_INSERT_USER = "Insert Into User (user_id, name, password, email) values (?, ? ,sha(?), ?)";
const insertUser = makeQuery(SQL_INSERT_USER, pool);

app.post('/signup', (req, res) => {
    const user = req.body;

    insertUser([ user.user_id, user.name, user.password, user.email])
        .then(results => {
            sendEmail(user.email, 'Register');
            return res.status(201).json({ message: "User Created Successfully"})
            
        })
        .catch(error => {
            return res.status(500).type('application/json').json({ message: 'Error During Signing up.'})
        })
})

//---------------------------------Handle Reminders----------------------------------------------------

const REMINDER_STATUS_UNDONE = 0;
const REMINDER_STATUS_COMPLETED = 1;

const SQL_GET_USER_REMINDERS = "SELECT * from Reminders where user_id = ? order by reminder_date desc";
const getUserReminders = makeQuery(SQL_GET_USER_REMINDERS, pool);

app.get('/getReminders', (req, res) => {
    console.info('res query', req.query);
    const user_id = req.query.user_id;

    getUserReminders([user_id])
        .then(results => {
            res.status(200).json(results);
        })
})

// 1. image 2. message 3. status where 4. user_id 5. id
const SQL_UPDATE_USER_REMINDER = "UPDATE Reminders set image = ?, message = ?, status = ? where user_id = ? and id = ?"
const updateUserReminder = makeQuery(SQL_UPDATE_USER_REMINDER, pool);

app.post('/completeReminder', (req, res) => {
    const r = req.body.reminder;

    updateUserReminder([r.image, r.message, REMINDER_STATUS_COMPLETED, r.user_id, r.id])
        .then(results => {
            if(results.affectedRows == 0)
                return res.status(409).type('application/json').json({ message: 'Reminder not found. 0 Record Updated'})
            else
                return res.status(200).type('application/json').json({ message: 'Reminder Updated'});
        })
        .catch(err => {
            return res.status(500).type('application/json').json({ message: err.message })
        })
})


//-------------------------SEND EMAIL-------------------------------------------------------------------
app.get('/sendMail', (req, res) => {
    sendEmail('ylyc2021@gmail.com', 'Register')
        .then(results => {
            console.info('Email Sent.....', results);
            return res.status(200).json({message: 'Email sent'});
        })
        .catch(error => console.error('Error during sending Email', error.message));
})

//------------------------Telegram Bot-------------------------------------------------------------------
bot.launch();