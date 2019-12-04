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

var database, contacts_collection, statuses_collection, users_collection;
var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));


//get to mongo db Permissions
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

//listen to server
app.listen(APP_PORT, () =>
{
    console.log("server " + APP_NAME + " is listening on port " + APP_PORT);
});

//get main page and contect to mongo db
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
			users_collection = database.collection("users");

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
//get bootstrap 
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
//get angular
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

//get CSS
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

//get CRM_Client.js
app.get("/CRM_Client.js", (request, response) =>{
        console.log('--Rendering CRM_Client.css file--');
        fs.readFile('./CRM_Client.js', function (error, data) {
            if (error) {
                console.log('error has happand in /CRM_Client.js', error)
            }
            response.writeHead(200, { 'Content-Type':"text/javascript" });
            response.end(data);
        });
});

app.get("/firstSystemLoad", (request, response) =>{

        console.log("entered firstSystemLoad function");
			
			users_collection.findOne({"UserName": "Admin"}).then(function(result) {
			  if(!result) {
				  
				var tempPassword = "12345678";
				users_collection.insertOne(
                {"UserName": "Admin" , "TempPassword": tempPassword } , function(err, res){
                 if (err) throw err;});
				 response.writeHead(200, { 'Content-Type': 'application/json' });
				 response.end(JSON.stringify({"tempPassword" : tempPassword}));
			  }

			}).catch(function(err) {
			  response.send({error: err})
			})

});

app.post("/verifyTemporaryPassword", (request, response) =>{

        console.log("entered verifyTemporaryPassword function");
		
			 var tempPassword = request.body.tempPassword;
			 users_collection.findOne({"TempPassword": tempPassword}).then(function(result) {
			  if(!result) {
				console.log("!result not a password"); 
				response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({not_verified :"You don't have a correct temporary password , Please get it from the administrator"}));
			  }
			  else
			  {
				   console.log("good password");
                 response.writeHead(200, { 'Content-Type': 'application/json' });
                 response.end(JSON.stringify({verified :true}));
			  }
			  
			

			}).catch(function(err) {
			  response.send({error: err})
			})

});

app.post("/addUser", (request, response) =>{

        console.log("entered addUser function");
		 var user = request.body.user;
			
			  users_collection.findOne({"UserName": user.UserName}).then(function(result) {
			  if(!result) 
			  {
				users_collection.insertOne(user, function(err, res) {
				if (err) throw err;
				user_to_client =  {"UserName":user.UserName, "Name":user.Name,
				  "eMail":user.eMail,"Password":user.Password}
				 console.log("user:" + user_to_client.UserName);
				response.writeHead(200, { 'Content-Type': 'application/json' });
                 response.end(JSON.stringify({"user" :user_to_client}));
				  });
			  }
  
			  else
			  {
                 response.writeHead(200, { 'Content-Type': 'application/json' });
                 response.end(JSON.stringify({user_exists :"This user name already exists."}));
			  }
  
        }).catch(function(err) {
			  response.send({error: err})
			});
});

app.post("/login", (request, response) =>{

        console.log("entered login function");
		 var user = request.body.LoginUser;
		  console.log(user.UserName);
			
			  users_collection.findOne({"UserName": user.UserName,"Password":user.Password}).then(function(result) {
			  if(!result) 
			  {  
		        console.log("no match!");
				response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({no_match :"The user name or password is incorrect. Try again."}));
			  }
  
			  else
			  {
				 console.log(result.Name);
                 response.writeHead(200, { 'Content-Type': 'application/json' });
				 if(result.UserName == "Admin")
				 {
					 response.end(JSON.stringify({user_login :{"adminUser":true,"UserName":result.UserName, "Name":result.Name,
				  "eMail":result.eMail,"Password":result.Password}}));
				 }
				 else
                 {
					 response.end(JSON.stringify({user_login :result}));
				 }
			  }
  
        }).catch(function(err) {
			  response.send({error: err})
			});
});

// contact addition only if the contact does not exsist
app.post("/addContact", (request, response) =>{
    console.log("addContact FUNCTION");
        //add new contact
            var contact = request.body.contact;
            console.log("contact: " + contact.Name);
			
			contacts_collection.findOne({"PhoneNumber": contact.PhoneNumber}).then(function(result) {
			  if(!result) {
				contacts_collection.insertOne(
                {"Name": contact.Name , "Status" : contact.Status ,"PhoneNumber": contact.PhoneNumber, "eMail" : contact.eMail ,"Address" : contact.Address} , function(err, res){
                 if (err) throw err;});
				 response.end();
			  }
			  //check if the contact already exsists
			  else
			  {
                 response.writeHead(200, { 'Content-Type': 'application/json' });
                 response.end(JSON.stringify({"phone_exists" :"ERROR : this phone number already exists, change it or search for this user."}));
			  }
			  
			

			}).catch(function(err) {
			  response.send({error: err})
			})



});
//get the list of contacts
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

//delete contact
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

// get the statuses list
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

//update contact detailes only with phone number that does not exsist in the system
app.post("/updateContact", (request, response) =>{
//update contact
    console.log("updateContact FUNCTION");
    var contact_before_update_body = request.body.contact_before_update;
    var contact_after_update_body = request.body.updated_contact;
    contact_before_update = {"Name":contact_before_update_body.Name ,"Status" : contact_before_update_body.Status , "PhoneNumber":contact_before_update_body.PhoneNumber ,"eMail" : contact_before_update_body.eMail ,"Address" : contact_before_update_body.Address };
   
	if(contact_after_update_body.PhoneNumber == contact_before_update_body.PhoneNumber)
	{
		contact_after_update = { $set: {"Name":contact_after_update_body.Name ,"Status" : contact_after_update_body.Status , "PhoneNumber":contact_after_update_body.PhoneNumber ,"eMail" : contact_after_update_body.eMail ,"Address" : contact_after_update_body.Address } };
				contacts_collection.updateOne(contact_before_update, contact_after_update, function(err, res) {
				if (err) throw err;
				response.end(JSON.stringify({"contact_after_update" :{"Name":contact_after_update_body.Name ,"Status" : contact_after_update_body.Status , "PhoneNumber":contact_after_update_body.PhoneNumber ,"eMail" : contact_after_update_body.eMail ,"Address" : contact_after_update_body.Address } }));
			    });
	}
	else
	{
		contacts_collection.findOne({"PhoneNumber": contact_after_update_body.PhoneNumber}).then(function(result) {
			  if(!result) 
			  {
				contact_after_update = { $set: {"Name":contact_after_update_body.Name ,"Status" : contact_after_update_body.Status , "PhoneNumber":contact_after_update_body.PhoneNumber ,"eMail" : contact_after_update_body.eMail ,"Address" : contact_after_update_body.Address } };
				contacts_collection.updateOne(contact_before_update, contact_after_update, function(err, res) {
				if (err) throw err;
				response.end(JSON.stringify({"contact_after_update" :{"Name":contact_after_update_body.Name ,"Status" : contact_after_update_body.Status , "PhoneNumber":contact_after_update_body.PhoneNumber ,"eMail" : contact_after_update_body.eMail ,"Address" : contact_after_update_body.Address } }));

				  });
			  }
			  else
			  {
                 response.writeHead(200, { 'Content-Type': 'application/json' });
                 response.end(JSON.stringify({"phone_exists" :"This phone number already exists, change it or search for this user."}));
			  }
  
        });
	}
	
});

//add a new status
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
