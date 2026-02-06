const moment = require('moment-timezone');
const textColor =  require('cli-color');
const variant = require('../database/models/productsVariantModels');
const stock = require('../database/models/stockModels');

// ─── Tutorial text ─────────────────────────────────────
const TUTORIAL =
`*[ ADD STOCK ]*

*Format :*
/addstock codeVariant
*(sambil reply ke pesan berisi stock)*

*Langkah :*
1. Tulis stock nya (satu per baris)
2. Reply pesan itu dengan /addstock codeVariant

*Contoh :*
\`\`\`
key1@gmail.com
key2@gmail.com
key3@gmail.com
\`\`\`
↑ reply pesan itu dengan : /addstock nike1`;

// ─── Command ──────────────────────────────────────────
const addStock = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const input = ctx.message.text.split(" ");
        const codeVariant = input[1];

        // kosong → tampil tutorial
        if (!codeVariant) {
            return ctx.replyWithMarkdown(TUTORIAL);
        }

        // cek variant ada
        const checkCode = await variant.findOne({ codeVariant });
        if (!checkCode) {
            return ctx.replyWithMarkdown(
                `*⚠️ Code variant "${codeVariant}" tidak ditemukan!*\n\n` + TUTORIAL
            );
        }

        // cek ada reply text
        const textReply = ctx.message?.reply_to_message?.text ?? "";
        if (textReply === "") {
            return ctx.replyWithMarkdown(
                `*⚠️ Reply ke pesan stock dulu!*\n\n` + TUTORIAL
            );
        }

        // save semua baris
        const lines = textReply.split("\n").map(s => s.trim()).filter(s => s);
        let count = 0;

        for (const line of lines) {
            await new stock({ codeVariant, dataStock: line }).save();
            count++;
        }

        // hitung total stock sekarang
        const totalStock = await stock.countDocuments({ codeVariant });

        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Added ${count} stocks to variant "${codeVariant}"`));

        ctx.replyWithMarkdown(
            `*✅ Stock berhasil ditambahkan!*\n\n` +
            `*🏷️ Code Variant :* ${codeVariant} (${checkCode.name})\n` +
            `*📦 Ditambahkan :* ${count} item\n` +
            `*📊 Total Stock :* ${totalStock} item`
        );
    } catch (err) {
        ctx.reply("*⚠️ ERROR ADD STOCK ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` addStock.js: ${err.message}`));
    }
};

module.exports = addStock;
