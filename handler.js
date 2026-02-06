// ============================================
// HANDLER.JS - Combined HandleAction & HandleHears
// ============================================

const fs = require('fs').promises;
const productsVariantModels = require("./database/models/productsVariantModels");
const stockModels = require("./database/models/stockModels");
const transactionModels = require("./database/models/transactionModels");
const productsModels = require("./database/models/productsModels");
const textColor =  require('cli-color');
const moment = require('moment-timezone');
const addStocks = require("./function/addStocks");
const { paygate } = require('./settings');


// ============================================
// HANDLE ACTION CLASS
// ============================================

function generateRandomCode() {
    const prefix = "BTZ_ORDER_";

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePart = `${year}${month}${day}`;

    const randomNumber = Math.floor(1000 + Math.random() * 9000);

    const randomCode = `${prefix}${datePart}${randomNumber}`;
    return randomCode;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateUniqueRandomPrice() {
    const totalPriceList = [];
    const getTransaction = await transactionModels.find({ isSuccess: false, isCanceled: false });

    getTransaction.forEach(data => {
        const createdAt = moment(data.createdAt);
        const time = moment();
        const selisih = time.diff(createdAt, 'minutes');

        if (selisih < 6) {
            totalPriceList.push(data.feeTax);
        }
    });

    let randomPrice;
    let feeExists = true;

    while (feeExists) {
        randomPrice = getRandomInt(0, 155);

        feeExists = totalPriceList.includes(randomPrice);

        if (feeExists) {
            console.log(textColor.blue.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Fee ${randomPrice} sudah ada, mencari fee baru...`));
        }
    }

    totalPriceList.push(randomPrice);

    return randomPrice.toString().padStart(2, '0');
}

class HandleAction {
    async ShowPesanan(ctx) {
        try {
            const variantValue = ctx.match[1]
            const SearchCodeVariant = await productsVariantModels.findOne({ codeVariant: variantValue });

            if (!SearchCodeVariant) {
                return ctx.answerCbQuery("404 PRODUCTS NOT FOUND", { show_alert: true });
            }
            const allStock = await stockModels.find({ codeVariant: variantValue })

            if (allStock.length == 0) {
                return ctx.answerCbQuery("SISA STOCK 0 TIDAK BISA MELANJUTKAN..", { show_alert: true });
            }
            await delay(1_000)
            if (ctx.callbackQuery && ctx.callbackQuery.message) {
                const messageId = ctx.callbackQuery.message.message_id;

                await ctx.deleteMessage(messageId)
            }

            let data = "*KONFIRMASI PESANAN*\n"
            data += "*╭─────────────────╮*\n"
            data += `*│ Product:* ${SearchCodeVariant.name.toUpperCase()}\n`
            data += `*│ Code Variant:* ${SearchCodeVariant.codeVariant}\n`
            data += `*│ Harga:* Rp ${SearchCodeVariant.price.toLocaleString('id-ID')}\n`
            data += `*│ Stock Tersedia:* ${allStock.length}\n`
            data += "*│──────────────────*\n"
            data += `*│ Jumlah Pesanan:* 1\n`
            const totalPrice = 1 * SearchCodeVariant.price
            data += `*│ Total dibayar:* Rp ${parseInt(totalPrice).toLocaleString('id-ID')}\n`
            data += "*╰─────────────────╯*\n"
            data += "*╰➤ Jika ingin mengorder klik Confirm Order✅*"

            return ctx.reply(data, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'mines-order' },
                            { text: '+', callback_data: 'plus-order' },
                        ],
                        [
                            { text: '🔙Kembali', callback_data: "back-to-product-list" },
                            { text: 'Confirm Order✅', callback_data: 'confirm-order' },
                        ]
                    ]
                },
                parse_mode: "Markdown"
            })
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, {
                userId: ctx.from?.id,
                action: ctx.callbackQuery?.data,
                error: err.message,
                stack: err.stack,
            });
            ctx.reply(`*⚠️ ERROR:* ${err.message}\nSilakan coba lagi atau hubungi owner jika masalah berlanjut.`, {
                parse_mode: "Markdown",
            });
        }
    }

    async PlusMinesStockProduct(ctx) {
        try {
            const action = ctx.callbackQuery.data;

            const messageText = ctx.callbackQuery.message.text;
            const orderAmountMatch = messageText.match(/Jumlah Pesanan:\s*(\d+)/);
            const productMatch = messageText.match(/Product:\s*(.+)/);
            const codeVariantMatch = messageText.match(/Code Variant:\s*(.+)/);
            const priceMatch = messageText.match(/Harga:\s*Rp\s*([\d,.]+)/);
            const stockMatch = messageText.match(/Stock Tersedia:\s*(\d+)/);

            let orderAmount = orderAmountMatch ? parseInt(orderAmountMatch[1]) : null;
            const product = productMatch ? productMatch[1].trim() : null;
            const codeVariant = codeVariantMatch ? codeVariantMatch[1].trim() : null;
            const price = priceMatch ? priceMatch[1].replace(/\./g, '').trim() : null;
            const stock = stockMatch ? parseInt(stockMatch[1]) : null;

            if (!ctx.session) {
                ctx.session = {};
            }

            const userLastAction = ctx.session?.lastAction || 0;
            const currentTime = Date.now();

            const minimumDelay = 1_500;

            if (currentTime - userLastAction < minimumDelay) {
                return ctx.answerCbQuery("Tunggu sebentar sebelum memencet tombol lagi!", { show_alert: true });
            }

            ctx.session.lastAction = currentTime;

            ctx.session.lastAction = currentTime;

            if (action == 'mines-order' && orderAmount == 1) {
                return ctx.answerCbQuery("Jumlah orderan tidak boleh 0 atau mines!!", { show_alert: true });
            }

            if (action == 'plus-order') {
                orderAmount++;
            } else if (action == 'mines-order') {
                orderAmount--;
            }

            if (orderAmount > stock) {
                return ctx.answerCbQuery("Stock tidak cukup", { show_alert: true });
            }

            const totalPrice = orderAmount * parseInt(price);
            let data = "*KONFIRMASI PESANAN*\n";
            data += "*╭─────────────────╮*\n";
            data += `*│ Product:* ${product.toUpperCase()}\n`;
            data += `*│ Code Variant:* ${codeVariant}\n`;
            data += `*│ Harga:* Rp ${parseInt(price).toLocaleString('id-ID')}\n`;
            data += `*│ Stock Tersedia:* ${stock}\n`;
            data += "*│──────────────────*\n";
            data += `*│ Jumlah Pesanan:* ${orderAmount}\n`;
            data += `*│ Total dibayar:* Rp ${parseInt(totalPrice).toLocaleString('id-ID')}\n`;
            data += "*╰─────────────────╯*\n";
            data += "*╰➤ Jika ingin mengorder klik Confirm Pesanan✅*";

            await ctx.editMessageText(data, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '-', callback_data: 'mines-order' },
                            { text: '+', callback_data: 'plus-order' },
                        ],
                        [
                            { text: '🔙Kembali', callback_data: 'back-to-product-list' },
                            { text: 'Confirm Order✅', callback_data: 'confirm-order' },
                        ]
                    ]
                },
                parse_mode: 'Markdown'
            });

            ctx.answerCbQuery();
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, {
                userId: ctx.from?.id,
                action: ctx.callbackQuery?.data,
                error: err.message,
                stack: err.stack,
            });
            ctx.reply(`*⚠️ ERROR:* ${err.message}\nSilakan coba lagi atau hubungi owner jika masalah berlanjut.`, {
                parse_mode: "Markdown",
            });
        }
    }


    async ConfirmOrder(ctx) {
        try {
            await delay(1_000)
            if (ctx.callbackQuery && ctx.callbackQuery.message) {
                const messageId = ctx.callbackQuery.message.message_id;

                await ctx.deleteMessage(messageId)
            }
            const messageText = ctx.callbackQuery.message.text;
            const orderAmountMatch = messageText.match(/Jumlah Pesanan:\s*(\d+)/);
            const productMatch = messageText.match(/Product:\s*(.+)/);
            const codeVariantMatch = messageText.match(/Code Variant:\s*(.+)/);
            const priceMatch = messageText.match(/Harga:\s*Rp\s*([\d,.]+)/);

            let orderAmount = orderAmountMatch ? parseInt(orderAmountMatch[1]) : null;
            const product = productMatch ? productMatch[1] : null;
            const codeVariant = codeVariantMatch ? codeVariantMatch[1] : null;
            const price = priceMatch ? priceMatch[1].replace(/\./g, '').trim() : null;

            const getVariantProduct = await productsVariantModels.findOne({ codeVariant: codeVariant });
            const getTransaction = await transactionModels.findOne({ telegramUserId: ctx.from.id, isSuccess: false, isCanceled: false });

            if (getTransaction) {
                return ctx.answerCbQuery("Tidak bisa confirm order, Harap selesaikan transaction sebelumnya", { show_alert: true });
            }

            const UserID = ctx.from.id;

            if (!getVariantProduct) {
                await ctx.editMessageText("*⚠️ Tidak bisa mendapatkan product, Harap coba lagi nanti*", {
                    parse_mode: 'Markdown',
                });

                ctx.answerCbQuery();
                return;
            }
            ctx.answerCbQuery("Bot sedang membuat pembayaran..", { show_alert: true });

            const ProductVariant = await productsVariantModels.findOne({ codeVariant: codeVariant });
            const getStock = await stockModels.find({ codeVariant: ProductVariant.codeVariant });

            // Get stock data first
            let dataStock = "";
            let totalStock = 0;
            const stocksToDelete = [];
            for (const stock of getStock) {
                if (totalStock >= orderAmount) {
                    break;
                }

                dataStock += `${stock.dataStock}\n`;
                stocksToDelete.push(stock.dataStock);
                totalStock++;
            }

            // Create transaction using Betabotz Paygate
            const baseAmount = Number(orderAmount * price);
            const transaction = await paygate.createTransaction({
                amount: baseAmount,
                fee: parseInt(btzFee),
                paymentMethod: btzMethod,
                timeout: parseInt(btzTimeout),
                notes: `Order ${product} - ${orderAmount}x`,
                metadata: {
                    productCode: codeVariant,
                    productName: product,
                    orderQuantity: orderAmount,
                    telegramUserId: UserID
                }
            });

            if (!transaction.success) {
                throw new Error('Gagal membuat transaksi pembayaran');
            }

            const { transactionId, paymentUrl, accessKey, totalAmount, expiredAt, qrisImage } = transaction.data;

            // Delete stock
            for (const stockData of stocksToDelete) {
                await stockModels.deleteOne({ dataStock: stockData });
            }

            // Calculate expiration time
            const expirationTime = new Date(expiredAt);
            const formattedTime = expirationTime.toLocaleTimeString("en-US", { timeZone: "Asia/Jakarta", hour12: false }).slice(0, 5);

            let text = "*╭──────────────\n*";
            text += `*│ Produk:* ${product.toUpperCase()}\n`;
            text += `*│ Harga satuan:* Rp ${parseInt(price).toLocaleString('id-ID')}\n`;
            text += `*│ ID TRX :* ${transactionId}\n`;
            text += "*│─────────────── *\n";
            text += `*│ Jumlah Pesanan:* ${orderAmount}\n`;
            text += `*│ Total yang di bayar:* Rp ${totalAmount.toLocaleString('id-ID')}\n`;
            text += "*╰─────────────\n*";
            text += `*Harap selesaikan pembayaran sebelum jam ${formattedTime} WIB⏲️*\n\n`;
            text += `*Link Pembayaran:* ${paymentUrl}\n\n`;
            text += `Ingin membatalkan transaksi? Klik button *Cancel Order❌*`;

            // Send payment message with QRIS if available, otherwise just text
            let sendMessage;
            const buildPhotoInput = (value) => {
                if (!value || typeof value !== "string") return null;
                const trimmed = value.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith("data:image/")) {
                    const base64 = trimmed.split(",")[1] || "";
                    try {
                        return { source: Buffer.from(base64, "base64") };
                    } catch {
                        return null;
                    }
                }

                if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                    return trimmed;
                }

                // Fallback: try raw base64 string
                try {
                    return { source: Buffer.from(trimmed, "base64") };
                } catch {
                    return null;
                }
            };

            const photoInput = buildPhotoInput(qrisImage);

            if (photoInput) {
                sendMessage = await ctx.telegram.sendPhoto(UserID, photoInput, {
                    caption: text,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Buka Link Pembayaran", url: paymentUrl }],
                            [{ text: "Cancel Order❌", callback_data: "cancel-order-pesanan" }],
                        ],
                    },
                    parse_mode: "Markdown",
                });
            } else {
                sendMessage = await ctx.telegram.sendMessage(UserID, text, {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Buka Link Pembayaran", url: paymentUrl }],
                            [{ text: "Cancel Order❌", callback_data: "cancel-order-pesanan" }],
                        ],
                    },
                    parse_mode: "Markdown",
                    disable_web_page_preview: false
                });
            }

            const formattedDate = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');

            const NewTransaction = new transactionModels({
                transactionId: transactionId,
                accessKey: accessKey,
                telegramUserId: UserID,
                productCode: ProductVariant.codeVariant,
                orderQuantity: orderAmount,
                formattedDate: formattedDate,
                feeTax: totalAmount - baseAmount,
                totalPrice: totalAmount,
                orderData: dataStock,
                chatId: sendMessage.chat.id,
                keteranganVariant: ProductVariant.keteranganVariant,
                messageId: sendMessage.message_id,
            });

            await NewTransaction.save();
            ctx.answerCbQuery();
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, {
                userId: ctx.from?.id,
                action: ctx.callbackQuery?.data,
                error: err.message,
                stack: err.stack,
            });
            ctx.reply(`*⚠️ ERROR:* ${err.message}\nSilakan coba lagi atau hubungi owner jika masalah berlanjut.`, {
                parse_mode: "Markdown",
            });
        }
    }

    async cancelOrder(ctx) {
        try {
            await delay(1_000)
            if (ctx.callbackQuery && ctx.callbackQuery.message) {
                const messageId = ctx.callbackQuery.message.message_id;

                await ctx.deleteMessage(messageId)
            }

            const getTransaction = await transactionModels.findOne({ telegramUserId: ctx.from.id, isCanceled: false, isSuccess: false });

            await addStocks(getTransaction.orderData, getTransaction.productCode)
            await transactionModels.updateOne({ telegramUserId: ctx.from.id, isCanceled: false, isSuccess: false }, { $set: { isCanceled: true } })
            await paygate.cancelTransaction(getTransaction.transactionId, 'User cancelled order')
            ctx.reply("*✅ Berhasil membatalkan transaksi yang sedang kamu lakukan\n\nDetail transaksi telah dihapus dari database.bb*", {
                parse_mode: "Markdown"
            })
            ctx.answerCbQuery();
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, {
                userId: ctx.from?.id,
                action: ctx.callbackQuery?.data,
                error: err.message,
                stack: err.stack,
            });
            ctx.reply(`*⚠️ ERROR:* ${err.message}\nSilakan coba lagi atau hubungi owner jika masalah berlanjut.`, {
                parse_mode: "Markdown",
            });
        }
    }

    async showAllproductVariant(ctx) {
        try {
            let text = "*[ SHOW CODE PRODUCT VARIANT ]*\n\n"
            const getAllData = await productsVariantModels.find()

            for (const variant of getAllData) {
                text += `\`${variant.name.toUpperCase()} || ${variant.codeVariant}\`\n`
            }

            ctx.reply(text, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🔙 Back', callback_data: 'back-to-ownermenu' },
                        ]
                    ]
                },
                parse_mode: "Markdown"
            })
        } catch (err) {
            console.error(`[ ERROR ] [${moment().format('YYYY-MM-DD HH:mm:ss')}]:`, {
                userId: ctx.from?.id,
                action: ctx.callbackQuery?.data,
                error: err.message,
                stack: err.stack,
            });
            ctx.reply(`*⚠️ ERROR:* ${err.message}\nSilakan coba lagi atau hubungi owner jika masalah berlanjut.`, {
                parse_mode: "Markdown",
            });
        }
    }

}

module.exports = HandleAction
// ============================================
// HANDLE HEARS CLASS
// ============================================

class HandleHears {

    async handleProductList(ctx) {
        try {
            const message = ctx.message.text
            const numberRegex = /^\d+$/;

            if (numberRegex.test(message)) {
                const codeNumber = message
                const getAllProductVariant = await productsVariantModels.find({ code: codeNumber });

                const getProduct = await productsModels.findOne({ code: codeNumber });

                if (!getProduct) return

                if (getAllProductVariant.length == 0) {
                    return ctx.reply(
                        "*⚠️ VARIANT PRODUCTS BELUM ADA ⚠️*",
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '🔙 Back', callback_data: 'back-to-listproduct' },
                                    ]
                                ]
                            },
                            parse_mode: 'Markdown'
                        }
                    );
                }

                const stockTersedia = async (code) => {
                    const totalStock = await stockModels.find({ codeVariant: code })

                    return totalStock.length
                }

                const stockTerjual = async (code) => {
                    const totalTerjual = await transactionModels.find({ productCode: code, isSuccess: true, isCanceled: false })

                    return totalTerjual.length
                }

                function addButton(inlineKeyboard, text, callbackData) {
                    const newButton = { text: text, callback_data: callbackData };

                    if (inlineKeyboard.length === 0 || inlineKeyboard[inlineKeyboard.length - 1].length >= 2) {
                        inlineKeyboard.push([newButton]);
                    } else {
                        inlineKeyboard[inlineKeyboard.length - 1].push(newButton);
                    }

                    return inlineKeyboard;
                }

                let text = ""
                let inlineKeyboard = []
                for (const data of getAllProductVariant) {
                    if (getAllProductVariant.length == 1) {
                        text += `*╭───── 〔 ${data.name} 〕 ──*\n`
                        text += `*┊・ Harga:* Rp ${data.price.toLocaleString('id-ID')}\n`
                        text += `*┊・ Stock Tersedia:* ${await stockTersedia(data.codeVariant)}\n`
                        text += `*┊・ Stock Terjual:* ${await stockTerjual(data.codeVariant)}\n`
                        text += `*┊・ Deskripsi:* ${data.descriptionVariant}`
                        text += "\n*╰───────────────*"
                    } else {
                        text += `*╭───── 〔 ${data.name} 〕 ──*\n`
                        text += `*┊・ Harga:* Rp ${data.price.toLocaleString('id-ID')}\n`
                        text += `*┊・ Stock Tersedia:* ${await stockTersedia(data.codeVariant)}\n`
                        text += `*┊・ Stock Terjual:* ${await stockTerjual(data.codeVariant)}\n`
                        text += `*┊・ Deskripsi:* ${data.descriptionVariant}`
                        text += "\n*╰───────────────*\n\n"
                    }

                    inlineKeyboard = addButton(inlineKeyboard, `${data.name}`, `variant-${data.codeVariant.toLowerCase()}`);
                }

                if (getAllProductVariant.length == 1) {
                    text += "\n╰➤ If want to order click the button below"
                } else {
                    text += "╰➤ If want to order click the button below"
                }
                inlineKeyboard.push([{ text: "🔙Back", callback_data: "back-to-product-list" }])

                await ctx.reply(text, {
                    reply_markup: {
                        inline_keyboard: inlineKeyboard
                    },
                    parse_mode: "Markdown"
                })
            }
        } catch (err) {
            ctx.reply("*⚠️SOMETHING ERROR IN HANDLE ACTION⚠️*", {
                parse_mode: "Markdown",
            })
            console.log(textColor.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Something error in file handler/HandleAction :  ${err.message}`));
        }
    }

    async GetTopBuyer(ctx) {
        try {
            const topBuyers = await transactionModels.aggregate([
                { $match: { isSuccess: true } },
                {
                    $group: {
                        _id: "$telegramUserId",
                        totalSpent: { $sum: "$totalPrice" },
                        totalOrders: { $sum: 1 }
                    }
                },
                { $sort: { totalSpent: -1 } },
                { $limit: 5 }
            ]);

            let buyerMessage = "\n*💝 CUSTOMER APPRECIATION*\n";
            buyerMessage += "━━━━━━━━━━━━━━━━━━━━\n";
            buyerMessage += "🙏 Terima kasih kepada 5 customer terbaik kami!\n\n";
            topBuyers.forEach((buyer, index) => {
                buyerMessage += `🎖️ *#${index + 1} - ${buyer._id}*\n`;
                buyerMessage += `└─ Total Belanja: Rp${buyer.totalSpent.toLocaleString('id-ID')}\n`;
                buyerMessage += `└─ Total Order: ${buyer.totalOrders} kali\n\n`;
            });

            await ctx.reply(`${buyerMessage}`, { parse_mode: "Markdown" });
        } catch (error) {
            console.error("Error fetching top buyers or products:", error);
            await ctx.reply("*⚠️ Terjadi kesalahan saat mengambil data Top Buyers dan Top Products ⚠️*", { parse_mode: "Markdown" });
        }
    }

    async GetTopProduct(ctx) {
        try {

            const topProducts = await transactionModels.aggregate([
                { $match: { isSuccess: true } },
                {
                    $group: {
                        _id: "$productCode",
                        totalSold: { $sum: "$orderQuantity" },
                        revenue: { $sum: "$totalPrice" }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 }
            ]);

            let productMessage = "\n*📊 LAPORAN PRODUK TERLARIS*\n";
            productMessage += "━━━━━━━━━━━━━━━━━━━━\n";
            productMessage += "🎯 Periode: [Tanggal]\n\n";
            topProducts.forEach((product, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
                productMessage += `${medal} #${index + 1} - *${product._id}*\n`;
                productMessage += `└─ Penjualan: ${product.totalSold} pcs | Revenue: Rp${product.revenue.toLocaleString('id-ID')}\n\n`;
            });

            await ctx.reply(`${productMessage}`, { parse_mode: "Markdown" });
        } catch (error) {
            console.error("Error fetching top buyers or products:", error);
            await ctx.reply("*⚠️ Terjadi kesalahan saat mengambil data Top Buyers dan Top Products ⚠️*", { parse_mode: "Markdown" });
        }
    }

}

module.exports = HandleHears
// ============================================
// EXPORTS
// ============================================

module.exports = { HandleAction, HandleHears };
