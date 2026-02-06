const textColor =  require('cli-color');
const moment = require('moment-timezone');
const variant = require('../database/models/productsVariantModels');

// ─── Tutorial text ─────────────────────────────────────
const TUTORIAL =
`*[ SET HARGA ]*

*Format :*
/setharga harga codeVariant

*Contoh :*
/setharga 350000 nike1

*Rules :*
• harga = angka saja, tanpa titik atau Rp
• codeVariant = code variant yang ingin diubah harganya`;

// ─── Command ──────────────────────────────────────────
const setHarga = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const input = ctx.message.text.split(" ");

        // kosong atau kurang param → tutorial
        if (input.length < 3) {
            return ctx.replyWithMarkdown(TUTORIAL);
        }

        const hargaRaw = input[1];
        const codeVariant = input[2];

        // validasi harga
        const harga = parseInt(hargaRaw);
        if (isNaN(harga)) {
            return ctx.replyWithMarkdown('*⚠️ Harga harus angka!*\n\n' + TUTORIAL);
        }

        // cek variant ada
        const variant = await variant.findOne({ codeVariant });
        if (!variant) {
            return ctx.replyWithMarkdown(`*⚠️ Code variant "${codeVariant}" tidak ditemukan!*`);
        }

        const hargaLama = variant.price;

        // update
        await variant.updateOne({ codeVariant }, { $set: { price: harga } });

        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` SetHarga variant "${codeVariant}" ${hargaLama} → ${harga}`));

        ctx.replyWithMarkdown(
            `*✅ Harga berhasil diubah!*\n\n` +
            `*🏷️ Code Variant :* ${codeVariant} (${variant.name})\n` +
            `*💰 Harga :* Rp ${hargaLama.toLocaleString('id-ID')} → Rp ${harga.toLocaleString('id-ID')}`
        );
    } catch (err) {
        ctx.reply("*⚠️ ERROR SET HARGA ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` setHarga.js: ${err.message}`));
    }
};

module.exports = setHarga;
