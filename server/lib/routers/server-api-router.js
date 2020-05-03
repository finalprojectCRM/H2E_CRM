// *************** Require External Modules ****************//
const express = require('express');
const bodyParser = require('body-parser');
// *************** Require Internal Modules ****************//
const serverApiRequestHandler = require('./server-api-request-handler');
const config = require('config');
const utils = require('../utils');
//*************** Global vars ****************//
const router = new express.Router();

//*************** Internal Functions ****************//
router.use(bodyParser.text({type: '*/*', limit: '50mb'}));

//get main page and connect to mongo db
/*router.route(config.server.api.root, (request, response) => {
    utils.getFile(request, response, true, 'CRM-Client.html');
});*/
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

router.route('/getContacts')
    .get(serverApiRequestHandler.getContacts);

router.route('/getRoles')
    .get(serverApiRequestHandler.getRoles);

router.route('/getUserEvents/:UserName')
    .get(serverApiRequestHandler.getUserEvents)

router.route('*')
    .get(utils.handleInvalidRequest);


//*************** Export ****************//
module.exports = router;
