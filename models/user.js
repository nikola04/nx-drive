const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    f_name: {
        type: String,
        requred: false
    },
    l_name: {
        type: String,
        requred: false
    },
    language: {
        type: String,
        default: 'english'
    },
    region: {
        type: String,
        required: false
    },
    used_space: {
        type: Number,
        default: 0
    },
    payment_plan: {
        type: Number,
        default: 0
    },
    subscription_end: {
        type: Date,
        default: Date.now
    },
    verified_email: {
        type: Boolean,
        default: false
    },
    email_verification_token: {
        type: String,
        required: true
    },
    verification_email_expire_date: {
        type: Date,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('users', userSchema);
module.exports = User;