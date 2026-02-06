const textColor =  require('cli-color');
const moment = require('moment-timezone');
const products = require('../database/models/productsModels');
const variant = require('../database/models/productsVariantModels');

// ─── Tutorial text ─────────────────────────────────────
const TUTORIAL =
`*[ DEL PRODUCT ]*

*Format :*
/delproduct noProduk

*Contoh :*
/delproduct 1

*⚠️ Peringatan :*
• Ini akan menghapus product DAN semua variantnya
• noProduk = nomor product di listproduct`;

// ─── Command ──────────────────────────────────────────
const delProduct = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const input = ctx.message.text.split(" ");
        const noProdukRaw = input[1];

        // kosong → tutorial
        if (!noProdukRaw) {
            return ctx.replyWithMarkdown(TUTORIAL);
        }

        const noProduk = parseInt(noProdukRaw);
        if (isNaN(noProduk)) {
            return ctx.replyWithMarkdown('*⚠️ Nomor produk harus angka!*\n\n' + TUTORIAL);
        }

        // cek produk ada
        const produk = await products.findOne({ code: noProduk });
        if (!produk) {
            return ctx.replyWithMarkdown(`*⚠️ Product nomor ${noProduk} tidak ditemukan!*\nCek di /listproduct`);
        }

        const namaHapus = produk.name;

        // hapus semua variant dari produk ini
        await variant.deleteMany({ code: noProduk });

        // hapus produknya
        await products.deleteOne({ code: noProduk });

        // re-index code produk yang tersisa (supaya tetap urut 1,2,3...)
        const remaining = await products.find().sort({ code: 1 });
        for (let i = 0; i < remaining.length; i++) {
            const newCode = i + 1;
            if (remaining[i].code !== newCode) {
                await products.findByIdAndUpdate(remaining[i]._id, { code: newCode });
                await variant.updateMany({ code: remaining[i].code }, { code: newCode });
            }
        }

        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Deleted product "${namaHapus}" code=${noProduk}`));

        ctx.replyWithMarkdown(
            `*✅ Product berhasil dihapus!*\n\n` +
            `*📦 Nama :* ${namaHapus}\n` +
            `*🗑️ Semua variant juga telah dihapus*\n` +
            `*🔄 Code produk lain sudah di re-index*`
        );
    } catch (err) {
        ctx.reply("*⚠️ ERROR DEL PRODUCT ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` delProduct.js: ${err.message}`));
    }
};

module.exports = delProduct;
