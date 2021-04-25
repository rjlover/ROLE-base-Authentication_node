const router = require('express').Router();

router.get('/profile', async (req, res, next) => {
    const person = req.user;
    // console.log(person);
    res.render('profile', { person });
});

router.get('/secret', async (req, res, next) => {
    res.render('secret');
});

module.exports = router;