const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    payment_id: {
        type: String,
        required: true
    },
    payment_plan: {
        type: Number,
        required: true
    },
    full_year: {
        type: Boolean,
        default: false
    },
    started_at: {
        type: Date,
        default: Date.now
    },
    success: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Payment = mongoose.model('payments', paymentSchema);
module.exports = Payment;