const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const createHttpError = require("http-errors");

const { roles } = require("../utils/constans");

//create user scema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [roles.admin, roles.moderator, roles.client],
        default: roles.client
    }
});

//middleware function for creating hash password 
//and this function is run before save the data in database [ {schema_name}.pre('save',{function}) ] 
userSchema.pre('save', async function (next) {
    try {
        if (this.isNew) {
            // first  check if coming all data is new by [isNew] method and encript the pasword by [bcrypt.hash]
            const hashPassword = await bcrypt.hash(this.password, 10);
            this.password = hashPassword;

            //to check for admin email
            if (this.email === process.env.ADMIN_EMAIL) {
                this.role = roles.admin;
            }

            //to check for moderator email
            if (this.email === process.env.MODERATOR_EMAIL) {
                this.role = roles.moderator;
            }
        }
        next();
    } catch (error) {
        next(error);
    }
})

//creating a function which check the login password is valid or not 
//[{scema_name}.methods.{function_name}=function(variable)]
userSchema.methods.isVerifyPassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password)
    } catch (error) {
        throw createHttpError.InternalServerError(error.message);
    }
}

//create user model and export it
const User = mongoose.model('User', userSchema);
module.exports = User;