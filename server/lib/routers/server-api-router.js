const express = require('express');
const bodyParser = require('body-parser');
const serverApiRequestHandler = require('./server-api-request-handler');
const config = require('config');
const utils = require('../utils');
const router = new express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
//router.use(bodyParser.text({type: '*/*', limit: '50mb'}));


//get main page
router.route(config.server.api.root)
    .get(serverApiRequestHandler.getClientFile);

//get bootstrap
router.route('/common/bootstrap.min.css')
    .get(serverApiRequestHandler.getClientFile);

//get angular js
router.route('/bower_components/angular/angular.min.js')
    .get(serverApiRequestHandler.getClientFile);

router.route('/bower_components/angular/angular.js')
    .get(serverApiRequestHandler.getClientFile);

router.route('/bower_components/jquery/dist/jquery.min.js')
    .get(serverApiRequestHandler.getClientFile);

//get angular.min.js.map
router.route('/bower_components/angular/angular.min.js.map')
    .get(serverApiRequestHandler.getClientFile);

//get select.js
router.route('/common/select.js')
    .get(serverApiRequestHandler.getClientFile);

//get select.css
router.route('/common/select.css')
    .get(serverApiRequestHandler.getClientFile);

//get fullcalendar.css component
router.route('/bower_components/fullcalendar/dist/fullcalendar.css')
    .get(serverApiRequestHandler.getClientFile);

router.route('/bower_components/fullcalendar/dist/fullcalendar.min.js')
    .get(serverApiRequestHandler.getClientFile);

router.route('/bower_components/fullcalendar/dist/gcal.js')
    .get(serverApiRequestHandler.getClientFile);

//get calendar.js
router.route('/bower_components/angular-ui-calendar/src/calendar.js')
    .get(serverApiRequestHandler.getClientFile);

//get datetimepicker.css
router.route('/calendar/datetimepicker.css')
    .get(serverApiRequestHandler.getClientFile);

//get datetimepicker.js
router.route('/calendar/datetimepicker.js')
    .get(serverApiRequestHandler.getClientFile);

//get moment.min.js
router.route('/bower_components/moment/min/moment.min.js')
    .get(serverApiRequestHandler.getClientFile);

router.route('/ng-file-upload/dist/ng-file-upload.min.js')
    .get(serverApiRequestHandler.getClientFile);

router.route('/ng-file-upload/dist/ng-file-upload-shim.min.js')
    .get(serverApiRequestHandler.getClientFile);

//get CRM-Client.js
router.route('/CRM-Client.js')
    .get(serverApiRequestHandler.getClientFile);

//get CSS of the system page
router.route('/CRM-Client.css')
    .get(serverApiRequestHandler.getClientFile);

/* a request that initialize the system when it's empty*/
router.route('/firstSystemLoad')
    .get(serverApiRequestHandler.getFirstSystemLoadStatus);

router.route('/login')
    .post(serverApiRequestHandler.logIn);

router.route('/getStatusOptions')
    .get(serverApiRequestHandler.getStatusOptions);

router.route('/getRolesColors')
    .get(serverApiRequestHandler.getRolesColors);

router.route('/getFiles')
    .get(serverApiRequestHandler.getFiles);

router.route('/getCustomers/:WorkerName')
    .get(serverApiRequestHandler.getCustomers);

router.route('/getRoles')
    .get(serverApiRequestHandler.getRoles);

router.route('/getAssignedRoles')
    .get(serverApiRequestHandler.getAssignedRoles);

router.route('/getWorkerEvents/:WorkerName')
    .get(serverApiRequestHandler.getWorkerEvents);

router.route('/getCustomerEvents/:WorkerName/:eventId')
    .get(serverApiRequestHandler.getCustomerEvents);

router.route('/deleteAllCustomers')
    .get(serverApiRequestHandler.deleteAllCustomers);

router.route('/deleteAllWorkers')
    .get(serverApiRequestHandler.deleteAllWorkers);

router.route('/getCustomer/:PhoneNumber')
    .get(serverApiRequestHandler.getCustomer);

router.route('/uploadFile')
    .post(serverApiRequestHandler.uploadFile);

router.route('/sendEmail')
    .post(serverApiRequestHandler.sendEmail);

router.route('/verifyTemporaryPassword')
    .post(serverApiRequestHandler.verifyTemporaryPassword);

router.route('/changeTemporaryPassword')
    .post(serverApiRequestHandler.changeTemporaryPassword);

router.route('/verifyCurrentPassword')
    .post(serverApiRequestHandler.verifyCurrentPassword);

router.route('/changeCurrentPassword')
    .post(serverApiRequestHandler.changeCurrentPassword);

router.route('/deleteCustomer')
    .post(serverApiRequestHandler.deleteCustomer);

router.route('/deleteFile')
    .post(serverApiRequestHandler.deleteFile);

router.route('/deleteWorker')
    .post(serverApiRequestHandler.deleteWorker);

router.route('/addCustomer')
    .post(serverApiRequestHandler.addCustomer);

router.route('/updateCustomer')
    .post(serverApiRequestHandler.updateCustomer);

router.route('/getWorkers')
    .post(serverApiRequestHandler.getWorkers);

router.route('/getWorkers')
    .post(serverApiRequestHandler.getWorkers);

router.route('/addStatus')
    .post(serverApiRequestHandler.addStatus);

router.route('/addStatusWithRoles')
    .post(serverApiRequestHandler.addStatusWithRoles);

router.route('/addRoleWithStatuses')
    .post(serverApiRequestHandler.addRoleWithStatuses);

router.route('/updateRole')
    .post(serverApiRequestHandler.updateRole);

router.route('/updateCustomerHistory')
    .post(serverApiRequestHandler.updateCustomerHistory);

router.route('/deleteStatusFromRole')
    .post(serverApiRequestHandler.deleteStatusFromRole);

router.route('/deleteStatusFromSystem')
    .post(serverApiRequestHandler.deleteStatusFromSystem);

router.route('/deleteRole')
    .post(serverApiRequestHandler.deleteRole);

router.route('*')
    .get(utils.handleInvalidRequest);

//*************** Export ****************//
module.exports = router;
