const stock = require('../database/models/stockModels');
const moment = require('moment-timezone');
const textColor =  require('cli-color')

const addStocks = async (text, code) => {
  try {
    const products = text.split("\n").map(product => product.trim()).filter(product => product);

    for (const product of products) {
      const newStock = new stock({
        codeVariant: code,
        dataStock: product
      });

      await newStock.save();
    }

    console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Stocks added successfully`));
    return;
  } catch (err) {
    console.log(textColor.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Error add stock : ${err.message}`));
  }
};

module.exports = addStocks;