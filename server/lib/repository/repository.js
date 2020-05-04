const config = require('config');
const utils = require('../utils');
const util = require('util');
const storage = require('../storage');
const {EventEmitter} = require('events');
const mediator = new EventEmitter();
const logging = require('../utils/logging');
const logger = logging.mainLogger;
let status = {};

async function setDBConnectionStatus(connStatus, isLogMessage = true) {
    status = connStatus;
    if (isLogMessage) {
        logger.info(status.message);
    }
}

async function getDBConnectionStatus() {
    logger.info(util.format('DB Connection Status Code: [%s]', status.code));
    logger.info(util.format('DB Connection Status Message: [%s]', status.message));
    return status;
}

async function init() {
    let connStatus = {};
    logger.info(util.format('connecting to %s DB ...', config.storage));
    try {
        await setDBConnectionStatus(utils.getErrorStatus(util.format(config.server.errors.DB.ERROR_DB_CONNECTION_FAILED,
            config.storage, 'possible networking issues')), false);
        const {statusCode, statusMessage, dbHandle} = await storage.init(mediator, logger);
        connStatus = {
            'code': statusCode,
            'message': statusMessage
        };
        if (statusCode !== 200) {
            connStatus = await getDBConnectionStatus();
            return {status: connStatus};
        }
        connStatus = {
            'code': 200,
            'message': util.format('Connected to %s DB: %s', config.storage, statusMessage)
        };
        await setDBConnectionStatus(connStatus);
        connStatus = await getDBConnectionStatus();

        // create db collections
        return {
            status: connStatus,
            customers: dbHandle.collection('customers'),
            statuses: dbHandle.collection('statuses'),
            workers: dbHandle.collection('workers'),
            files: dbHandle.collection('files'),
            rolesWithStatuses: dbHandle.collection('roles with statuses'),
            statusesWithRoles: dbHandle.collection('statuses with roles'),
            colors: dbHandle.collection('colors')
        };

    } catch (err) {
        logger.error(util.format('Error while trying to connect: %s', err));
        setTimeout(init, config.mongo.retryInterval);
    }
}

/*
 This function checks whether the collections statuses, roles and files are empty
*/
async function checkExistingStatusesAndRolesAndFiles() {
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
}

async function getAdminUser() {
    return await storage.getItem({'UserName': 'Admin'}, 'worker');
}

async function getAllCollectionItems(type, condition) {
    return await storage.getAllItems(type, condition);
}

async function addDefaultAdminUser() {
    return await storage.addItem({
        'UserName': 'Admin',
        'Role': 'Administrator',
        'Name': '',
        'eMail': '',
        'Password': '',
        'TempPassword': config.server.access.firstTempPassword
    }, 'worker');
}

async function getUserLogInInfo(userName, password) {
    return await storage.getItem({'UserName': userName, 'Password': password}, 'worker');
}

async function getItems(req, res, collectionName, desc, condition = {}, arrayValue = '') {
    let status = {
        code: 200,
        message: 'OK'
    };
    try {
        let itemArray = await getAllCollectionItems(collectionName, condition);
        //OK response with the list of all statuses
        status.code = 200;
        if (arrayValue) {
            itemArray = itemArray[0][arrayValue];
        }
        const resJson = JSON.stringify({desc: itemArray}).replace('desc', desc);
        status.message = JSON.parse(resJson);
    } catch (err) {
        logger.error(util.format('happened error[%s]', err));
        status = module.exports.getErrorStatus(err);
    }
    const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
    logger.info(util.format("Response Data: %s", response));
    res.writeHead(status.code, {'Content-Type': 'application/json'});
    res.end(response);
}

async function getCustomerEvents(req, res, collectionName) {
    let status = {
        code: 200,
        message: {}
    };
    try {
        storage.getCollection(collectionName).find(
            {
                'UserName': req.params.UserName,
                'Events.id': req.params.eventId
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
                res.end(JSON.stringify({ 'customerEvents': doc.Events}));
            } else {
                status.message = {'customerEvents': {}};
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({ 'customerEvents': doc.Events}));
            }
        });
    } catch (err) {
        logger.error(util.format('happened error[%s]', err));
        status = module.exports.getErrorStatus(err);
        const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
        res.writeHead(status.code, {'Content-Type': 'application/json'});
        res.end(response);
    }
    /*const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
    logger.info(util.format("Response Data: %s", response));
    res.writeHead(status.code, {'Content-Type': 'application/json'});
    res.end(response);*/
}

async function deleteItemAndReturnUpdatedList(req, res, item, collectionName, jsonObj, desc) {
    let status = {
        code: 200,
        message: 'OK'
    };
    try {
        logger.info(util.format('deleteItemAndReturnUpdatedList: item=%s collectionName=%s',
            JSON.stringify(item), collectionName));

        const cursor = await storage.deleteItem(item, collectionName);
        logger.info(util.format('deleted %s %s', cursor.deletedCount, collectionName));
        const itemArray = await getAllCollectionItems(collectionName, {});
        status.code = 200;
        if (desc) {
            jsonObj[desc] = itemArray;
        }
        status.message = jsonObj;
    } catch (err) {
        logger.error(util.format('happened error[%s]', err));
        status = module.exports.getErrorStatus(err);
    }
    const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
    logger.info(util.format("Response Data: %s", response));
    res.writeHead(status.code, {'Content-Type': 'application/json'});
    res.end(response);
}

async function updateFileCollection(fileName) {
    return await storage.updateItem({FileName: fileName}, 'file');
}

async function updateUserPassword(userNameItem, newPasswordItem) {
    return await storage.updateItem(userNameItem, 'worker', newPasswordItem);
}

exports.init = init;
exports.getDBConnectionStatus = getDBConnectionStatus;
exports.checkExistingStatusesAndRolesAndFiles = checkExistingStatusesAndRolesAndFiles;
exports.getAdminUser = getAdminUser;
exports.addDefaultAdminUser = addDefaultAdminUser;
exports.getUserLogInInfo = getUserLogInInfo;
exports.getAllCollectionItems = getAllCollectionItems;
exports.getItems = getItems;
exports.updateFileCollection = updateFileCollection;
exports.updateUserPassword = updateUserPassword;
exports.deleteItemAndReturnUpdatedList = deleteItemAndReturnUpdatedList;
exports.getCustomerEvents = getCustomerEvents;
