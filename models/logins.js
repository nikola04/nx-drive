const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loginsSchema = new Schema({
    user_id: {
        type: Object,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    userAgent:{
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Login = mongoose.model('logins', loginsSchema);
module.exports = Login;