//the libraries
var http = require('http');
var url = require('url');
const fs = require('fs');
const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ReadPreference = require('mongodb').ReadPreference;
const ObjectId = require("mongodb").ObjectID;
const config = require('./mongo-config.json');

const APP_NAME = require('os').hostname();
const APP_PORT = 7000;

var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

function get_mongo_connection_string()
{
    let connection_string = "";
    let mongo_config = config["mongo"];
    let auth_type = mongo_config["auth_type"];

    let db_user_name = process.env.SECRET_USERNAME;
    let db_user_password = process.env.SECRET_PASSWORD;
    if (auth_type == 'none')
    {
        if (mongo_config["uri_prefix"]) {
            connection_string = mongo_config["uri_prefix"] + "://";
        }

        connection_string += mongo_config["cluster_url"] + ":" +
            mongo_config["mongodb_port"] + "/" +
            mongo_config["mongodb_name"]  + "?";

        replica_set =  mongo_config["replica_set"];
        if (replica_set) {
            connection_string += "replicaSet=" + replica_set;
        }
    }
    else if(auth_type == 'SHA-1'){
        connection_string = mongo_config["uri_prefix"] + "://" + db_user_name + ":" + db_user_password + "@" +
            mongo_config["cluster_url"];
    }
    return connection_string;
}


app.listen(APP_PORT, () =>
{
    console.log("server " + APP_NAME + " is listening on port " + APP_PORT);
});


app.get("/", (request, response) => {
        console.log('--Rendering html page--');
        fs.readFile('./CRM_Client.html', function (error, data) {
            if (error) {
                console.log('error has happand in CRM_Client.html', error)
            }

            let mongo_config = config["mongo"];
            let db_name = mongo_config["mongodb_name"];
            let conn_string = get_mongo_connection_string();
            console.log("db uri: " + conn_string);
            MongoClient.connect(conn_string,
                {
                    useNewUrlParser: true,
                    readPreference:ReadPreference.NEAREST,
                    autoReconnect:true,
                    reconnectTries:Number.MAX_SAFE_INTEGER,
                    poolSize:16,
                    connectWithNoPrimary:true,
                    useUnifiedTopology: true,
                    appname:APP_NAME
                }, (error, client) => {
                    if(error) {
                        return response.status(500).send(error);
                    }
                    database = client.db(db_name);
                    contacts_collection = database.collection("contacts");
                    console.log("Connected to `" + db_name + "`!");
                    result = {
                        "db_conn_string": conn_string
                    };


                });
            response.writeHead(200, {"Content-Type": "text/html"});
            response.end(data);
        });
});
app.get("/bootstrap.min.css", (request, response) =>{
        console.log('--Rendering bootstrap-css file--');
        fs.readFile('./lib/bootstrap.min.css', function (error, data) {
            if (error) {
                console.log('error has happand in bootstrap.min.css', error)
            }
            response.writeHead(200, {"Content-Type": "text/css"});
            response.end(data);
        });
});
app.get("/angular.min.js", (request, response) =>{//bring the angular file
        console.log('--Rendering angular-js file--');
        fs.readFile('./lib/angular.min.js', function (error, data) {
            if (error) {
                console.log('error has happand in angular.min.js', error)
            }
            response.writeHead(200, {"Content-Type": "text/javascript"});
            response.end(data);
        });
});
    /*else if (request.method == 'GET' && url_parts.pathname == '/angular.min.js.map') {//bring the angular-map file
        console.log('--Rendering angular-map file--');
        fs.readFile('./lib/angular.min.js.map', function (error, data) {
            if (error) {
                console.log('error has happand in /angular.min.js.map', error)
            }
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(data);
        });
    }


    else if (request.method == 'GET' && url_parts.pathname == '/bootstrap.min.css.map') {//bring the bootstrap-map file
        console.log('--Rendering bootstrap-map file--');
        fs.readFile('./lib/bootstrap.min.css.map', function (error, data) {
            if (error) {
                console.log('error has happand in /bootstrap.min.css.map', error)
            }
			response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(data);
        });
    }*/

app.get("/CRM_Client.css", (request, response) =>{   //bring the CRM_Client.css file
        console.log('--Rendering CRM_Client.css file--');
        fs.readFile('./CRM_Client.css', function (error, data) {
            if (error) {
                console.log('error has happand in /CRM_Client.css', error)
            }
            response.writeHead(200, { 'Content-Type': "text/css" });
            response.end(data);
        });
});

app.get("/CRM_Client.js", (request, response) =>{
        console.log('--Rendering CRM_Client.css file--');
        fs.readFile('./CRM_Client.css', function (error, data) {
            if (error) {
                console.log('error has happand in /CRM_Client.js', error)
            }
            response.writeHead(200, { 'Content-Type':"text/javascript" });
            response.end(data);
        });
});

app.post("/addContact", (request, response) =>{
        //add new contact
            var contact = request.body.contact;
            var contactsString = fs.readFileSync('contacts.json');
            var contacts = JSON.parse(contactsString);
    db.onlyInsertIfValueIsUniqueDemo.insertOne({"StudentName":"Larry","StudentAge":22});
});
app.get("/getContacts", (request, response) =>{

        console.log("entered getContacts function");
        var contacts = fs.readFileSync('contacts.json');
        console.log("read contacts file "+contacts);
        var contactsList = JSON.parse(contacts);
        console.log("parse contacts"+ contactsList);
        console.log("stringify contacts"+ JSON.stringify({"contacts": contactsList}));
        response.writeHead(200, { 'Content-Type': 'application/json' });

        response.end(JSON.stringify({contacts:contactsList}));
});

app.post("/deleteContact", (request, response) =>{
//add new contact
        request.on('data', function (stringifiedData) {
            var data = JSON.parse(stringifiedData);
            var contact_to_delete = data.contact;
            var new_contacts_list = [];
            var contactsString = fs.readFileSync('contacts.json');
            var contacts = JSON.parse(contactsString);
            for(var i=0; i<contacts.length; i++){
                if((contacts[i].Name!=contact_to_delete.Name)
                    ||(contacts[i].PhoneNumber!=contact_to_delete.PhoneNumber)
                    ||(contacts[i].eMail!=contact_to_delete.eMail)
                    ||(contacts[i].Address!=contact_to_delete.Address))
                {//push to file all contacts that are not to be deleted
                    new_contacts_list.push(contacts[i]);
                }
            }
            fs.writeFileSync('contacts.json', JSON.stringify(new_contacts_list));
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end();
        });
});

app.get("/getStatusOptions", (request, response) =>{
        console.log("entered getStatusOptions function");
        var statuses = fs.readFileSync('status.json');
        console.log("read statuses file "+statuses);
        var statusesList = JSON.parse(statuses);
        console.log("parse contacts"+ statusesList);
        //console.log("stringify contacts"+ JSON.stringify({"contacts": contactsList}));
        response.writeHead(200, { 'Content-Type': 'application/json' });

        response.end(JSON.stringify({statusOptions:statusesList}));
});

app.post("/updateContact", (request, response) =>{
//update contact
        request.on('data', function (stringifiedData) {
            var data = JSON.parse(stringifiedData);
            var contacts_to_update = data.contactsInfoToUpdate;

            fs.writeFileSync('contacts.json', JSON.stringify(contacts_to_update));
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end();
        });
});

app.post("/addOption", (request, response) =>{
//add new option
        request.on('data', function (stringifiedData) {
            console.log("entered addStatus function");
            var data = JSON.parse(stringifiedData);
            var status_to_add = data.new_status;
            console.log("new status: " + status_to_add.Status);
            var statusString = fs.readFileSync('status.json');
            var statuses = JSON.parse(statusString);

            statuses.push(status_to_add);
            console.log(statuses);
            fs.writeFileSync('status.json', JSON.stringify(statuses));
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end();
        });
});
