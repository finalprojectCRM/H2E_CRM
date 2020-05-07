const repo = require('./repository');

module.exports = {
    init: repo.init,
    getDBConnectionStatus: repo.getDBConnectionStatus,
    checkExistingStatusesAndRolesAndFiles: repo.checkExistingStatusesAndRolesAndFiles,
    getAdminWorker: repo.getAdminWorker,
    addDefaultAdminWorker: repo.addDefaultAdminWorker,
    getWorkerLogInInfo: repo.getWorkerLogInInfo,
    getAllCollectionItems: repo.getAllCollectionItems,
    getItems: repo.getItems,
    updateFileCollection: repo.updateFileCollection,
    updateWorkerPassword: repo.updateWorkerPassword,
    deleteItemAndReturnUpdatedList: repo.deleteItemAndReturnUpdatedList,
    getCustomerEvents: repo.getCustomerEvents,
    insertItemByCondition: repo.insertItemByCondition,
    updateItem: repo.updateItem,
    assignWorker: repo.assignWorker,
    deleteAllItems: repo.deleteAllItems,
    addOrUpdateItem: repo.addOrUpdateItem,
    getAssignedRoles: repo.getAssignedRoles,
    getItem: repo.getItem
};
