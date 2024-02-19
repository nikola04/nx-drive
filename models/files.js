const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    owner_id: {
        type: String,
        required: true
    },
    givenName: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    ext: {
        type: String,
        default: null
    },
    copy_of: {
        type: String,
        default: null
    },
    have_copies: {
        type: Boolean,
        default: false
    },
    copied: {
        type: Number,
        default: 0
    },
    favorite: {
        type: Boolean,
        default: false
    },
    file_type: {
        type: String,
        default: null
    },
    file_size:{
        type: Number,
        default: null
    },
    contentType: {
        type: String,
        default: null
    },
    width: {
        type: Number,
        default: 0
    },
    height: {
        type: Number,
        default: 0
    },
    folder: {
        type: Boolean,
        required: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    modified: {
        type: Date,
        default: Date.now
    },
    entered_times: {
        type: Number,
        default: 0
    },
    entered: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Files = mongoose.model('files', fileSchema);
module.exports = Files;