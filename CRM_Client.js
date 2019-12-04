(function() {
var app = angular.module("CRM", []);
	app.controller('CRM_controller', ['$scope','$http','$log', function($scope, $http,$log) {	

	var contact_before_update;
	var MAX_LETTERS_IN_NAME = 25;
	var MAX_LETTERS_IN_ADDRESS = 35;
    var new_status_option = "add a new status";
	var temp_password_from_server ;
	$scope.PhoneNumber_before_update = undefined;
	
	$scope.click = false;
	$scope.menu = false;
	$scope.show_calendar = false;
    $scope.show_contacts = false;
	$scope.show_update_input = false;
	$scope.check_phone_enable = false;
	$scope.show_update_expression = false;
	$scope.get_new_contact_details = false;
	$scope.login_page = false;
	$scope.register_page = false;
	$scope.admin_page = false;
	$scope.first_load = false;
	

	$scope.contactsInfo=[];
	$scope.options=[];

	$http({method : "GET",
			url : "firstSystemLoad"
		  }).then(function(response) {		  		  
			  tempPassword =  response.data.tempPassword;
			  $log.log("tempPassword: " + tempPassword);

			  
			  $scope.first_load = true;	
			  $scope.temp_password_page = true;
			  
			  //$scope.register_page = true;
			  //$scope.UserName = "Admin";
			}, function (response) {
    });
	
	
    $scope.validation_of_temp_password = function(tempPasswordFromClient)
	{
		$http.post("http://localhost:3000/verifyTemporaryPassword", {
			tempPassword: tempPasswordFromClient,
		}).then(
			function (response) {//success callback
			    if(response.data.verified == true)
				{
					$scope.register_page = true;
				}
				else
				{
					$scope.message = response.data.not_verified;
					$scope.message_type = "ERROR";
					angular.element(Message_Modal).modal("show");
				}
			},
			function (response) {//failure callback
			    
			}	
		);		
	}
	

	$scope.signUp=function()
	{//user sign up,check and register 
	
	    var re_username = /^[a-zA-Z]{3,10}$/;
		var re_name = /^[a-zA-Z\s\u0590-\u05fe]{2,20}$/;
		if($scope.registration_user_name==undefined ||!re_username.test($scope.registration_user_name)){
		    $scope.message = "User name must contain only English letters ,minimum 3 leterrs and maximum 10 letters and no whitespace";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		if($scope.registration_name==undefined ||!re_name.test($scope.registration_name)){
			$scope.message = "The name must contain only English or Hebrew letters ,minimum 2 leterrs and maximum 20 letters ";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		var re_email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if($scope.registration_email==undefined || !re_email.test($scope.registration_email)){//check the email
			$scope.message = "This email is invalid ";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		var re_password = /^((?!.*[\s])(?=.*[A-Z])(?=.*\d))(?=.*?[#?!@$%^&*-]).{8,15}$/;
		if($scope.registration_password==undefined || !re_password.test($scope.registration_password)){//check the length of the password
			$scope.message = "The password must contain at least 8 to 15 characters , at least : one capital letter, one small letter, one number, and one of the following special characters: #?! @ $% ^ & * -";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		if($scope.registration_password!=$scope.registration_validation_password){//check if the two password equals
			$scope.message = "The two passwords do not match";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			$scope.registration_password=$scope.registration_validation_password=undefined;
			return;
		}
		var user={UserName:$scope.registration_user_name, Name:$scope.registration_name,
				  eMail:$scope.registration_email,Password:$scope.registration_password};
		$log.log("befor call server");
		  
		$http.post("http://localhost:3000/addUser", {
			user: user,
		}).then(
			function (response) { 
			    var user_from_server = response.data.user;
			   //success callback
               	if(!response.data.user_exists)	
				{
					$log.log(user_from_server.Name);
					$scope.registration_user_name = undefined;
					$scope.registration_name = undefined;
					$scope.registration_email = undefined;
					$scope.registration_password = undefined;
					$scope.registration_validation_password = undefined;
					$log.log(user_from_server.UserName);
					
				}
				else
				{
					$scope.message = response.data.user_exists;
					$scope.message_type = "ERROR";
					angular.element(Message_Modal).modal("show");
					$scope.registration_user_name = undefined;
					
				}
					

			},
			function (response) { //failure callback
				
			}
		);
	}
	
	$scope.login=function(){//log in user
	$log.log("UserNameLogin "+$scope.UserNameLogin)
		if($scope.UserNameLogin == undefined || $scope.UserNameLogin == "")
		{
			$scope.message = "User name is required";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
			
		
		if($scope.PasswordLogin == undefined || $scope.PasswordLogin == "")
	    {
			$scope.message = "Password is required";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;

		}
				
		var LoginUser={UserName:$scope.UserNameLogin, Password:$scope.PasswordLogin};
		$http.post("http://localhost:3000/login", {
			LoginUser: LoginUser,
		}).then(
			function (response) { //success callback            
				LoginUser = response.data.user_login;
				if(!response.data.no_match)
				{
					if(LoginUser.adminUser == true)
					{
						$scope.admin_page = true;
					}
					else
					{
						$scope.admin_page = false;
					}
					$scope.UserNameLogin = undefined;
					$scope.PasswordLogin = undefined;
					$scope.menu = true;
					$scope.login_page = false;
				}
				else
				{
					$scope.message = response.data.no_match;
					$scope.message_type = "ERROR";
					angular.element(Message_Modal).modal("show");
				}
				
			},
			function (response) { //failure callback
				
			}
		);
	}
	
    //show the list of contacts
	$scope.get_contacts_function = function()
	{
	   $scope.login_page = false;
	   $scope.show_contacts = true;
	   $scope.show_update_expression = true;
	   $scope.show_update_input = false;
	   $scope.click = true;
	   $scope.show_calendar = false;

	   $scope.getContactsList();
	   $scope.getOptionsList();
	  
	   
	}	

    //show calendar
	$scope.calendar_function = function()
	{
	   $scope.login_page = false;
	   $scope.show_contacts = false;
	   $scope.show_calendar = true;

	   $scope.search = "";
	}
   //show settings
	$scope.settings_function = function()
	{
	   $scope.login_page = false;
	   $scope.show_contacts = false;
	   $scope.search = "";
	}
	//show the 
	$scope.add_contact_function = function()
	{
	    $scope.get_new_contact_details = true;
		 $scope.click = false;
	}
	
	//close the option of contact addition
	$scope.cancel_function = function()
	{
	    $scope.get_new_contact_details = false;
		$scope.click = true;
		$scope.newName=undefined;
		$scope.newStatus=undefined;
		$scope.newPhoneNumber=undefined;
		$scope.newEmail=undefined;
		$scope.newAddress=undefined;
	}
	
	//get the list of statuses from the server
	$scope.getOptionsList = function()
	{
		$log.log("entered getStatusList() = function()");
		$http.get("http://localhost:3000/getStatusOptions").then(
			function (response) {//success callback
				$scope.options = response.data.statusOptions;//return the list of the statusOptions
			},
			function (response) {//failure callback
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
	   
	
	}

    //save the deatailes of contact before update
	$scope.update_contact_function = function(contact)
	{
		contact_before_update = {Name:contact.Name,Status:contact.Status, PhoneNumber:contact.PhoneNumber, eMail:contact.eMail, Address:contact.Address};
		$log.log("contact name : "+contact.Name);
		$scope.update_status = contact_before_update.Status;
		 $log.log("contactIsEdit : "+$scope.contactIsEdit);

        		
	}

    //show the modal with a new status addition
	$scope.onChange = function(option){
		if(option==new_status_option)
		{
		    angular.element(myModalHorizontal).modal("show");
		}
	}

    //save a new status in server
	$scope.save_new_status = function()
	{
		if($scope.status_from_modal != undefined)
		{
			if($scope.status_from_modal != "")
			{
			    var new_status= {Status:$scope.status_from_modal};
				$http.post("http://localhost:3000/addOption", {
				new_status: new_status,
				}).then(
				function (response) { //success callback
                    $scope.newStatus="";
                 // $scope.update_status=$scope.status_from_modal;				  
                  $scope.getOptionsList();				
				},
				function (response) { //failure callback
					$scope.message = response.data.error;
					$scope.message_type = "ERROR";
					angular.element(Message_Modal).modal("show");
				}
				);
			}
		}
		
		$scope.status_from_modal =undefined;
	}
		
	//get the contacts list from server
	$scope.getContactsList = function(){// get the list of the contacts
		 $http.get("http://localhost:3000/getContacts").then(
			function (response) {//success callback
				$scope.contactsInfo = response.data.contacts;//return the list of the contacts
			},
			function (response) {//failure callback
				$scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
		
	}
 
 
    //check validation of all new contact fildes
	$scope.check_and_save_details = function()
	{
	  if($scope.newName!=undefined)
	  {
		var name = $scope.newName;
		if(name.length > MAX_LETTERS_IN_NAME){//check the length of the name
		    $scope.message_type = "WARNNING";
		    $scope.message = "This name is too long, therefore only "+ MAX_LETTERS_IN_NAME  +" characters including spaces will be saved";
		    angular.element(Message_Modal).modal("show");
			$scope.newName=$scope.newName.slice(0, MAX_LETTERS_IN_NAME);
			return;
		}
	  }
	  else
	  {
		$scope.newName="";
	  }
	  
	  if($scope.newStatus==undefined || $scope.newStatus=="" || $scope.newStatus==new_status_option) 
	  {
		 $scope.newStatus="";
	  }
	  
		
		if($scope.newPhoneNumber==undefined || $scope.newPhoneNumber== "")
		{//check the phone number
		    $scope.message_type = "ERROR";
		    $scope.message = "You must enter a phone number";
		    angular.element(Message_Modal).modal("show");
		    return;
			
		}
		else
		{
		    var valid_phone_number =  /^\+?([0-9]{2})?[0-9]{7,10}$/;
		    if(!valid_phone_number.test($scope.newPhoneNumber))
			{//check the phone number
			    $scope.message_type = "ERROR";
		        $scope.message = "This phone number is invalid";
		        angular.element(Message_Modal).modal("show");
				$scope.newPhoneNumber=undefined;
				return;
			}
		}
			
		
		if($scope.newEmail!=undefined)
		{
			var valid_email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				if( !valid_email.test($scope.newEmail)){//check the email
				    $scope.message_type = "ERROR";
		            $scope.message = "This email is invalid";
		            angular.element(Message_Modal).modal("show");
					$scope.newEmail=undefined;
					return;
				}
		}
        else
		{
		   $scope.newEmail= undefined ;
        }		
		
		if($scope.newAddress!=undefined)
		{
		    var address = $scope.newAddress;
			if(address.length > MAX_LETTERS_IN_ADDRESS){//check the length of the address
		        $scope.message_type = "WARNNING";
		        $scope.message = "This address is too long, therefore only "+ MAX_LETTERS_IN_ADDRESS +" characters including spaces will be saved";
			    angular.element(Message_Modal).modal("show");
				$scope.newAddress=$scope.newAddress.slice(0, MAX_LETTERS_IN_ADDRESS);
				return;
			}
			
		}
		else
		{
		   $scope.newAddress = "";
		}
		
		$scope.click = true;
		$scope.addNewContact();
	}
	
    //add a new contact to server
	$scope.addNewContact = function(){
				
		var contact={Name:$scope.newName,Status:$scope.newStatus, PhoneNumber:$scope.newPhoneNumber, eMail:$scope.newEmail, Address:$scope.newAddress};
		$http.post("http://localhost:3000/addContact", {
				contact: contact,
			}).then(
				function (response) { //success callback  
                    $log.log("phone exists response : "+response.data.phone_exists);					
					if(!response.data.phone_exists)
					{
						$scope.get_new_contact_details=false;
						$scope.getContactsList();
						$scope.newName=undefined;
						$scope.newPhoneNumber=undefined;
						$scope.newEmail=undefined;
						$scope.newStatus=undefined;
						$scope.newAddress=undefined;

					}
					//check if the phone exsists
					else
					{
					   $scope.message_type = "ERROR";
                       $scope.message = response.data.phone_exists;
				       angular.element(Message_Modal).modal("show");
					}				
					
				},
				function (response) { //failure callback
					$scope.newName=undefined;
					$scope.newPhoneNumber=undefined;
					$scope.newEmail=undefined;
					$scope.newAddress=undefined;
					alert(response.data.error);
				}
			);
	}
	
	 //delete a contact from server
	$scope.delete_contact_function = function(contact)
	{
		$http.post("http://localhost:3000/deleteContact", {
				contact: contact,
			}).then(
				function (response) { //success callback            
					$scope.getContactsList();
				},
				function (response) { //failure callback
					
				}
			);
	}
	
	
	//check validation of all updated contact fildes and if they corect are corcect send them to the server
	$scope.save_updated = function(contactInfoToUpdate)
	{
		$log.log("Status before: "+ contact_before_update.Status);
		$log.log("Status after : "+ contactInfoToUpdate.Status);
		if(contactInfoToUpdate.Name!=undefined)
		{
			if(contactInfoToUpdate.Name.length > MAX_LETTERS_IN_NAME){//check the length of the name
			$scope.message_type = "WARNNING";
		    $scope.message = "This name is too long, therefore only "+ MAX_LETTERS_IN_NAME  +" characters including spaces will be saved";
		    angular.element(Message_Modal).modal("show");
			contactInfoToUpdate.Name=contactInfoToUpdate.Name.slice(0, MAX_LETTERS_IN_NAME);
			return;
			}
		}
		else
		{
			contactInfoToUpdate.Name="";
		}
		  
		if(contactInfoToUpdate.Status==undefined || contactInfoToUpdate.Status=="") 
		{
			contactInfoToUpdate.Status="";
		}
		else if (contactInfoToUpdate.Status==new_status_option)
		{
		
		    if (contact_before_update.Status==new_status_option)
			{
			  contactInfoToUpdate.Status = "";
			}
			contactInfoToUpdate.Status = contact_before_update.Status;
		}
			
		if(contactInfoToUpdate.PhoneNumber!=undefined && contactInfoToUpdate.PhoneNumber!= "")
		{//check the phone number
			var valid_phone_number =  /^\+?([0-9]{2})?[0-9]{7,10}$/;
		    if(!valid_phone_number.test(contactInfoToUpdate.PhoneNumber))
			{//check the phone number
				 $scope.message_type = "ERROR";
		         $scope.message = "This phone number is invalid";
		         angular.element(Message_Modal).modal("show");
				return;
			}
		}
		else
		{
		    $scope.message_type = "ERROR";
		    $scope.message = "You must enter a phone number";
		    angular.element(Message_Modal).modal("show");
		   return;
		}
			
		
		if(contactInfoToUpdate.eMail!=undefined && contactInfoToUpdate.eMail!="" && contactInfoToUpdate.eMail!=null)
		{
			var valid_email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				if( !valid_email.test(contactInfoToUpdate.eMail)){//check the email
					$scope.message_type = "ERROR";
		            $scope.message = "This email is invalid";
		            angular.element(Message_Modal).modal("show");
					return;
				}
		}
        else
		{
		   contactInfoToUpdate.eMail="";
        }		
		
		if(contactInfoToUpdate.Address!=undefined)
		{
			if(contactInfoToUpdate.Address.length > MAX_LETTERS_IN_ADDRESS){//check the length of the address
				$scope.message_type = "WARNNING";
		        $scope.message = "This address is too long, therefore only "+ MAX_LETTERS_IN_ADDRESS +" characters including spaces will be saved";
			    angular.element(Message_Modal).modal("show");
				$scope.newAddress=$scope.newAddress.slice(0, MAX_LETTERS_IN_ADDRESS);
				contactInfoToUpdate.Address=contactInfoToUpdate.Address.slice(0, MAX_LETTERS_IN_ADDRESS);
				return;
			}
			
		}
		else
		{
		   contactInfoToUpdate.Address = "";
		}
		var updated_contact={Name:contactInfoToUpdate.Name,Status:contactInfoToUpdate.Status, PhoneNumber:contactInfoToUpdate.PhoneNumber, eMail:contactInfoToUpdate.eMail, Address:contactInfoToUpdate.Address};
		$http.post("http://localhost:3000/updateContact", {
				contact_before_update: contact_before_update,updated_contact:updated_contact
			}).then(
				function (response) { //success callback   

                   $log.log("phone exists response : "+response.data.phone_exists);				
					if(!response.data.phone_exists)
					{
                          $scope.getContactsList();
					}
					//check if th phone already exsist
					else
					{
					   $scope.message_type = "ERROR";
					   $scope.message = response.data.phone_exists;
					   angular.element(Message_Modal).modal("show");
					  
					    
					}					
					
				},
				function (response) { //failure callback
					
					
				}
			);
	}
	}]);
})();