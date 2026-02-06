const textColor =  require('cli-color');
const moment = require('moment-timezone');
const products = require('../database/models/productsModels');
const variant = require('../database/models/productsVariantModels');

// ─── Tutorial text ─────────────────────────────────────
const TUTORIAL =
`*[ ADD VARIANT ]*

*Format :*
/addvariant nama,noProduk,codeVariant,harga,deskripsi

*Contoh :*
/addvariant Nike Air Max,1,nike1,350000,Sneakers Nike Air Max Original

*Rules :*
• Pisah tiap field dengan koma *,*
• noProduk = nomor product di listproduct
• codeVariant = kode unik untuk variant ini
• harga = angka saja tanpa titik atau Rp
• deskripsi boleh lebih dari satu kata`;

// ─── Command ──────────────────────────────────────────
const addProductVariants = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const input = ctx.message.text.split(' ').slice(1).join(' ');

        // kosong → tampil tutorial
        if (!input) {
            return ctx.replyWithMarkdown(TUTORIAL);
        }

        // split by koma — harus persis 5 bagian
        const parts = input.split(',').map(s => s.trim());

        if (parts.length < 5) {
            return ctx.replyWithMarkdown('*⚠️ Kurang field! Butuh 5 field.*\n\n' + TUTORIAL);
        }

        const [name, noProdukRaw, codeVariant, hargaRaw, ...deskArr] = parts;
        const deskripsi = deskArr.join(',').trim(); // deskripsi boleh ada koma di dalamnya

        // ── validasi kosong ─
        if (!name || !noProdukRaw || !codeVariant || !hargaRaw || !deskripsi) {
            return ctx.replyWithMarkdown('*⚠️ Ada field yang kosong!*\n\n' + TUTORIAL);
        }

        // ── validasi noProduk ─
        const noProduk = parseInt(noProdukRaw);
        if (isNaN(noProduk)) {
            return ctx.replyWithMarkdown('*⚠️ Nomor produk harus angka!*\n\n' + TUTORIAL);
        }

        const produkExist = await products.findOne({ code: noProduk });
        if (!produkExist) {
            return ctx.replyWithMarkdown(`*⚠️ Product nomor ${noProduk} tidak ditemukan!*\nCek dulu di /listproduct`);
        }

        // ── validasi harga ─
        const harga = parseInt(hargaRaw);
        if (isNaN(harga)) {
            return ctx.replyWithMarkdown('*⚠️ Harga harus angka!*\n\n' + TUTORIAL);
        }

        // ── cek duplikat codeVariant ─
        const dupVariant = await variant.findOne({ codeVariant });
        if (dupVariant) {
            return ctx.replyWithMarkdown(`*⚠️ Code variant "${codeVariant}" sudah ada!*`);
        }

        // ── save ─
        await new variant({
            name,
            code: noProduk,
            codeVariant,
            descriptionVariant: deskripsi,
            price: harga,
            keteranganVariant: deskripsi
        }).save();

        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Added variant "${name}" code=${codeVariant}`));

        ctx.replyWithMarkdown(
            `*✅ Variant berhasil ditambahkan!*\n\n` +
            `*📦 Nama :* ${name}\n` +
            `*🔢 Product No :* ${noProduk} (${produkExist.name})\n` +
            `*🏷️ Code Variant :* ${codeVariant}\n` +
            `*💰 Harga :* Rp ${harga.toLocaleString('id-ID')}\n` +
            `*📝 Deskripsi :* ${deskripsi}\n\n` +
            `Tambah stock sekarang ?\n/addstock ${codeVariant}`
        );
    } catch (err) {
        ctx.reply("*⚠️ ERROR ADD VARIANT ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` addProductVariant.js: ${err.message}`));
    }
};

module.exports = { addProductVariants };
