const mongoose = require('mongoose');
const textColor = require("cli-color");
const moment = require('moment-timezone');


const db = mongoose.connection;

async function connectDatabase() {
    try {
        await mongoose.connect(DATABASE_MONGODB_URI, {
            dbName: "BTZPayGate",
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (error) {
        console.clear()
        console.log("MongoDB connection error:", error);
        process.exit()

    }
}

db.once("connected", () => {
    console.log(textColor.green.bold("[ INFO ]") + ` [${moment().format('HH:mm:ss')}]:` + textColor.blueBright(" Success connect to database"));
});

module.exports = connectDatabase;
