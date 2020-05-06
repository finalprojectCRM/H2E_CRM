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
        const {status, customers, statuses, workers, files, rolesWithStatuses, statusesWithRoles, colors} = await repo.init();
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
	This request is add a new status with an appropriate roles
*/
app.post('/addStatutsWithRoles', (request, response) => {

    const statusWithRoles = request.body.statusWithRoles;
    console.log('before updateOne');
    //add a new add a new status with an appropriate roles only if the status does not exist
    statusesWithRolesCollection.updateOne({Status: statusWithRoles.Status},
        {$setOnInsert: {Status: statusWithRoles.Status, Roles: statusWithRoles.Roles}},
        {upsert: true}, function (err, res) {
            console.log('after updateOne');
        });

    console.log('statusWithRoles.Roles: ' + statusWithRoles.Roles);

    //go through of all roles
    for (const role of statusWithRoles.Roles) {
        console.log('role: ' + role);
        //add to role a new status
        rolesWithStatusesCollection.updateOne({Role: role}, {$addToSet: {Statuses: statusWithRoles.Status}},
            function (err, res) {
                console.log('after updateOne');
            });

    }
    //add to the statuses list a new status
    statusesCollection.updateOne(
        {'Status': statusWithRoles.Status},
        {$setOnInsert: {'Status': statusWithRoles.Status}},
        {upsert: true}
    );
    //response with ok
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end();
});

/*
	This request is add a new role with an appropriate statuses
*/
app.post('/addRoleWithStatuses', (request, response) => {
    const roleWithStatuses = request.body.roleWithStatuses;
    console.log('before updateOne');
    //insert to the colors list the role color
    colorsCollection.insertOne({Color: roleWithStatuses.Color});
    //add a new add a new role with an appropriate statuses only if the role does not exist
    rolesWithStatusesCollection.updateOne({Role: roleWithStatuses.Role}, {
        $setOnInsert: {
            Role: roleWithStatuses.Role,
            Color: roleWithStatuses.Color,
            Statuses: roleWithStatuses.Statuses
        }
    },
    {upsert: true},
    function (err, res) {
        console.log('after updateOne');
    });

    //go through of all statuses
    for (const status of roleWithStatuses.Statuses) {
        console.log('status: ' + status);
        //add the to status a new role
        statusesWithRolesCollection.updateOne({Status: status}, {$addToSet: {Roles: roleWithStatuses.Role}}, {upsert: true},
            function (err, res) {
                console.log('after updateOne');
            });
    }
    //response with ok
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end();
});
/*
	This request is to update role with new statuses
*/
app.post('/updateRole', (request, response) => {
    //the role to update
    const roleToUpdate = request.body.roleToUpdate;
    //the appropriate statuses to role
    const statuses = roleToUpdate.Statuses;
    console.log('before updateOne');
    //update the role with new statuses
    rolesWithStatusesCollection.updateOne({Role: roleToUpdate.Role}, {$addToSet: {Statuses: {$each: statuses}}},
        function (err, res) {
            console.log('after updateOne');
        });
    //go through statuses
    for (const status of roleToUpdate.Statuses) {
        console.log('status: ' + status);
        console.log('type of status: ' + typeof status);
        //update the status with new role
        statusesWithRolesCollection.updateOne({Status: status}, {$addToSet: {Roles: roleToUpdate.Role}},
            function (err, res) {
                console.log('after updateOne');
            });
    }
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

app.post('/deleteStatusFromRole', (request, response) => {
//add new customer
    console.log('entered deleteStatusFromRole function');
    const statusToDelete = request.body.statusToDelete;
    console.log('statusToDelete.Role ' + statusToDelete.Role);
    console.log('statusToDelete.Status ' + statusToDelete.Status);
    const Status = statusToDelete.Status;

    rolesWithStatusesCollection.updateOne({Role: statusToDelete.Role}, {$pull: {Statuses: Status}}, function (err, obj) {
        if (err) throw err;
        console.log('1 status was deleted from role ');
        rolesWithStatusesCollection.find({}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'roles': result}));
        });
    });
});

app.post('/deleteStatusFromSystem', (request, response) => {
//add new customer
    console.log('entered deleteStatusFromSystem function');
    const statusToDelete = request.body.statusToDelete;
    let statuses, rolesStatuses, statusesRoles;

    console.log('statusToDelete:' + statusToDelete);
    statusesCollection.deleteOne({'Status': statusToDelete}, function (err, obj) {
        if (err) throw err;
        console.log('1 status deleted');
        statusesCollection.find({}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            statuses = result;
        });
        statusesWithRolesCollection.deleteOne({'Status': statusToDelete}, function (err, obj) {
            if (err) throw err;
            console.log('1 status deleted');
            statusesWithRolesCollection.find({}).toArray((error, result) => {
                if (error) {
                    return response.status(500).send(error);
                }
                statusesRoles = result;
            });
        });
        rolesWithStatusesCollection.updateMany({}, {$pull: {Statuses: {$in: [statusToDelete]}}}, function (err, obj) {
            if (err) throw err;
            console.log('1 status was deleted from role ');
            rolesWithStatusesCollection.find({}).toArray((error, rolesStatuses) => {
                if (error) {
                    return response.status(500).send(error);
                }
                //rolesStatuses = rolesStatuses;
            });
        });
    });
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({'statuses': statuses, 'roles': rolesStatuses}));

});

app.post('/deleteRole', (request, response) => {
//add new customer
    console.log('entered deleteRole function');
    const roleToDelete = request.body.role;
    console.log('roleToDelete:' + roleToDelete);
    rolesWithStatusesCollection.deleteOne({Role: roleToDelete}, function (err, obj) {
        if (err) throw err;
        console.log('1 worker deleted');
        rolesWithStatusesCollection.find({}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'roles': result}));
        });
    });
    statusesWithRolesCollection.updateMany({}, {$pull: {Roles: {$in: [roleToDelete]}}}, function (err, obj) {
        if (err) throw err;
        console.log('1 status was deleted from role ');
        statusesWithRolesCollection.find({}).toArray((error, rolesStatuses) => {
            if (error) {
                return response.status(500).send(error);
            }
            //rolesStatuses = rolesStatuses;
        });
    });
});

app.post('/updateCustomerHistory', (request, response) => {
//add new option
    console.log('/updateCustomerHistory');
    const customerPhoneToUpdateHistory = request.body.updateHistory.customerPhoneNumber;
    const History = request.body.updateHistory.customerHistory;
    console.log('customerPhoneToUpdateHistory : '+customerPhoneToUpdateHistory);
    console.log('History : '+History);
    customersCollection.updateMany({PhoneNumber: { "$in" : customerPhoneToUpdateHistory}}, {$addToSet: {History: {$each: History}}},
        function (err, res) {
            console.log('after updateOne');
        });
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end();
});

