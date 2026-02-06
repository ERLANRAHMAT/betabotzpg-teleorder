const textColor =  require('cli-color');
const moment = require('moment-timezone');
const variant = require('../database/models/productsVariantModels');
const stock = require('../database/models/stockModels');

// ─── Tutorial text ─────────────────────────────────────
const TUTORIAL =
`*[ DEL VARIANT ]*

*Format :*
/delvariant codeVariant

*Contoh :*
/delvariant nike1

*⚠️ Peringatan :*
• Ini juga menghapus semua stock dari variant ini`;

// ─── Command ──────────────────────────────────────────
const delProductVariant = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const input = ctx.message.text.split(" ");
        const codeVariant = input[1];

        // kosong → tutorial
        if (!codeVariant) {
            return ctx.replyWithMarkdown(TUTORIAL);
        }

        // cek variant ada
        const variant = await variant.findOne({ codeVariant });
        if (!variant) {
            return ctx.replyWithMarkdown(`*⚠️ Code variant "${codeVariant}" tidak ditemukan!*`);
        }

        const namaVariant = variant.name;

        // hapus stock dari variant ini
        const stockResult = await stock.deleteMany({ codeVariant });

        // hapus variant
        await variant.deleteOne({ codeVariant });

        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Deleted variant "${namaVariant}" code=${codeVariant}, stocks=${stockResult.deletedCount}`));

        ctx.replyWithMarkdown(
            `*✅ Variant berhasil dihapus!*\n\n` +
            `*📦 Nama :* ${namaVariant}\n` +
            `*🏷️ Code :* ${codeVariant}\n` +
            `*🗑️ Stock dihapus :* ${stockResult.deletedCount} item`
        );
    } catch (err) {
        ctx.reply("*⚠️ ERROR DEL VARIANT ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` delProductVariant.js: ${err.message}`));
    }
};

module.exports = delProductVariant;
