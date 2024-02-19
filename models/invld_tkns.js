const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
    type: {
        type: String,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    message: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const InvToken = mongoose.model('invalid_tokens', tokenSchema);
module.exports = InvToken;