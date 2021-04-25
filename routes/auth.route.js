const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const passport = require("passport");
const connectEnsure = require("connect-ensure-login");

//imports user model for storing and using data(mongodb)
const User = require('../models/user.model');

router.get('/register', connectEnsure.ensureLoggedOut({ redirectTo: '/' }), async (req, res, next) => {
    res.render('register');
});

router.post('/register', connectEnsure.ensureLoggedOut({ redirectTo: '/' }),
    [
        body('name')
            .toUpperCase()
            .isLength({ min: 5 })
            .withMessage('At Least 5 letter required'),
        body('email')
            .trim()
            .isEmail()
            .normalizeEmail().toLowerCase()
            .withMessage('Email Must be a Valid email!'),
        body('password')
            .trim()
            .isLength({ min: 5 })
            .withMessage('Password length is short, minimum 5 character is required')


    ],
    async (req, res, next) => {
        try {
            //first create a error variable where store error details about validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                errors.array().forEach((error) => {
                    req.flash('error', error.msg);
                });
                res.render('register', { email: req.body.email, messages: req.flash() });
                return;
            }

            const { email, password } = req.body;
            //check the user is already exist or not
            const emailExit = await User.findOne({ email: email });
            if (emailExit) {
                req.flash('error', 'Email is already used!')
                res.redirect('/auth/register');
                return;
            }
            //check both password are same or not
            if (req.body.password != req.body.password2) {
                req.flash('error', 'password do not match!')
                res.render('register', { email: req.body.email, messages: req.flash() });
                return;
            }

            //send the all data to ourUser
            const ourUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            });
            //finally save the data in database
            await ourUser.save();
            req.flash('success', `👍 ${email} is registered successfully, Now you can login us.`)
            res.redirect('/auth/login')
        } catch (error) {

            // (The error is handel by error-handeler in applicationCache.js file which i created to handel error)
            next(error);
        }
    });


router.get('/login', ensureNotAuthenticated, async (req, res, next) => {
    res.render('login');
});

//using passport authentication and function is make in (passport.auth.js ) file
router.post('/login', ensureNotAuthenticated, passport.authenticate('local', {
    // successRedirect: "/user/profile",
    successReturnToOrRedirect: '/',
    failureRedirect: "/auth/login",
    failureFlash: true,
})
);




router.get('/logout', ensureAuthenticated, async (req, res, next) => {
    req.logout();
    res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('error', 'you are not Logged In')
        res.redirect('/auth/login');
    }
}

function ensureNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('back')
    } else {
        next();
    }
}
module.exports = router;