const repo = require('../repository');
const utils = require('../utils');
const util = require('util');
const config = require('config');
const fs = require('fs');
const logging = require('../utils/logging');
const logger = logging.mainLogger;

module.exports = {
    getClientFile: async function (req, res) {
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
    },

    getFirstSystemLoadStatus: async function (req, res) {
        let status = {code: 200, message: 'OK'};
        logger.info('getFirstSystemLoadStatus');
        //check if data exists in statuses & roles & files collection
        try {
            await repo.checkExistingStatusesAndRolesAndFiles();
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
    },
    /*
    verify a temporary password that user received from the admin to perform the first user registration to the system
*/
    verifyTemporaryPassword: async function (req, res) {
        let status = {code: 200, message: 'OK'};
        try {
            logger.info('/verifyTemporaryPassword');
            status = await repo.getDBConnectionStatus();
            if (status.code !== 200) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(status.message);
            }
            const adminUser = await repo.getAdminUser();
            const tempPassword = req.body.tempPassword;
            if (adminUser.TempPassword !== tempPassword) { //not correct temp password
                logger.info('!result not a password');
                status.code = 200;
                status.message = {notVerified: 'You do not have a correct temporary password , Please get it from the administrator'};
            } else if (adminUser.UserName === 'Admin' && adminUser.Name === '' && adminUser.eMail === '' && adminUser.Password === '') {
                if (adminUser.TempPassword === config.server.access.firstTempPassword) { //admin did not yet change the temp password that he got from system
                    status.code = 200;
                    status.message = {'adminChangedTempPassword': false};
                } else { //admin changed temp password that he got from system
                    status.code = 200;
                    status.message = {'adminChangedTempPassword': true};
                }
            } else {
                //the user has a good password that changed by admin
                logger.info('good password');
                status.code = 200;
                status.message = {verified: true};
            }
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
        }
        const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
        logger.info(util.format("Response Data: %s", response));
        res.writeHead(status.code, {'Content-Type': 'application/json'});
        res.end(response);//Admin has been loaded first time to mongodb
    },

    verifyCurrentPassword: async function (req, res) {
        let status = {code: 200, message: 'OK'};
        try {
            logger.info('/verifyCurrentPassword');
            status = await repo.getDBConnectionStatus();
            if (status.code !== 200) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(status.message);
            }
            const loggedInCurrentPassword = req.body.loggedInCurrentPassword;
            logger.info(util.format('curUsername=%s', loggedInCurrentPassword.username));
            logger.info(util.format('curPassword=%s', loggedInCurrentPassword.currentPassword));
            //try to find in user collection a user with a given username and password
            const logInInfo = await repo.getUserLogInInfo(loggedInCurrentPassword.username,
                loggedInCurrentPassword.currentPassword);
            if (!logInInfo) { //no such username and password in the system
                logger.info('notVerified');
                status.code = 200;
                status.message = {'notVerified': 'The current password is incorrect, please try again.'};
            } else { //found the user with correct username and password
                logger.info('verified');
                status.code = 200;
                status.message = {'verified': true};
            }
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
        }
        const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
        logger.info(util.format("Response Data: %s", response));
        res.writeHead(status.code, {'Content-Type': 'application/json'});
        res.end(response);
    },

    changeCurrentPassword: async function (req, res) {
        let status = {code: 200, message: 'OK'};
        try {
            logger.info('/changeCurrentPassword');
            status = await repo.getDBConnectionStatus();
            if (status.code !== 200) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(status.message);
            }
            const loggedInNewPassword = req.body.loggedInNewPassword;
            //update in workersCollection the the password of user with a new password
            logger.info(util.format('username=%s', loggedInNewPassword.username));
            logger.info(util.format('newPassword=%s', loggedInNewPassword.newPassword));
            const cursor = await repo.updateUserPassword({'UserName': loggedInNewPassword.username},
                {'Password': loggedInNewPassword.newPassword});
            if (cursor.modifiedCount === 0) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('The Password change is failed');
            }
            status.code = 200;
            status.message = {'success': 'The Password has been changed successfully'};
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus(err);
        }
        const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
        logger.info(util.format("Response Data: %s", response));
        res.writeHead(status.code, {'Content-Type': 'application/json'});
        res.end(response);
    },

    changeTemporaryPassword: async function (req, res) {
        let status = {code: 200, message: 'OK'};
        try {
            logger.info('/changeTemporaryPassword');
            status = await repo.getDBConnectionStatus();
            if (status.code !== 200) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(status.message);
            }
            const newTempPassword = req.body.newTempPassword;
            //update in workersCollection the the password of user with a new password
            logger.info(util.format('newTempPassword=%s', newTempPassword));
            await repo.updateUserPassword({'UserName': 'Admin'}, {TempPassword: newTempPassword.TempPassword});
            status.code = 200;
            status.message = {'success': 'The temporary password has been changed successfully'};
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = utils.getErrorStatus('Error happened during the temporary password change');
        }
        const response = JSON.stringify(status.message);
        logger.info(util.format("Response Data: %s", response));
        res.writeHead(status.code, {'Content-Type': 'application/json'});
        res.end(response);
    },

    logIn: async function (req, res) {
        logger.info('logIn');
        let status = {
            code: 200,
            message: 'OK'
        };
        try {
            const user = req.body.LoginUser;
            logger.info(util.format('userName=%s', user.UserName));
            //check if the username and the password exist
            const logInInfo = await repo.getUserLogInInfo(user.UserName, user.Password);
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
    },

    /*
        get list of all statuses
    */
    getStatusOptions: async function (req, res) {

        logger.info('getStatusOptions');
        await repo.getItems(req, res, 'status', 'statusOptions');
    },

    /*
        get list of all colors for roles
    */
    getRolesColors: async function (req, res) {

        logger.info('getRolesColors');
        await repo.getItems(req, res, 'color', 'colors');
    },

    /*
        get list of all files
    */
    getFiles: async function (req, res) {
        logger.info('getFiles');
        await repo.getItems(req, res, 'file', 'files');
    },

    /*
        get list of all contacts
    */
    getContacts: async function (req, res) {
        logger.info('getContacts');
        await repo.getItems(req, res, 'customer', 'contacts');
    },

    /*
        get list of all roles with their statuses
    */
    getRoles: async function (req, res) {
        logger.info('getRoles');
        await repo.getItems(req, res, 'rolesWithStatus', 'roles');
    },

    /*
        get list of all events for specific user
    */
    getUserEvents: async function (req, res) {
        logger.info(util.format('/getUserEvents/%s', req.params.UserName));
        await repo.getItems(req, res, 'worker',
            'userEvents', {UserName: req.params.UserName}, 'Events');
    },

    getCustomerEvents: async function (req, res) {
        logger.info(util.format('/getCustomerEvents/%s/%s', req.params.UserName, req.params.eventId));
        await repo.getCustomerEvents(req, res, 'worker');
    },
    /*
        app.get('/getCustomerEvents/:UserName/:eventId', (request, response) => {
            console.log('/getCustomerEvents/' + request.params.UserName + '/' + request.params.eventId);
            workersCollection.find(
                {
                    'UserName': request.params.UserName,
                    'Events.id': request.params.eventId}).forEach(function (doc) {
                doc.Events = doc.Events.filter(function (event) {
                    if (event.id === request.params.eventId) {
                        return event;
                    }
                });
                console.dir(doc.Events);
                if (doc.Events) {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({ 'customerEvents': doc.Events}));
                } else {
                    response.end(JSON.stringify({ 'customerEvents': {}}));
                }
            });
        });
    */

    uploadFile: async function (req, res) {
        logger.info('/uploadFile');
        utils.uploadFile(req, res, repo.updateFileCollection);
    },

    sendEmail: async function (req, res) {
        logger.info('/sendEmail');
        utils.sendMail(req.body.emailData, res);
    },

    deleteContact: async function (req, res) {
        logger.info('deleteContact');
        //the contact to delete with its details
        const contactToDelete = req.body.contact;
        logger.info('contactToDelete :' + JSON.stringify(contactToDelete));
        const itemToDelete = {
            'Name': contactToDelete.Name,
            'Status': contactToDelete.Status,
            'PhoneNumber': contactToDelete.PhoneNumber,
            'eMail': contactToDelete.eMail,
            'Address': contactToDelete.Address
        };
        await repo.deleteItemAndReturnUpdatedList(req, res, itemToDelete, 'customer', {'contacts': {}}, 'contacts');
    },

    deleteFile: async function (req, res) {
        logger.info('deleteFile');
        //the contact to delete with its details
        const fileToDelete = req.body.file;
        logger.info('fileToDelete :' + JSON.stringify(fileToDelete));
        const path = config.server.data.uploadFolder + fileToDelete.FileName;
        const fileDeleted = 'The file ' + fileToDelete.FileName + ' has been deleted.';
        await repo.deleteItemAndReturnUpdatedList(req, res, fileToDelete, 'file', {fileDeleted: fileDeleted});
        fs.unlinkSync(path);
    },

    deleteUser: async function (req, res) {
        logger.info('deleteUser');
        //the contact to delete with its details
        const userToDelete = req.body.username;
        logger.info('statusToDelete :' + userToDelete);
        await repo.deleteItemAndReturnUpdatedList(req, res, {'UserName': userToDelete}, 'worker',
            {'showUsers': true, 'users': {}}, 'users');
    }
    /*
        app.post('/deleteUser', (request, response) => {
    //add new contact
            workersCollection.findOne({'UserName': userToDelete}).then(function (result) {
                if (!result) {
                    console.log('did not find user to delete ');
                } else { //check if the contact already exists
                    workersCollection.deleteOne({'UserName': result.UserName}, function (err, obj) {
                        if (err) throw err;
                        console.log('1 user deleted');
                        workersCollection.find({}).toArray((error, result) => {
                            if (error) {
                                return response.status(500).send(error);
                            }
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify({'showUsers': true, 'users': result}));
                        });
                    });

                    console.log('User name that found ' + result.UserName);
                }


            }).catch(function (err) {
                response.send({error: err});
            });
        });
        */
};
