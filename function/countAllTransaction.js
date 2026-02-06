const textColor = require("cli-color");
const moment = require('moment-timezone');
const transactionSchema = require("../database/models/transactionModels");

async function countAllTransaction() {
    try {
        const transactionData = await transactionSchema.find({ isSuccess: true, isCanceled: false })
        const profit = transactionData.reduce((total, data) => {
            return total + data.totalPrice;
        }, 0);

        
        return [transactionData.length, profit]
    } catch (err) {
        console.log(textColor.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Something error in file utils/countAllTransaction.js  ${err.message}`));
    }
}

module.exports = countAllTransaction