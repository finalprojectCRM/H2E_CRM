const config = require('config');
const utils = require('../utils');
const util = require('util');
const storage = require('../storage');
const {EventEmitter} = require('events');
const mediator = new EventEmitter();
const logging = require('../utils/logging');
const logger = logging.mainLogger;
let status = {};

async function init() {
    let status = {};
    await setDBConnectionStatus(utils.getErrorStatus(util.format(config.server.errors.DB.ERROR_DB_CONNECTION_FAILED,
        config.storage, 'possible networking issues')), false);
    logger.info(util.format('connecting to %s DB ...', config.storage));
    try {
        const {statusCode, statusMessage, dbHandle} = await storage.init(mediator, logger);
        status = {
            'code': statusCode,
            'message': statusMessage
        };
        if (statusCode !== 200) {
            return status;
        }
        status = {
            'code': 200,
            'message': util.format('Connected to %s DB: %s', config.storage, statusMessage)
        };
        await setDBConnectionStatus(status);

        // create db collections
        return {
            status: status,
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

/*
 This function checks whether the collections statuses, roles and files are empty
*/
async function checkExistingStatusesAndRolesAndFiles() {
    logger.info('checkExistingStatusesAndRolesAndFiles');
    await storage.populateEmptyCollectionByDefaultValue([{'Status': 'בעיה טכנית'}], 'status', logger);
    await storage.populateEmptyCollectionByDefaultValue([{Role: 'new in the system'},
        {Role: 'תמיכה טכנית',
            Color: '#66ffff',
            Statuses: ['בעיה טכנית']
        }], 'rolesWithStatus', logger);
    await storage.populateEmptyCollectionByDefaultValue([{Color: '#66ffff'}], 'color', logger);
    await storage.populateEmptyCollectionByDefaultValue([{Status: 'בעיה טכנית', Roles: ['תמיכה טכנית']}], 'statusesWithRole', logger);
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

async function getUserLogInInfo(user) {
    return await storage.getItem({'UserName': user.UserName, 'Password': user.Password}, 'worker');
}

exports.init = init;
exports.getDBConnectionStatus = getDBConnectionStatus;
exports.checkExistingStatusesAndRolesAndFiles = checkExistingStatusesAndRolesAndFiles;
exports.getAdminUser = getAdminUser;
exports.addDefaultAdminUser = addDefaultAdminUser;
exports.getUserLogInInfo = getUserLogInInfo;
exports.getAllCollectionItems = getAllCollectionItems;
