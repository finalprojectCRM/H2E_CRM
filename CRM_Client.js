(function() {
var app = angular.module("CRM", []);
	app.controller('CRM_controller', ['$scope','$http', function($scope, $http) {	

	var MAX_LETTERS_IN_NAME = 25;
	var MAX_LETTERS_IN_ADDRESS = 35;
	
    $scope.show_contacts = false;
	
	$scope.contacts_table = function()
	{
	   $scope.show_contacts = true;
	   $scope.getContactsList();
	   
	}	

	$scope.getContactsList=function(){// get the list of the contacts
		$http.get("http://localhost:5000/getContacts").then(function (response) {
			$scope.friendsList = response.data;
		});
	}
	
	$scope.addNewContact=function(){
		
		if($scope.newName > MAX_LETTERS_IN_NAME){//check the length of the name
			alert("WARNNING:This name is too long, therefore only 25 characters will be saved");
			$scope.newName=$scope.newName.slice(0, MAX_LETTERS_IN_NAME);
			return;
		}
		
		var valid_phone_number =  /^\+?([0-9]{2})?[0-9]{7,10}$/;
			if(!valid_phone_number.test($scope.newPhoneNumber)){//check the phone number
				alert("ERROR:This phone number is invalid");
				$scope.newPhoneNumber="";
				return;
			}
			
		var valid_email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			if( !valid_email.test($scope.newEmail)){//check the email
				alert("ERROR:This email is invalid");
				$scope.newEmail="";
				return;
			}
			
		if($scope.newAddress > MAX_LETTERS_IN_ADDRESS){//check the length of the address
			alert("WARNNING:This address is too long, therefore only 35 characters will be saved");
			$scope.newAddress=$scope.newAddress.slice(0, MAX_LETTERS_IN_ADDRESS);
			return;
		}
			
		
			
		var contact={Name:$scope.newName, PhoneNumber:$scope.newPhoneNumber, eMail:$scope.newEmail, Address:$scope.newAddress};
		$http.post("http://localhost:5000/addContact", {
				contact: contact,
			}).then(
				function (response) { //success callback            
					$scope.new_contact =response.data.contact;
					alert("The contact added successfully");
					$scope.newName="";
					$scope.newPhoneNumber="";
					$scope.newEmail="";
					$scope.newAddress="";
				},
				function (response) { //failure callback
					alert(response.data.error);
				}
			);
	}
	
	}]);
})();