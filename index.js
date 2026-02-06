// Load settings first to set global variables
require('./settings');

const { Telegraf, Markup } = require('telegraf');
const textColor = require('cli-color');
const moment = require('moment-timezone');
const figlet = require('figlet');

const { HandleHears, HandleAction } = require('./handler');

const handleHears = new HandleHears()
const handleAction = new HandleAction()

moment.tz.setDefault('Asia/Jakarta');

const connectDatabase = require('./database');
const command = require('./plugins/exportPlugins');

const ProcessingTransaction = require('./function/ProcessTransaction');

const token_bot = BOT_TOKEN;

if (!token_bot || !OWNER_ID || !DATABASE_MONGODB_URI || !btzKey) {
    console.error("Harap isi semua yang ada di file settings.js");
    process.exit(1);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var bot = new Telegraf(token_bot);

bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'infobot', description: 'Info Bot' },
    { command: 'ownermenu', description: 'Open owner menu' },
]);

// ─── Public commands ────────────────────────────────────
bot.start(command.startCommand);
bot.command("help", command.helpCommand);

// ─── Owner: product ─────────────────────────────────────
bot.command(["addproduct", "addproduk"], command.addProduct);
bot.command(["editproduct", "editproduk"], command.editProduct);
bot.command(["delproduct", "delproduk", "delproducts"], command.delProduct);

// ─── Owner: variant ─────────────────────────────────────
bot.command(["addvariant", "addvariants", "addproductvariant", "addproductvariants"], command.addProductVariants);
bot.command(["editvariant", "editvariants", "editproductvariant"], command.editVariant);
bot.command(["delvariant", "delvariants", "delproductvariant", "delproductvariants", "delprodukvariant", "delprodukvariants"], command.delProductVariant);

// ─── Owner: stock ───────────────────────────────────────
bot.command(["addstock", "addstok"], command.addStock);
bot.command(["editstock", "editstok"], command.editStock);
bot.command(["delstock", "delstocks"], command.delStock);

// ─── Owner: lainnya ─────────────────────────────────────
bot.command("setharga", command.setHarga);
bot.command("broadcast", command.broadcastCommand);
bot.command("ownermenu", command.ownerMenuCommand);

bot.command("infobot", (ctx) => {
  try {
    const text = "*Creator Bot : Betabotz*\n*Version : 1.0.0*\n\n*Thanks To:*\n• ERLAN RAHMAT/BETABOTZ\n• DANIAL ALRES/DANIALIFY (REFERENSI IDE)\n\n_Terima kasih atas kontribusinya dalam pembuatan script ini_ 🙏"
    
    ctx.replyWithMarkdown(text, {
      ...Markup.inlineKeyboard([
        [Markup.button.url('Source Code', "https://github.com/ERLANRAHMAT/betabotzpg-teleorder")],
      ])
    })
  } catch (err) {
    ctx.reply("*⚠️SOMETHING ERROR IN COMMAND INFO BOT⚠️*", {
      parse_mode: "Markdown",
    })
    console.log(textColor.red.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Something error in file command/start.js ${err.message}`));
  }
})

//logger
bot.hears(/^\d+$/, (ctx) => {
    console.log(textColor.green.bold("[ HEARS ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` User ${ctx.from.id} mengakses product list dengan input: ${ctx.message.text}`));
    handleHears.handleProductList(ctx);
});

bot.hears("TOP 5 BUYYER LEADERBOARD", (ctx) => {
    console.log(textColor.green.bold("[ HEARS ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` User ${ctx.from.id} mengakses TOP BUYER`));
    handleHears.GetTopBuyer(ctx);
});

bot.hears("BEST SELLER", (ctx) => {
    console.log(textColor.green.bold("[ HEARS ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` User ${ctx.from.id} mengakses BEST PRODUCT`));
    handleHears.GetTopProduct(ctx);
});

bot.hears("LIST PRODUCT", (ctx) => {
    console.log(textColor.green.bold("[ HEARS ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` User ${ctx.from.id} mengakses LIST PRODUCT`));
    command.listProduct(ctx);
});

bot.hears("TUTORIAL ORDER", (ctx) => {
    console.log(textColor.green.bold("[ HEARS ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` User ${ctx.from.id} mengakses TUTORAL ORDER`));
    command.helpCommand(ctx);
});
//action
bot.action(/^variant-(.+)$/, (ctx) => handleAction.ShowPesanan(ctx));
bot.action(["plus-order", "mines-order"], (ctx) => handleAction.PlusMinesStockProduct(ctx))
bot.action("confirm-order", (ctx) => handleAction.ConfirmOrder(ctx))
bot.action("show-code-variant", (ctx) => { ctx.deleteMessage(); handleAction.showAllproductVariant(ctx) })
bot.action("back-to-ownermenu", (ctx) => { ctx.deleteMessage(); command.ownerMenuCommand(ctx) })
bot.action("cancel-order-pesanan", (ctx) => handleAction.cancelOrder(ctx));
bot.action(["back-to-product-list", "back-to-listproduct"], async (ctx) => {
    await delay(1_800)
    if (ctx.callbackQuery && ctx.callbackQuery.message) {
        const messageId = ctx.callbackQuery.message.message_id;

        await ctx.deleteMessage(messageId)
    }; await command.listProduct(ctx)
})

bot.telegram.getMe().then(async (me) => {
    console.clear()
    console.log(await textColor.greenBright(await figlet("Betabotz")));
    console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(` Succes connect to bot ${me.username}`));
    await connectDatabase()
})

bot.launch()

let isProcessing = false
setInterval(async () => {
    if (!isProcessing) {
        isProcessing = true;
        await ProcessingTransaction(bot);
        isProcessing = false;
    }
}, 7_000);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
