const textColor =  require('cli-color');
const moment = require('moment-timezone');
const countUserOrders = require('../function/countUserOrders');
const countAllTransaction = require('../function/countAllTransaction');
const broadcast = require('../database/models/broadcastModels');
const { Input } = require('telegraf');

const escapeMarkdown = (text) => {
    // Escape karakter spesial untuk Markdown
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
};

const startCommand = async (ctx) => {
    try {
        const from = ctx.from;
        const [totalTransaction, totalProfit] = await countAllTransaction();
        const checkBroadcast = await broadcast.findOne({ idTelegram: from.id });

        if (!checkBroadcast) {
            const newIdBroadcast = new broadcast({
                usernameTelegram: from.username,
                idTelegram: from.id
            });

            await newIdBroadcast.save();
        }

        // Buat pesan profil dengan escape karakter Markdown
        const profileMessage = escapeMarkdown(`
╭────〔 PROFILE 〕─ 
┊ • User Id ${from.id}
┊ • Username: ${from.username || 'N/A'}
┊ • Total Transaction: ${await countUserOrders(from.id)}
╰────────────

╭────〔 STORE STATISTIC 〕─
┊ • Total Transaction: ${totalTransaction}
┊ • Total Profit: Rp ${parseInt(totalProfit).toLocaleString('id-ID')}
╰────────────`);

        const keyboard = [
            ["LIST PRODUCT"],
            ["TUTORIAL ORDER"],
            ["BEST SELLER", "TOP 5 BUYYER LEADERBOARD"]
        ];


        try {
            await ctx.telegram.sendPhoto(from.id, Input.fromLocalFile('media//thumbnail.png'), {
                caption: profileMessage,
                reply_markup: {
                    keyboard: keyboard,
                    resize_keyboard: true
                },
                parse_mode: "MarkdownV2"
            });
        } catch (photoError) {
            // Jika pengiriman foto gagal, kirim hanya teks
            console.log(textColor.yellow("[ WARNING ]") + ` Gagal mengirim foto: ${photoError.message}`);
            await ctx.reply(profileMessage, {
                parse_mode: "MarkdownV2",
                reply_markup: {
                    keyboard: keyboard,
                    resize_keyboard: true
                }
            });
        }

    } catch (err) {
        // Tangani error umum
        await ctx.reply("*⚠️ Terjadi error saat menjalankan command!*", {
            parse_mode: "Markdown"
        });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]: ${textColor.blueBright(`Error in command/start.js: ${err.message}`)}`);
    }
};

module.exports = startCommand;
