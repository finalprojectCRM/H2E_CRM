//the libraries that not exsising fundamentally in node js
var http = require('http');
var url = require('url');
const fs = require('fs');
var node_mailer = require('nodemailer');
const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ReadPreference = require('mongodb').ReadPreference;
const ObjectId = require("mongodb").ObjectID;
const config = require('./mongo-config.json');

//the name of app
const APP_NAME = require('os').hostname();
//the port that the app running on it
const APP_PORT = 3000;

//the database and the collectios in mongodb
var database, contacts_collection, statuses_collection, users_collection ,files_collection, roles_with_statuses_collection , statuses_with_roles_collection , colors_collection;
var app = Express();
//The temp password that the adminstrator get with the system 
var firstTempPassword = "12345678";
//the email of the system
const SERVER_EMAIL = "h2e.crm@gmail.com"

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));


//create an approach to send emailes from the system by using node mailer library
var transporter = node_mailer.createTransport({
    service: 'gmail',
    auth: {
        user: SERVER_EMAIL,
        pass: 'H2E_CRM!@'
    }
});
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
			
			/*create all collections in mongo db*/
            database = client.db(db_name);
            contacts_collection = database.collection("contacts");
            statuses_collection = database.collection("statuses");
			users_collection = database.collection("users");
			files_collection = database.collection("files");
			roles_with_statuses_collection = database.collection("roles with statuses");
			statuses_with_roles_collection = database.collection("statuses with roles");
			colors_collection = database.collection("colors");

            console.log("Connected to `" + db_name + "`!");
            result = {
                "db_conn_string": conn_string
            };
  
            //only after a good connection to mongo db we can read the main page and send it to client
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
//get angular js
app.get("/bower_components/angular/angular.min.js", (request, response) =>{//bring the angular file
        console.log('--Rendering angular-js file--');
        fs.readFile('./bower_components/angular/angular.min.js', function (error, data) {
            if (error) {
                console.log('error has happand in angular.min.js', error)
            }
            response.writeHead(200, {"Content-Type": "text/javascript"});
            response.end(data);
        });
});
//get angular.min.js.map
app.get("/bower_components/angular/angular.min.js.map", (request, response) =>{//bring the angular file
        console.log('--Rendering angular-js file--');
        fs.readFile('./bower_components/angular/angular.min.js.map', function (error, data) {
            if (error) {
                console.log('error has happand in angular.min.js.map', error)
            }
            response.writeHead(200, {"Content-Type": "text/javascript"});
            response.end(data);
        });
});
//get select.js
app.get("/select.js", (request, response) =>{
        console.log('--Rendering select.js file--');
        fs.readFile('./lib/select.js', function (error, data) {
            if (error) {
                console.log('error has happand in select.js', error)
            }
            response.writeHead(200, {"Content-Type": "text/javascript"});
            response.end(data);
        });
});
//get select.css
app.get("/select.css", (request, response) =>{
        console.log('--Rendering select.css file--');
        fs.readFile('./lib/select.css', function (error, data) {
            if (error) {
                console.log('error has happand in select.css', error)
            }
            response.writeHead(200, {"Content-Type": "text/css"});
            response.end(data);
        });
});
//get angular


//get CSS of the system page
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


//get fullcalendar.css componnent 
app.get("/bower_components/fullcalendar/dist/fullcalendar.css", (request, response) =>{
        console.log('--Rendering fullcalendar.css file--');
        fs.readFile('./bower_components/fullcalendar/dist/fullcalendar.css', function (error, data) {
            if (error) {
                console.log('error has happand in fullcalendar.css', error)
            }
            response.writeHead(200, { 'Content-Type':"text/css" });
            response.end(data);
        });
});
//get datetimepicker.css componnent 
app.get("/datetimepicker.css", (request, response) =>{
        console.log('--Rendering datetimepicker.css file--');
        fs.readFile('./calendar/datetimepicker.css', function (error, data) {
            if (error) {
                console.log('error has happand in /datetimepicker.css', error)
            }
            response.writeHead(200, { 'Content-Type':"text/css" });
            response.end(data);
        });
});

//get moment.min.js componnent 
app.get("/bower_components/moment/min/moment.min.js", (request, response) =>{
        console.log('--Rendering moment.min.js file--');
        fs.readFile('./bower_components/moment/min/moment.min.js', function (error, data) {
            if (error) {
                console.log('error has happand in /moment.min.js', error)
            }
            response.writeHead(200, { 'Content-Type':"text/javascript" });
            response.end(data);
        });
});
//get calendar.js componnent 
app.get("/bower_components/angular-ui-calendar/src/calendar.js", (request, response) =>{
        console.log('--Rendering ui-calendar.js file--');
        fs.readFile('./bower_components/angular-ui-calendar/src/calendar.js', function (error, data) {
            if (error) {
                console.log('error has happand in /ui-calendar.js', error)
            }
            response.writeHead(200, { 'Content-Type':"text/javascript" });
            response.end(data);
        });
});
//get datetimepicker.js componnent 
app.get("/datetimepicker.js", (request, response) =>{
        console.log('--Rendering datetimepicker.js file--');
        fs.readFile('./calendar/datetimepicker.js', function (error, data) {
            if (error) {
                console.log('error has happand in /datetimepicker.js', error)
            }
            response.writeHead(200, { 'Content-Type':"text/javascript" });
            response.end(data);
        });
});
app.get("/bower_components/fullcalendar/dist/fullcalendar.min.js", (request, response) =>{
        console.log('--Rendering fullcalendar.min.js file--');
        fs.readFile('./bower_components/fullcalendar/dist/fullcalendar.min.js', function (error, data) {
            if (error) {
                console.log('error has happand in fullcalendar.min.js', error)
            }
            response.writeHead(200, { 'Content-Type':"text/javascript" });
            response.end(data);
        });
});
app.get("/bower_components/fullcalendar/dist/gcal.js", (request, response) =>{
        console.log('--Rendering gcal.js file--');
        fs.readFile('./bower_components/fullcalendar/dist/gcal.js', function (error, data) {
            if (error) {
                console.log('error has happand in gcal.js', error)
            }
            response.writeHead(200, { 'Content-Type':"text/javascript" });
            response.end(data);
        });
});

app.get("/bower_components/jquery/dist/jquery.min.js", (request, response) =>{
        console.log('--Rendering jquery.min.js file--');
        fs.readFile('./bower_components/jquery/dist/jquery.min.js', function (error, data) {
            if (error) {
                console.log('error has happand in jquery.min.js', error)
            }
            response.writeHead(200, { 'Content-Type':"text/javascript" });
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

/* a request that initialize the system when it empty*/

app.get("/firstSystemLoad", (request, response) =>{

        console.log("entered firstSystemLoad function");
		    
			//check if data exsist in statuses & roles & files collection
		   	check_exsisting_statuses_and_roles_and_files();

			
			users_collection.findOne({"UserName": "Admin"}).then(function(mongo_user) {
			if(!mongo_user)//Admin not yet in system = mongo db users_collection is empty
			{
				//insert to users collection the first user - Admin
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

/*
	this request verify if user that try to register to the system has a password that exsists only in adminstrator hands
*/

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
					//the user has a good password that changed by admin
					console.log("good password");
					response.writeHead(200, { 'Content-Type': 'application/json' });
					response.end(JSON.stringify({verified :true}));
				}
			}
				
			}).catch(function(err) {
			  response.send({error: err})
			})	
});

/*
	This request is to change the temporary password that the admin handle
*/

app.post("/changeTemporaryPassword", (request, response) =>{

        console.log("entered changeTemporaryPassword function");
		
			 var NewTempPassword = request.body.new_temp_password;
			 console.log("NewTempPassword: "+NewTempPassword);
			 //update in users_collection the filed TempPassword that exsist in admin with a new password
			 users_collection.update({"UserName": "Admin"}, { $set:{TempPassword: NewTempPassword.TempPassword}}, function(err, obj) {
                    if (err) throw err;
                    console.log("succssed changing temp password");

                });
			//response with ok 
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({"succsses" :"The temp password has been changed succssesfully"}));
			  
});

/*
  	This request is to verify the match between the current password of user to the given password
*/
app.post("/verificationCurrentPassword", (request, response) =>{

        console.log("entered verificationCurrentPassword function");
		
			 var logged_in_current_password = request.body.logged_in_current_password;
			 //try to find in user collection a user with a given username and password
			 users_collection.findOne({"UserName": logged_in_current_password.username,"Password":logged_in_current_password.current_password}).then(function(mongo_user) {
				 
				if(mongo_user==null)//no such username with this current password
				 {
					 console.log("entered if ");
					response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({"not_verified" :"The current password is incorrect, please try again."})); 
				 }
				 else//found the user that the username and the current password match
				 {
					console.log("entered else");
					response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({"verified" :true}));
				 }
			 });

            
			  
});

/*
	This request is to change the current password that of user
*/

app.post("/changeCurrentPassword", (request, response) =>{

        console.log("entered changeCurrentPassword function");
		
			 var logged_in_new_password = request.body.logged_in_new_password;
			 
			 //update in users_collection the the password of user with a new password 
			 users_collection.update({"UserName": logged_in_new_password.username},
			 {$set:{"Password":logged_in_new_password.new_password }}, function(err, obj) {
                     if (err) throw err;
					 //return ok
					 response.writeHead(200, { 'Content-Type': 'application/json' });
                     response.end(JSON.stringify({"success" :"The Password has been changed successesfully"}));
				
			 
			 });
});

/*
	This request is to add a new user to system
*/

app.post("/addUser", (request, response) =>{

        console.log("entered addUser function");
		var user = request.body.user;
		//user with his detailes : Role , UserName ,Name ,eMail,Password
		    user = {"Role":"new in the system","UserName":user.UserName,"Name":user.Name,"eMail":user.eMail,"Password":user.Password }
			//check if this username does not exsist in the system
			  users_collection.findOne({"UserName": user.UserName}).then(function(mongo_user) {
			  if(!mongo_user) 
			  { 
		       //if this username does not exsist in the system - add a new user with his detailes
				users_collection.insertOne(user, function(err, res) {
				if (err) throw err;
				 //return the user detailes with is_admin:false
				 response.writeHead(200, { 'Content-Type': 'application/json' });
                 response.end(JSON.stringify({"user" :{"Role": user.Role,"UserName":user.UserName,"Name":user.Name,
				  "eMail":user.eMail,"Password":user.Password ,is_admin:false}}));
				  });
			  }
  
			  else
			  {
				 //when the username already exsist with admin and his fileds did not fill
				 if(mongo_user.UserName=="Admin" && mongo_user.Name=="" && mongo_user.eMail=="" && mongo_user.Password=="")
				 {
					 //update the Admin empty detailes with a new detailes
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
					 //if the username already exsists and he is not the Admin
					 response.writeHead(200, { 'Content-Type': 'application/json' });
					 response.end(JSON.stringify({user_exists :"This user name already exists."}));
				 }
			  }
  
        }).catch(function(err) {
			  response.send({error: err})
			});
});


/*
	This request is to login to the system
*/
app.post("/login", (request, response) => {

        console.log("entered login function");
		 var user = request.body.LoginUser;
		  console.log(user.UserName);
			  //check if the username and the password exsist
			  users_collection.findOne({"UserName": user.UserName,"Password":user.Password}).then(function(result) {
			  //if no match
			  if(!result) 
			  {  
		        console.log("no match!");
				response.writeHead(200, { 'Content-Type': 'application/json' });
				//post a response with The user name or password is incorrect. Try again.
                response.end(JSON.stringify({no_match :"The user name or password is incorrect. Try again."}));
			  }
  
			  else
			  {
				 //if there is matching
				 console.log(result.Name);
                 response.writeHead(200, { 'Content-Type': 'application/json' });
				 //check if the user is admin and return a user detailes with "adminUser":true
				 if(result.UserName == "Admin")
				 {
					 response.end(JSON.stringify({user_login :{"adminUser":true,"Role":result.Role,"UserName":result.UserName, "Name":result.Name,
				   "eMail":result.eMail,"Password":result.Password}}));
				 }
				 //if the user is not admin rturn user datailes
				 else
                 {
					 response.end(JSON.stringify({user_login :result}));
				 }
			  }
  
        }).catch(function(err) {
			  response.send({error: err})
			});
});

/*
	This request is to contact only if the contact does not exsist
*/
app.post("/addContact", (request, response) =>{
    console.log("addContact FUNCTION");
        //add new contact 
            var contact = request.body.contact;
            console.log("contact: " + contact.History);
			
			//check if the contact is already exsist by the key - the PhoneNumber
			contacts_collection.findOne({"PhoneNumber": contact.PhoneNumber}).then(function(result) {
				
			  if(!result) {
			   //if this contact does not exsist in the system - add a new contact with his detailes
				contacts_collection.insertOne(
				{"Name": contact.Name ,  "Category":contact.Category, "Status":contact.Status,"PhoneNumber": contact.PhoneNumber, "eMail" : contact.eMail ,"Address" : contact.Address , History:contact.History} , function(err, res){
				 if (err) throw err;});
				
				 
				
				 response.end();
			  }
			  //check if the contact already exsists
			  else
			  {
                 response.writeHead(200, { 'Content-Type': 'application/json' });
				 //response with eror massage
                 response.end(JSON.stringify({"phone_exists" :"ERROR : this phone number already exists, change it or search for this user."}));
			  }
			  
			

			}).catch(function(err) {
			  response.send({error: err})
			})



});

/*
	This request is to get the list of contacts
*/
app.get("/getContacts", (request, response) =>{

        console.log("entered getContacts function");
		//enter all members of contacts_collection to array
        contacts_collection.find({}).toArray((error, result) => {
            if(error) {
                return response.status(500).send(error);
            }
			//response with ok, and with the contacts list
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({"contacts" :result}));
    });

});

/*
	This request is to get the list of files
*/
app.get("/getFiles", (request, response) =>{

        console.log("entered getFiles function");
		//enter all members of contacts_collection to array
        files_collection.find({}).toArray((error, result) => {
            if(error) {
                return response.status(500).send(error);
            }
			//response with ok, and with the contacts list

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({"files" :result}));
    });

});

/*
	This request is to get the list of users
*/
app.post("/getUsers", (request, response) =>{
	
		console.log("entered getUsers function");
		var status_flag = request.body.status_flag;
				console.log("status_flag : " + status_flag);
				
        //if reguest is to get the users for the delete user
		if(status_flag == "deleteUser")
		{
			console.log("entered if with : " + status_flag);
			//get the user list without the administrator
			users_collection.find({UserName: { $ne: "Admin" }}).toArray((error, result) => {
            if(error) {
                return response.status(500).send(error);
            }
			//response with ok, and with the users list
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({"deleteUser":true,"users" :result}));
			});
		}
		 //if reguest is to get the users for show user

		else if(status_flag == "showUsers")
		{
			//enter all members of users_collection to array
			users_collection.find({}).toArray((error, result) => {
            if(error) {
                return response.status(500).send(error);
            }
			//response with ok, and with the users list
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({"showUsers":true,"users" :result}));
			});

		}

        
        

});
/*
	This request is to delete contact
*/
app.post("/deleteContact", (request, response) =>{
    console.log("entered deleteContact function");
	        //the contact to delete with his detailes
            var contact_to_delete = request.body.contact;
            console.log("contact_to_delete :"+ contact_to_delete);
			//delete the contact from contacts collection by his all detailes
                contacts_collection.deleteOne({"Name":contact_to_delete.Name ,"Status" : contact_to_delete.Status , "PhoneNumber":contact_to_delete.PhoneNumber ,"eMail" : contact_to_delete.eMail ,"Address" : contact_to_delete.Address }, function(err, obj) {
                    if (err) throw err;
                    console.log("1 document deleted");

                });
            response.writeHead(200, { 'Content-Type': 'application/json' });
			//response with ok
            response.end();
});

/*
	This request is to delete file
*/
app.post("/deleteFile", (request, response) =>{
    console.log("entered deleteContact function");
            var file_to_delete = request.body.file;
                files_collection.deleteOne({"FileName":file_to_delete.FileName}, function(err, obj) {
                    if (err) throw err;
                    console.log("1 document deleted");

                });
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end();
});

/*
	This request is to get the statuses list
*/
app.get("/getStatusOptions", (request, response) =>{
    console.log("entered getStatusOptions function");
	//enter all members of statuses_collection to array
    statuses_collection.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
		//response with ok, and with the statuses list
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({"statusOptions" :result}));
    });
});

/*
	This request is to get the roles (every role with his statuses) list
*/
app.get("/getRoles",(request, response) =>{
    //enter all members of roles_with_statuses_collection to array
	roles_with_statuses_collection.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
		//response with ok, and with the roles list
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({"roles" :result}));
    });
	
});

/*
	This request is to get the colors of roles list
*/
app.get("/getRolesColors",(request, response) =>{
	//enter all members of colors_collection to array
	colors_collection.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
		//response with ok, and with the colors list
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({"colors" :result}));
    });
	
});
/*
	This request is add a new status with an appropriate roles
*/
app.post("/addStatutsWithRoles", (request, response) =>{
	
     var status_with_roles = request.body.status_with_roles;
	 console.log("before updateOne");
	 //add a new add a new status with an appropriate roles only if the status does not exsist
	 statuses_with_roles_collection.updateOne( { Status:status_with_roles.Status },
	  { $setOnInsert:{ Status:status_with_roles.Status , Roles:status_with_roles.Roles } },
        { upsert: true }
		,function(err, res) {
     console.log("after updateOne");
	 });
	 
	     console.log("status_with_roles.Roles: "+ status_with_roles.Roles);

	 //go through of all roles
	 for (let role of status_with_roles.Roles) {
		 console.log("role: "+ role);
		 //add to role a new status
		  roles_with_statuses_collection.updateOne( { Role : role }
		 ,{$addToSet: {Statuses: status_with_roles.Status} },
			function(err, res) {
		 console.log("after updateOne");
		 });
  
     }   
	//add to the statuses list a new status
    statuses_collection.updateOne(
        {"Status": status_with_roles.Status},
        { $setOnInsert:{"Status": status_with_roles.Status} },
        { upsert: true }
    )
	//response with ok
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end();
});

/*
	This request is add a new role with an appropriate statuses
*/
app.post("/addRoleWithStatuses", (request, response) =>{
	
     var role_with_statuses = request.body.role_with_statuses;
	 console.log("before updateOne");
	 //insert to the colors list the role color 
	 colors_collection.insertOne({Color:role_with_statuses.Color});
	 //add a new add a new role with an appropriate statuses only if the role does not exsist
	 roles_with_statuses_collection.updateOne( { Role:role_with_statuses.Role }
	 ,{ $setOnInsert:{ Role:role_with_statuses.Role ,Color:role_with_statuses.Color, Statuses:role_with_statuses.Statuses } },
        { upsert: true },
		function(err, res) {
     console.log("after updateOne");
	 });
	  
	  	 //go through of all statuses
		  for (let status of role_with_statuses.Statuses) 
		  {
			 //check if the status does not "add a new status" or "-- Choose status --"
			if(status!="add a new status" && status!="-- Choose status --")
			{
			 console.log("status: "+ status);
			 //add the to status a new role
			  statuses_with_roles_collection.updateOne( { Status : status }
			 ,{$addToSet: {Roles: role_with_statuses.Role} },{ upsert: true },
				function(err, res) {
			 console.log("after updateOne");
			 });
	  
			} 
	     }
		 //response with ok
		 response.writeHead(200, { 'Content-Type': 'application/json' });
		 response.end();
});
/*
	This request is to update role with new statuses
*/
app.post("/updateRole", (request, response) =>{
	//the role to update
     var role_to_update = request.body.role_to_update;
	 //the appropriate statuses to role
	 statuses = role_to_update.Statuses;
	 console.log("before updateOne");
	 //update the role with new statuses
	 roles_with_statuses_collection.updateOne( { Role:role_to_update.Role }
	 ,{$addToSet: {Statuses:{$each :statuses}} },
	  function(err, res) {
     console.log("after updateOne");
	 });
	 //go through statuses
	  for (let status of role_to_update.Statuses) {
		  //check if the status does not "add a new status" or "-- Choose status --"
		 if(status!="add a new status" && status!="-- Choose status --")
		 {
			 console.log("status: "+ status);
			 console.log("type of status: "+ typeof status);
			 //update the status with new role
			  statuses_with_roles_collection.updateOne({ Status:status}
			 ,{$addToSet: {Roles: role_to_update.Role} },
				function(err, res) {
			 console.log("after updateOne");
			 });
		 }
  
     } 
});


/*
 This function is to check if the collections : statuses , roles and files are empty
*/
function check_exsisting_statuses_and_roles_and_files()
{
	console.log("check_exsisting_statuses_and_roles FUNCTION");
	
	//count the documents in statuses collection
	statuses_collection.countDocuments(function (err, count) {
	//if the collection does not have documents
    if (!err && count === 0) {
		 console.log("no statuses");
		 
		//insert the statuses : "-- Choose status for role --","בעיה טכנית"
         //statuses_collection.insertOne({"Status":"-- Choose status for role --"});
         statuses_collection.insertOne({"Status":"בעיה טכנית"});
    }
});
	
    //count the documents in roles_with_statuses_collection
    roles_with_statuses_collection.countDocuments(function (err, count) {
    if (!err && count === 0) 
	{
		console.log("no roles");
		//insert the role : "-- Choose category for role --"
		 //roles_with_statuses_collection.insertOne({Role:"-- Choose category for role --"});
		 //insert the roles: "תמיכה טכנית" with statuses: : "-- Choose status for role --","בעיה טכנית" ,,"add a new status" and color:#66ffff"
         roles_with_statuses_collection.insertOne({Role:"תמיכה טכנית",Color:"#66ffff",Statuses:["בעיה טכנית","add a new status"]});
		 //insert the color:#66ffff" to colors_collection
		 colors_collection.insertOne({Color:"#66ffff"});

    }
	});
   //count the documents in statuses_with_roles_collection
	statuses_with_roles_collection.countDocuments(function (err, count) {
    if (!err && count === 0) {
		console.log("no statuses");
		//insert the statuses : "-- Choose status for role --","בעיה טכנית"
		 //statuses_with_roles_collection.insertOne({Status:"-- Choose status for role --"});
         statuses_with_roles_collection.insertOne({Status:"בעיה טכנית",Roles:["תמיכה טכנית"]});
    }
});
		
}
/*
	update contact detailes only with phone number that does not exsist in the system
*/
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
				 contacts_collection.updateOne({ PhoneNumber:contact_after_update_body.PhoneNumber}
				 ,{$addToSet: {History: contact_after_update_body.History}},
					function(err, res) {
				 console.log("after updateOne");
				 });
				
				
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
				contacts_collection.updateOne(contact_before_update, contact_after_update ,function(err, res) {
				if (err) throw err;
				contacts_collection.updateOne({ PhoneNumber:contact_after_update_body.PhoneNumber}
				 ,{$addToSet: {History: contact_after_update_body.History}},
					function(err, res) {
				 console.log("after updateOne");
				 });
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
			var statuses,roles_statuses,statuses_roles;
			
            console.log("status_to_delete:"+status_to_delete);
			statuses_collection.deleteOne({"Status":status_to_delete}, function(err, obj) {
				if (err) throw err;
				console.log("1 status deleted");
				 statuses_collection.find({}).toArray((error, result) => {
					if(error) {
						return response.status(500).send(error);
					}
					statuses = result;
				});
				statuses_with_roles_collection.deleteOne({"Status":status_to_delete}, function(err, obj) {
				if (err) throw err;
				console.log("1 status deleted");
				 statuses_with_roles_collection.find({}).toArray((error, result) => {
					if(error) {
						return response.status(500).send(error);
					}
					statuses_roles = result;
				});
				});
				roles_with_statuses_collection.updateMany({}, {$pull: {Statuses: {$in:[status_to_delete]}}  }, function(err, obj) {
				if (err) throw err;
				console.log("1 status was deleted from role ");
					roles_with_statuses_collection.find({}).toArray((error, roles_statuses) => {
					if(error) {
						return response.status(500).send(error);
					}
					
					 roles_statuses = roles_statuses;
					
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
	
	statuses_with_roles_collection.updateMany({}, {$pull: {Roles: {$in:[role_to_delete]}}  }, function(err, obj) {
		if (err) throw err;
		console.log("1 status was deleted from role ");
			statuses_with_roles_collection.find({}).toArray((error, roles_statuses) => {
			if(error) {
				return response.status(500).send(error);
			}
			
			 roles_statuses = roles_statuses;
			
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
					//console.log("#########################file_data############################"+file_data);

					
					// writeFile function with filename, content and callback function
					fs.writeFile(new_file_name,file_data, function (err) {
					if (err) throw err;
					console.log('File is created successfully.');
					response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end();
				}); 
               }
            }
         }
      }
   }
	files_collection.insertOne({"FileName":new_file_name});
});



app.post("/sendEmail", (request, response) => {
    console.log("sendEmail");
    let email_data = request.body.email_data;

    let mailOptions = {
        from: SERVER_EMAIL,
        to: email_data.mail_recipient,
        subject: email_data.mail_subject,
        text: email_data.mail_text
    };

    if (email_data.attachment_file_name){
        mailOptions.attachments = [{path: './uploaded_files/' + email_data.attachment_file_name}]
    }

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'mail failed to be sent to ' +  email_data.mail_recipient}));
        } else {
            console.log('Email sent: ' + info.response);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ ok: 'mail has been sent successfully to ' +  email_data.mail_recipient}));
        }
    });
});


