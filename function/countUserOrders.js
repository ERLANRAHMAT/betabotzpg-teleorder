const textColor = require("cli-color");
const moment = require('moment-timezone');
const transactionSchema = require("../database/models/transactionModels");

async function countUserOrders(telegramId) {
    try {
        const transactionData = await transactionSchema.find({ telegramUserId: telegramId, isSuccess: true, isCanceled: false })

        let count = 0
        for (const data of transactionData) {
            count = count + data.orderQuantity
        }

        return count
    } catch (err) {
        console.log(textColor.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Something error in file utils/countUserOrders.js  ${err.message}`));
    }
}

module.exports = countUserOrders