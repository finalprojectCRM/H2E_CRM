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
const APP_PORT = 3000;

var database, contacts_collection;
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
                console.log("ERROR TO CONECT TO MONGODB")
            }
            database = client.db(db_name);
            contacts_collection = database.collection("contacts");
            statuses_collection = database.collection("statuses");

            console.log("Connected to `" + db_name + "`!");
            result = {
                "db_conn_string": conn_string
            };

            fs.readFile('./CRM_Client.html', function (error, data) {
                if (error) {
                    console.log('error has happand in CRM_Client.html', error)
                }
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end(data);
            });


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
    console.log("addContact FUNCTION");
        //add new contact
            var contact = request.body.contact;
            console.log("contact: " + contact.Name);

            contacts_collection.updateOne(
                {"PhoneNumber": contact.PhoneNumber},
                { $setOnInsert: { "Name": contact.Name ,"Status" : contact.Status , "eMail" : contact.eMail ,"Address" : contact.Address} },
                { upsert: true }
   )
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end();

});
app.get("/getContacts", (request, response) =>{

        console.log("entered getContacts function");
        contacts_collection.find({}).toArray((error, result) => {
            if(error) {
                return response.status(500).send(error);
            }
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({"contacts" :result}));
    });

});

app.post("/deleteContact", (request, response) =>{
//add new contact
    console.log("entered deleteContact function");
            var contact_to_delete = request.body.contact;
            console.log("contact_to_delete :"+ contact_to_delete);
                contacts_collection.deleteOne({"Name":contact_to_delete.Name ,"Status" : contact_to_delete.Status , "PhoneNumber":contact_to_delete.PhoneNumber ,"eMail" : contact_to_delete.eMail ,"Address" : contact_to_delete.Address }, function(err, obj) {
                    if (err) throw err;
                    console.log("1 document deleted");

                });
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end();
});

app.get("/getStatusOptions", (request, response) =>{
    console.log("entered getStatusOptions function");
    statuses_collection.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({"statusOptions" :result}));
    });
});

app.post("/updateContact", (request, response) =>{
//update contact
    console.log("updateContact FUNCTION");
    var contact_before_update_body = request.body.contact_before_update;
    var contact_after_update_body = request.body.updated_contact;
    contact_before_update = {"Name":contact_before_update_body.Name ,"Status" : contact_before_update_body.Status , "PhoneNumber":contact_before_update_body.PhoneNumber ,"eMail" : contact_before_update_body.eMail ,"Address" : contact_before_update_body.Address };
    console.log("contact_before_update_body.Name : "+contact_before_update_body.Name);
    console.log("contact_after_update_body.Name : "+contact_after_update_body.Name);
    contact_after_update = { $set: {"Name":contact_after_update_body.Name ,"Status" : contact_after_update_body.Status , "PhoneNumber":contact_after_update_body.PhoneNumber ,"eMail" : contact_after_update_body.eMail ,"Address" : contact_after_update_body.Address } };
    contacts_collection.updateOne(contact_before_update, contact_after_update, function(err, res) {
        if (err) throw err;
        console.log("1 document updated");
    });
});

app.post("/addOption", (request, response) =>{
//add new option
    var status_to_add = request.body.new_status;

    statuses_collection.updateOne(
        {"Status": status_to_add.Status},
        { $setOnInsert:{"Status": status_to_add.Status} },
        { upsert: true }
    )
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end();
});
