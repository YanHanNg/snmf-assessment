require('dotenv').config();

//Library
const express = require('express');
const mysql = require('mysql2/promise');

const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const webPush = require('web-push');
const fetch = require('node-fetch');
const publicVapidKey = process.env.PUBLIC_VAPID_KEY ;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

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
const pool = mysql.createPool({   
    host: process.env.MYSQL_SERVER || 'localhost',   
    port: parseInt(process.env.MYSQL_SVR_PORT) || 3306,   
    database: process.env.MYSQL_SCHEMA,   
    user: process.env.MYSQL_USERNAME,   
    password: process.env.MYSQL_PASSWORD,   
    connectionLimit: parseInt(process.env.MYSQL_CONN_LIMIT) || 4,   
    timezone: process.env.DB_TIMEZONE || '+08:00'   
})

//Make a Closure, Take in SQLStatement and ConnPool  
const makeQuery = (sql, pool) => {  
    return (async (args) => {  
        const conn = await pool.getConnection();  
        try {  
            let results = await conn.query(sql, args || []);  
            //Only need first array as it contains the query results.  
            //index 0 => data, index 1 => metadata  
            return results[0];  
        }  
        catch(err) {  
            console.error('Error Occurred during Query', err);  
        }  
        finally{  
            conn.release();  
        }  
    })  
}  

//Morgan
app.use(morgan('combined'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors());

//Get User information from DB
const SQL_GET_USER_INFO = "SELECT username, notification, notification_token from user where username = ?";
const getUserInfo = makeQuery(SQL_GET_USER_INFO, pool);

// configure passport with a strategy
passport.use(
    new LocalStrategy(
        { usernameField: 'username', passwordField: 'password', passReqToCallback: true },
        ( req, user, password, done ) => {
            //perform the authentication
            console.info(`Username: ${user} and password: ${password}`);
            
            getUserInfo( [ user, password ] )
                .then(results => {
                    console.info(results);
                    if(results.length > 0)
                    {
                        done(null, 
                            {
                                username: user,
                                notification: results[0].notification,
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
            sub: req.user.username,
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
        res.json({ message: `Login at ${new Date()}` , token, user: req.user.username, notification: req.user.notification });
    })

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


//---------------------------------Notifications-------------------------------------------------------------------

let taskWaterNotification = cron.schedule('30 7-22 * * *', () => {
    console.info(`Running Task every 30mins ${new Date()}`);
})
taskWaterNotification.start();

let taskBreakfastNotification = cron.schedule('0 8 * * *', () => {
    console.info(`Running Task every day at 8am ${new Date()}`);
})
taskBreakfastNotification.start();

let taskLunchNotification = cron.schedule('0 12 * * *', () => {
    console.info(`Running Task every day at 12pm ${new Date()}`);
})
taskLunchNotification.start();

let taskDinnerNotification = cron.schedule('0 18 * * *', () => {
    console.info(`Running Task every day at 6pm ${new Date()}`);
})
taskDinnerNotification.start();

let taskExerciseNotification = cron.schedule('0 20 * * *', () => {
    console.info(`Running Task every day at 8pm ${new Date()}`);
})
taskExerciseNotification.start();

let taskSleepNotification = cron.schedule('0 22 * * *', () => {
    console.info(`Running Task every day at 10pm ${new Date()}`);
})
taskSleepNotification.start();

//-------------------------------------------------------------------------------------------------------------------

//--------------------------------------START NOTIFICATIONS----------------------------------------------------------

//Update the user with the Sub
const SQL_UPDATE_USER_SUB = "Update user set notification = ?, notification_token = ? where username = ?";
const updateUserSubSQL = makeQuery(SQL_UPDATE_USER_SUB, pool);

//webPush.setVapidDetails('127.0.0.1:8080', publicVapidKey, privateVapidKey);
app.post('/notificationsSub', (req, res) => {
    const token = req.body.token;
    const user = req.body.user;
    console.info(`Notification Token received >> ${token} for User >> ${user}`);

    //Update the user with the Subscription
    updateUserSubSQL( [ true, token, user ] )
        .then(result => {
            res.status(200).json({ message: 'Updated Notification Token', notification: true });
        })
});

app.post('/notificationsUnSub', (req, res) => {
    const user = req.body.user;
    console.info(`Unsubscribe to Notification for User >> ${user}`);

    //Update the user with the Subscription
    updateUserSubSQL( [ false, '', user ] )
        .then(result => {
            res.status(200).json({ message: 'Updated Notification Token', notification: false });
        })
});

app.get('/getNotification', (req, res) => {
    console.info('im here');
    getUserInfo( [ 'nyh' ])
        .then(results => {
            console.info(results);
            res.status(201).json({});
            const payload = JSON.stringify({
                notification: {
                title: 'Notifications are cool',
                body: 'Know how to send notifications through Angular with this article!',
                icon: 'https://www.shareicon.net/data/256x256/2015/10/02/110808_blog_512x512.png',
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
            // webPush.sendNotification(results[0].pushSubscription, payload)
            // .catch(error => console.error(error));

        })
})

//---------------------------END NOTIFICATION-----------------------------------------------------------