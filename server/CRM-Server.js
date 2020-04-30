/*jshint unused:false*/
/* eslint-disable no-unused-vars */

//the libraries that not existing fundamentally in node js
const fs = require('fs');
const nodeMailer = require('nodemailer');
const Express = require('express');
const BodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ReadPreference = require('mongodb').ReadPreference;
const config = require('./config/default.json');
const multer = require('multer');
const morgan = require('morgan');
const helmet = require('helmet');


//the name of app
const APP_NAME = require('os').hostname();
//the port that the app running on it
const APP_PORT = 3000;

//the database and the collections in mongodb
let database, customersCollection, statusesCollection, workersCollection, filesCollection,
    rolesWithStatusesCollection, statusesWithRolesCollection, colorsCollection;
const app = new Express();
//The temp password that the administrator get with the system
const firstTempPassword = '12345678';
//the email of the system
const SERVER_EMAIL = 'h2e.crm@gmail.com';

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(helmet());

//create an approach to send emails from the system by using node mailer library
const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: SERVER_EMAIL,
        pass: 'H2E_CRM!@'
    }
});

//get to mongo db Permissions
function getMongoConnectionString() {
    let connectionString = '';
    const mongoConfig = config.mongo;
    const authType = mongoConfig.authType;

    const dbUserName = process.env.SECRET_USERNAME;
    const dbUserPassword = process.env.SECRET_PASSWORD;
    if (authType === 'none') {
        if (mongoConfig.uriPrefix) {
            connectionString = mongoConfig.uriPrefix + '://';
        }
        connectionString += mongoConfig.clusterUrl + ':' +
            mongoConfig.mongodbPort + '/' +
            mongoConfig.mongodbName + '?';

        const replicaSet = mongoConfig.replicaSet;
        if (replicaSet) {
            connectionString += 'replicaSet=' + replicaSet;
        }
    } else if (authType === 'SHA-1') {
        connectionString = mongoConfig.uriPrefix + '://' + dbUserName + ':' + dbUserPassword + '@' +
            mongoConfig.clusterUrl;
    }
    return connectionString;
}

//listen to server
app.listen(APP_PORT, () => {
    console.log('server ' + APP_NAME + ' is listening on port ' + APP_PORT);
});

/*
 This function is to check if the collections : statuses , roles and files are empty
*/
function checkExistingStatusesAndRolesAndFiles() {
    console.log('checkExistingStatusesAndRoles FUNCTION');

    //count the documents in statuses collection
    statusesCollection.countDocuments(function (err, count) {
        console.log('there are statuses');
        //if the collection does not have documents
        if (!err && count === 0) {
            console.log('no statuses');

            //insert the statuses : '-- Choose status for role --','בעיה טכנית'
            //statusesCollection.insertOne({'Status':'-- Choose status for role --'});
            statusesCollection.insertOne({'Status': 'בעיה טכנית'});
        }
    });

    //count the documents in rolesWithStatusesCollection
    rolesWithStatusesCollection.countDocuments(function (err, count) {
        if (!err && count === 0) {
            console.log('no roles');
            //insert the role : '-- Choose category for role --'
            rolesWithStatusesCollection.insertOne({Role: 'new in the system'});
            //insert the roles: 'תמיכה טכנית' with statuses: : '-- Choose status for role --','בעיה טכנית'  and color:#66ffff'
            rolesWithStatusesCollection.insertOne({
                Role: 'תמיכה טכנית',
                Color: '#66ffff',
                Statuses: ['בעיה טכנית']
            });
            //insert the color:#66ffff' to colorsCollection
            colorsCollection.insertOne({Color: '#66ffff'});

        }
    });
    //count the documents in statusesWithRolesCollection
    statusesWithRolesCollection.countDocuments(function (err, count) {
        if (!err && count === 0) {
            console.log('no statuses');
            //insert the statuses : '-- Choose status for role --','בעיה טכנית'
            //statusesWithRolesCollection.insertOne({Status:'-- Choose status for role --'});
            statusesWithRolesCollection.insertOne({Status: 'בעיה טכנית', Roles: ['תמיכה טכנית']});
        }
    });
}

//get main page and connect to mongo db
app.get('/', (request, response) => {
    console.log('--Rendering html page--');

    const mongoConfig = config.mongo;
    const dbName = mongoConfig.mongodbName;
    const connString = getMongoConnectionString();
    console.log('db uri: ' + connString);
    MongoClient.connect(connString,
        {
            useNewUrlParser: true,
            readPreference: ReadPreference.NEAREST,
            autoReconnect: true,
            reconnectTries: Number.MAX_SAFE_INTEGER,
            poolSize: 16,
            connectWithNoPrimary: true,
            useUnifiedTopology: true,
            appname: APP_NAME
        }, (error, client) => {
            if (error) {
                console.log('ERROR TO CONNECT TO MONGODB');
            }

            /*create all collections in mongo db*/
            database = client.db(dbName);
            customersCollection = database.collection('customers');
            statusesCollection = database.collection('statuses');
            workersCollection = database.collection('workers');
            filesCollection = database.collection('files');
            rolesWithStatusesCollection = database.collection('roles with statuses');
            statusesWithRolesCollection = database.collection('statuses with roles');
            colorsCollection = database.collection('colors');

            console.log('Connected to `' + dbName + '`!');
            //only after a good connection to mongo db we can read the main page and send it to client
            fs.readFile('../client/CRM-Client.html', function (error, data) {
                if (error) {
                    console.log('error has happened in client/CRM-Client.html', error);
                }
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(data);

            });
        });

});
//get bootstrap
app.get('/common/bootstrap.min.css', (request, response) => {
    console.log('--Rendering bootstrap-css file--');
    fs.readFile('../client/angular_modules/common/bootstrap.min.css', function (error, data) {
        if (error) {
            console.log('error has happened in bootstrap.min.css', error);
        }
        response.writeHead(200, {'Content-Type': 'text/css'});
        response.end(data);
    });
});
//get angular js
app.get('/bower_components/angular/angular.min.js', (request, response) => {//bring the angular file
    console.log('--Rendering ../client/angular_modules/bower_components/angular/angular.min.js file--');
    fs.readFile('../client/angular_modules/bower_components/angular/angular.min.js', function (error, data) {
        if (error) {
            console.log('error has happened in angular.min.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});
//get angular.min.js.map
app.get('/bower_components/angular/angular.min.js.map', (request, response) => {//bring the angular file
    console.log('--Rendering ../client/angular_modules/bower_components/angular/angular.min.js.map file --');
    fs.readFile('../client/angular_modules/bower_components/angular/angular.min.js.map', function (error, data) {
        if (error) {
            console.log('error has happened in angular.min.js.map', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});

app.get('/ng-file-upload.min.js', (request, response) => {//bring the angular file
    console.log('--Rendering /ng-file-upload.min.js file--');
    fs.readFile('../client/angular_modules/ng-file-upload/dist/ng-file-upload.min.js', function (error, data) {
        if (error) {
            console.log('error has happened in ng-file-upload.min.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});

app.get('/ng-file-upload-shim.min.js', (request, response) => {//bring the angular file
    console.log('--Rendering../client/angular_modules/ng-file-upload/dist/ng-file-upload-shim.min.js file--');
    fs.readFile('../client/angular_modules/ng-file-upload/dist/ng-file-upload-shim.min.js', function (error, data) {
        if (error) {
            console.log('error has happened in ng-file-upload-shim.min.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});

//get select.js
app.get('/common/select.js', (request, response) => {
    console.log('--Rendering select.js file--');
    fs.readFile('../client/angular_modules/common/select.js', function (error, data) {
        if (error) {
            console.log('error has happened in select.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});
//get select.css
app.get('/common/select.css', (request, response) => {
    console.log('--Rendering select.css file--');
    fs.readFile('../client/angular_modules/common/select.css', function (error, data) {
        if (error) {
            console.log('error has happened in select.css', error);
        }
        response.writeHead(200, {'Content-Type': 'text/css'});
        response.end(data);
    });
});
//get angular


//get CSS of the system page
app.get('/CRM-Client.css', (request, response) => { //bring the client/CRM-Client.css file
    console.log('--Rendering client/CRM-Client.css file--');
    fs.readFile('../client/CRM-Client.css', function (error, data) {
        if (error) {
            console.log('error has happened in../client/CRM-Client.css', error);
        }
        response.writeHead(200, {'Content-Type': 'text/css'});
        response.end(data);
    });
});


//get fullcalendar.css component
app.get('/bower_components/fullcalendar/dist/fullcalendar.css', (request, response) => {
    console.log('--Rendering fullcalendar.css file--');
    fs.readFile('../client/angular_modules/bower_components/fullcalendar/dist/fullcalendar.css', function (error, data) {
        if (error) {
            console.log('error has happened in fullcalendar.css', error);
        }
        response.writeHead(200, {'Content-Type': 'text/css'});
        response.end(data);
    });
});
//get datetimepicker.css componnent
app.get('/calendar/datetimepicker.css', (request, response) => {
    console.log('--Rendering datetimepicker.css file--');
    fs.readFile('../client/angular_modules/calendar/datetimepicker.css', function (error, data) {
        if (error) {
            console.log('error has happened in /datetimepicker.css', error);
        }
        response.writeHead(200, {'Content-Type': 'text/css'});
        response.end(data);
    });
});

//get moment.min.js componnent
app.get('/bower_components/moment/min/moment.min.js', (request, response) => {
    console.log('--Rendering moment.min.js file--');
    fs.readFile('../client/angular_modules/bower_components/moment/min/moment.min.js', function (error, data) {
        if (error) {
            console.log('error has happened in /moment.min.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});
//get calendar.js componnent
app.get('/bower_components/angular-ui-calendar/src/calendar.js', (request, response) => {
    console.log('--Rendering ui-calendar.js file--');
    fs.readFile('../client/angular_modules/bower_components/angular-ui-calendar/src/calendar.js', function (error, data) {
        if (error) {
            console.log('error has happened in /ui-calendar.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});
//get datetimepicker.js componnent
app.get('/calendar/datetimepicker.js', (request, response) => {
    console.log('--Rendering datetimepicker.js file--');
    fs.readFile('../client/angular_modules/calendar/datetimepicker.js', function (error, data) {
        if (error) {
            console.log('error has happened in /datetimepicker.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});
app.get('/bower_components/fullcalendar/dist/fullcalendar.min.js', (request, response) => {
    console.log('--Rendering fullcalendar.min.js file--');
    fs.readFile('../client/angular_modules/bower_components/fullcalendar/dist/fullcalendar.min.js', function (error, data) {
        if (error) {
            console.log('error has happened in fullcalendar.min.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});
app.get('/bower_components/fullcalendar/dist/gcal.js', (request, response) => {
    console.log('--Rendering gcal.js file--');
    fs.readFile('../client/angular_modules/bower_components/fullcalendar/dist/gcal.js', function (error, data) {
        if (error) {
            console.log('error has happened in gcal.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});

app.get('/bower_components/jquery/dist/jquery.min.js', (request, response) => {
    console.log('--Rendering jquery.min.js file--');
    fs.readFile('../client/angular_modules/bower_components/jquery/dist/jquery.min.js', function (error, data) {
        if (error) {
            console.log('error has happened in jquery.min.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});

//get client/CRM-Client.js
app.get('/CRM-Client.js', (request, response) => {
    console.log('--Rendering client/CRM-Client.js file--');
    fs.readFile('../client/CRM-Client.js', function (error, data) {
        if (error) {
            console.log('error has happened in../client/CRM-Client.js', error);
        }
        response.writeHead(200, {'Content-Type': 'text/javascript'});
        response.end(data);
    });
});

/* a request that initialize the system when it empty*/

app.get('/firstSystemLoad', (request, response) => {
    console.log('entered firstSystemLoad function');
    //check if data exists in statuses & roles & files collection
    checkExistingStatusesAndRolesAndFiles();
    workersCollection.findOne({'UserName': 'Admin'}).then(function (mongoUser) {
        //Admin not yet in system = mongo db workersCollection is empty
        if (!mongoUser) {
            //insert to users collection the first user - Admin
            workersCollection.insertOne(
                {
                    'UserName': 'Admin', 'Role': 'Administrator', 'Name': '',
                    'eMail': '', 'Password': '', 'TempPassword': firstTempPassword
                }, function (err, res) {
                    if (err) throw err;
                });
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'adminFirstLoad': true}));//Admin has been loaded first time to mongodb
        } else//there is a user in system and Admin exists = mongo db workersCollection is not empty
        if (mongoUser.UserName === 'Admin' && mongoUser.Name === '' && mongoUser.eMail === '' && mongoUser.Password === '') {
            //admin did not yet change the temp password that he got from system
            if (mongoUser.TempPassword === firstTempPassword) {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'adminChangedTempPassword': false}));

            } else { //admin changed temp password that he got from system
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'adminChangedTempPassword': true}));//go to registration page with admin
            }

        } else { //Admin has filled in all his details
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'admin_exists_with_details': true}));
        }

    }).catch(function (err) {
        response.send({error: err});
    });

});

/*
	this request verify if user that try to register to the system has a password that exists only in administrator hands
*/

app.post('/verifyTemporaryPassword', (request, response) => {

    console.log('entered verifyTemporaryPassword function');
    const tempPassword = request.body.tempPassword;
    workersCollection.findOne({'UserName': 'Admin'}).then(function (mongoUser) {

        if (mongoUser.TempPassword !== tempPassword) { //not correct temp password
            console.log('!result not a password');
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({notVerified: 'You do not have a correct temporary password , Please get it from the administrator'}));
        } else if (mongoUser.UserName === 'Admin' && mongoUser.Name === '' && mongoUser.eMail === '' && mongoUser.Password === '') {
            if (mongoUser.TempPassword === firstTempPassword) { //admin did not yet change the temp password that he got from system
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'adminChangedTempPassword': false}));
            } else { //admin changed temp password that he got from system
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'adminChangedTempPassword': true}));//go to registration page with admin
            }
        } else {
            //the user has a good password that changed by admin
            console.log('good password');
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({verified: true}));
        }

    }).catch(function (err) {
        response.send({error: err});
    });
});

/*
	This request is to change the temporary password that the admin handle
*/

app.post('/changeTemporaryPassword', (request, response) => {

    console.log('entered changeTemporaryPassword function');

    const newTempPassword = request.body.newTempPassword;
    console.log('NewTempPassword: ' + newTempPassword);
    //update in workersCollection the filed TempPassword that exists in admin with a new password
    workersCollection.update({'UserName': 'Admin'}, {$set: {TempPassword: newTempPassword.TempPassword}}, function (err, obj) {
        if (err) throw err;
        console.log('succeeded changing temp password');

    });
    //response with ok
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({'success': 'The temp password has been changed successfully'}));

});

/*
  	This request is to verify the match between the current password of user to the given password
*/
app.post('/verificationCurrentPassword', (request, response) => {

    console.log('entered verificationCurrentPassword function');

    const loggedInCurrentPassword = request.body.loggedInCurrentPassword;
    //try to find in user collection a user with a given username and password
    workersCollection.findOne({
        'UserName': loggedInCurrentPassword.username,
        'Password': loggedInCurrentPassword.currentPassword
    }).then(function (mongoUser) {

        if (mongoUser == null) { //no such username with this current password
            console.log('entered if ');
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'notVerified': 'The current password is incorrect, please try again.'}));
        } else { //found the user that the username and the current password match
            console.log('entered else');
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'verified': true}));
        }
    });


});

/*
	This request is to change the current password that of user
*/

app.post('/changeCurrentPassword', (request, response) => {

    console.log('entered changeCurrentPassword function');

    const loggedInNewPassword = request.body.loggedInNewPassword;

    //update in workersCollection the the password of user with a new password
    workersCollection.update({'UserName': loggedInNewPassword.username},
        {$set: {'Password': loggedInNewPassword.newPassword}}, function (err, obj) {
            if (err) throw err;
            //return ok
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'success': 'The Password has been changed successfully'}));


        });
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
	This request is to login to the system
*/
app.post('/login', (request, response) => {

    console.log('entered login function');
    const user = request.body.LoginUser;
    console.log(user.UserName);
    //check if the username and the password exist
    workersCollection.findOne({'UserName': user.UserName, 'Password': user.Password}).then(function (result) {
        //if no match
        if (!result) {
            console.log('no match!');
            response.writeHead(200, {'Content-Type': 'application/json'});
            //post a response with The user name or password is incorrect. Try again.
            response.end(JSON.stringify({noMatch: 'The user name or password is incorrect. Try again.'}));
        } else {
            //if there is matching
            console.log(result.Name);
            response.writeHead(200, {'Content-Type': 'application/json'});
            //check if the user is admin and return a user details with 'adminUser':true
            if (result.UserName === 'Admin') {
                response.end(JSON.stringify({
                    userLogin: {
                        'adminUser': true, 'Role': result.Role, 'UserName': result.UserName, 'Name': result.Name,
                        'eMail': result.eMail, 'Password': result.Password, 'Events': result.Events
                    }
                }));
            } else { //if the user is not admin rturn user datails
                response.end(JSON.stringify({userLogin: result}));
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
	This request is to get the list of contacts
*/
app.get('/getContacts', (request, response) => {

    console.log('entered getContacts function');
    //enter all members of customersCollection to array
    customersCollection.find({}).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        //response with ok, and with the contacts list
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'contacts': result}));
    });

});

/*
	This request is to get the list of files
*/
app.get('/getFiles', (request, response) => {

    console.log('entered getFiles function');
    //enter all members of customersCollection to array
    filesCollection.find({}).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        //response with ok, and with the contacts list

        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'files': result}));
    });

});

app.get('/getUserEvents/:UserName', (request, response) => {
    console.log('/getUserEvents/' + request.params.UserName);
    //enter all members of customersCollection to array
    workersCollection.find({UserName: request.params.UserName}).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        //response with ok, and with the users list
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'userEvents': result[0].Events}));
    });
});

app.get('/getCustomerEvents/:UserName/:eventId', (request, response) => {
    console.log('/getUserEvents/' + request.params.UserName + '/' + request.params.eventId);
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
	This request is to delete contact
*/
app.post('/deleteContact', (request, response) => {
    console.log('entered deleteContact function');
    //the contact to delete with his details
    const contactToDelete = request.body.contact;
    console.log('contactToDelete :' + contactToDelete);
    //delete the contact from contacts collection by his all details
    customersCollection.deleteOne({
        'Name': contactToDelete.Name,
        'Status': contactToDelete.Status,
        'PhoneNumber': contactToDelete.PhoneNumber,
        'eMail': contactToDelete.eMail,
        'Address': contactToDelete.Address
    }, function (err, obj) {
        if (err) throw err;
        console.log('1 document deleted');

    });
    response.writeHead(200, {'Content-Type': 'application/json'});
    //response with ok
    response.end();
});

/*
	This request is to delete file
*/
app.post('/deleteFile', (request, response) => {
    console.log('entered deleteContact function');
    const fileToDelete = request.body.file;
    const path = './uploads/' + fileToDelete.FileName;
    try {
        fs.unlinkSync(path);
        filesCollection.deleteOne({'FileName': fileToDelete.FileName}, function (err, obj) {
            if (err) throw err;
            console.log('1 document deleted');
            if (obj) {
                const fileDeleted = 'The file ' + fileToDelete.FileName + ' has been deleted.';
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({fileDeleted: fileDeleted}));
            }


        });
        //file removed
    } catch (err) {
        console.error(err);
    }


});

/*
	This request is to get the statuses list
*/
app.get('/getStatusOptions', (request, response) => {
    console.log('entered getStatusOptions function');
    //enter all members of statusesCollection to array
    statusesCollection.find({}).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        //response with ok, and with the statuses list
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'statusOptions': result}));
    });
});

/*
	This request is to get the roles (every role with his statuses) list
*/
app.get('/getRoles', (request, response) => {
    //enter all members of rolesWithStatusesCollection to array
    rolesWithStatusesCollection.find({}).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        //response with ok, and with the roles list
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'roles': result}));
    });

});

/*
	This request is to get the colors of roles list
*/
app.get('/getRolesColors', (request, response) => {
    //enter all members of colorsCollection to array
    colorsCollection.find({}).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        //response with ok, and with the colors list
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'colors': result}));
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

    /*{
    $addToSet: {
        Events: [{
            title: eventAfterUpdate.title,
            start: eventAfterUpdate.start,
            end: eventAfterUpdate.end,
            color: eventAfterUpdate.color,
            id: eventAfterUpdate.id,
            editable: eventAfterUpdate.editable,
            allDay: eventAfterUpdate.allDay
        }]
    }
}*/
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
});//update contact details only with phone number that does not exist in the system
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

app.post('/deleteUser', (request, response) => {
//add new contact
    console.log('entered deleteUser function');
    const userToDelete = request.body.username;

    console.log('userToDelete:' + userToDelete + 'check');
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

app.post('/deleteStatus', (request, response) => {
//add new contact
    console.log('entered deleteStatus function');
    const statusToDelete = request.body.Status;
    statusesCollection.deleteOne({'Status': statusToDelete}, function (err, obj) {
        if (err) throw err;
        console.log('1 status deleted');

    });
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end();
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

const storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        //var datetimestamp = Date.now();
        //cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
        filesCollection.updateOne(
            {FileName: file.originalname},
            {$set: {FileName: file.originalname}},
            {upsert: true}
        );
        cb(null, file.originalname);

    }
});

const upload = multer({ //multer settings
    storage: storage
}).single('file');

/** API path that will upload the files */
app.post('/uploadImage', function (req, res) {
    console.log('/uploadImage');
    upload(req, res, function (err) {
        if (err) {
            res.json({errorCode: 1, errDesc: err});
            return;
        }
        res.json({errorCode: 0, errDesc: null});
    });
});


app.post('/sendEmail', (request, response) => {
    console.log('sendEmail');
    const emailData = request.body.emailData;

    const mailOptions = {
        from: SERVER_EMAIL,
        to: emailData.mailRecipient,
        subject: emailData.mailSubject,
        text: emailData.mailText
    };

    if (emailData.attachmentFileName) {
        mailOptions.attachments = [{path: './uploads/' + emailData.attachmentFileName}];
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            response.writeHead(500, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({error: 'mail failed to be sent to ' + emailData.mailRecipient}));
        } else {
            console.log('Email sent: ' + info.response);
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({ok: 'mail has been sent successfully to ' + emailData.mailRecipient}));
        }
    });
});


