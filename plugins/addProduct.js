const textColor =  require('cli-color');
const moment = require('moment-timezone');
const products = require('../database/models/productsModels');

// ─── Tutorial text ─────────────────────────────────────
const TUTORIAL =
`*[ ADD PRODUCT ]*

*Format :*
/addproduct nama,deskripsi

*Contoh :*
/addproduct Sepatu Nike,Sepatu sneakers Nike original

*Rules :*
• Pisah nama & deskripsi dengan koma *,*
• Nama & deskripsi boleh lebih dari satu kata`;

// ─── Command ──────────────────────────────────────────
const addProduct = async (ctx) => {
    try {
        if (OWNER_ID != ctx.from.id) return;

        const input = ctx.message.text.split(' ').slice(1).join(' ');

        // kosong → tampil tutorial
        if (!input) {
            return ctx.replyWithMarkdown(TUTORIAL);
        }

        // split by koma pertama
        const commaIndex = input.indexOf(',');
        if (commaIndex === -1) {
            return ctx.replyWithMarkdown('*⚠️ Format salah! Kurang koma.*\n\n' + TUTORIAL);
        }

        const name = input.substring(0, commaIndex).trim();
        const description = input.substring(commaIndex + 1).trim();

        if (!name || !description) {
            return ctx.replyWithMarkdown('*⚠️ Nama atau deskripsi kosong!*\n\n' + TUTORIAL);
        }

        // cek duplikat
        const existing = await products.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) {
            return ctx.replyWithMarkdown(`*⚠️ Product "${name}" sudah ada!*`);
        }

        // code baru
        const allProducts = await products.find();
        const newCode = allProducts.length + 1;

        await new products({ name, description, code: newCode }).save();

        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Added product "${name}" code=${newCode}`));

        ctx.replyWithMarkdown(
            `*✅ Product berhasil ditambahkan!*\n\n` +
            `*📦 Nama :* ${name}\n` +
            `*📝 Deskripsi :* ${description}\n` +
            `*🔢 Code :* ${newCode}\n\n` +
            `Tambahkan variant sekarang ?\n/addvariant`
        );
    } catch (err) {
        ctx.reply("*⚠️ ERROR ADD PRODUCT ⚠️*", { parse_mode: "Markdown" });
        console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` addProduct.js: ${err.message}`));
    }
};

module.exports = { addProduct };
