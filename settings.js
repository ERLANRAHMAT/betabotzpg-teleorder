// settings.js
const BetabotzPaygate = require('betabotz-paygate');

// Set as global variables for easy access across the app
global.BOT_TOKEN = "";
global.OWNER_ID = "";
global.DATABASE_MONGODB_URI = "";

// Betabotz Paygate Configuration
global.btzKey = "";
global.btzTimeout = "900000"; // 15 minutes dalam milidetik
global.btzFee = "0"; // Rp 0
global.btzMethod = "qrisgopay"; // qrisdana, qrisgopay, qrisorkut, qrisshopeepay,etc

// Initialize Betabotz Paygate
const paygate = new BetabotzPaygate({
    apiKey: btzKey 
});
global.paygate = paygate;

// Export as module for use in other files
module.exports = {
    BOT_TOKEN: global.BOT_TOKEN,
    OWNER_ID: global.OWNER_ID,
    DATABASE_MONGODB_URI: global.DATABASE_MONGODB_URI,
    BTZ_MERCHANT_KEY: global.btzKey,
    BTZ_TIMEOUT_PAYMENT: global.btzTimeout,
    BTZ_FEE: global.btzFee,
    BTZ_PAYMENT_METHOD: global.btzMethod,
    paygate: global.paygate
};

