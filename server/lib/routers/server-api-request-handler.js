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
            const adminWorker = await repo.getAdminWorker();
            if (!adminWorker) {
                await repo.addDefaultAdminWorker();
                status.code = 200;
                status.message = {'adminFirstLoad': true};
            } else if (adminWorker.WorkerName === 'Admin' && adminWorker.Name === '' && adminWorker.eMail === '' && adminWorker.Password === '') {
                //there is a worker in system and Admin exists = mongo db workersCollection is not empty
                //admin did not yet change the temp password that he got from system
                if (adminWorker.TempPassword === config.server.access.firstTempPassword) {
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
    verify a temporary password that worker received from the admin to perform the first worker registration to the system
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
            const adminWorker = await repo.getAdminWorker();
            const tempPassword = req.body.tempPassword;
            if (adminWorker.TempPassword !== tempPassword) { //not correct temp password
                logger.info('!result not a password');
                status.code = 200;
                status.message = {notVerified: 'You do not have a correct temporary password , Please get it from the administrator'};
            } else if (adminWorker.WorkerName === 'Admin' && adminWorker.Name === '' && adminWorker.eMail === '' && adminWorker.Password === '') {
                if (adminWorker.TempPassword === config.server.access.firstTempPassword) { //admin did not yet change the temp password that he got from system
                    status.code = 200;
                    status.message = {'adminChangedTempPassword': false};
                } else { //admin changed temp password that he got from system
                    status.code = 200;
                    status.message = {'adminChangedTempPassword': true};
                }
            } else {
                //the worker has a good password that changed by admin
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
            logger.info(util.format('curWorkername=%s', loggedInCurrentPassword.workername));
            logger.info(util.format('curPassword=%s', loggedInCurrentPassword.currentPassword));
            //try to find in worker collection a worker with a given workername and password
            const logInInfo = await repo.getWorkerLogInInfo(loggedInCurrentPassword.workername,
                loggedInCurrentPassword.currentPassword);
            if (!logInInfo) { //no such workername and password in the system
                logger.info('notVerified');
                status.code = 200;
                status.message = {'notVerified': 'The current password is incorrect, please try again.'};
            } else { //found the worker with correct workername and password
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
            //update in workersCollection the the password of worker with a new password
            logger.info(util.format('workername=%s', loggedInNewPassword.workername));
            logger.info(util.format('newPassword=%s', loggedInNewPassword.newPassword));
            const cursor = await repo.updateWorkerPassword({'WorkerName': loggedInNewPassword.workername},
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
            //update in workersCollection the the password of worker with a new password
            logger.info(util.format('newTempPassword=%s', newTempPassword));
            await repo.updateWorkerPassword({'WorkerName': 'Admin'}, {TempPassword: newTempPassword.TempPassword});
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
        let status = {code: 200, message: 'OK'};
        try {
            const worker = req.body.LoginWorker;
            logger.info(util.format('workerName=%s', worker.WorkerName));
            //check if the workername and the password exist
            const logInInfo = await repo.getWorkerLogInInfo(worker.WorkerName, worker.Password);
            //if no match
            if (!logInInfo) {
                logger.info('no match!');
                status.code = 200;
                status.message = {noMatch: 'The worker name or password is incorrect. Try again.'};
            } else {
                //if there is matching
                logger.info(util.format('logInInfo.Name=%s', logInInfo.Name));
                //check if the worker is admin and return a worker details with 'adminWorker':true
                if (logInInfo.WorkerName === 'Admin') {
                    status.code = 200;
                    status.message = {
                        workerLogin: {
                            'adminWorker': true,
                            'Role': logInInfo.Role,
                            'WorkerName': logInInfo.WorkerName,
                            'Name': logInInfo.Name,
                            'eMail': logInInfo.eMail,
                            'Password': logInInfo.Password,
                            'Events': logInInfo.Events
                        }
                    };
                } else { //if the worker is not admin rturn worker datails
                    status.code = 200;
                    status.message = {workerLogin: logInInfo};
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
        get list of all customers
    */
    getCustomers: async function (req, res) {
        logger.info('getCustomers');
        let condition = {};
        if (req.params.WorkerName !== 'Admin') {
            condition = {WorkerName: req.params.WorkerName};
        }
        await repo.getItems(req, res, 'customer', 'customers', condition);
    },
    /*
        get list of all roles with their statuses
    */
    getRoles: async function (req, res) {
        logger.info('getRoles');
        await repo.getItems(req, res, 'rolesWithStatus', 'roles');
    },
    /*
        get list of all roles with their statuses
    */
    getAssignedRoles: async function (req, res) {
        logger.info('getRoles');
        await repo.getAssignedRoles(req, res);
    },
    /*
        get list of all events for specific worker
    */
    getWorkerEvents: async function (req, res) {
        logger.info(util.format('/getWorkerEvents/%s', req.params.WorkerName));
        await repo.getItems(req, res, 'worker',
            'workerEvents', {WorkerName: req.params.WorkerName}, 'Events');
    },
    getCustomerEvents: async function (req, res) {
        logger.info(util.format('/getCustomerEvents/%s/%s', req.params.WorkerName, req.params.eventId));
        await repo.getCustomerEvents(req, res, 'worker');
    },
    uploadFile: async function (req, res) {
        logger.info('/uploadFile');
        utils.uploadFile(req, res, repo.updateFileCollection);
    },
    sendEmail: async function (req, res) {
        logger.info('/sendEmail');
        utils.sendMail(req.body.emailData, res);
    },
    deleteCustomer: async function (req, res) {
        logger.info('deleteCustomer');
        //the customer to delete with its details
        const customerToDelete = req.body.customer;
        logger.info('customerToDelete :' + JSON.stringify(customerToDelete));
        const itemToDelete = {
            'Name': customerToDelete.Name,
            'Status': customerToDelete.Status,
            'PhoneNumber': customerToDelete.PhoneNumber,
            'eMail': customerToDelete.eMail,
            'Address': customerToDelete.Address
        };
        await repo.deleteItemAndReturnUpdatedList(req, res, itemToDelete, 'customer', {'customers': {}}, 'customers');
    },
    deleteFile: async function (req, res) {
        logger.info('deleteFile');
        //the customer to delete with its details
        const fileToDelete = req.body.file;
        logger.info('fileToDelete :' + JSON.stringify(fileToDelete));
        const path = config.server.data.uploadFolder + fileToDelete.FileName;
        const fileDeleted = 'The file ' + fileToDelete.FileName + ' has been deleted.';
        await repo.deleteItemAndReturnUpdatedList(req, res, fileToDelete, 'file', {fileDeleted: fileDeleted});
        fs.unlinkSync(path);
    },
    deleteWorker: async function (req, res) {
        logger.info('deleteWorker');
        //the customer to delete with its details
        const workerToDelete = req.body.workername;
        logger.info('statusToDelete :' + workerToDelete);
        await repo.deleteItemAndReturnUpdatedList(req, res, {'WorkerName': workerToDelete}, 'worker',
            {'showWorkers': true, 'workers': {}}, 'workers');
    },
    getCustomer: async function (req, res) {
        logger.info('getCustomer');
        await repo.getItems(req, res, 'customer',
            'customers', {'PhoneNumber': req.params.PhoneNumber});
    },
    addCustomer: async function (req, res) {
        logger.info('addCustomer');
        const customer = req.body.customer;
        customer.WorkerName = await repo.assignWorker({Role: customer.Category.Role}, 'customer');
        await repo.insertItemByCondition(req, res, {'PhoneNumber': customer.PhoneNumber}, customer,
            {'phoneExists': 'ERROR : this phone number already exists, change it or search for this worker.'}, 'customer');
    },
    updateCustomer: async function (req, res) {
        let status = {code: 200, message: 'OK'};
        try {
            logger.info('updateCustomer');
            const customerBeforeUpdate = req.body.customerBeforeUpdate;
            const customerAfterUpdate = req.body.updatedCustomer;
            const history = customerAfterUpdate.History;
            delete customerAfterUpdate.History;
            if (customerBeforeUpdate.Category.Role !== customerAfterUpdate.Category.Role) {
                customerAfterUpdate.WorkerName = await repo.assignWorker({Role: customerAfterUpdate.Category.Role}, 'customer');
            }
            const foundItems = await repo.getAllCollectionItems('customer', {PhoneNumber: customerAfterUpdate.PhoneNumber});
            if (foundItems.length === 0 || foundItems.length === 1 && foundItems[0].PhoneNumber === customerBeforeUpdate.PhoneNumber) {
                await repo.updateItem(req, res, {PhoneNumber: customerBeforeUpdate.PhoneNumber}, {
                    $addToSet: {History: history},
                    $set: customerAfterUpdate
                }, 'customer');
                return;
            }
            status.message = {'phoneExists': 'This phone number already exists, change it or search for this worker.'};

        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = module.exports.getErrorStatus(err);
        }
        const response = status.code === 200 ? JSON.stringify(status.message) : JSON.stringify(status);
        logger.info(util.format('Response Data: %s', response));
        res.writeHead(status.code, {'Content-Type': 'application/json'});
        res.end(response);
    },
    getWorkers: async function (req, res) {
        let status = {code: 200, message: 'OK'};
        try {
            const statusFlag = req.body.statusFlag;
            logger.info(util.format('statusFlag: %s', statusFlag));
            //if request is to get the workers for the delete worker
            if (statusFlag === 'deleteWorker') {
                await repo.getItems(req, res, 'worker', 'workers', {WorkerName: {$ne: 'Admin'}}, '', {
                    'showWorkers': true,
                    'workers': {}
                });
            } else if (statusFlag === 'showWorkers') {
                await repo.getItems(req, res, 'worker', 'workers', {}, '', {'showWorkers': true, 'workers': {}});
            }
        } catch (err) {
            logger.error(util.format('happened error[%s]', err));
            status = module.exports.getErrorStatus(err);
            const response = JSON.stringify(status);
            logger.info(util.format('Response Data: %s', response));
            res.writeHead(status.code, {'Content-Type': 'application/json'});
            res.end(response);
        }
    },
    deleteAllCustomers: async function (req, res) {
        logger.info(util.format('deleteAllCustomers'));
        await repo.deleteAllItems(req, res, 'customer', {'message': 'All customers have been deleted from the system'});
    },
    deleteAllWorkers: async function (req, res) {
        logger.info(util.format('deleteAllWorkers'));
        await repo.deleteAllItems(req, res, 'worker', {'message': 'All workers have been deleted from the system'}, {WorkerName: {$ne: 'Admin'}});
    },
    addStatus: async function (req, res) {
        const statusToAdd = req.body.newSatus;
        logger.info(util.format('statusToAdd=%s', statusToAdd));
        return await repo.addOrUpdateItem(req, res, {'Status': statusToAdd.Status}, 'status', false, true, false, false);
    },
    /*
	    Add new status to the correspondent roles
    */
    addStatusWithRoles: async function (req, res) {
        const statusWithRoles = req.body.statusWithRoles;
        //add a new add a new status with an appropriate roles only if the status does not exist
        await repo.addOrUpdateItem(req, res, {Status: statusWithRoles.Status}, 'statusesWithRole',
            {Status: statusWithRoles.Status, Roles: statusWithRoles.Roles}, true, false, false, false);
        //go through of all roles
        for (const role of statusWithRoles.Roles) {
            //add to role a new status
            await repo.addOrUpdateItem(req, res, {Role: role}, 'rolesWithStatus',
                {Statuses: statusWithRoles.Status}, false, false, true, false);
        }
        await repo.addOrUpdateItem(req, res, {'Status': statusWithRoles.Status}, 'status',
            {'Status': statusWithRoles.Status}, true, true, false, false);
    },
    /*
	    Add a new role with the correspondent statuses
    */
    addRoleWithStatuses: async function (req, res) {
        const roleWithStatuses = req.body.roleWithStatuses;
        // insert the role color to the colors list
        await repo.addOrUpdateItem(req, res, {Color: roleWithStatuses.Color}, 'color',
            {Color: roleWithStatuses.Color}, true, false, false, false);
        //add a new role with the correspondent statuses only if the role does not exist
        await repo.addOrUpdateItem(req, res, {Role: roleWithStatuses.Role}, 'rolesWithStatus',
            {
                Role: roleWithStatuses.Role,
                Color: roleWithStatuses.Color,
                Statuses: roleWithStatuses.Statuses
            }, true, false, false, false);
        //go through of all statuses and add a new role
        for (const status of roleWithStatuses.Statuses) {
            await repo.addOrUpdateItem(req, res, {Status: status}, 'statusesWithRole',
                {Roles: roleWithStatuses.Role}, false, true, true, false);
        }
    },
    /*
	    Update a role with new statuses
    */
    updateRole: async function (req, res) {
        //the role to update
        const roleToUpdate = req.body.roleToUpdate;
        //the role's statuses
        const statuses = roleToUpdate.Statuses;
        //go through statuses
        for (const status of roleToUpdate.Statuses) {
            console.log('status: ' + status);
            console.log('type of status: ' + typeof status);
            //update the status with new role
            await repo.addOrUpdateItem(req, res, {Status: status}, 'statusesWithRole',
                {Roles: roleToUpdate.Role}, false, false, true, false);
        }
        //update the role with new statuses
        await repo.addOrUpdateItem(req, res, {Role: roleToUpdate.Role}, 'rolesWithStatus',
            {Statuses: {$each: statuses}}, false, true, true, false);
    },

    updateCustomerHistory: async function (req, res) {
        const customerPhoneToUpdateHistory = req.body.updateHistory.customerPhoneNumber;
        const customerHistory = req.body.updateHistory.customerHistory;
        logger.info(util.format('customerPhoneToUpdateHistory: %s', customerPhoneToUpdateHistory));
        logger.info(util.format('customerHistory: %s', customerHistory));
        await repo.addOrUpdateItem(req, res, {PhoneNumber: { $in : customerPhoneToUpdateHistory} },
            'customer', {History: {$each: customerHistory}}, false, true, true, true);
    }
};
