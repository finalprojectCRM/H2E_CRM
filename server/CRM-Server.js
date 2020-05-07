/*jshint unused:false*/
/* eslint-disable no-unused-vars */

const fs = require('fs');
const util = require('util');
const Express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('config');
const utils = require('./lib/utils');
const logging = require('./lib/utils/logging');
const logger = logging.mainLogger;
const serverApiRouter = require('./lib/routers/server-api-router');
const repo = require('./lib/repository');
const multer = require('multer');

let customersCollection, statusesCollection, workersCollection, filesCollection,
    rolesWithStatusesCollection, statusesWithRolesCollection, colorsCollection;

const app = new Express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(helmet());
app.use(config.server.api.root, serverApiRouter);

//start server
app.listen(config.server.access.port, () => {
    logger.info(util.format('%s server is listening on port %s', config.server.name, config.server.access.port));
    (async function() {
        const {status, customers, statuses, workers, files, rolesWithStatuses,
            statusesWithRoles, colors} = await repo.init();
        if (status.code !== 200){
            logger.error(utils.getErrorStatus(util.format(config.server.errors.DB.ERROR_DB_CONNECTION_FAILED, config.storage, status.message)));
        }
        customersCollection = customers;
        statusesCollection = statuses;
        workersCollection = workers;
        filesCollection = files;
        rolesWithStatusesCollection = rolesWithStatuses;
        statusesWithRolesCollection = statusesWithRoles;
        colorsCollection = colors;
    })();
});

app.post('/updateEvent', (request, response) => {
    console.log('/updateEvent');
    const workerForEvent = request.body.updatEvent.worker;
    console.log('worker_for_task.WorkerName: ' + workerForEvent.WorkerName);
    const eventBeforeUpdate = request.body.updatEvent.eventBeforeUpdate;
    const eventAfterUpdate = request.body.updatEvent.eventAfterUpdate;
    // console.log('event start: '+ event.start +'end '+ event.end);
    workersCollection.updateOne(
        {
            WorkerName: workerForEvent.WorkerName,
            Events: eventBeforeUpdate
        },
        {
            $set: {
                'Events.$.title': eventAfterUpdate.title,
                'Events.$.start': eventAfterUpdate.start,
                'Events.$.end': eventAfterUpdate.end,
                'Events.$.color': eventAfterUpdate.color,
                'Events.$.id': eventAfterUpdate.id,
                'Events.$.editable': eventAfterUpdate.editable,
                'Events.$.allDay': eventAfterUpdate.allDay
            }
        }, function (err, document) {
            if (err) {
                console.log(err);
                response.writeHead(500, {'Content-Type': 'application/json'});
            } else {
                console.log('after update');
                response.writeHead(200, {'Content-Type': 'application/json'});

            }
            response.end();
        });
});

