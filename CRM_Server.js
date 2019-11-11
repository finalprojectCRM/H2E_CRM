//the libraries
var http = require('http');
var fs = require('fs');
var url = require('url');
var  config = require('./config/default.json');
var mongoClient = require('mongodb').MongoClient; // New MongoDB client
var urldb = "mongodb://localhost:27017/CRMdb";

var portNum = 5000;
const dbName = 'CRMdb'

function onRequest(request, response) {

    var url_parts = url.parse(request.url, true);
    console.log(JSON.stringify(url_parts.pathname));
    console.log(JSON.stringify(request.method));
    if (request.method == 'GET' && request.url == '/')
	{//bring the main page
		console.log('--Rendering html page--');
		fs.readFile('./CRM_Client.html', function (error, data) {
			if (error) {
				console.log('error has happand in CRM_Client.html', error)
			}
		response.writeHead(200, {"Content-Type": "text/html"});
			mongoClient.connect( urldb , function(err, db) { // connect to the local Database

			if(err) { throw err; } // check if connection is ok, else err-output
			console.log("database created!");
			 console.log(`Connected MongoDB: ${urldb}`)
             console.log(`Database: ${dbName}`)
             console.log("Switched to "+db.databaseName+" database")
			
			db.createCollection("contacts", function(err, res) {
				if (err) throw err;
				console.log("Collection created!");});
			
			response.end();
			db.close(); // close the Database connection
			});
			response.end(data);
			
		});
			
	}
   
    else if (request.method == 'GET' && url_parts.pathname == '/bootstrap.min.css') {//bring the bootstrap file
        console.log('--Rendering bootstrap-css file--');
        fs.readFile('./lib/bootstrap.min.css', function (error, data) {
            if (error) {
                console.log('error has happand in bootstrap.min.css', error)
            }
            response.writeHead(200, {"Content-Type": "text/css"});
            response.end(data);
        });
    }
    else if (request.method == 'GET' && url_parts.pathname == '/angular.min.js') {//bring the angular file
        console.log('--Rendering angular-js file--');
        fs.readFile('./lib/angular.min.js', function (error, data) {
            if (error) {
                console.log('error has happand in angular.min.js', error)
            }
            response.writeHead(200, {"Content-Type": "text/javascript"});
            response.end(data);
        });
    }
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
	
	else if (request.method == 'GET' && url_parts.pathname == '/CRM_Client.css') {//bring the CRM_Client.css file
        console.log('--Rendering CRM_Client.css file--');
        fs.readFile('./CRM_Client.css', function (error, data) {
            if (error) {
                console.log('error has happand in /CRM_Client.css', error)
            }
			response.writeHead(200, { 'Content-Type': "text/css" });
            response.end(data);
        });
    }
	
	else if (request.method == 'GET' && url_parts.pathname == '/CRM_Client.js') {//bring the CRM_Client.js file
        console.log('--Rendering CRM_Client.css file--');
        fs.readFile('./CRM_Client.css', function (error, data) {
            if (error) {
                console.log('error has happand in /CRM_Client.js', error)
            }
			response.writeHead(200, { 'Content-Type':"text/javascript" });
            response.end(data);
        });
    }
	
	else if (request.method == 'POST' && url_parts.pathname == '/addContact') {//add new contact   
        request.on('data', function (stringifiedData) {
            var data = JSON.parse(stringifiedData);
			var contact = data.contact;		
            var contactsString = fs.readFileSync('contacts.json');
            var contacts = JSON.parse(contactsString);
            for(var i=0; i<contacts.length; i++){
				if(contacts[i].PhoneNumber==contact.PhoneNumber)
				{//check if the contact already exists
					response.writeHead(500, { 'Content-Type': 'text/html' });
					response.end(JSON.stringify({error:"This contact exists in the system."}));
					return;
				}
					//############################ ADD OPTION TO DISPLAY THIS CONTACT #############################
			}
            contacts.push(contact);
			console.log(contacts);
            fs.writeFileSync('contacts.json', JSON.stringify(contacts));
			response.writeHead(200, { 'Content-Type': 'application/json' });//The product name not exist, the product added
			response.end();
			});
    }
	
	else if (request.method == 'GET' && url_parts.pathname == '/getContacts')
	{
		console.log("entered getContacts function");
		var contacts = fs.readFileSync('contacts.json');
		console.log("read contacts file "+contacts);
        var contactsList = JSON.parse(contacts);
		console.log("parse contacts"+ contactsList);
		console.log("stringify contacts"+ JSON.stringify({"contacts": contactsList}));
		response.writeHead(200, { 'Content-Type': 'application/json' });
			
        response.end(JSON.stringify({contacts:contactsList}));
    }
	else if (request.method == 'POST' && url_parts.pathname == '/deleteContact') {//add new contact 
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
    }
	else if (request.method == 'GET' && url_parts.pathname == '/getStatusOptions')
	{
		console.log("entered getStatusOptions function");
		var statuses = fs.readFileSync('status.json');
		console.log("read statuses file "+statuses);
        var statusesList = JSON.parse(statuses);
		console.log("parse contacts"+ statusesList);
		//console.log("stringify contacts"+ JSON.stringify({"contacts": contactsList}));
		response.writeHead(200, { 'Content-Type': 'application/json' });
			
        response.end(JSON.stringify({statusOptions:statusesList}));
    }
	
	else if (request.method == 'POST' && url_parts.pathname == '/updateContact') {//add new contact 
        request.on('data', function (stringifiedData) {
            var data = JSON.parse(stringifiedData);
			var contacts_to_update = data.contactsInfoToUpdate;
			
            fs.writeFileSync('contacts.json', JSON.stringify(contacts_to_update));
			response.writeHead(200, { 'Content-Type': 'application/json' });
			response.end();
			});
    }
	
	else if (request.method == 'POST' && url_parts.pathname == '/addOption') {//add new status 
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
    }
}
http.createServer(onRequest).listen(portNum);
console.log(`Sever is now running at http://localhost:${portNum}`);	