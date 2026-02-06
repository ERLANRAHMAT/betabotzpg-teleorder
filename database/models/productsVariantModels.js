const mongoose = require('mongoose');
const { Schema } = mongoose;

const productVariantsSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: Number,
        required: true
    },
    codeVariant: {
        type: String,
        required: true
    },
    descriptionVariant: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    keteranganVariant: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product_Variants', productVariantsSchema, "product_variants");