const fs = require('fs')
const path = require('path')
const textColor =  require('cli-color')
const moment = require('moment-timezone')


const transactionModels = require('../database/models/transactionModels')
const addStocks = require('./addStocks')


let pollingCount = {}
let transactionStartTime = {}

// Calculate max polling based on timeout and polling interval
// Timeout in ms / Polling interval (7000ms) = Max polling count
const POLLING_INTERVAL = 7000 // 7 seconds (sesuai dengan interval di index.js)
const MAX_POLLING = Math.ceil(parseInt(btzTimeout) / POLLING_INTERVAL)

async function ProcessingTransaction(bot) {
    try {
        const pendingTransactions = await transactionModels.find({
            isSuccess: false,
            isCanceled: false
        })

        for (const transaction of pendingTransactions) {
            try {
                // Initialize polling count and start time
                if (!pollingCount[transaction.transactionId]) {
                    pollingCount[transaction.transactionId] = 0
                    transactionStartTime[transaction.transactionId] = Date.now()
                }

                // Calculate elapsed time
                const elapsedTime = Date.now() - transactionStartTime[transaction.transactionId]
                const remainingTime = parseInt(btzTimeout) - elapsedTime

                // Check if timeout reached
                // Check if timeout reached
                if (remainingTime <= 0) {
                    console.log(textColor.yellow.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Timeout reached for ${transaction.transactionId} (${Math.floor(elapsedTime / 1000)}s)`))

                    await transactionModels.updateOne(
                        { transactionId: transaction.transactionId },
                        { $set: { isCanceled: true } }
                    )

                    await bot.telegram.deleteMessage(transaction.chatId, transaction.messageId)

                    // Get user mention
                    const userMention = transaction.username ? `@${transaction.username}` : `User ${transaction.chatId}`

                    await bot.telegram.sendMessage(
                        transaction.chatId,
                        `*❌ TRANSAKSI DIBATALKAN OTOMATIS*\n*╭────「 DETAIL PESANAN 」*\n*┊・Produk:* ${transaction.productName || transaction.productCode.toUpperCase()}\n*┊・Pembeli:* ${userMention}\n*┊・Jumlah:* ${transaction.quantity || 1} Pcs\n*┊・Total:* Rp ${transaction.totalPrice.toLocaleString('id-ID')}\n*┊・Status:* KADALUARSA (TIMEOUT)\n*╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈*\n⏳ _Batas waktu pembayaran telah habis._\n📢 _Silakan lakukan pemesanan ulang jika ingin melanjutkan transaksi._`,
                        { parse_mode: "Markdown" }
                    )

                    // Return stock
                    await addStocks(transaction.orderData, transaction.productCode)

                    // Clear polling count and start time
                    delete pollingCount[transaction.transactionId]
                    delete transactionStartTime[transaction.transactionId]
                    continue
                }

                // Check max polling (backup safety)
                if (pollingCount[transaction.transactionId] >= MAX_POLLING) {
                    console.log(textColor.yellow.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Max polling (${MAX_POLLING}) reached for ${transaction.transactionId}`))
                    continue
                }

                // Get transaction details from Betabotz Paygate
                const result = await paygate.getTransaction(
                    transaction.transactionId,
                    transaction.accessKey
                )

                pollingCount[transaction.transactionId]++

                // Log polling status
                console.log(textColor.cyan.bold("[ POLLING ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` ${transaction.transactionId} - Poll #${pollingCount[transaction.transactionId]}/${MAX_POLLING} | Remaining: ${Math.floor(remainingTime / 1000)}s`))

                if (result.success && result.data) {
                    const status = result.data.status

                    // Check if payment is successful
                    if (status === 'sukses') {
                        await bot.telegram.deleteMessage(transaction.chatId, transaction.messageId)
                        await transactionModels.updateOne(
                            { transactionId: transaction.transactionId },
                            { $set: { isSuccess: true } }
                        )

                        console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Berhasil mengirim data produk ke ${transaction.chatId} (${transaction.transactionId})`))

                        await bot.telegram.sendMessage(
                            transaction.chatId,
                            `╭────〔 *TRANSAKSI SUKSES🎉* 〕──\n│・ *Traksaksi ID :* ${transaction.transactionId}\n│・ *Code Product :* ${transaction.productCode.toUpperCase()}\n│・ *Total Dibayar :* Rp ${transaction.totalPrice.toLocaleString('id-ID')}\n╰─────────\n╭────〔 *KETERANGAN PRODUK📄* 〕──\n│ 📄 ${transaction.keteranganVariant}\n╰─────────\n╰➤ *Data barang yang di beli check file txt di bawah👇*`,
                            { parse_mode: "Markdown" }
                        )
                        const filePath = path.join(__dirname, `../database/dataOrder/${transaction.transactionId}.txt`)

                        fs.writeFile(filePath, transaction.orderData, async (err) => {
                            if (err) {
                                return console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(err.message))
                            }

                            await bot.telegram.sendDocument(transaction.chatId, { source: filePath })
                                .then(() => {
                                    fs.unlink(filePath, (err) => {
                                        if (err) {
                                            console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(err.message))
                                        }
                                    })
                                })
                                .catch((err) => {
                                    console.log(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(err.message))
                                })
                        })

                        // Clear polling count and start time
                        delete pollingCount[transaction.transactionId]
                        delete transactionStartTime[transaction.transactionId]
                    }
                    // Check if payment expired or cancelled
                    // Check if payment expired or cancelled
                    else if (status === 'expired' || status === 'cancel') {
                        console.log(textColor.yellow.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Transaksi ${transaction.transactionId} ${status}`))

                        await transactionModels.updateOne(
                            { transactionId: transaction.transactionId },
                            { $set: { isCanceled: true } }
                        )
                     
                        await bot.telegram.deleteMessage(transaction.chatId, transaction.messageId)

                        // Get user mention
                        const userMention = transaction.username ? `@${transaction.username}` : `User ${transaction.chatId}`
                        const statusText = status === 'expired' ? 'KADALUARSA' : 'DIBATALKAN'

                        await bot.telegram.sendMessage(
                            transaction.chatId,
                            `*──────────『 PAYMENT ${status.toUpperCase()} 』──────────*\n*❌ TRANSAKSI DIBATALKAN OTOMATIS*\n*╭────「 DETAIL PESANAN 」*\n*┊・Produk:* ${transaction.productName || transaction.productCode.toUpperCase()}\n*┊・Pembeli:* ${userMention}\n*┊・Jumlah:* ${transaction.quantity || 1} Pcs\n*┊・Total:* Rp ${transaction.totalPrice.toLocaleString('id-ID')}\n*┊・Status:* ${statusText}\n*╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈*\n⏳ _Batas waktu pembayaran telah habis._\n📢 _Silakan lakukan pemesanan ulang jika ingin melanjutkan transaksi._`,
                            { parse_mode: "Markdown" }
                        )

                        // Return stock
                        await addStocks(transaction.orderData, transaction.productCode)

                        // Clear polling count and start time
                        delete pollingCount[transaction.transactionId]
                        delete transactionStartTime[transaction.transactionId]
                    }
                }
            } catch (error) {
                console.error(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Error processing transaction ${transaction.transactionId}: ${error.message}`))
            }
        }
    } catch (error) {
        console.error(textColor.red.bold("[ ERROR ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Error in ProcessingTransaction: ${error.message}`))
    }
}

module.exports = ProcessingTransaction