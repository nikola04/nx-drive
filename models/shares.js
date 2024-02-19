const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sharesSchema = new Schema({
    file_id: {
        type: Object,
        required: true
    },
    shared_by: {
        type: Object,
        required: true
    },
    shared_with: {
        type: Object,
        required: false
    },
    public_share: {
        type: Boolean,
        default: false
    },
    path: {
        type: String,
        required: true
    },
    shared_on: {
        type: Date,
        default: Date.now
    }
});

const Share = mongoose.model('shares', sharesSchema);
module.exports = Share;