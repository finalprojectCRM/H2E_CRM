const config = require('config');
const utils = require('../utils');
const util = require('util');
const storage = require('../storage');
const {EventEmitter} = require('events');
const _ = require('lodash');
const mediator = new EventEmitter();
const logging = require('../utils/logging');
const logger = logging.mainLogger;
let status = {};

module.exports = {
    setDBConnectionStatus: async function (connStatus, isLogMessage = true) {
        status = connStatus;
        if (isLogMessage) {
            logger.info(status.message);
        }
    },
    getDBConnectionStatus: async function () {
        logger.info(util.format('DB Connection Status Code: [%s]', status.code));
        logger.info(util.format('DB Connection Status Message: [%s]', status.message));
        return status;
    },
    init: async function () {
        let connStatus = {};
        logger.info(util.format('connecting to %s DB ...', config.storage));
        try {
            await module.exports.setDBConnectionStatus(utils.getErrorStatus(util.format(config.server.errors.DB.ERROR_DB_CONNECTION_FAILED,
                config.storage, 'possible networking issues')), false);
            const {statusCode, statusMessage} = await storage.init(mediator, logger);
            connStatus = {
                'code': statusCode,
                'message': statusMessage
            };
            if (statusCode !== 200) {
                connStatus = await module.exports.getDBConnectionStatus();
                return {status: connStatus};
            }
            connStatus = {
                'code': 200,
                'message': util.format('Connected to %s DB: %s', config.storage, statusMessage)
            };
            await module.exports.setDBConnectionStatus(connStatus);
            connStatus = await module.exports.getDBConnectionStatus();
            return connStatus;
        } catch (err) {
            logger.error(util.format('Error while trying to connect: %s', err));
            setTimeout(module.exports.init, config.mongo.retryInterval);
        }
    },
    /*
     This function checks whether the collections statuses, roles and files are empty
    */
    checkExistingStatusesAndRolesAndFiles: async function () {
        logger.info('checkExistingStatusesAndRolesAndFiles');
        await storage.populateEmptyCollectionByDefaultValue([{'Status': 'בעיה טכנית'}], 'status', logger);
        await storage.populateEmptyCollectionByDefaultValue([{Role: 'new in the system'},
            {
                Role: 'תמיכה טכנית',
                Color: '#66ffff',
                Statuses: ['בעיה טכנית']
            }], 'rolesWithStatus', logger);
        await storage.populateEmptyCollectionByDefaultValue([{Color: '#66ffff'}], 'color', logger);
        await storage.populateEmptyCollectionByDefaultValue([{
            Status: 'בעיה טכנית',
            Roles: ['תמיכה טכנית']
        }], 'statusesWithRole', logger);
    },
    getAdminWorker: async function () {
        return await storage.getItem({'workerName': 'Admin'}, 'worker');
    },
    getItem: async function (item, type) {
        return await storage.getItem(item, type);
    },
    getAllCollectionItems: async function (type, condition) {
        return await storage.getAllItems(type, condition);
    },
    addDefaultAdminWorker: async function () {
        return await storage.addItem({
            'workerName': 'Admin',
            'Role': 'Administrator',
            'Name': '',
            'eMail': '',
            'Password': '',
            'TempPassword': config.server.access.firstTempPassword
        }, 'worker');
    },
    getWorkerLogInInfo: async function (workerName, password) {
        return await storage.getItem({'workerName': workerName, 'Password': password}, 'worker');
    },
    getItems: async function (req, res, collectionName, desc, condition = {}, arrayValue = '', jsonObj = undefined, isResponse = true) {
        let status = {code: 200, message: 'OK'};
        try {
            let itemArray = await module.exports.getAllCollectionItems(collectionName, condition);
            //OK response with the list of all statuses
            status.code = 200;
            if (arrayValue) {
                itemArray = itemArray[0][arrayValue];
            }
            if (jsonObj) {
                jsonObj[desc] = itemArray;
                status.message = jsonObj;
            } else {
                const resJson = JSON.stringify({desc: itemArray}).replace('desc', desc);
                status.message = JSON.parse(resJson);
            }
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
        }
        if (isResponse) {
            const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
            logger.info(util.format('Response Data: %s', response));
            res.writeHead(status.code, {'Content-Type': 'application/json'});
            res.end(response);
        } {
            return status.message;
        }
    },
    handleWorker: async function (req, res, workerName, warningMessage, isDelete = false ) {
        logger.info('deleteWorker');
        //the customer to delete with its details
        let status = {code: 200, message: 'OK'};
        try {
            logger.info(util.format('workerName: %s', workerName));
            const worker = await module.exports.getItem({'workerName': workerName}, 'worker');
            const workers = await module.exports.getItems(req, res, 'worker', 'workers', {'Role': worker.Role}, '', {'workers': {}}, false);
            if (workers.workers.length > 1) {
                if (isDelete) {
                    const updatedWorkers = await module.exports.deleteItemAndReturnUpdatedList(req, res, {'workerName': workerName}, 'worker',
                        {'workers': {}}, 'workers', undefined, false, false);
                    logger.info(util.format('updatedWorkers=%s', JSON.stringify(updatedWorkers)));
                }
                
                const eventsItems = await module.exports.getItems(req, res, 'event', 'events',
                    {'workerName': worker.workerName}, '', {'events': {}}, false);
                for (let i = 0; i < eventsItems.events.length; i++) {
                    const eventBeforeUpdate = _.clone(eventsItems.events[i], true);
                    const eventAfterUpdate = _.clone(eventsItems.events[i], true);
                    eventAfterUpdate.workerName = await module.exports.assignWorker({Role: worker.Role}, 'event');
                    await module.exports.updateItem(req, res, eventBeforeUpdate, {$set: eventAfterUpdate}, 'event', undefined, undefined, undefined, false);
                }
                const customersItems = await module.exports.getItems(req, res, 'customer', 'customers',
                    {'workerName': worker.workerName}, '', {'customers': {}}, false);
                for (let i = 0; i < customersItems.events.length; i++) {
                    const customerBeforeUpdate = _.clone(customersItems.events[i], true);
                    const customerAfterUpdate = _.clone(customersItems.events[i], true);
                    customerAfterUpdate.workerName = await module.exports.assignWorker({Role: worker.Role}, 'customer');
                    await module.exports.updateItem(req, res, customerBeforeUpdate, {$set: customerAfterUpdate}, 'customer', undefined, undefined, undefined, false);
                }
                await module.exports.getItems(req, res, 'worker', 'workers', {}, '', {'workers': {}});
            } else {
                status.message = warningMessage;
            }
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = module.exports.getErrorStatus(err);
        }
        const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
        logger.info(util.format('Response Data: %s', response));
        res.writeHead(status.code, {'Content-Type': 'application/json'});
        res.end(response);
    },

    getCustomerEvents: async function (req, res, collectionName) {
        let status = {
            code: 200,
            message: {}
        };
        try {
            storage.getCollection(collectionName).find(
                {
                    'workerName': req.params.workerName,
                    'customerPhone': req.params.eventId
                }).forEach(function (doc) {
                doc.Events = doc.Events.filter(function (event) {
                    if (event.id === req.params.eventId) {
                        return event;
                    }
                });
                console.dir(doc.Events);
                if (doc.Events) {
                    status.message = {'customerEvents': doc.Events};
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({'customerEvents': doc.Events}));
                } else {
                    status.message = {'customerEvents': {}};
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({'customerEvents': doc.Events}));
                }
            });
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
            const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
            res.writeHead(status.code, {'Content-Type': 'application/json'});
            res.end(response);
        }
    },
    deleteItemAndReturnUpdatedList: async function (req, res, item, collectionName, jsonObj, desc = undefined, deleteItem = undefined, isPullItems = false, isResponse = true) {
        let status = {
            code: 200,
            message: 'OK'
        };
        try {
            let cursor;
            logger.info(util.format('deleteItemAndReturnUpdatedList: item=%s collectionName=%s',
                JSON.stringify(item), collectionName));
            if (isPullItems) {
                cursor = await storage.deleteItem(item, collectionName, deleteItem, isPullItems);
                logger.info(util.format('deleted %s %s', cursor.modifiedCount, collectionName));
            } else {
                cursor = await storage.deleteItem(item, collectionName);
                logger.info(util.format('deleted %s %s', cursor.deletedCount, collectionName));
            }

            const itemArray = await module.exports.getAllCollectionItems(collectionName, {});
            status.code = 200;
            if (desc) {
                jsonObj[desc] = itemArray;
            }
            status.message = jsonObj;
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
        }
        if (isResponse) {
            const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
            logger.info(util.format("Response Data: %s", response));
            res.writeHead(status.code, {'Content-Type': 'application/json'});
            res.end(response);
        } else {
            return jsonObj;
        }
    },
    updateFileCollection: async function (fileName) {
        return await storage.updateItem({FileName: fileName}, 'file');
    },
    updateWorkerPassword: async function (workerNameItem, newPasswordItem) {
        return await storage.updateItem(workerNameItem, 'worker', newPasswordItem);
    },
    insertItemByCondition: async function (req, res, condition, item, descJson, type, isResponse = true, resJson = undefined) {
        let status = {code: 200, message: 'OK'};
        try {
            const foundItem = await storage.getItem(condition, type);
            if (!foundItem) {
                await storage.addItem(item, type);
                status.message = {'success': item};
                if (resJson) {
                    status.message = resJson;
                }
            } else {
                status.message = descJson;
            }
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
        }
        if (isResponse) {
            const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
            logger.info(util.format('Response Data: %s', response));
            res.writeHead(status.code, {'Content-Type': 'application/json'});
            res.end(response);
        } else {
            return status.message;
        }
    },
    updateItem: async function (req, res, condition, item, type, descJson = undefined, jsonObj = undefined, desc = undefined, isResponse = true) {
        let status = {code: 200, message: 'OK'};
        try {
            await storage.updateItemByCondition(condition, item, type);
            if (descJson) {
                status.message = descJson;
            } else {
                status.message = {'success': item};
            }
            if (jsonObj) {
                const itemArray = await module.exports.getAllCollectionItems(type, {});
                jsonObj[desc] = itemArray;
                status.message = jsonObj;
            }
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
        }
        if (isResponse) {
            const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
            logger.info(util.format('Response Data: %s', response));
            res.writeHead(status.code, {'Content-Type': 'application/json'});
            res.end(response);
        } else {
            return status.message;
        }
    },
    addOrUpdateItem: async function (req, res, findItem, type, updatedItem = undefined, insertIfNotFound = false, sendResponse = true, useAddToSet = false, updateMany = false, resJson = undefined) {
        let status = {code: 200, message: 'OK'};
        try {
            if (updateMany) {
                await storage.updateItems(findItem, type, updatedItem, insertIfNotFound, useAddToSet);
            } else {
                await storage.updateItem(findItem, type, updatedItem, insertIfNotFound, useAddToSet);
            }
            status.message = {'success': findItem};
            if (resJson) {
                status.message = resJson;
            }
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
        }
        if (sendResponse) {
            const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
            logger.info(util.format('Response Data: %s', response));
            res.writeHead(status.code, {'Content-Type': 'application/json'});
            res.end(response);
        } else {
            return status.message;
        }
    },
    deleteAllItems: async function (req, res, type, jsonObj, condition = {}) {
        let status = {code: 200, message: 'OK'};
        try {
            await storage.deleteAllItems(type, condition);
            status.message = jsonObj;
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
        }
        const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
        logger.info(util.format('Response Data: %s', response));
        res.writeHead(status.code, {'Content-Type': 'application/json'});
        res.end(response);
    },
    assignWorker: async function (condition, assignedCollection) {
        const assignedItems = [];
        const workerArray = await module.exports.getAllCollectionItems('worker', condition);

        for (let i = 0; i < workerArray.length; i++) {
            const foundItems = await module.exports.getAllCollectionItems(assignedCollection, {workerName: workerArray[i].workerName});
            assignedItems.push(foundItems.length);
        }
        const minIndex = _.indexOf(assignedItems, _.min(assignedItems));
        return minIndex === -1 ? null : workerArray[minIndex].workerName;
    },
    getAssignedRoles: async function (req, res) {
        let status = {code: 200, message: 'OK'};
        try {
            const assignedRoles = [];
            const workerArray = await module.exports.getAllCollectionItems('worker', {});
            const roleArray = await module.exports.getAllCollectionItems('rolesWithStatus', {});

            for (let i = 0; i < workerArray.length; i++) {
                for (let j = 0; j < roleArray.length; j++) {
                    if (workerArray[i].Role === roleArray[j].Role) {
                        assignedRoles.push(roleArray[j]);
                    }
                }
            }
            status.message = {'assignedRoles': _.sortedUniq(assignedRoles)};
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
        }
        const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
        logger.info(util.format('Response Data: %s', response));
        res.writeHead(status.code, {'Content-Type': 'application/json'});
        res.end(response);
    }
};

