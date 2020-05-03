const util = require("util");
const config = require('config');
const storage = require('./' + config.storage);

module.exports = {
    init: storage.init,
    countItems: storage.countItems,
    populateEmptyCollectionByDefaultValue: storage.populateEmptyCollectionByDefaultValue,
    addItem: storage.addItem,
    addItems: storage.addItems,
    getItem: storage.getItem,
    deleteItem: storage.deleteItem,
    getAllItems: storage.getAllItems

};
