const textColor =  require('cli-color');
const moment = require('moment-timezone');
const variant = require('../database/models/productsVariantModels');

// ─── Tutorial text ─────────────────────────────────────
const TUTORIAL =
`*[ EDIT VARIANT ]*

*Format :*
/editvariant codeVariant nama,harga,deskripsi

*Contoh :*
/editvariant nike1 Nike Air Max V2,400000,Sneakers Nike terbaru

*Rules :*
• codeVariant = code variant yang ingin diedit
• Pisah nama, harga, deskripsi dengan koma *,*
• harga = angka saja tanpa titik atau Rp
• Deskripsi boleh lebih dari satu kata`;

// ─── Command ──────────────────────────────────────────
const editVariant = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const fullText = ctx.message.text;
        const afterCmd = fullText.split(' ').slice(1).join(' ');

        // kosong → tutorial
        if (!afterCmd) {
            return ctx.replyWithMarkdown(TUTORIAL);
        }

        // pisah: word pertama = codeVariant, sisanya = nama,harga,deskripsi
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

        // split nama,harga,deskripsi — min 3 bagian
        const parts = rest.split(',').map(s => s.trim());
        if (parts.length < 3) {
            return ctx.replyWithMarkdown('*⚠️ Kurang field! Butuh nama, harga, deskripsi.*\n\n' + TUTORIAL);
        }

        const newName = parts[0];
        const newHargaRaw = parts[1];
        const newDeskripsi = parts.slice(2).join(',').trim(); // deskripsi boleh ada koma

        if (!newName || !newHargaRaw || !newDeskripsi) {
            return ctx.replyWithMarkdown('*⚠️ Ada field yang kosong!*\n\n' + TUTORIAL);
        }

        // validasi harga
        const newHarga = parseInt(newHargaRaw);
        if (isNaN(newHarga)) {
            return ctx.replyWithMarkdown('*⚠️ Harga harus angka!*\n\n' + TUTORIAL);
        }

        // update
        await variant.updateOne(
            { codeVariant },
            { $set: { name: newName, price: newHarga, descriptionVariant: newDeskripsi, keteranganVariant: newDeskripsi } }
        );

        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Edited variant "${codeVariant}" → "${newName}"`));

        ctx.replyWithMarkdown(
            `*✅ Variant berhasil diedit!*\n\n` +
            `*🏷️ Code Variant :* ${codeVariant}\n` +
            `*📦 Nama :* ${variant.name} → ${newName}\n` +
            `*💰 Harga :* Rp ${variant.price.toLocaleString('id-ID')} → Rp ${newHarga.toLocaleString('id-ID')}\n` +
            `*📝 Deskripsi :* ${variant.descriptionVariant} → ${newDeskripsi}`
        );
    } catch (err) {
        ctx.reply("*⚠️ ERROR EDIT VARIANT ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` editProductVariant.js: ${err.message}`));
    }
};

module.exports = editVariant;
