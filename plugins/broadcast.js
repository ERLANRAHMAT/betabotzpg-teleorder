const moment = require('moment-timezone');
const textColor =  require('cli-color');
const broadcast = require('../database/models/broadcastModels');

const broadcastCommand = async (ctx) => {
    try {

        if (OWNER_ID != ctx.from.id) {
            return;
        }
        if (!ctx.message.text || ctx.message.text.length <= 10) {
            return ctx.replyWithMarkdown("*⚠️ HARAP MASUKKAN PESAN YANG INGIN DI BROADCAST! MINIMAL 10 KARAKTER ⚠️*");
        };
        const allDataBroadcast = await broadcast.find()
        const fullMessage = ctx.message.text;
        const messageWithoutCommand = fullMessage.replace('/broadcast', '').trim();
        const messageToBroadcast = `*[ 📢 BROADCAST 📢 ]*\n\n${messageWithoutCommand}`

        for (const data of allDataBroadcast) {
            await ctx.telegram.sendMessage(data.idTelegram, messageToBroadcast, {
                parse_mode: "Markdown"
            })
        }

        await ctx.replyWithMarkdown("*SUCCESSFULL SENDING MESSAGE BROADCAST✅*")
    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND BROADCAST⚠️*", {
            parse_mode: "Markdown",
        })
        console.log(textColor.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Something error in file command/privateCommand/broadcast.js :  ${err.message}`));
    }
}

module.exports = broadcastCommand