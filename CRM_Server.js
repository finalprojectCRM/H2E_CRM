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
var firstTempPassword = "12345678";

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
			files_collection = database.collection("files");
			roles_with_statuses_collection = database.collection("roles with statuses");
			statuses_with_roles_collection = database.collection("statuses with roles");


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
		   	check_exsisting_statuses_and_roles();

			
			users_collection.findOne({"UserName": "Admin"}).then(function(mongo_user) {
			if(!mongo_user)//Admin not yet in system = mongo db users_collection is empty
			{
				users_collection.insertOne(
                {"UserName": "Admin" ,"Role":"Administrator","Name":"",
				  "eMail":"","Password":"", "TempPassword": firstTempPassword } , function(err, res){
                if (err) throw err;});
				response.writeHead(200, {'Content-Type': 'application/json' });
				response.end(JSON.stringify({"admin_first_load" : true }));//Admin has been loaded first time to mongodb
			}
			else//there is a user in system and Admin exists = mongo db users_collection is not empty
			{
				if(mongo_user.UserName=="Admin" && mongo_user.Name=="" && mongo_user.eMail=="" && mongo_user.Password=="")
				{
					if(mongo_user.TempPassword == firstTempPassword)//admin did not yet change the temp password that he got from system
					{
						response.writeHead(200, { 'Content-Type':'application/json' });
						response.end(JSON.stringify({"admin_changed_temp_password" : false }));
					}
					else//admin changed temp password that he got from system
					{
						response.writeHead(200, { 'Content-Type':'application/json' });
						response.end(JSON.stringify({"admin_changed_temp_password" : true }));//go to registation page with admin
					}
					
				}
				else//Admin has filled in all his details
				{
					response.writeHead(200, { 'Content-Type': 'application/json' });
					response.end(JSON.stringify({"admin_exists_with_details" : true }));
				}				
				
			}

			}).catch(function(err) {
			  response.send({error: err})
			})

});

app.post("/verifyTemporaryPassword", (request, response) =>{

        console.log("entered verifyTemporaryPassword function");
		var tempPassword = request.body.tempPassword;
		users_collection.findOne({"UserName": "Admin"}).then(function(mongo_user) {
			
			if(mongo_user.TempPassword != tempPassword)//not correct temp password
			{
				console.log("!result not a password"); 
				response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({not_verified :"You don't have a correct temporary password , Please get it from the administrator"}));
			}
			else
			{
				if(mongo_user.UserName=="Admin" && mongo_user.Name=="" && mongo_user.eMail=="" && mongo_user.Password=="")
				{
					if(mongo_user.TempPassword == firstTempPassword)//admin did not yet change the temp password that he got from system
					{
						response.writeHead(200, { 'Content-Type':'application/json' });
						response.end(JSON.stringify({"admin_changed_temp_password" : false }));
					}
					else//admin changed temp password that he got from system
					{
						response.writeHead(200, { 'Content-Type':'application/json' });
						response.end(JSON.stringify({"admin_changed_temp_password" : true }));//go to registation page with admin
					}
				}
				else
				{
					console.log("good password");
					response.writeHead(200, { 'Content-Type': 'application/json' });
					response.end(JSON.stringify({verified :true}));
				}
			}
				
			}).catch(function(err) {
			  response.send({error: err})
			})	
});

app.post("/changeTemporaryPassword", (request, response) =>{

        console.log("entered changeTemporaryPassword function");
		
			 var NewTempPassword = request.body.new_temp_password;
			 console.log("NewTempPassword: "+NewTempPassword);
			 users_collection.update({"UserName": "Admin"}, { $set:{TempPassword: NewTempPassword.TempPassword}}, function(err, obj) {
                    if (err) throw err;
                    console.log("succssed changing temp password");

                });
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({"succsses" :"The temp password has been changed succssesfully"}));
			  
});

app.post("/verificationCurrentPassword", (request, response) =>{

        console.log("entered verificationCurrentPassword function");
		
			 var logged_in_current_password = request.body.logged_in_current_password;
			 users_collection.findOne({"UserName": logged_in_current_password.username,"Password":logged_in_current_password.current_password}).then(function(mongo_user) {
				 
				if(mongo_user==null)//no such username with this current password
				 {
					 console.log("entered if ");
					response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({"not_verified" :"The current password is incorrect, please try again."})); 
				 }
				 else//fount the user that the username and the current password match
				 {
					console.log("entered else");
					response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({"verified" :true}));
				 }
			 });

            
			  
});

app.post("/changeCurrentPassword", (request, response) =>{

        console.log("entered changeCurrentPassword function");
		
			 var logged_in_new_password = request.body.logged_in_new_password;
			 users_collection.update({"UserName": logged_in_new_password.username},
			 {$set:{"Password":logged_in_new_password.new_password }}, function(err, obj) {
                     if (err) throw err;
					 response.writeHead(200, { 'Content-Type': 'application/json' });
                     response.end(JSON.stringify({"success" :"The Password has been changed successesfully"}));
				
			 
			 });
});

app.post("/addUser", (request, response) =>{

        console.log("entered addUser function");
		var user = request.body.user;
		    user = {"Role":"new in the system","UserName":user.UserName,"Name":user.Name,"eMail":user.eMail,"Password":user.Password }
			  users_collection.findOne({"UserName": user.UserName}).then(function(mongo_user) {
			  if(!mongo_user) 
			  {
				users_collection.insertOne(user, function(err, res) {
				if (err) throw err;
				
				 response.writeHead(200, { 'Content-Type': 'application/json' });
                 response.end(JSON.stringify({"user" :{"Role": user.Role,"UserName":user.UserName,"Name":user.Name,
				  "eMail":user.eMail,"Password":user.Password ,is_admin:false}}));
				  });
			  }
  
			  else
			  {
				  
				 if(mongo_user.UserName=="Admin" && mongo_user.Name=="" && mongo_user.eMail=="" && mongo_user.Password=="")
				 {
					 users_collection.update({"UserName": "Admin"}, { $set:{"Role":"Administrator", "Name":user.Name,
				     "eMail":user.eMail,"Password":user.Password}}, function(err, obj) {
                     if (err) throw err;
					 
					 response.writeHead(200, { 'Content-Type': 'application/json' });
                     response.end(JSON.stringify({"user" :{"Role":"Administrator","UserName":user.UserName, "Name":user.Name,
				     "eMail":user.eMail,"Password":user.Password ,is_admin: true}}));
                     console.log("admin register");
					 

                });
				 }
				 else
				 {
					 response.writeHead(200, { 'Content-Type': 'application/json' });
					 response.end(JSON.stringify({user_exists :"This user name already exists."}));
				 }
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
					 response.end(JSON.stringify({user_login :{"adminUser":true,"Role":result.Role,"UserName":result.UserName, "Name":result.Name,
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
                {"Name": contact.Name ,  "Category":contact.Category, "Status":contact.Status,"PhoneNumber": contact.PhoneNumber, "eMail" : contact.eMail ,"Address" : contact.Address} , function(err, res){
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

//get the list of users
app.post("/getUsers", (request, response) =>{
	
		console.log("entered getUsers function");
		console.log("status_flag : " + status_flag);
		var status_flag = request.body.status_flag;
		if(status_flag == "deleteUser")
		{
			users_collection.find({UserName: { $ne: "Admin" }}).toArray((error, result) => {
            if(error) {
                return response.status(500).send(error);
            }
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({"deleteUser":true,"users" :result}));
			});
		}
		else if(status_flag == "showUsers")
		{
			users_collection.find({}).toArray((error, result) => {
            if(error) {
                return response.status(500).send(error);
            }
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({"showUsers":true,"users" :result}));
			});

		}

        
        

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
//roles_with_statuses_collection.find().pretty();
    statuses_collection.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({"statusOptions" :result}));
    });
});


app.get("/getRoles",(request, response) =>{
	
	roles_with_statuses_collection.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({"roles" :result}));
    });
	
});
app.post("/addStatutsWithRoles", (request, response) =>{
	
     var status_with_roles = request.body.status_with_roles;
	 console.log("before updateOne");
	 statuses_with_roles_collection.updateOne( { Status:status_with_roles.Status },
	  { $setOnInsert:{ Status:status_with_roles.Status , Roles:status_with_roles.Roles } },
        { upsert: true }
		,function(err, res) {
     console.log("after updateOne");
	 });
	 
	 roles_with_statuses_collection.updateMany( { Role : status_with_roles.Roles }
	 ,{$addToSet: {Statuses: status_with_roles.Status} },
		function(err, res) {
     console.log("after updateOne");
	 });
	 
    statuses_collection.updateOne(
        {"Status": status_with_roles.Status},
        { $setOnInsert:{"Status": status_with_roles.Status} },
        { upsert: true }
    )
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end();
});

app.post("/addRoleWithStatuses", (request, response) =>{
	
     var role_with_statuses = request.body.role_with_statuses;
	 console.log("before updateOne");
	 roles_with_statuses_collection.updateOne( { Role:role_with_statuses.Role }
	 ,{ $setOnInsert:{ Role:role_with_statuses.Role , Statuses:role_with_statuses.Statuses } },
        { upsert: true },
		function(err, res) {
     console.log("after updateOne");
	 });
});

function check_exsisting_statuses_and_roles()
{
	console.log("check_exsisting_statuses_and_roles FUNCTION");
	
	statuses_collection.countDocuments(function (err, count) {
    if (!err && count === 0) {
		 console.log("no statuses");
         statuses_collection.insertOne({"Status":"-- Choose status for role --"});
         statuses_collection.insertOne({"Status":"בעיה טכנית"});
    }
});

    roles_with_statuses_collection.countDocuments(function (err, count) {
    if (!err && count === 0) {
		console.log("no roles");
		 roles_with_statuses_collection.insertOne({Role:"-- Choose category for role --"});
         roles_with_statuses_collection.insertOne({Role:"תמיכה טכנית",Statuses:["-- Choose status --","בעיה טכנית"]});
    }
});
		
}

//update contact detailes only with phone number that does not exsist in the system
app.post("/updateContact", (request, response) =>{
//update contact
    console.log("updateContact FUNCTION");
    var contact_before_update_body = request.body.contact_before_update;
    var contact_after_update_body = request.body.updated_contact;
    contact_before_update = {"Name":contact_before_update_body.Name ,"Category" : contact_before_update_body.Category , "Status" : contact_before_update_body.Status , "PhoneNumber":contact_before_update_body.PhoneNumber ,"eMail" : contact_before_update_body.eMail ,"Address" : contact_before_update_body.Address };
   
	if(contact_after_update_body.PhoneNumber == contact_before_update_body.PhoneNumber)
	{
		contact_after_update = { $set: {"Name":contact_after_update_body.Name ,"Category" : contact_after_update_body.Category ,"Status" : contact_after_update_body.Status , "PhoneNumber":contact_after_update_body.PhoneNumber ,"eMail" : contact_after_update_body.eMail ,"Address" : contact_after_update_body.Address } };
				contacts_collection.updateOne(contact_before_update, contact_after_update, function(err, res) {
				if (err) throw err;
				contacts_collection.find({}).toArray((error, result) => {
					if(error) {
						return response.status(500).send(error);
					}
					response.writeHead(200, { 'Content-Type': 'application/json' });
					response.end(JSON.stringify({"contacts" :result}));
				});
			    });
	}
	else
	{
		contacts_collection.findOne({"PhoneNumber": contact_after_update_body.PhoneNumber}).then(function(result) {
			  if(!result) 
			  {
				contact_after_update = { $set: {"Name":contact_after_update_body.Name ,"Category" : contact_after_update_body.Category,"Status" : contact_after_update_body.Status , "PhoneNumber":contact_after_update_body.PhoneNumber ,"eMail" : contact_after_update_body.eMail ,"Address" : contact_after_update_body.Address } };
				contacts_collection.updateOne(contact_before_update, contact_after_update, function(err, res) {
				if (err) throw err;
				contacts_collection.find({}).toArray((error, result) => {
					if(error) {
						return response.status(500).send(error);
					}
					response.writeHead(200, { 'Content-Type': 'application/json' });
					response.end(JSON.stringify({"contacts" :result}));
				});

				  });
			  }
			  else
			  {
                 response.writeHead(200, { 'Content-Type': 'application/json' });
                 response.end(JSON.stringify({"phone_exists" :"This phone number already exists, change it or search for this user."}));
			  }
  
        });
	}
	
});//update contact detailes only with phone number that does not exsist in the system
app.post("/updateUser", (request, response) =>{
//update contact
    console.log("update users FUNCTION");
    var user_before_update_body = request.body.user_before_update;
    var user_after_update_body = request.body.updated_user;
    user_before_update = {Role:user_before_update_body.Role,UserName:user_before_update_body.UserName, Name:user_before_update_body.Name, eMail:user_before_update_body.eMail};
   
	
	user_after_update = { $set: {Role:user_after_update_body.Role,UserName:user_after_update_body.UserName, Name:user_after_update_body.Name, eMail:user_after_update_body.eMail}};
	users_collection.updateOne(user_before_update, user_after_update, function(err, res) {
	if (err) throw err;
	users_collection.find({}).toArray((error, result) => {
		if(error) {
			return response.status(500).send(error);
		}
		response.writeHead(200, { 'Content-Type': 'application/json' });
		response.end(JSON.stringify({"showUsers":true,"users" :result}));
		});
	});	
});


app.get("/deleteAllContacts", (request, response) =>{
	
	contacts_collection.remove({},function(err, obj) {
		 if (err) throw err;
		 response.writeHead(200, { 'Content-Type': 'application/json' });
		 response.end(JSON.stringify({"message":"All contacts have been deleted from the system"}));

	});
       
});

app.get("/deleteAllUsers", (request, response) =>{
	
	users_collection.remove({UserName: { $ne: "Admin" } },function(err, obj) {
		 if (err) throw err;
		 response.writeHead(200, { 'Content-Type': 'application/json' });
		 response.end(JSON.stringify({"message":"All users have been deleted from the system"}));

	});

});


app.post("/deleteStatusFromRole", (request, response) =>{
//add new contact
    console.log("entered deleteStatusFromRole function");
        var status_to_delete = request.body.status_to_delete;
		console.log("status_to_delete.Role " + status_to_delete.Role);
		console.log("status_to_delete.Status "+ status_to_delete.Status);
        var Status =  status_to_delete.Status;
		
		
        roles_with_statuses_collection.updateOne({Role:status_to_delete.Role}, {$pull: { Statuses: Status } } , function(err, obj) {
		if (err) throw err;
		console.log("1 status was deleted from role ");
			roles_with_statuses_collection.find({}).toArray((error, result) => {
			if(error) {
				return response.status(500).send(error);
			}
			response.writeHead(200, { 'Content-Type': 'application/json' });
			response.end(JSON.stringify({"roles" :result}));
			});
		});

	
});



app.post("/deleteStatusFromSystem", (request, response) =>{
//add new contact
    console.log("entered deleteStatusFromSystem function");
            var status_to_delete = request.body.status_to_delete;
			
            console.log("status_to_delete:"+status_to_delete);
			statuses_collection.deleteOne({"Status":status_to_delete}, function(err, obj) {
				if (err) throw err;
				console.log("1 status deleted");
				 statuses_collection.find({}).toArray((error, statuses) => {
					if(error) {
						return response.status(500).send(error);
					}
					var statuses = statuses;
				});
				roles_with_statuses_collection.updateOne({}, {$pull: { Statuses: status_to_delete } } , function(err, obj) {
				if (err) throw err;
				console.log("1 status was deleted from role ");
					roles_with_statuses_collection.find({}).toArray((error, roles_statuses) => {
					if(error) {
						return response.status(500).send(error);
					}
					
					var roles_statuses = roles_statuses;
					
					});
				});

             });
			 
			 response.writeHead(200, { 'Content-Type': 'application/json' });
			 response.end(JSON.stringify({"statuses" :statuses,"roles":roles_statuses}));
			
});

app.post("/deleteUser", (request, response) =>{
//add new contact
    console.log("entered deleteUser function");
            var user_to_delete = request.body.username;
			
            console.log("user_to_delete:"+user_to_delete+"check");
              users_collection.findOne({"UserName":user_to_delete}).then(function(result) {
			  if(!result) {
				console.log("did not find user to delete ");
			  }
			  //check if the contact already exsists
			  else
			  {
				  users_collection.deleteOne({"UserName":result.UserName}, function(err, obj) {
                    if (err) throw err;
                    console.log("1 user deleted");
						users_collection.find({}).toArray((error, result) => {
						if(error) {
							return response.status(500).send(error);
						}
						response.writeHead(200, { 'Content-Type': 'application/json' });
						response.end(JSON.stringify({"showUsers":true,"users" :result}));
						});
                });
				
                 console.log("User name that found "+result.UserName);
			  }
			  
			

			}).catch(function(err) {
			  response.send({error: err})
			})
});
app.post("/deleteRole", (request, response) =>{
//add new contact
    console.log("entered deleteRole function");
	var role_to_delete = request.body.role;
	
    console.log("role_to_delete:"+role_to_delete);
	 
	roles_with_statuses_collection.deleteOne({Role:role_to_delete}, function(err, obj) {
		if (err) throw err;
		console.log("1 user deleted");
			roles_with_statuses_collection.find({}).toArray((error, result) => {
			if(error) {
				return response.status(500).send(error);
			}
			response.writeHead(200, { 'Content-Type': 'application/json' });
			response.end(JSON.stringify({"roles" :result}));
			});

	});
});

app.post("/deleteStatus", (request, response) =>{
//add new contact
    console.log("entered deleteStatus function");
            var status_to_delete = request.body.Status;
                statuses_collection.deleteOne({"Status":status_to_delete}, function(err, obj) {
                    if (err) throw err;
                    console.log("1 status deleted");

                });
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end();
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
app.post("/uploadImage", (request, response) =>{
	var new_file_name = request.body.fileName;
	var new_file_data = request.body.uploadData;

	console.log("entered uploadImage");
	console.log(new_file_name);
	//console.log(new_file_data);

	//console.log(new_file.uploadData);
	
	
	if (new_file_name != null && new_file_data != null)
   {
      if (new_file_data.length > 0)
      {
         var splitData = new_file_data.split(";");
         if (splitData != null && splitData.length == 2)
         {
           // var mediaType = splitData[0];
           
            if (splitData[1] != null && splitData[1].length > 0)
            {
               var splitAgain = splitData[1].split(",");//holds the data
               if (splitAgain != null && splitAgain.length == 2)
               {
					//var encodingType = splitAgain[0];
					//console.log(encodingType);
					var fileData = splitAgain[1];

					let buff = new Buffer(fileData, 'base64');
					//console.log("#########################buff############################"+buff);
					//buff = Buffer.from(fileData, 'base64'); 
					let file_data = buff.toString('ascii');
					console.log("#########################file_data############################"+file_data);

					
					// writeFile function with filename, content and callback function
					fs.writeFile(new_file_name,file_data, function (err) {
					if (err) throw err;
					console.log('File is created successfully.');
				}); 
               }
            }
         }
      }
   }
	files_collection.insertOne({"FileName":new_file_name,"Data":new_file_data});

   
});

