const config = require('config');
const storage = require('./' + config.storage);

module.exports = {
    init: storage.init,
    countItems: storage.countItems,
    populateEmptyCollectionByDefaultValue: storage.populateEmptyCollectionByDefaultValue,
    addItem: storage.addItem,
    updateItem: storage.updateItem,
    updateItems: storage.updateItems,
    addItems: storage.addItems,
    getItem: storage.getItem,
    deleteItem: storage.deleteItem,
    getAllItems: storage.getAllItems,
    getCollection: storage.getCollection,
    updateItemByCondition: storage.updateItemByCondition,
    deleteAllItems: storage.deleteAllItems
};
