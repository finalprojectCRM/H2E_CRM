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

/*
	This request is to add a new worker to system
*/
app.post('/addWorker', (request, response) => {
    console.log('entered addWorker function');
    let worker = request.body.worker;
    const workerEvents = [];
    //worker with his details : Role , WorkerName ,Name ,eMail,Password
    worker = {
        'Role': 'new in the system',
        'WorkerName': worker.WorkerName,
        'Name': worker.Name,
        'eMail': worker.eMail,
        'Password': worker.Password,
        'Events': workerEvents
    };
    //check if this workername does not exist in the system
    workersCollection.findOne({'WorkerName': worker.WorkerName}).then(function (mongoWorker) {
        if (!mongoWorker) {
            //if this workername does not exist in the system - add a new worker with his details
            workersCollection.insertOne(worker, function (err, res) {
                if (err) throw err;
                //return the worker details with isAdmin:false
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({
                    'worker': {
                        'Role': worker.Role, 'WorkerName': worker.WorkerName, 'Name': worker.Name,
                        'eMail': worker.eMail, 'Password': worker.Password, isAdmin: false
                    }
                }));
            });
        } else {
            //when the workername already exists with admin and his fields did not fill
            if (mongoWorker.WorkerName === 'Admin' && mongoWorker.Name === '' && mongoWorker.eMail === '' && mongoWorker.Password === '') {
                //update the Admin empty details with a new details
                workersCollection.update({'WorkerName': 'Admin'}, {
                    $set: {
                        'Role': 'Administrator', 'Name': worker.Name,
                        'eMail': worker.eMail, 'Password': worker.Password
                    }
                }, function (err, obj) {
                    if (err) throw err;

                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({
                        'worker': {
                            'Role': 'Administrator', 'WorkerName': worker.WorkerName, 'Name': worker.Name,
                            'eMail': worker.eMail, 'Password': worker.Password, isAdmin: true
                        }
                    }));
                    console.log('admin register');
                });
            } else {
                //if the workername already exists and he is not the Admin
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({workerExists: 'This worker name already exists.'}));
            }
        }
    }).catch(function (err) {
        response.send({error: err});
    });
});

/*
	update customer details only with phone number that does not exist in the system
*/
app.post('/addEvent', (request, response) => {
    console.log('/addEvent');
    const workerForEvent = request.body.newEvent.worker;
    console.log('worker_for_task.WorkerName: ' + workerForEvent.WorkerName);
    const event = request.body.newEvent.event;
    console.log('event: ' + event.id);

    workersCollection.updateOne({WorkerName: workerForEvent.WorkerName}, {$addToSet: {Events: event}}, {upsert: true},
        function (err, res) {
            workersCollection.find({Events: workerForEvent.Events}).toArray((error, Events) => {
                if (error) {
                    return response.status(500).send(error);
                }
                console.log(Events);
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'Events': Events}));
            });

        });
});

app.post('/deleteEvent', (request, response) => {
    console.log('/deleteEvent');
    const workerForEvent = request.body.deletevent.worker;
    console.log('worker_for_task.WorkerName: ' + workerForEvent.WorkerName);
    const event = request.body.deletevent.event;
    console.log('event start: ' + event.start + 'end ' + event.end);
    workersCollection.updateOne(
        {WorkerName: workerForEvent.WorkerName},
        {
            $pull: {
                Events: {
                    title: event.title,
                    start: event.start,
                    end: event.end,
                    color: event.color
                }
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

//update customer details only with phone number that does not exist in the system
app.post('/updateWorker', (request, response) => {
//update customer
    console.log('update workers FUNCTION');
    const workerBeforeUpdateBody = request.body.workerBeforeUpdate;
    const workerAfterUpdateBody = request.body.updatedWorker;
    const workerBeforeUpdate = {
        Role: workerBeforeUpdateBody.Role,
        WorkerName: workerBeforeUpdateBody.WorkerName,
        Name: workerBeforeUpdateBody.Name,
        eMail: workerBeforeUpdateBody.eMail
    };
    const workerAfterUpdate = {
        $set: {
            Role: workerAfterUpdateBody.Role,
            WorkerName: workerAfterUpdateBody.WorkerName,
            Name: workerAfterUpdateBody.Name,
            eMail: workerAfterUpdateBody.eMail
        }
    };
    workersCollection.updateOne(workerBeforeUpdate, workerAfterUpdate, function (err, res) {
        if (err) throw err;
        workersCollection.find({}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'showWorkers': true, 'workers': result}));
        });
    });
});

