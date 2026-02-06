const textColor = require('cli-color');
const moment = require('moment-timezone');
const productModels = require('../database/models/productsModels');
const { Input } = require('telegraf');

const listProduct = async (ctx) => {
    try {
        const from = ctx.from;
        const allProduct = await productModels.find().lean(); 

        if (allProduct.length > 0) {
            let productMessage = "┏━━━━━━━━━━━━━━━━━━━━┓\n";
            productMessage += "┃  📦 *LIST PRODUCT*  ┃\n";
            productMessage += "┗━━━━━━━━━━━━━━━━━━━━┛\n\n";
            productMessage += `🛍️ Total: *${allProduct.length} produk* tersedia\n`;
            productMessage += "━━━━━━━━━━━━━━━━━━━━\n\n";

            const array = [["LIST PRODUCT"]];

            allProduct.forEach((data, index) => {
                const number = index + 1;
                const emoji = number <= 3 ? ['🥇', '🥈', '🥉'][index] : '📍';
                productMessage += `${emoji} *${number}.* ${data.name.toUpperCase()}\n`;
            });

            productMessage += "\n━━━━━━━━━━━━━━━━━━━━";
            productMessage += "\n💡 _Pilih nomor untuk info detail_";
            
            const addButtonArray = async (start, end) => {
                let newArray = [];
                for (let i = start; i <= end; i++) {
                    newArray.push(i.toString());
                    if (newArray.length >= 6) {
                        array.push(newArray);
                        newArray = [];
                    }
                }
                if (newArray.length > 0) {
                    array.push(newArray);
                }
            };

            await addButtonArray(1, allProduct.length);
            
            array.push(["TUTORIAL ORDER"],
                ["BEST SELLER", "TOP 5 BUYYER LEADERBOARD"])

            await ctx.telegram.sendPhoto(from.id, Input.fromLocalFile('media//thumbnail.png'), {
                caption: productMessage,
                reply_markup: {
                    keyboard: array,
                    resize_keyboard: true
                },
                parse_mode: "Markdown"
            })
        } else {
            const message = "*⚠️ BELUM ADA PRODUCT ⚠️*"

            await ctx.telegram.sendPhoto(from.id, Input.fromLocalFile('media//thumbnail.png'), {
                caption: message,
                parse_mode: "Markdown",
                disable_web_page_preview: "true",
            })
        }

    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR TO BACK⚠️*", {
            parse_mode: "Markdown",
        })
        console.log(textColor.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Something error in file command/listProduct.js  ${err.message}`));
    }
}

module.exports = listProduct