const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config({ path: './.env' })

const morgan = require("morgan");
const createHttpError = require('http-errors');
const mongoose = require("mongoose");
const session = require("express-session");
const connectFlash = require('connect-flash');
const passport = require("passport");
const MongoStore = require("connect-mongo");
const connectEnsureLogin = require('connect-ensure-login');
const { roles } = require("./utils/constans");

const PORT = process.env.PORT || 3001;

app.use(morgan('dev'));

//set template engine(ejs)
app.set('view engine', 'ejs');

//rendering dynamic public file
app.use(express.static('public'));

//handeling body request
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


//initialize session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            // secure: true,  use in production for https
            httpOnly: true
        },
        store: MongoStore.create({
            mongoUrl: 'mongodb://localhost:27017/rolebaselearning',
            ttl: 1 * 24 * 60 * 60 // = 1 days valid. 
        })
    })
);

//for passport js authentication
app.use(passport.initialize());
app.use(passport.session());
require('./utils/passport.auth');

//for dynamic navbar rendering
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
})

//initializing connect-flash
app.use(connectFlash());
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

//routing page
app.use('/', require('./routes/index.route'));
app.use('/auth', require('./routes/auth.route'));
// app.use('/user', protectRouting, require('./routes/user.route'));
app.use('/user', connectEnsureLogin.ensureLoggedIn({ redirectTo: '/auth/login' }), require('./routes/user.route'));
app.use('/admin', connectEnsureLogin.ensureLoggedIn({ redirectTo: '/auth/login' }), ensureAdmin, require('./routes/admin.route'));


//handeling http error( for wrong routing/anything other errors)
app.use((req, res, next) => {
    next((createHttpError.NotFound()));
});
app.use((error, req, res, next) => {
    error.status = error.status || 500;
    res.status(error.status);
    res.render('error_40x', { error });
});

//connect to Database(mongo)
mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log("📁 Database Connected");

    app.listen(PORT, () => {
        console.log(`app is listening on port ${PORT} 🚀`);
    });
}).catch((err) => {
    console.log(err.message);
});

// function protectRouting(req, res, next) {
//     if (req.isAuthenticated()) {
//         next();
//     } else {
//         req.flash('error', 'please Login First')
//         res.redirect('/auth/login');
//     }
// }

//make this function to use this route only admin
function ensureAdmin(req, res, next) {
    if (req.user.role === roles.admin) {
        next();
    } else {
        req.flash('warning', 'You Are not Authorized to Acsess the page/route');
        res.redirect('back');
    }
}

//make this function to use this route only moderator
function ensureModerator(req, res, next) {
    if (req.user.role === roles.moderator) {
        next();
    } else {
        req.flash('warning', 'You Are not Authorized to Acsess the page/route');
        res.redirect('back');
    }
}


