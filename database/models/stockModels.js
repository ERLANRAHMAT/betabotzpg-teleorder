const mongoose = require('mongoose');
const { Schema } = mongoose;

const stockVariantsSchema = new Schema({
    codeVariant: {
        type: String,
        required: true
    },
    dataStock: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Stock_Data_Variants', stockVariantsSchema, "stock_data_variants");