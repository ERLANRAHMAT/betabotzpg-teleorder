const textColor =  require('cli-color');
const moment = require('moment-timezone');
const products = require('../database/models/productsModels');

// ─── Tutorial text ─────────────────────────────────────
const TUTORIAL =
`*[ EDIT PRODUCT ]*

*Format :*
/editproduct noProduk nama,deskripsi

*Contoh :*
/editproduct 1 Sepatu Adidas,Sepatu sneakers Adidas Original

*Rules :*
• noProduk = nomor product di listproduct
• Pisah nama & deskripsi dengan koma *,*
• Kalau cuma mau edit nama saja, tetap isi deskripsi sama
• Kalau cuma mau edit deskripsi saja, tetap isi nama sama`;

// ─── Command ──────────────────────────────────────────
const editProduct = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const fullText = ctx.message.text;
        // ambil semua setelah "/editproduct "
        const afterCmd = fullText.split(' ').slice(1).join(' ');

        // kosong → tutorial
        if (!afterCmd) {
            return ctx.replyWithMarkdown(TUTORIAL);
        }

        // pisah: word pertama = noProduk, sisanya = nama,deskripsi
        const spaceIndex = afterCmd.indexOf(' ');
        if (spaceIndex === -1) {
            return ctx.replyWithMarkdown('*⚠️ Kurang input!*\n\n' + TUTORIAL);
        }

        const noProdukRaw = afterCmd.substring(0, spaceIndex).trim();
        const rest = afterCmd.substring(spaceIndex + 1).trim();

        // validasi noProduk
        const noProduk = parseInt(noProdukRaw);
        if (isNaN(noProduk)) {
            return ctx.replyWithMarkdown('*⚠️ Nomor produk harus angka!*\n\n' + TUTORIAL);
        }

        // cek produk ada
        const produk = await products.findOne({ code: noProduk });
        if (!produk) {
            return ctx.replyWithMarkdown(`*⚠️ Product nomor ${noProduk} tidak ditemukan!*\nCek di /listproduct`);
        }

        // split nama,deskripsi
        const commaIndex = rest.indexOf(',');
        if (commaIndex === -1) {
            return ctx.replyWithMarkdown('*⚠️ Kurang koma antara nama dan deskripsi!*\n\n' + TUTORIAL);
        }

        const newName = rest.substring(0, commaIndex).trim();
        const newDesc = rest.substring(commaIndex + 1).trim();

        if (!newName || !newDesc) {
            return ctx.replyWithMarkdown('*⚠️ Nama atau deskripsi kosong!*\n\n' + TUTORIAL);
        }

        // cek duplikat nama (kecuali produk yang sama)
        const dupName = await products.findOne({ name: { $regex: new RegExp(`^${newName}$`, 'i') }, code: { $ne: noProduk } });
        if (dupName) {
            return ctx.replyWithMarkdown(`*⚠️ Nama "${newName}" sudah dipakai produk lain!*`);
        }

        // update
        await products.updateOne({ code: noProduk }, { $set: { name: newName, description: newDesc } });

        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Edited product code=${noProduk} → "${newName}"`));

        ctx.replyWithMarkdown(
            `*✅ Product berhasil diedit!*\n\n` +
            `*🔢 Code :* ${noProduk}\n` +
            `*📦 Nama :* ${produk.name} → ${newName}\n` +
            `*📝 Deskripsi :* ${produk.description} → ${newDesc}`
        );
    } catch (err) {
        ctx.reply("*⚠️ ERROR EDIT PRODUCT ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` editProduct.js: ${err.message}`));
    }
};

module.exports = editProduct;
