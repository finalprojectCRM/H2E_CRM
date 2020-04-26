//the libraries that not existing fundamentally in node js
const fs = require('fs');
const nodeMailer = require('nodemailer');
const Express = require('express');
const BodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ReadPreference = require('mongodb').ReadPreference;
const config = require('./config/default.json');
const multer = require('multer');

//the name of app
const APP_NAME = require('os').hostname();
//the port that the app running on it
const APP_PORT = 3000;

//the database and the collections in mongodb
let database, contactsCollection, statusesCollection, usersCollection, filesCollection,
    rolesWithStatusesCollection, statusesWithRolesCollection, colorsCollection;
const app = new Express();
//The temp password that the administrator get with the system
const firstTempPassword = '12345678';
//the email of the system
const SERVER_EMAIL = 'h2e.crm@gmail.com';

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended: true}));


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
    let mongoConfig = config.mongo;
    let authType = mongoConfig.authType;

    let dbUserName = process.env.SECRET_USERNAME;
    let dbUserPassword = process.env.SECRET_PASSWORD;
    if (authType === 'none') {
        if (mongoConfig.uriPrefix) {
            connectionString = mongoConfig.uriPrefix + '://';
        }
        connectionString += mongoConfig.clusterUrl + ':' +
            mongoConfig.mongodbPort + '/' +
            mongoConfig.mongodbName + '?';

        let replicaSet = mongoConfig.replicaSet;
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

//get main page and connect to mongo db
app.get('/', (request, response) => {
    console.log('--Rendering html page--');

    let mongoConfig = config.mongo;
    let dbName = mongoConfig.mongodbName;
    let connString = getMongoConnectionString();
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
            contactsCollection = database.collection('contacts');
            statusesCollection = database.collection('statuses');
            usersCollection = database.collection('users');
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
app.get('/CRM-Client.css', (request, response) => {   //bring the client/CRM-Client.css file
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
    usersCollection.findOne({'UserName': 'Admin'}).then(function (mongoUser) {
        if (!mongoUser)//Admin not yet in system = mongo db usersCollection is empty
        {
            //insert to users collection the first user - Admin
            usersCollection.insertOne(
                {
                    'UserName': 'Admin', 'Role': 'Administrator', 'Name': '',
                    'eMail': '', 'Password': '', 'TempPassword': firstTempPassword
                }, function (err, res) {
                    if (err) throw err;
                });
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'admin_first_load': true}));//Admin has been loaded first time to mongodb
        } else//there is a user in system and Admin exists = mongo db usersCollection is not empty
        {
            if (mongoUser.UserName === 'Admin' && mongoUser.Name === '' && mongoUser.eMail === '' && mongoUser.Password === '') {
                if (mongoUser.TempPassword === firstTempPassword)//admin did not yet change the temp password that he got from system
                {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({'admin_changed_temp_password': false}));
                } else//admin changed temp password that he got from system
                {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({'admin_changed_temp_password': true}));//go to registration page with admin
                }

            } else//Admin has filled in all his details
            {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'admin_exists_with_details': true}));
            }

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
    usersCollection.findOne({'UserName': 'Admin'}).then(function (mongoUser) {

        if (mongoUser.TempPassword !== tempPassword)//not correct temp password
        {
            console.log('!result not a password');
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({notVerified: 'You do not have a correct temporary password , Please get it from the administrator'}));
        } else {
            if (mongoUser.UserName === 'Admin' && mongoUser.Name === '' && mongoUser.eMail === '' && mongoUser.Password === '') {
                if (mongoUser.TempPassword === firstTempPassword)//admin did not yet change the temp password that he got from system
                {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({'admin_changed_temp_password': false}));
                } else//admin changed temp password that he got from system
                {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({'admin_changed_temp_password': true}));//go to registration page with admin
                }
            } else {
                //the user has a good password that changed by admin
                console.log('good password');
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({verified: true}));
            }
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

    const NewTempPassword = request.body.new_temp_password;
    console.log('NewTempPassword: ' + NewTempPassword);
    //update in usersCollection the filed TempPassword that exists in admin with a new password
    usersCollection.update({'UserName': 'Admin'}, {$set: {TempPassword: NewTempPassword.TempPassword}}, function (err, obj) {
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

    let loggedInCurrentPassword = request.body.logged_in_current_password;
    //try to find in user collection a user with a given username and password
    usersCollection.findOne({
        'UserName': loggedInCurrentPassword.username,
        'Password': loggedInCurrentPassword.currentPassword
    }).then(function (mongoUser) {

        if (mongoUser == null)//no such username with this current password
        {
            console.log('entered if ');
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'notVerified': 'The current password is incorrect, please try again.'}));
        } else//found the user that the username and the current password match
        {
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

    let logged_in_new_password = request.body.logged_in_new_password;

    //update in usersCollection the the password of user with a new password
    usersCollection.update({'UserName': logged_in_new_password.username},
        {$set: {'Password': logged_in_new_password.new_password}}, function (err, obj) {
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
    let userEvents = [];
    //user with his details : Role , UserName ,Name ,eMail,Password
    user = {
        'Role': 'new in the system',
        'UserName': user.UserName,
        'Name': user.Name,
        'eMail': user.eMail,
        'Password': user.Password,
        'Events': userEvents,
    };
    //check if this username does not exist in the system
    usersCollection.findOne({'UserName': user.UserName}).then(function (mongoUser) {
        if (!mongoUser) {
            //if this username does not exist in the system - add a new user with his details
            usersCollection.insertOne(user, function (err, res) {
                if (err) throw err;
                //return the user details with is_admin:false
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({
                    'user': {
                        'Role': user.Role, 'UserName': user.UserName, 'Name': user.Name,
                        'eMail': user.eMail, 'Password': user.Password, is_admin: false
                    }
                }));
            });
        } else {
            //when the username already exists with admin and his fields did not fill
            if (mongoUser.UserName === 'Admin' && mongoUser.Name === '' && mongoUser.eMail === '' && mongoUser.Password === '') {
                //update the Admin empty details with a new details
                usersCollection.update({'UserName': 'Admin'}, {
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
                            'eMail': user.eMail, 'Password': user.Password, is_admin: true
                        }
                    }));
                    console.log('admin register');


                });
            } else {
                //if the username already exists and he is not the Admin
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({user_exists: 'This user name already exists.'}));
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
    let user = request.body.LoginUser;
    console.log(user.UserName);
    //check if the username and the password exist
    usersCollection.findOne({'UserName': user.UserName, 'Password': user.Password}).then(function (result) {
        //if no match
        if (!result) {
            console.log('no match!');
            response.writeHead(200, {'Content-Type': 'application/json'});
            //post a response with The user name or password is incorrect. Try again.
            response.end(JSON.stringify({no_match: 'The user name or password is incorrect. Try again.'}));
        } else {
            //if there is matching
            console.log(result.Name);
            response.writeHead(200, {'Content-Type': 'application/json'});
            //check if the user is admin and return a user details with 'adminUser':true
            if (result.UserName === 'Admin') {
                response.end(JSON.stringify({
                    user_login: {
                        'adminUser': true, 'Role': result.Role, 'UserName': result.UserName, 'Name': result.Name,
                        'eMail': result.eMail, 'Password': result.Password, 'Events': result.Events
                    }
                }));
            }
            //if the user is not admin rturn user datails
            else {
                response.end(JSON.stringify({user_login: result}));
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
    let contact = request.body.contact;
    console.log('contact: ' + contact.History);

    //check if the contact is already exist by the key - the PhoneNumber
    contactsCollection.findOne({'PhoneNumber': contact.PhoneNumber}).then(function (result) {

        if (!result) {
            //if this contact does not exist in the system - add a new contact with his details
            contactsCollection.insertOne(
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
        }
        //check if the contact already exists
        else {
            response.writeHead(200, {'Content-Type': 'application/json'});
            //response with error massage
            response.end(JSON.stringify({'phone_exists': 'ERROR : this phone number already exists, change it or search for this user.'}));
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
    //enter all members of contactsCollection to array
    contactsCollection.find({}).toArray((error, result) => {
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
    //enter all members of contactsCollection to array
    filesCollection.find({}).toArray((error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        //response with ok, and with the contacts list

        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'files': result}));
    });

});

/*
	This request is to get the list of users
*/
app.post('/getUsers', (request, response) => {

    console.log('entered getUsers function');
    let status_flag = request.body.status_flag;
    console.log('status_flag : ' + status_flag);

    //if request is to get the users for the delete user
    if (status_flag === 'deleteUser') {
        console.log('entered if with : ' + status_flag);
        //get the user list without the administrator
        usersCollection.find({UserName: {$ne: 'Admin'}}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            //response with ok, and with the users list
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'deleteUser': true, 'users': result}));
        });
    }
    //if request is to get the users for show user

    else if (status_flag === 'showUsers') {
        //enter all members of usersCollection to array
        usersCollection.find({}).toArray((error, result) => {
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
    let contact_to_delete = request.body.contact;
    console.log('contact_to_delete :' + contact_to_delete);
    //delete the contact from contacts collection by his all details
    contactsCollection.deleteOne({
        'Name': contact_to_delete.Name,
        'Status': contact_to_delete.Status,
        'PhoneNumber': contact_to_delete.PhoneNumber,
        'eMail': contact_to_delete.eMail,
        'Address': contact_to_delete.Address
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
    let file_to_delete = request.body.file;
    const path = './uploads/' + file_to_delete.FileName;
    try {
        fs.unlinkSync(path);
        filesCollection.deleteOne({'FileName': file_to_delete.FileName}, function (err, obj) {
            if (err) throw err;
            console.log('1 document deleted');
            if (obj) {
                var fileDeleted = 'The file ' + file_to_delete.FileName + ' has been deleted.';
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

    let status_with_roles = request.body.status_with_roles;
    console.log('before updateOne');
    //add a new add a new status with an appropriate roles only if the status does not exist
    statusesWithRolesCollection.updateOne({Status: status_with_roles.Status},
        {$setOnInsert: {Status: status_with_roles.Status, Roles: status_with_roles.Roles}},
        {upsert: true}, function (err, res) {
            console.log('after updateOne');
        });

    console.log('status_with_roles.Roles: ' + status_with_roles.Roles);

    //go through of all roles
    for (let role of status_with_roles.Roles) {
        console.log('role: ' + role);
        //add to role a new status
        rolesWithStatusesCollection.updateOne({Role: role}, {$addToSet: {Statuses: status_with_roles.Status}},
            function (err, res) {
                console.log('after updateOne');
            });

    }


    //add to the statuses list a new status
    statusesCollection.updateOne(
        {'Status': status_with_roles.Status},
        {$setOnInsert: {'Status': status_with_roles.Status}},
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

    let role_with_statuses = request.body.role_with_statuses;
    console.log('before updateOne');
    //insert to the colors list the role color
    colorsCollection.insertOne({Color: role_with_statuses.Color});
    //add a new add a new role with an appropriate statuses only if the role does not exist
    rolesWithStatusesCollection.updateOne({Role: role_with_statuses.Role}
        , {
            $setOnInsert: {
                Role: role_with_statuses.Role,
                Color: role_with_statuses.Color,
                Statuses: role_with_statuses.Statuses
            }
        },
        {upsert: true},
        function (err, res) {
            console.log('after updateOne');
        });

    //go through of all statuses
    for (let status of role_with_statuses.Statuses) {
        //check if the status does not 'add a new status' or '-- Choose status --'
        if (status !== 'add a new status' && status !== '-- Choose status --') {
            console.log('status: ' + status);
            //add the to status a new role
            statusesWithRolesCollection.updateOne({Status: status}
                , {$addToSet: {Roles: role_with_statuses.Role}}, {upsert: true},
                function (err, res) {
                    console.log('after updateOne');
                });

        }
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
    let role_to_update = request.body.role_to_update;
    //the appropriate statuses to role
    let statuses = role_to_update.Statuses;
    console.log('before updateOne');
    //update the role with new statuses
    rolesWithStatusesCollection.updateOne({Role: role_to_update.Role}
        , {$addToSet: {Statuses: {$each: statuses}}},
        function (err, res) {
            console.log('after updateOne');
        });
    //go through statuses
    for (let status of role_to_update.Statuses) {
        //check if the status does not 'add a new status' or '-- Choose status --'
        if (status !== 'add a new status' && status !== '-- Choose status --') {
            console.log('status: ' + status);
            console.log('type of status: ' + typeof status);
            //update the status with new role
            statusesWithRolesCollection.updateOne({Status: status}
                , {$addToSet: {Roles: role_to_update.Role}},
                function (err, res) {
                    console.log('after updateOne');
                });
        }

    }
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
            //insert the roles: 'תמיכה טכנית' with statuses: : '-- Choose status for role --','בעיה טכנית' ,,'add a new status' and color:#66ffff'
            rolesWithStatusesCollection.insertOne({
                Role: 'תמיכה טכנית',
                Color: '#66ffff',
                Statuses: ['בעיה טכנית', 'add a new status']
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

/*
	update contact details only with phone number that does not exist in the system
*/

app.post('/addEvent', (request, response) => {
    console.log("/addEvent");
    let user_for_event = request.body.newEvent.user;
    console.log("user_for_task.UserName: " + user_for_event.UserName);
    let event = request.body.newEvent.event;
    console.log("event: " + event.id);

    usersCollection.updateOne({UserName: user_for_event.UserName}, {$addToSet: {Events: event},}, {upsert: true},
        function (err, res) {
            console.log('after updateOne');
        });
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end();
});

app.post('/deleteEvent', (request, response) => {
    console.log("/deleteEvent");
    let user_for_event = request.body.deletevent.user;
    console.log("user_for_task.UserName: " + user_for_event.UserName);
    let event = request.body.deletevent.event;
    console.log("event start: " + event.start + 'end ' + event.end);
    usersCollection.updateOne(
        {UserName: user_for_event.UserName},
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
    console.log("/updateEvent");
    let user_for_event = request.body.updatEvent.user;
    console.log("user_for_task.UserName: " + user_for_event.UserName);
    let eventBeforeUpdate = request.body.updatEvent.eventBeforeUpdate;
    let eventAfterUpdate = request.body.updatEvent.eventAfterUpdate;
    // console.log("event start: "+ event.start +'end '+ event.end);
    usersCollection.updateOne(
        {
            UserName: user_for_event.UserName,
            Events: eventBeforeUpdate
        },
        {
            $set: {
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
    let contact_before_update_body = request.body.contact_before_update;
    let contact_after_update_body = request.body.updated_contact;
    let contact_before_update = {
        'Name': contact_before_update_body.Name,
        'Category': contact_before_update_body.Category,
        'Status': contact_before_update_body.Status,
        'PhoneNumber': contact_before_update_body.PhoneNumber,
        'eMail': contact_before_update_body.eMail,
        'Address': contact_before_update_body.Address
    };

    if (contact_after_update_body.PhoneNumber == contact_before_update_body.PhoneNumber) {
        let contact_after_update = {
            $set: {
                'Name': contact_after_update_body.Name,
                'Category': contact_after_update_body.Category,
                'Status': contact_after_update_body.Status,
                'PhoneNumber': contact_after_update_body.PhoneNumber,
                'eMail': contact_after_update_body.eMail,
                'Address': contact_after_update_body.Address
            }
        };
        contactsCollection.updateOne(contact_before_update, contact_after_update, function (err, res) {
            if (err) throw err;
            contactsCollection.updateOne({PhoneNumber: contact_after_update_body.PhoneNumber}
                , {$addToSet: {History: contact_after_update_body.History}},
                function (err, res) {
                    console.log('after updateOne');
                });


            contactsCollection.find({}).toArray((error, result) => {
                if (error) {
                    return response.status(500).send(error);
                }
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'contacts': result}));
            });
        });
    } else {
        contactsCollection.findOne({'PhoneNumber': contact_after_update_body.PhoneNumber}).then(function (result) {
            if (!result) {
                let contact_after_update = {
                    $set: {
                        'Name': contact_after_update_body.Name,
                        'Category': contact_after_update_body.Category,
                        'Status': contact_after_update_body.Status,
                        'PhoneNumber': contact_after_update_body.PhoneNumber,
                        'eMail': contact_after_update_body.eMail,
                        'Address': contact_after_update_body.Address
                    }
                };
                contactsCollection.updateOne(contact_before_update, contact_after_update, function (err, res) {
                    if (err) throw err;
                    contactsCollection.updateOne({PhoneNumber: contact_after_update_body.PhoneNumber}
                        , {$addToSet: {History: contact_after_update_body.History}},
                        function (err, res) {
                            console.log('after updateOne');
                        });
                    contactsCollection.find({}).toArray((error, result) => {
                        if (error) {
                            return response.status(500).send(error);
                        }
                        response.writeHead(200, {'Content-Type': 'application/json'});
                        response.end(JSON.stringify({'contacts': result}));
                    });

                });
            } else {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'phone_exists': 'This phone number already exists, change it or search for this user.'}));
            }

        });
    }
});//update contact details only with phone number that does not exist in the system
app.post('/updateUser', (request, response) => {
//update contact
    console.log('update users FUNCTION');
    let user_before_update_body = request.body.user_before_update;
    let user_after_update_body = request.body.updated_user;
    let user_before_update = {
        Role: user_before_update_body.Role,
        UserName: user_before_update_body.UserName,
        Name: user_before_update_body.Name,
        eMail: user_before_update_body.eMail
    };
    let user_after_update = {
        $set: {
            Role: user_after_update_body.Role,
            UserName: user_after_update_body.UserName,
            Name: user_after_update_body.Name,
            eMail: user_after_update_body.eMail
        }
    };
    usersCollection.updateOne(user_before_update, user_after_update, function (err, res) {
        if (err) throw err;
        usersCollection.find({}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({'showUsers': true, 'users': result}));
        });
    });
});


app.get('/deleteAllContacts', (request, response) => {

    contactsCollection.remove({}, function (err, obj) {
        if (err) throw err;
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'message': 'All contacts have been deleted from the system'}));

    });

});

app.get('/deleteAllUsers', (request, response) => {

    usersCollection.remove({UserName: {$ne: 'Admin'}}, function (err, obj) {
        if (err) throw err;
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({'message': 'All users have been deleted from the system'}));

    });

});


app.post('/deleteStatusFromRole', (request, response) => {
//add new contact
    console.log('entered deleteStatusFromRole function');
    let status_to_delete = request.body.status_to_delete;
    console.log('status_to_delete.Role ' + status_to_delete.Role);
    console.log('status_to_delete.Status ' + status_to_delete.Status);
    let Status = status_to_delete.Status;

    rolesWithStatusesCollection.updateOne({Role: status_to_delete.Role}, {$pull: {Statuses: Status}}, function (err, obj) {
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
    let status_to_delete = request.body.status_to_delete;
    let statuses, roles_statuses, statuses_roles;

    console.log('status_to_delete:' + status_to_delete);
    statusesCollection.deleteOne({'Status': status_to_delete}, function (err, obj) {
        if (err) throw err;
        console.log('1 status deleted');
        statusesCollection.find({}).toArray((error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            statuses = result;
        });
        statusesWithRolesCollection.deleteOne({'Status': status_to_delete}, function (err, obj) {
            if (err) throw err;
            console.log('1 status deleted');
            statusesWithRolesCollection.find({}).toArray((error, result) => {
                if (error) {
                    return response.status(500).send(error);
                }
                statuses_roles = result;
            });
        });
        rolesWithStatusesCollection.updateMany({}, {$pull: {Statuses: {$in: [status_to_delete]}}}, function (err, obj) {
            if (err) throw err;
            console.log('1 status was deleted from role ');
            rolesWithStatusesCollection.find({}).toArray((error, roles_statuses) => {
                if (error) {
                    return response.status(500).send(error);
                }

                roles_statuses = roles_statuses;

            });
        });

    });

    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({'statuses': statuses, 'roles': roles_statuses}));

});

app.post('/deleteUser', (request, response) => {
//add new contact
    console.log('entered deleteUser function');
    let user_to_delete = request.body.username;

    console.log('user_to_delete:' + user_to_delete + 'check');
    usersCollection.findOne({'UserName': user_to_delete}).then(function (result) {
        if (!result) {
            console.log('did not find user to delete ');
        }
        //check if the contact already exists
        else {
            usersCollection.deleteOne({'UserName': result.UserName}, function (err, obj) {
                if (err) throw err;
                console.log('1 user deleted');
                usersCollection.find({}).toArray((error, result) => {
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
        response.send({error: err})
    })
});
app.post('/deleteRole', (request, response) => {
//add new contact
    console.log('entered deleteRole function');
    let role_to_delete = request.body.role;

    console.log('role_to_delete:' + role_to_delete);

    rolesWithStatusesCollection.deleteOne({Role: role_to_delete}, function (err, obj) {
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

    statusesWithRolesCollection.updateMany({}, {$pull: {Roles: {$in: [role_to_delete]}}}, function (err, obj) {
        if (err) throw err;
        console.log('1 status was deleted from role ');
        statusesWithRolesCollection.find({}).toArray((error, roles_statuses) => {
            if (error) {
                return response.status(500).send(error);
            }

            roles_statuses = roles_statuses;

        });
    });
});

app.post('/deleteStatus', (request, response) => {
//add new contact
    console.log('entered deleteStatus function');
    let status_to_delete = request.body.Status;
    statusesCollection.deleteOne({'Status': status_to_delete}, function (err, obj) {
        if (err) throw err;
        console.log('1 status deleted');

    });
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end();
});

//add a new status
app.post('/addOption', (request, response) => {
//add new option
    let status_to_add = request.body.new_status;

    statusesCollection.updateOne(
        {'Status': status_to_add.Status},
        {$setOnInsert: {'Status': status_to_add.Status}},
        {upsert: true}
    );
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end();
});

let storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        //var datetimestamp = Date.now();
        //cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
        filesCollection.insertOne({"FileName": file.originalname});
        cb(null, file.originalname);

    }
});

let upload = multer({ //multer settings
    storage: storage
}).single('file');

/** API path that will upload the files */
app.post('/uploadImage', function (req, res) {
    console.log('/uploadImage');
    upload(req, res, function (err) {
        if (err) {
            res.json({error_code: 1, err_desc: err});
            return;
        }
        res.json({error_code: 0, err_desc: null});
    });
});


app.post('/sendEmail', (request, response) => {
    console.log('sendEmail');
    let email_data = request.body.email_data;

    let mailOptions = {
        from: SERVER_EMAIL,
        to: email_data.mail_recipient,
        subject: email_data.mail_subject,
        text: email_data.mail_text
    };

    if (email_data.attachment_file_name) {
        mailOptions.attachments = [{path: './uploads/' + email_data.attachment_file_name}]
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            response.writeHead(500, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({error: 'mail failed to be sent to ' + email_data.mail_recipient}));
        } else {
            console.log('Email sent: ' + info.response);
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({ok: 'mail has been sent successfully to ' + email_data.mail_recipient}));
        }
    });
});


