const textColor =  require('cli-color');
const moment = require('moment-timezone');
const variant = require('../database/models/productsVariantModels');
const stock = require('../database/models/stockModels');

// ─── Tutorial text ─────────────────────────────────────
const TUTORIAL =
`*[ EDIT STOCK ]*

*Format :*
/editstock codeVariant dataLama,dataBaru

*Contoh :*
/editstock nike1 key_lama@gmail.com,key_baru@gmail.com

*Rules :*
• codeVariant = code variant stock yang ingin diedit
• Pisah dataLama & dataBaru dengan koma *,*
• dataLama = persis text stock yang ada di database
• dataBaru = text baru yang akan menggantikannya`;

// ─── Command ──────────────────────────────────────────
const editStock = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const fullText = ctx.message.text;
        const afterCmd = fullText.split(' ').slice(1).join(' ');

        // kosong → tutorial
        if (!afterCmd) {
            return ctx.replyWithMarkdown(TUTORIAL);
        }

        // pisah: word pertama = codeVariant, sisanya = dataLama,dataBaru
        const spaceIndex = afterCmd.indexOf(' ');
        if (spaceIndex === -1) {
            return ctx.replyWithMarkdown('*⚠️ Kurang input!*\n\n' + TUTORIAL);
        }

        const codeVariant = afterCmd.substring(0, spaceIndex).trim();
        const rest = afterCmd.substring(spaceIndex + 1).trim();

        // cek variant ada
        const variant = await variant.findOne({ codeVariant });
        if (!variant) {
            return ctx.replyWithMarkdown(`*⚠️ Code variant "${codeVariant}" tidak ditemukan!*`);
        }

        // split by koma pertama → dataLama, dataBaru
        const commaIndex = rest.indexOf(',');
        if (commaIndex === -1) {
            return ctx.replyWithMarkdown('*⚠️ Kurang koma antara dataLama dan dataBaru!*\n\n' + TUTORIAL);
        }

        const dataLama = rest.substring(0, commaIndex).trim();
        const dataBaru = rest.substring(commaIndex + 1).trim();

        if (!dataLama || !dataBaru) {
            return ctx.replyWithMarkdown('*⚠️ dataLama atau dataBaru kosong!*\n\n' + TUTORIAL);
        }

        // cek stock lama ada
        const stockLama = await stock.findOne({ codeVariant, dataStock: dataLama });
        if (!stockLama) {
            return ctx.replyWithMarkdown(`*⚠️ Stock "${dataLama}" tidak ditemukan di variant ${codeVariant}!*`);
        }

        // update
        await stock.updateOne(
            { _id: stockLama._id },
            { $set: { dataStock: dataBaru } }
        );

        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Edited stock "${dataLama}" → "${dataBaru}" on variant "${codeVariant}"`));

        ctx.replyWithMarkdown(
            `*✅ Stock berhasil diedit!*\n\n` +
            `*🏷️ Code Variant :* ${codeVariant} (${variant.name})\n` +
            `*📦 Lama :* ${dataLama}\n` +
            `*📦 Baru :* ${dataBaru}`
        );
    } catch (err) {
        ctx.reply("*⚠️ ERROR EDIT STOCK ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` editStock.js: ${err.message}`));
    }
};

module.exports = editStock;
