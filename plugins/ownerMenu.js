const textColor =  require('cli-color');
const moment = require('moment-timezone');

const ownerMenuCommand = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const text =
`*[ OWNER MENU ]*

*📦 PRODUCT*
/addproduct          → tambah product
/editproduct         → edit product
/delproduct          → hapus product

*📦 VARIANT*
/addvariant          → tambah variant
/editvariant         → edit variant
/delvariant          → hapus variant

*📦 STOCK*
/addstock            → tambah stock
/editstock           → edit stock
/delstock            → hapus stock

*📢 LAINNYA*
/setharga            → set harga variant
/broadcast           → broadcast pesan

*💡 Ketik command tanpa param untuk lihat tutorial*

*Untuk lihat code variant klik tombol di bawah👇*`;

        ctx.reply(text, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📃 Show Code Variant', callback_data: 'show-code-variant' },
                    ]
                ]
            },
            parse_mode: "Markdown"
        });
    } catch (err) {
        ctx.reply("*⚠️ ERROR OWNER MENU ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` ownerMenu.js: ${err.message}`));
    }
};

module.exports = ownerMenuCommand;
