// ─── Public commands ──────────────────────────────────
const startCommand = require("./start");
const helpCommand = require("./help");
const listProduct = require("./listProduct");

// ─── Owner: product ───────────────────────────────────
const addProductModule = require("./addProduct");
const addProduct = addProductModule.addProduct || addProductModule;
const editProduct = require("./editProduct");
const delProduct = require("./delProduct");

// ─── Owner: variant ───────────────────────────────────
const addProductVariantModule = require("./addProductVariant");
const addProductVariants = addProductVariantModule.addProductVariants || addProductVariantModule;
const editVariant = require("./editProductVariant");
const delProductVariant = require("./delProductVariant");

// ─── Owner: stock ─────────────────────────────────────
const addStock = require("./addStock");
const editStock = require("./editStock");
const delStock = require("./delStock");

// ─── Owner: lainnya ───────────────────────────────────
const setHarga = require("./setHarga");
const broadcastCommand = require("./broadcast");
const ownerMenuCommand = require("./ownerMenu");

module.exports = {
    // public
    startCommand,
    helpCommand,
    listProduct,

    // product
    addProduct,
    editProduct,
    delProduct,

    // variant
    addProductVariants,
    editVariant,
    delProductVariant,

    // stock
    addStock,
    editStock,
    delStock,

    // lainnya
    setHarga,
    broadcastCommand,
    ownerMenuCommand
};
