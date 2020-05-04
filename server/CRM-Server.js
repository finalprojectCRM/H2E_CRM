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
	This request is to add a new user to system
*/
app.post('/addUser', (request, response) => {
    console.log('entered addUser function');
    let user = request.body.user;
    const userEvents = [];
    //user with his details : Role , UserName ,Name ,eMail,Password
    user = {
        'Role': 'new in the system',
        'UserName': user.UserName,
        'Name': user.Name,
        'eMail': user.eMail,
        'Password': user.Password,
        'Events': userEvents
    };
    //check if this username does not exist in the system
    workersCollection.findOne({'UserName': user.UserName}).then(function (mongoUser) {
        if (!mongoUser) {
            //if this username does not exist in the system - add a new user with his details
            workersCollection.insertOne(user, function (err, res) {
                if (err) throw err;
                //return the user details with isAdmin:false
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({
                    'user': {
                        'Role': user.Role, 'UserName': user.UserName, 'Name': user.Name,
                        'eMail': user.eMail, 'Password': user.Password, isAdmin: false
                    }
                }));
            });
        } else {
            //when the username already exists with admin and his fields did not fill
            if (mongoUser.UserName === 'Admin' && mongoUser.Name === '' && mongoUser.eMail === '' && mongoUser.Password === '') {
                //update the Admin empty details with a new details
                workersCollection.update({'UserName': 'Admin'}, {
                    $set: {
                        'Role': 'Administrator', 'Name': user.Name,
                        'eMail': user.eMail, 'Password': user.Password
                    }
                }, function (err, obj) {
                    if (err) throw err;

                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({
                        'user': {
                            'Role': 'Administrator', 'UserName': user.UserName, 'Name': user.Name,
                            'eMail': user.eMail, 'Password': user.Password, isAdmin: true
                        }
                    }));
                    console.log('admin register');
                });
            } else {
                //if the username already exists and he is not the Admin
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({userExists: 'This user name already exists.'}));
            }
        }
    }).catch(function (err) {
        response.send({error: err});
    });
});


/*
	This request is to contact only if the contact does not exist
*/
app.post('/addContact', (request, response) => {
    console.log('addContact FUNCTION');
    //add new contact
    const contact = request.body.contact;
    console.log('contact: ' + contact.History);

    //check if the contact is already exist by the key - the PhoneNumber
    customersCollection.findOne({'PhoneNumber': contact.PhoneNumber}).then(function (result) {
        if (!result) {
            //if this contact does not exist in the system - add a new contact with his details
            customersCollection.insertOne(
                {
                    'Name': contact.Name,
                    'Category': contact.Category,
                    'Status': contact.Status,
                    'PhoneNumber': contact.PhoneNumber,
                    'eMail': contact.eMail,
                    'Address': contact.Address,
                    History: contact.History
                }, function (err, res) {
                    if (err) throw err;
                });
            response.end();
        } else { //check if the contact already exists
            response.writeHead(200, {'Content-Type': 'application/json'});
            //response with error massage
            response.end(JSON.stringify({'phoneExists': 'ERROR : this phone number already exists, change it or search for this user.'}));
        }
    }).catch(function (err) {
        response.send({error: err});
    });
});

/*
	This request is to get the list of users
*/
app.post('/getUsers', (request, response) => {

    console.log('entered getUsers function');
    const statusFlag = request.body.statusFlag;
    console.log('statusFlag : ' + statusFlag);

    //if request is to get the users for the delete user
    if (statusFlag === 'deleteUser') {
        console.log('entered if with : ' + statusFlag);
        //get the user list without the administrator
        workersCollection.find({UserName: {$ne: 'Admin'}}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            //response with ok, and with the users list
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'deleteUser': true, 'users': result}));
        });
    } else if (statusFlag === 'showUsers') { //if request is to get the users for show user
        //enter all members of workersCollection to array
        workersCollection.find({}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            //response with ok, and with the users list
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'showUsers': true, 'users': result}));
        });

    }


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
	update contact details only with phone number that does not exist in the system
*/

app.post('/addEvent', (request, response) => {
    console.log('/addEvent');
    const userForEvent = request.body.newEvent.user;
    console.log('user_for_task.UserName: ' + userForEvent.UserName);
    const event = request.body.newEvent.event;
    console.log('event: ' + event.id);

    workersCollection.updateOne({UserName: userForEvent.UserName}, {$addToSet: {Events: event}}, {upsert: true},
        function (err, res) {
            workersCollection.find({Events: userForEvent.Events}).toArray((error, Events) => {
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
    const userForEvent = request.body.deletevent.user;
    console.log('user_for_task.UserName: ' + userForEvent.UserName);
    const event = request.body.deletevent.event;
    console.log('event start: ' + event.start + 'end ' + event.end);
    workersCollection.updateOne(
        {UserName: userForEvent.UserName},
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
    const userForEvent = request.body.updatEvent.user;
    console.log('user_for_task.UserName: ' + userForEvent.UserName);
    const eventBeforeUpdate = request.body.updatEvent.eventBeforeUpdate;
    const eventAfterUpdate = request.body.updatEvent.eventAfterUpdate;
    // console.log('event start: '+ event.start +'end '+ event.end);
    workersCollection.updateOne(
        {
            UserName: userForEvent.UserName,
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


app.post('/updateContact', (request, response) => {
//update contact
    console.log('updateContact FUNCTION');
    const contactBeforeUpdateBody = request.body.contactBeforeUpdate;
    const contactAfterUpdateBody = request.body.updatedContact;
    const contactBeforeUpdate = {
        'Name': contactBeforeUpdateBody.Name,
        'Category': contactBeforeUpdateBody.Category,
        'Status': contactBeforeUpdateBody.Status,
        'PhoneNumber': contactBeforeUpdateBody.PhoneNumber,
        'eMail': contactBeforeUpdateBody.eMail,
        'Address': contactBeforeUpdateBody.Address
    };

    if (contactAfterUpdateBody.PhoneNumber === contactBeforeUpdateBody.PhoneNumber) {
        const contactAfterUpdate = {
            $set: {
                'Name': contactAfterUpdateBody.Name,
                'Category': contactAfterUpdateBody.Category,
                'Status': contactAfterUpdateBody.Status,
                'PhoneNumber': contactAfterUpdateBody.PhoneNumber,
                'eMail': contactAfterUpdateBody.eMail,
                'Address': contactAfterUpdateBody.Address
            }
        };
        customersCollection.updateOne(contactBeforeUpdate, contactAfterUpdate, function (err, res) {
            if (err) throw err;
            customersCollection.updateOne({PhoneNumber: contactAfterUpdateBody.PhoneNumber}, {$addToSet: {History: contactAfterUpdateBody.History}},
                function (err, res) {
                    console.log('after updateOne');
                });


            customersCollection.find({}).toArray((error, result) => {
                if (error) {
                    return response.status(500).send(error);
                }
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'contacts': result}));
            });
        });
    } else {
        customersCollection.findOne({'PhoneNumber': contactAfterUpdateBody.PhoneNumber}).then(function (result) {
            if (!result) {
                const contactAfterUpdate = {
                    $set: {
                        'Name': contactAfterUpdateBody.Name,
                        'Category': contactAfterUpdateBody.Category,
                        'Status': contactAfterUpdateBody.Status,
                        'PhoneNumber': contactAfterUpdateBody.PhoneNumber,
                        'eMail': contactAfterUpdateBody.eMail,
                        'Address': contactAfterUpdateBody.Address
                    }
                };
                customersCollection.updateOne(contactBeforeUpdate, contactAfterUpdate, function (err, res) {
                    if (err) throw err;
                    customersCollection.updateOne({PhoneNumber: contactAfterUpdateBody.PhoneNumber}, {$addToSet: {History: contactAfterUpdateBody.History}},
                        function (err, res) {
                            console.log('after updateOne');
                        });
                    customersCollection.find({}).toArray((error, result) => {
                        if (error) {
                            return response.status(500).send(error);
                        }
                        response.writeHead(200, {'Content-Type': 'application/json'});
                        response.end(JSON.stringify({'contacts': result}));
                    });

                });
            } else {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'phoneExists': 'This phone number already exists, change it or search for this user.'}));
            }

        });
    }
});

//update contact details only with phone number that does not exist in the system
app.post('/updateUser', (request, response) => {
//update contact
    console.log('update users FUNCTION');
    const userBeforeUpdateBody = request.body.userBeforeUpdate;
    const userAfterUpdateBody = request.body.updatedUser;
    const userBeforeUpdate = {
        Role: userBeforeUpdateBody.Role,
        UserName: userBeforeUpdateBody.UserName,
        Name: userBeforeUpdateBody.Name,
        eMail: userBeforeUpdateBody.eMail
    };
    const userAfterUpdate = {
        $set: {
            Role: userAfterUpdateBody.Role,
            UserName: userAfterUpdateBody.UserName,
            Name: userAfterUpdateBody.Name,
            eMail: userAfterUpdateBody.eMail
        }
    };
    workersCollection.updateOne(userBeforeUpdate, userAfterUpdate, function (err, res) {
        if (err) throw err;
        workersCollection.find({}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'showUsers': true, 'users': result}));
        });
    });
});


app.get('/deleteAllContacts', (request, response) => {

    customersCollection.remove({}, function (err, obj) {
        if (err) throw err;
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'message': 'All contacts have been deleted from the system'}));

    });

});

app.get('/deleteAllUsers', (request, response) => {

    workersCollection.remove({UserName: {$ne: 'Admin'}}, function (err, obj) {
        if (err) throw err;
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'message': 'All users have been deleted from the system'}));

    });

});


app.post('/deleteStatusFromRole', (request, response) => {
//add new contact
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
//add new contact
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
//add new contact
    console.log('entered deleteRole function');
    const roleToDelete = request.body.role;

    console.log('roleToDelete:' + roleToDelete);

    rolesWithStatusesCollection.deleteOne({Role: roleToDelete}, function (err, obj) {
        if (err) throw err;
        console.log('1 user deleted');
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

//add a new status
app.post('/addOption', (request, response) => {
//add new option
    const statusToAdd = request.body.newSatus;

    statusesCollection.updateOne(
        {'Status': statusToAdd.Status},
        {$setOnInsert: {'Status': statusToAdd.Status}},
        {upsert: true}
    );
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end();
});

app.post('/updateContactHistory', (request, response) => {
//add new option
    console.log('/updateContactHistory');

    const contactPhoneToUpdateHistory = request.body.updateHistory.contactPhoneNumber;
    const History = request.body.updateHistory.contactHistory;
    console.log('contactPhoneToUpdateHistory : '+contactPhoneToUpdateHistory);
    console.log('History : '+History);

    customersCollection.updateMany({PhoneNumber: { "$in" : contactPhoneToUpdateHistory}}, {$addToSet: {History: {$each: History}}},
        function (err, res) {
            console.log('after updateOne');
        });
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end();
});
