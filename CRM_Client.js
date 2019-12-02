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
	$scope.login_page = true;
	$scope.register_page = false;

	$scope.contactsInfo=[];
	$scope.options=[];

	
	
	$scope.validation_of_temp_password = function()
	{
		$scope.temp_password_page = true;
		$scope.login_page = false;
		$scope.check_if_exists_password_in_db();
	}
	
    $scope.check_if_exists_password_in_db = function()
	{
		$http.get("http://localhost:3000/checkExsistingTempPassword").then(
			function (response) {//success callback
			    temp_password_from_server = response.data.tempPassword;
				$log.log("temp_password_from_server: " + temp_password_from_server);
			},
			function (response) {//failure callback
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);		
	}
	
	$scope.verify_temporary_password = function()
	{
		
		if($scope.temp_password == temp_password_from_server )
		{
			$scope.register_page = true;
			$scope.temp_password_page = false;
		}
		else
		{
			$scope.message = "You don't have a correct temporary password , Please get it from the administrator";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
		}
	
		
	}

	$scope.signUp=function()
	{//user sign up,check and register 
		if($scope.registration_user_name==undefined){//check if the first name & the last name contains letters
			alert("User name must contain at least one letter");
			return;
		}
		if($scope.registration_name==undefined){//check if the first name & the last name contains letters
			alert("User name and/or first name and/or last name must contain at least one letter");
			return;
		}
		if($scope.s_uName=="" || $scope.s_fName=="" || $scope.s_lName==""){//check if the first name & the last name contains letters
			alert("User name and/or first name and/or last name must contain at least one letter");
			return;
		}
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if($scope.registration_email==undefined || !re.test($scope.registration_email)){//check the email
			alert("The email not valid");
			return;
		}
		if($scope.registration_password==undefined || $scope.registration_password=="" || $scope.registration_password.length<8){//check the length of the password
			alert("The password must contain at least 8 letters");
			$scope.registration_password=undefined;
			return;
		}
		if($scope.registration_password!=$scope.registration_validation_password){//check if the two password equals
			alert("The passwords not equals");
			$scope.registration_password=$scope.registration_validation_password=undefined;
			return;
		}
		var user={fName:$scope.s_fName,lName:$scope.s_lName,uName:$scope.s_uName,
					 eMail:$scope.s_uEmail,password:$scope.s_uPassword};
		$http.post("http://localhost:3000/addUser", {
			user: user,
		}).then(
			function (response) { //success callback            
				$scope.c_user =response.data.user;
				alert("The user added successfuly");
				$scope.wUser="Hello "+$scope.c_user.fName+" "+$scope.c_user.lName;
				$scope.status=3;
			},
			function (response) { //failure callback
				alert(response.data.error);
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