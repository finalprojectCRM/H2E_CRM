const repo = require('./repository');

module.exports = {
    init: repo.init,
    getDBConnectionStatus: repo.getDBConnectionStatus,
    checkExistingStatusesAndRolesAndFiles: repo.checkExistingStatusesAndRolesAndFiles,
    getAdminUser: repo.getAdminUser,
    addDefaultAdminUser: repo.addDefaultAdminUser,
    getUserLogInInfo: repo.getUserLogInInfo,
    getAllCollectionItems: repo.getAllCollectionItems,
    getItems: repo.getItems,
    updateFileCollection: repo.updateFileCollection
};
