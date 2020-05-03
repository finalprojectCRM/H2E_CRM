const repo = require('../repository');
const utils = require('../utils');
const util = require('util');
const config = require('config');
const logging = require('../utils/logging');
const logger = logging.mainLogger;

async function getClientFile(req, res) {
    let isOnlyClientRoot = false;
    let mainPage = '';
    logger.info(util.format('req.url[%s]', req.url));
    if (req.url === config.server.api.root) {
        isOnlyClientRoot = true;
        mainPage = 'CRM-Client.html';
    }
    if (req.url.includes('CRM-Client')) {
        isOnlyClientRoot = true;
    }
    utils.getFile(req, res, repo.getDBConnectionStatus, isOnlyClientRoot, mainPage);
}

async function getFirstSystemLoadStatus(req, res) {
    logger.info('getFirstSystemLoadStatus');
    //check if data exists in statuses & roles & files collection
    await repo.checkExistingStatusesAndRolesAndFiles();
    let status = {
        code: 200,
        message: 'OK'
    };
    try {
        status = await repo.getDBConnectionStatus();
        if (status.code !== 200) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(status.message);
        }
        const adminUser = await repo.getAdminUser();
        if (!adminUser) {
            await repo.addDefaultAdminUser();
            status.code = 200;
            status.message = {'adminFirstLoad': true};
        } else if (adminUser.UserName === 'Admin' && adminUser.Name === '' && adminUser.eMail === '' && adminUser.Password === '') {
            //there is a user in system and Admin exists = mongo db workersCollection is not empty
            //admin did not yet change the temp password that he got from system
            if (adminUser.TempPassword === config.server.access.firstTempPassword) {
                status.code = 200;
                status.message = {'adminChangedTempPassword': false};
            } else { //admin changed temp password that he got from system
                //go to registration page with admin
                status.code = 200;
                status.message = {'adminChangedTempPassword': true};
            }
        } else { //Admin has filled in all his details
            status.code = 200;
            status.message = {'admin_exists_with_details': true};
        }
    } catch (err) {
        logger.error(util.format('happened error[%s]', err));
        status = utils.getErrorStatus(err);
    }
    const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
    logger.info(util.format("Response Data: %s", response));
    res.writeHead(status.code, {'Content-Type': 'application/json'});
    res.end(response);//Admin has been loaded first time to mongodb
}

async function logIn(req, res) {
    logger.info('logIn');
    let status = {
        code: 200,
        message: 'OK'
    };
    try {
        const user = req.body.LoginUser;
        logger.info(util.format('userName=%s', user.UserName));
        //check if the username and the password exist
        const logInInfo = await repo.getUserLogInInfo(user);
        //if no match
        if (!logInInfo) {
            logger.info('no match!');
            status.code = 200;
            status.message = {noMatch: 'The user name or password is incorrect. Try again.'};
        } else {
            //if there is matching
            logger.info(util.format('logInInfo.Name=%s', logInInfo.Name));
            //check if the user is admin and return a user details with 'adminUser':true
            if (logInInfo.UserName === 'Admin') {
                status.code = 200;
                status.message = {
                    userLogin: {
                        'adminUser': true,
                        'Role': logInInfo.Role,
                        'UserName': logInInfo.UserName,
                        'Name': logInInfo.Name,
                        'eMail': logInInfo.eMail,
                        'Password': logInInfo.Password,
                        'Events': logInInfo.Events
                    }
                };
            } else { //if the user is not admin rturn user datails
                status.code = 200;
                status.message = {userLogin: logInInfo};
            }
        }
    } catch (err) {
        logger.error(util.format('happened error[%s]', err));
        status = utils.getErrorStatus(err);
    }
    const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
    logger.info(util.format("Response Data: %s", response));
    res.writeHead(status.code, {'Content-Type': 'application/json'});
    res.end(response);//Admin has been loaded first time to mongodb
}

/*
    get list of all statuses
*/
async function getStatusOptions(req, res) {

    logger.info('getStatusOptions');
    await repo.getItems(req, res, 'status', 'statusOptions');
}

/*
    get list of all colors for roles
*/
async function getRolesColors(req, res) {

    logger.info('getRolesColors');
    await repo.getItems(req, res, 'color', 'colors');
}

/*
    get list of all files
*/
async function getFiles(req, res) {
    logger.info('getFiles');
    await repo.getItems(req, res, 'file', 'files');
}

/*
    get list of all contacts
*/
async function getContacts(req, res) {
    logger.info('getContacts');
    await repo.getItems(req, res, 'customer', 'contacts');
}

/*
    get list of all roles with their statuses
*/
async function getRoles(req, res) {
    logger.info('getRoles');
    await repo.getItems(req, res, 'rolesWithStatus', 'roles');
}

/*
    get list of all roles with their statuses
*/
async function getUserEvents(req, res) {
    logger.info(util.format('/getUserEvents/%s', req.params.UserName));
    await repo.getItems(req, res, 'worker',
        'userEvents', {UserName: req.params.UserName}, 'Events');
}


exports.getFirstSystemLoadStatus = getFirstSystemLoadStatus;
exports.getClientFile = getClientFile;
exports.logIn = logIn;
exports.getStatusOptions = getStatusOptions;
exports.getRolesColors = getRolesColors;
exports.getFiles = getFiles;
exports.getContacts = getContacts;
exports.getRoles = getRoles;
exports.getUserEvents = getUserEvents;
