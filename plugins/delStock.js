const moment = require('moment-timezone');
const textColor =  require('cli-color');
const variant = require('../database/models/productsVariantModels');
const stock = require('../database/models/stockModels');

// ─── Tutorial text ─────────────────────────────────────
const TUTORIAL =
`*[ DEL STOCK ]*

*Format :*
/delstock codeVariant
*(sambil reply ke pesan berisi stock yang mau dihapus)*

*Langkah :*
1. Tulis stock yang ingin dihapus (satu per baris)
2. Reply pesan itu dengan /delstock codeVariant

*Contoh :*
\`\`\`
key1@gmail.com
key2@gmail.com
\`\`\`
↑ reply pesan itu dengan : /delstock nike1`;

// ─── Command ──────────────────────────────────────────
const delStock = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const input = ctx.message.text.split(" ");
        const codeVariant = input[1];

        // kosong → tutorial
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
                `*⚠️ Reply ke pesan stock yang mau dihapus!*\n\n` + TUTORIAL
            );
        }

        // hapus tiap baris
        const stocks = textReply.split("\n").map(s => s.trim()).filter(s => s);
        let count = 0;

        for (const stock of stocks) {
            const result = await stock.deleteOne({ codeVariant, dataStock: stock });
            if (result.deletedCount > 0) count++;
        }

        // hitung sisa stock
        const totalStock = await stock.countDocuments({ codeVariant });

        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Deleted ${count} stocks from variant "${codeVariant}"`));

        ctx.replyWithMarkdown(
            `*✅ Stock berhasil dihapus!*\n\n` +
            `*🏷️ Code Variant :* ${codeVariant} (${checkCode.name})\n` +
            `*🗑️ Dihapus :* ${count} item\n` +
            `*📊 Sisa Stock :* ${totalStock} item`
        );
    } catch (err) {
        ctx.reply("*⚠️ ERROR DEL STOCK ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` delStock.js: ${err.message}`));
    }
};

module.exports = delStock;
