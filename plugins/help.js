const { Markup, Input } = require("telegraf");
const textColor =  require('cli-color');
const moment = require('moment-timezone');

const helpCommand = async (ctx) => {
    try {
        const reminderMessage = await ctx.reply("*Tunggu bentar videonya lagi dikirim ^^*", {
            parse_mode: "Markdown"
        });

        await ctx.telegram.sendVideo(ctx.from.id, Input.fromLocalFile('media//tutorial.mp4'), {
            caption: "*[ TUTORIAL ORDER ]*\n\n1. Buka Menu LIST PRODUCT di bot.\n2. Pilih product yang ingin di beli.\n3. Pilih variant product yang diinginkan.\n4. Atur jumlah pembelian dengan menekan tombol + atau -.\n5. Tekan tombol Confirm Order untuk melanjutkan.\n6. Ikuti instruksi selanjutnya untuk menyelesaikan pembayaran dan mendapatkan product yang dibeli.\n\nJika ada kendala, silahkan hubungi owner bot untuk bantuan lebih lanjut.",
            parse_mode: "Markdown"
        });

        await ctx.deleteMessage(reminderMessage.message_id);

    } catch (err) {
        ctx.reply("*⚠️SOMETHING ERROR IN COMMAND HELP*", {
            parse_mode: "Markdown",
        });
        console.log(textColor.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Something error in file command/publicCommand/help.js.js  ${err.message}`));
    }
};

module.exports = helpCommand;
