const mongoose = require('mongoose');
const User = require('../models/user.model');
const { roles } = require('../utils/constans');

const router = require('express').Router();


//to manage the other user details
router.get('/users', async (req, res, next) => {
    try {
        const allUsers = await User.find();
        res.render('manage-user', { allUsers });
    } catch (error) {
        next(error);
    }
});

// to see the any user's profile details
router.get('/user/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error', 'Invalid Id');
            res.redirect('/admin/users');
            return;
        }
        const person = await User.findById(id);
        res.render('profile', { person });
        console.log(person);
    } catch (error) {
        next(error);
    }
});


// to change the any user's role
router.post('/update-role', async (req, res, next) => {
    try {
        const { id, role } = req.body;
        //check users' role and id is empty or not?
        if (!id || !role) {
            req.flash('error', 'Inavlid Request');
            return res.redirect('back');
        }

        //to check  user id is valid or not by mongoose property [mongoose.Types.ObjectId.isValid({id_variable})]
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error', 'Inavlid Object Id');
            return res.redirect('back');
        }
        const rolesArrey = Object.values(roles)
        // to check role is valid or not
        if (!rolesArrey.includes(role)) {
            req.flash('error', 'Inavlid Roles');
            return res.redirect('back');
        }

        // to check the admin's id
        // here (req.user.id)=is admin's id, because here user is admin
        if (req.user.id === id) {
            req.flash('error', 'Admin Can not remove themselves ,ask another admin');
            return res.redirect('back');
        }
        //update the role of another user and save in databse
        const user = await User.findByIdAndUpdate(id, { role: role }, { new: true, runValidators: true });
        req.flash('info', ` 🔔 Updated role for " ${user.email} " to ${user.role}`);
        res.redirect('/admin/users');
    } catch (error) {
        next(error)
        console.log(error);
    }
})

module.exports = router;
