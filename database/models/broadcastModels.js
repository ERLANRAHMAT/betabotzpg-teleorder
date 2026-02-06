const mongoose = require('mongoose');
const { Schema } = mongoose;

const BroadcastIdSchema = new Schema({
    usernameTelegram: {
        type: String,
    },
    idTelegram: {
        type: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Broadcast_Data', BroadcastIdSchema, "broadcast_data");