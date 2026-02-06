const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    transactionId: {
        type: String,
        required: true,
    },
    accessKey: {
        type: String,
        required: false,
    },
    telegramUserId: {
        type: Number,
        required: true,
    },
    productCode: {
        type: String,
        required: true,
    },
    formattedDate: {
        type: String,
        required: true
    },
    feeTax: {
        type: Number,
        required: true
    },
    orderQuantity: {
        type: Number,
        required: true,
        min: 1,
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    keteranganVariant: {
        type: String,
        required: true
    },
    orderData: {
        type: String,
        required: true,
    },
    chatId: {
        type: String,
        required: true,
    },
    messageId: {
        type: String,
        required: true,
    },
    isCanceled: {
        type: Boolean,
        required: true,
        default: false,
    },
    isSuccess: {
        type: Boolean,
        required: true,
        default: false,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema, "order_transactions");