const config = require('config');
const storage = require('./' + config.storage);

module.exports = {
    init: storage.init,
    countItems: storage.countItems,
    populateEmptyCollectionByDefaultValue: storage.populateEmptyCollectionByDefaultValue,
    addItem: storage.addItem,
    updateItem: storage.updateItem,
    addItems: storage.addItems,
    getItem: storage.getItem,
    deleteItem: storage.deleteItem,
    getAllItems: storage.getAllItems,
    getCollection: storage.getCollection
};
