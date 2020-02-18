(function() {
"use strict";
var app = angular.module("CRM",  [ "ngResource",'ui.calendar','ui.bootstrap','ui.bootstrap.datetimepicker','ngSanitize', 'ui.select','ngAnimate'])
.factory("sampleUploadService", [ "$resource",
  function ($resource) {
	 var svc = {};
	 
	 var restSvc = $resource(null, null, {
		"uploadImage": {
		   url: "./uploadImage",
		   method: "post",
		   isArray: false,
		   data: {
			  fileName: "@fileName",
			  uploadData: "@uploadData"
		   }
		}
	 });

	 svc.uploadImage = function (imageUpload) {
		return restSvc.uploadImage(imageUpload).$promise;
	 };
	 
	 return svc;
  }
])



.controller('CRM_controller', ['$scope','$compile','$http','$log','$timeout','sampleUploadService' ,'uiCalendarConfig',function($scope,$compile, $http,$log,$timeout,sampleUploadService,uiCalendarConfig) {	

	var contact_before_update;
	var user_before_update;
	var MAX_LETTERS_IN_NAME = 25;
	var MAX_LETTERS_IN_ADDRESS = 35;
    var new_status_option = "add a new status";
    var status_header = "-- Choose status --";
	var category;
	var status_role;
	var temp_password_from_server ;
	var logged_in_user;
	var incorect_password = false;
	var incorect_current_password = false;
	var missing_role_field = false;
	var missing_status_field = false;
	var delete_all_contacts_flag = false;
	var delete_all_users_flag = false;
	var missing_role_field_calendar = false;
	var username_to_delete;
	var deleted_status;
    var selected_items= [];
	var history_array =[];
	var start_date,end_date;
	var selected_contact;
	var edit_event_detailes;
	
	$scope.PhoneNumber_before_update = undefined;
	$scope.account = false;
	$scope.click = false;
	$scope.menu = false;
	$scope.show_calendar = false;
    $scope.show_contacts = false;
	$scope.show_update_input = false;
	$scope.check_phone_enable = false;
	$scope.show_update_expression = false;
	$scope.get_new_contact_details = false;
	$scope.show_settings = false;
	$scope.login_page = false;
	$scope.register_page = false;
	$scope.admin_page = false;
	$scope.first_load = false;
	$scope.Admin = false;
	$scope.show_users = false;
	$scope.add_event = false;
	$scope.taskIsEdit = false;


	
	//$scope.selected.Name = undefined;
	//$scope.selected.PhoneNumber = undefined;
	
	

	$scope.contactsInfo=[];
	$scope.users=[];
	$scope.options=[];
    $scope.roles=[];
	$scope.roles_colors=[];
	


   $scope.history_of_contact = function(contact_history)
   {
	   $scope.History = contact_history;
   }
	
	$scope.renderCalender = function(calendar) {
    console.log($scope.events)
    uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEventSource', $scope.events)
  };
  $scope.uiCalendarConfig = uiCalendarConfig;

  $scope.events = [];

  $scope.eventSources = [$scope.events];

  $scope.calendarConfig = {
	header:{
		 left: 'prev,next today',
         center: 'title',
         right: 'month,agendaWeek,agendaDay'
	},
	views: {
        month: { columnHeaderFormat: 'ddd', displayEventEnd: true, eventLimit: 3 },
        week: { columnHeaderFormat: 'ddd DD', titleRangeSeparator: ' \u2013 ' },
        day: { columnHeaderFormat: 'dddd' },
    },
	columnFormat:{              
		month: 'ddd',    
		week: 'ddd D/M', 
		day: 'dddd' 
	},
	//height : 500,
	
	aspectRatio: 1.5,
    selectable: true,
    selectHelper: true,
    editable: true,
	eventLimit:true,
	renderCalender: $scope.renderCalender,
	//eventRender: $scope.eventRender,

	select: function(start, end, allDay, jsEvent) {
		$log.log("start: "+ moment(start).format("DD/MM/YYYY HH:mm"));
		start_date = moment(start).format();
		$log.log("end: "+ moment(end).format());
		end_date = moment(end).format();
		
        $scope.date = moment(start).format("DD/MM/YYYY HH:mm")+ ' - ' + moment(end).format("DD/MM/YYYY HH:mm");
        $scope.getRolesList();
        //$scope.openPopover(start, end, allDay, jsEvent);
		$scope.role = $scope.roles[0].Role;
		$scope.contact_task = undefined;
		$scope.title = undefined;
	
		angular.element(add_event).modal("show");

    },
	eventClick: function(event, element) {
	
 
	edit_event_detailes = event;	
	var title = event.title.split(":");

    $scope.event_title = title[1];
	$scope.event_start = event.start;
	$scope.event_end = event.end;
	$scope.contact_event = event.id;
	$scope.event_date = moment(event.start).format("DD/MM/YYYY HH:mm")+ ' - ' + moment(event.end).format("DD/MM/YYYY HH:mm");
	$scope.taskIsEdit = false;

	angular.element(edit_or_delete_event).modal("show");
	

  }
	
	
	
  };
  
	$scope.save_edit_event = function() { 
  

    $log.log("edit");

    edit_event_detailes.title = "Task for contact "+ selected_contact.Name +" "+ selected_contact.PhoneNumber+" : "+$scope.event_title;
	edit_event_detailes.start = $scope.event_start;
	edit_event_detailes.end = $scope.event_end;
	edit_event_detailes.color = $scope.role.Color;
	edit_event_detailes.id = selected_contact.Name +" "+ selected_contact.PhoneNumber;
	uiCalendarConfig.calendars.myCalendar.fullCalendar('updateEvent', edit_event_detailes);
	
	   

		
		
   };
   
    $scope.go_to_contact = function() { 
	
		var contact_phone_number = $scope.contact_event.split(" "); 
		$scope.get_contacts_function();
		$log.log("contact_phone_number : "+ contact_phone_number);

		$scope.search = contact_phone_number[1];
	    angular.element(edit_or_delete_event).modal("hide");


		
		
	}; 
	$scope.calendarContact = function(contact) { 
	
	    var event_id = contact.Name +" "+ contact.PhoneNumber;
		$log.log("event_id : " + event_id);
	    $scope.events = uiCalendarConfig.calendars.myCalendar.fullCalendar('clientEvents', event_id);
	   
		$log.log("$scope.events : " + $scope.events);
	    $scope.calendar_function();
		
	};
  
  
  $scope.deleteEvent = function( event, element, view ) { 
        uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents', function (event) {
				return event == edit_event_detailes;
			});

    };
	$scope.eventRender = function( event, element, view ) { 
        element.attr({'title': event.title,
                     'tooltip-append-to-body': true});
        $compile(element)($scope);
    };
	
 $scope.selections = [];
  
  $scope.selectionChanged = function(idx) {
    $log.log(idx, $scope.selections[idx]);
    selected_contact = $scope.selections[idx];
	
  };
  


  $scope.addEvent = function() {

	  
	var date = $scope.date.split("-");
    $log.log("start date : " + date[0]);
    //$log.log("type "+typeof date[0]);
	$log.log("end date : " + date[1]);
    var start_date= moment(date[0], 'DD/MM/YYYY HH:mm').format("MM/DD/YYYY HH:mm");
    var end_date= moment(date[1], 'DD/MM/YYYY HH:mm').format("MM/DD/YYYY HH:mm");
	$log.log("start date : " + start_date);
	$log.log("start date : " + end_date);
    //$log.log("end date : " + formatDate(date[1]));
	$log.log("$scope.role : "+$scope.role.Role);
    if($scope.role.Role == undefined || $scope.role.Role == "" || $scope.role.Role == "-- Choose category for role --")
	{   
		$scope.message = "Category is a must field, please select one";
		$scope.message_type = "ERROR";
		angular.element(Message_Modal).modal("show");
		missing_role_field_calendar= true;
		return;
	}
	
	var description = "Task for contact "+ selected_contact.Name +" "+ selected_contact.PhoneNumber+" : "+$scope.title;
	var contact = selected_contact.Name +" "+ selected_contact.PhoneNumber;
	$log.log("description: "+description);


    $scope.events.push({
		title: description,
		start: start_date,
		end:  end_date,
		color: $scope.role.Color,
		id : contact,
	    editable: true
    });

  //  console.log($scope.pendingRequests);
  };

	
	$scope.sendMail=function()
	{
		$http.post("http://localhost:3000/sendEmail", {
			
		}).then(
			function (response) { 
			
			},
			function (response) { //failure callback
				
			}
		);
	}	
	
	$http({method : "GET",
			url : "firstSystemLoad"
		  }).then(function(response) {
			  
		$scope.first_load = false;
		$scope.not_first_load = false;
			  
		if(response.data.admin_first_load == true || response.data.admin_changed_temp_password == false)//go to change password page
		{
			$scope.first_load = true;	
			$scope.temp_password_page = true;
			
        }
        else if(response.data.admin_changed_temp_password == true)//admin	
		{
			$scope.first_load = false;
			$scope.not_first_load = true;
			$scope.temp_password_page = true;
		}			
		else
		{
			$scope.login_page =true;
			$scope.first_load = false;	
		}
			
			  
			  //$scope.register_page = true;
			  //$scope.UserName = "Admin";
			}, function (response) {
    });	
 
$scope.clickSelectFile = function () {
   angular.element("#fileUploadField").click();
};
angular.element("#fileUploadField").bind("change", function(evt) {
   if (evt) {
	    var fn = evt.target.value;
		if (fn && fn.length > 0) {
		   var idx = fn.lastIndexOf("/");
		   if (idx >= 0 && idx < fn.length) {
			  $scope.uploadFileName = fn.substring(idx+1);
		   } else {
			  idx = fn.lastIndexOf("\\");
			  if (idx >= 0 && idx < fn.length) {
				 $scope.uploadFileName = fn.substring(idx+1);
			  }
		   }
		}
		$scope.$apply();

   }
});

$scope.doUpload = function () {
   $scope.uploadSuccessful = false;
   var elems = angular.element("#fileUploadField");
   if (elems != null && elems.length > 0) {
      if (elems[0].files && elems[0].files.length > 0) {
         let fr = new FileReader();
         fr.onload = function(e) {
            if (fr.result && fr.result.length > 0) {
               var uploadObj = {
                  fileName: $scope.uploadFileName,
                  uploadData: fr.result
               };
			   $log.log( fr.result);
			   $log.log( $scope.uploadFileName);
               
               sampleUploadService.uploadImage(uploadObj).then(function(result) {
                  if (result && result.success === true) {
                     clearUploadData();
                     $scope.uploadSuccessful = true;
                  }
               }, function(error) {
                  if (error) {
                     $log.log(error);
                  }
               });
            }
         };
         
         fr.readAsDataURL(elems[0].files[0]);
      } else {
         vm.uploadObj.validationSuccess = false;
         vm.uploadObj.errorMsg = "No file has been selected for upload.";
      }
   }
};

function clearUploadData() {
            $scope.uploadFileName = "";
            angular.element("#fileUploadField").val(null);
         }
	

	 
	
	
    $scope.validation_of_temp_password = function(tempPasswordFromClient)
	{
		$log.log("validation_of_temp_password :" + tempPasswordFromClient);
		$http.post("http://localhost:3000/verifyTemporaryPassword", {
			tempPassword: tempPasswordFromClient,
		}).then(
			function (response) {//success callback
			$log.log("response.data.verified :" + response.data.verified);
			
			if(response.data.verified == true)//verified passwords (not for Admin user)
			{
				$scope.new_temp_password_page = false;
				$scope.temp_password_page = false;
				$scope.register_page =true;
			}
			else if(response.data.admin_changed_temp_password == false)//admin did not yet change temp password that he got with the system  			
			{
				$scope.new_temp_password_page = true;
				$scope.temp_password_page = false;
				
				$scope.register_page = false;
			}
			else if(response.data.admin_changed_temp_password == true)//admin changed temp password that he got with the system  			
			{
				$scope.new_temp_password_page = false;
				$scope.temp_password_page = false;
				$scope.register_page =true;
				$scope.registration_user_name = "Admin";
				$scope.Admin = true;
			}
			else//not correct temprorary password
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
	
	$scope.change_temp_password=function()
	{
		var re_password = /^((?!.*[\s])(?=.*[A-Z])(?=.*\d))(?=.*?[#?!@$%^&*-]).{8,15}$/;
		if($scope.new_temporary_password==undefined || !re_password.test($scope.new_temporary_password)){//check the length of the password
			$scope.message = "The password must contain at least 8 to 15 characters , at least : one capital letter or one small letter, one number, and one of the following special characters: #?! @ $% ^ & * -";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		if($scope.new_temporary_password!=$scope.new_temporary_validation_password){//check if the two password equals
			$scope.message = "The two passwords do not match";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
		    $scope.new_temporary_validation_password=undefined;
			return;
		}
		var new_temp_password ={TempPassword:$scope.new_temporary_password};
		$http.post("http://localhost:3000/changeTemporaryPassword", {
			new_temp_password: new_temp_password,
		}).then(
			function (response) { //success callback
			  
					$scope.new_temporary_password = $scope.new_temporary_validation_password = undefined ;
					$scope.register_page = true;
					$scope.registration_user_name = "Admin";
					$scope.Admin = true;
					
					
					
					$scope.new_temp_password_page=false;
					$scope.first_load=false;
					
					
			
					

			},
			function (response) { //failure callback
				
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
			$scope.message = "The password must contain at least 8 to 15 characters , at least : one capital letter or one small letter, one number, and one of the following special characters: #?! @ $% ^ & * -";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		if($scope.registration_password!=$scope.registration_validation_password){//check if the two password equals
			$scope.message = "The two passwords do not match";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			$scope.registration_validation_password=undefined;
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
				logged_in_user = user_from_server;
			   //success callback
               	if(!response.data.user_exists)	
				{
					$log.log(user_from_server.Name);
					$scope.registration_user_name = undefined;
					$scope.registration_name = undefined;
					$scope.registration_email = undefined;
					$scope.registration_password = undefined;
					$scope.registration_validation_password = undefined;
					$scope.menu = true;
					$scope.all_system = true;
					$scope.account = true;
					$scope.name_of_user = user_from_server.Name;
					$scope.role_of_user = user_from_server.Role;
					$scope.register_page = false;
					$scope.getOptionsList();
					$scope.getRolesList();
					$scope.getRolesColorsList();
					$scope.getContactsList();
					$scope.getUsersList('showUsers');
					
					if(user_from_server.is_admin==true)
					{
						$scope.admin_page = true;
						$scope.isAdmin = true;
						
					}
					else
					{
						$scope.admin_page = false;
						$scope.isAdmin = false;
					}
					
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
				logged_in_user = LoginUser;
				if(!response.data.no_match)
				{
					if(LoginUser.adminUser == true)
					{
						$scope.admin_page = true;
						$scope.isAdmin =true;
					}
					else
					{
						$scope.admin_page = false;
						$scope.isAdmin =false;
					}
					$scope.UserNameLogin = undefined;
					$scope.PasswordLogin = undefined;
					$scope.menu = true;
					$scope.account = true;
					$scope.login_page = false;
					$scope.name_of_user = LoginUser.Name;
					$log.log("role_of_user: "+LoginUser.Role);
					$scope.role_of_user = LoginUser.Role;
					$scope.all_system = true;
					$scope.getOptionsList();
					$scope.getRolesList();
					$scope.getRolesColorsList();
					$scope.getContactsList();
					$scope.getUsersList('showUsers');
					

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
	   $scope.show_users = false;
	   $scope.show_settings = false;
	   $scope.show_update_expression = true;
	   $scope.show_update_input = false;
	   $scope.click = true;
	   $scope.show_calendar = false;
	   $scope.account = true;
		

	   $scope.getContactsList();
	   $scope.getOptionsList();
	   $scope.getRolesList();

	  
	   
	}	
    
	 $scope.check_exsisting_color = function(color)
	 {
		 $log.log("$scope.check_exsisting_color : color: "+ color);

		 for(var item=0 ; item < $scope.roles_colors.length ; item++)
		 {
			$log.log("$scope.roles_colors[item].Color: "+ $scope.roles_colors[item].Color);

			 if($scope.roles_colors[item].Color == color )
			 {
				 return true;
			 }
		 }
		 return false;
	 }


	
	$scope.save_new_role_status = function()
	{
		$log.log(document.getElementById("role_color").value);
		var role_color = document.getElementById("role_color").value;
		var color = role_color.toString();
		$log.log("color: "+ color);

		var existing_color = $scope.check_exsisting_color(color);
		$log.log("existing_color: "+ existing_color);

		if($scope.role_from_modal == undefined || $scope.role_from_modal == "")
		{
			$scope.message = "You must fill in the role field";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			missing_role_field = true;
		}
		else if(existing_color == true)
		{
            $log.log("entered existing_color: "+ existing_color);

			$scope.message = "This color already exist, please choose different color";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			missing_role_field = true;
		}
		else
		{
			selected_items.unshift( status_header );
			selected_items.push(new_status_option);
			$log.log("new_status_option :"+new_status_option);
			var role_with_statuses = {Role:$scope.role_from_modal,Color:role_color, Statuses:selected_items};
			$http.post("http://localhost:3000/addRoleWithStatuses", {
				role_with_statuses: role_with_statuses,
			}).then(
				function (response) { //success callback  
                  $scope.role_from_modal = undefined; 
				  $scope.getRolesList();
				},
				function (response) { //failure callback
					
				}
			);
		}
	
	}
	
	$scope.display_role_list = function()
	{
		$scope.getRolesList();
		angular.element(delete_role_modal).modal('show');
	}

	
	
	$scope.save_new_status_roles = function()
	{
		if($scope.status_from_modal == undefined || $scope.status_from_modal == "")
		{
			$scope.message = "You must fill in the status field";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			missing_status_field = true;
		}
		else
		{
			
			var status_with_roles = {Status:$scope.status_from_modal, Roles:selected_items};
			$http.post("http://localhost:3000/addStatutsWithRoles", {
				status_with_roles: status_with_roles,
			}).then(
				function (response) { //success callback  
                  $scope.status_from_modal = undefined; 
				  $scope.getOptionsList();
				  $scope.role = undefined;
				  $scope.item = undefined;
				  selected_items = [];
				},
				function (response) { //failure callback
					
				}
			);
		}
	
	}
	
	$scope.add_new_role = function()
	{
		$log.log("entered add_new_role() = function()");
		$http.get("http://localhost:3000/getStatusOptions").then(
			function (response) {//success callback
				$scope.options = response.data.statusOptions;//return the list of the statusOptions
				$scope.item = $scope.options[0];
				$scope.getRolesColorsList();
				angular.element(add_new_role_modal).modal("show");
				$scope.role_from_modal = undefined;
				selected_items = [];
			},
			function (response) {//failure callback
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
	}

    //show calendar
	$scope.calendar_function = function()
	{
	   $scope.login_page = false;
	   $scope.show_contacts = false;
	   $scope.show_calendar = true;
	   $scope.show_users = false;
	   $scope.show_settings = false;
	   $scope.account = false;
       $scope.getRolesList();
	   $scope.search = "";
	}
   //show settings
	$scope.settings_function = function()
	{
		$log.log("entered settings function");
	   $scope.show_settings = true;
	   $scope.login_page = false;
	   $scope.show_contacts = false;
	   $scope.show_users = false;
	   $scope.show_calendar = false;

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
				$scope.item = $scope.options[0];
				$log.log("item: "+ $scope.item );
			},
			function (response) {//failure callback
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
	   
	
	}
	$scope.getRolesColorsList = function()
	{
		$log.log("entered getStatusList() = function()");
		$http.get("http://localhost:3000/getRolesColors").then(
			function (response) {//success callback
				$scope.roles_colors = response.data.colors;//return the list of the colors
				$log.log("roles_colors : " + $scope.roles_colors);
			},
			function (response) {//failure callback
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
	   
	
	}
	
	$scope.getRolesList = function()
	{
		$log.log("entered getRolesList() = function()");
		$http.get("http://localhost:3000/getRoles").then(
			function (response) {//success callback
				$scope.roles = response.data.roles;//return the list of the statusOptions
				$scope.role = $scope.roles[0];
				if($scope.roles[1]!=undefined)
				{
					$scope.status_role = $scope.roles[1].Statuses[0];
				}
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
		contact_before_update = {Category:contact.Category, Name:contact.Name,Status:contact.Status, PhoneNumber:contact.PhoneNumber, eMail:contact.eMail, Address:contact.Address};
		$log.log("contact name : "+contact.Name);
		$scope.update_status = contact_before_update.Status;
		 $log.log("contactIsEdit : "+$scope.contactIsEdit);
		// $scope.role_category = contact.Category;
		// $scope.role_category = contact.Category;
		 $log.log("contact role : "+contact.Category.Role);

		 //$scope.status_role = contact.Status;

        		
	}
	
	$scope.update_user_function = function(user)
	{
		user_before_update = {Role:user.Role,Name:user.Name,UserName:user.UserName, eMail:user.eMail};
		$log.log("user name : "+user.Name);
        		
	}

    //show the modal with a new status addition
	$scope.onChange = function(option){
		$log.log("option : "+option);
		status_role = option;
		if(option==new_status_option)
		{
		    angular.element(add_new_status_modal).modal("show");
		}
	}

	$scope.onChangeCategory = function(option,flag){
		$log.log("option : "+option.Role);
		category = option;
		if(flag == 'update role')
		{
			category = option.Role;
		}
	}
	
	
	
	$scope.selected_item = function(option,flag)
	{
		
		if(flag == 'new status' || flag == 'update role')
		{
			selected_items.push(option.Status);
		}
		
		else if(flag == 'new role')
		{
			selected_items.push(option.Role);
		}
		
		else if(flag == 'delete status')
		{
			deleted_status = option.Status;
		}
			
        else
		{
			selected_items.push(option);
		}			
		$log.log("selected_items :"+ selected_items);
	}
	
	
	
	$scope.add_new_status_to_role = function()
	{
		
		$log.log("entered add_new_role() = function()");
		$http.get("http://localhost:3000/getRoles").then(
			function (response) {//success callback
				$scope.roles = response.data.roles;//return the list of the statusOptions
	            $scope.role = $scope.roles[0];
				if($scope.roles[1]!=undefined)
				{
					$scope.status_role = $scope.roles[1].Statuses[0];
				}
				
			    angular.element(add_new_status_modal).modal("show");

			},
			function (response) {//failure callback
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);

	}

	$scope.add_new_status_to_system = function()
	{
		
		$log.log("entered add_new_status_to_system() = function()");
		$scope.getOptionsList();
		angular.element(add_new_status_to_system_modal).modal("show");


	}
	
    //save a new status in server
	$scope.save_new_system_status = function()
	{
		if($scope.system_status_from_modal != undefined && $scope.system_status_from_modal != "")
		{
			var new_status= {Status:$scope.system_status_from_modal};
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
		else
		{
			$scope.message = "You must enter a status";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			
		}
		
		$scope.system_status_from_modal =undefined;
	}
	
	$scope.update_role = function()
	{
		        $log.log($scope.options);

		angular.element(update_role_modal).modal("show");
	}
	$scope.update_role_with_statuses = function()
	{
		if(category == undefined){
		    $scope.message = "You must choose a role";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		if(selected_items==undefined) 
		{
			$scope.message = "You must choose a status";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		var role_to_update={Role:category,Statuses:selected_items};
		$http.post("http://localhost:3000/updateRole", {
				role_to_update: role_to_update,
			}).then(
				function (response) { //success callback  
                   	
					
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
	
	
	
	
		
	//get the contacts list from server
	$scope.getContactsList = function(){// get the list of the contacts
		 $http.get("http://localhost:3000/getContacts").then(
			function (response) {//success callback
				$scope.contactsInfo = response.data.contacts;//return the list of the contacts
				
			},
			function (response) {//failure callback
				
			}	
		);
		
	}
	
	
	$scope.getUsersList = function(flag){// get the list of the contacts
		$log.log("flag : " + flag);
		 $http.post("http://localhost:3000/getUsers", {	
			status_flag: flag,
		}).then(
			function (response) {//success callback
			$scope.users = response.data.users;//return the list of the users
			if(response.data.deleteUser == true)
			{
				$log.log($scope.users.length);
				$scope.message_type = "Choose user to delete";
		        angular.element(delete_modal).modal("show");
			}
							
			},
			function (response) {//failure callback
				$scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
		
	}
	$scope.get_users_function = function(flag){// get the list of the contacts
		$scope.show_users = true;
		$scope.show_settings = false;
		$scope.show_contacts = false;
		$scope.show_calendar = false;
		$scope.account = true;
		$scope.getUsersList(flag);
		$scope.getRolesList();
		
	}
 
 
    //check validation of all new contact fildes
	$scope.check_and_save_details = function()
	{
	  if(category == undefined)
	  {
		    $scope.message = "You must choose a category";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
	  }
	if(status_role==undefined ||status_role=="") 
	{
		$scope.message = "You must choose a status";
		$scope.message_type = "ERROR";
		angular.element(Message_Modal).modal("show");
		return;
	}
	else if (status_role==new_status_option)
	{
	
		if (status_role==new_status_option)
		{
			status_role = "";
		}
		status_role = contact_before_update.Status;
	}
	
	if($scope.newName==undefined || $scope.newName== "")
	{//check the name
		$scope.message_type = "ERROR";
		$scope.message = "You must enter a name";
		angular.element(Message_Modal).modal("show");
		return;
		
	}
	 else
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
	
	$scope.getCurrentDate = function()
	{
		var date = new Date();
		var dd = String(date.getDate()).padStart(2, '0');
		var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
		var yyyy = date.getFullYear();

		date = mm + '/' + dd + '/' + yyyy;
		
		return date;
	}
	
    //add a new contact to server
	$scope.addNewContact = function(){
		
		var contact_history	= 'Date : ' + $scope.getCurrentDate() +'\nContact Addition ';
		history_array.push(contact_history);
		$log.log("contact_history :" + contact_history);
		var contact={Name:$scope.newName, Category:category, Status:status_role, PhoneNumber:$scope.newPhoneNumber, eMail:$scope.newEmail, Address:$scope.newAddress, History:history_array};
		$http.post("http://localhost:3000/addContact", {
				contact: contact,
			}).then(
				function (response) { //success callback  
                    $log.log("phone exists response : "+response.data.phone_exists);					
					if(!response.data.phone_exists)
					{
						$log.log("entered !response.data.phone_exists: ");					
						$scope.get_new_contact_details=false;
						$scope.getContactsList();
						$scope.newName=undefined;
						$scope.newPhoneNumber=undefined;
						$scope.newEmail=undefined;
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
	
	
	$scope.changed_detailes = function(contactInfoToUpdate)
	{
		var updated_contact_history="";
		var change = -1;
		if(category!=contact_before_update.Category.Role)
		{
			updated_contact_history = "Role changed : " + contact_before_update.Category.Role+ " -> : " +category.Role+"\n";
			change =0;
		}
		if(status_role!= contact_before_update.Status)
		{
			updated_contact_history += "Status changed : " + contact_before_update.Status+ " -> : " + status_role +"\n";
			change =0;
		}
		if(contactInfoToUpdate.Name != contact_before_update.Name)
		{
			updated_contact_history += "Name changed : " + contact_before_update.Name+ " -> : " + contactInfoToUpdate.Name +"\n";
			change =0;
		}
		if(contactInfoToUpdate.PhoneNumber != contact_before_update.PhoneNumber)
		{
			updated_contact_history += "Phone number changed : " + contact_before_update.PhoneNumber+ " -> : " + contactInfoToUpdate.PhoneNumber +"\n";
			change =0;
		}
		if(contactInfoToUpdate.eMail != contact_before_update.eMail)
		{
			updated_contact_history += "Email changed : " + contact_before_update.eMail+ " -> : " + contactInfoToUpdate.eMail +"\n";
			change =0;
		}
		if(contactInfoToUpdate.Address != contact_before_update.Address)
		{
			updated_contact_history += "Address changed : " + contact_before_update.Address+ " -> : " + contactInfoToUpdate.Address +"\n";
			change =0;
		}
		
		if(change==0)
		{
			var contact_history=$scope.getCurrentDate()+"\nEdit Contact:\n"+updated_contact_history;
			return contact_history;
		}
		
		return -1;
				
	}
	
	 
	
	//check validation of all updated contact fildes and if they corect are corcect send them to the server
	$scope.save_updated = function(contactInfoToUpdate)
	{
		$log.log("Category before: "+ contact_before_update.Category.Role);
		$log.log("Category after : "+ category);
		
		
		if(category == undefined){
		    $scope.message = "You must choose a category";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		if(contactInfoToUpdate.Name==undefined || contactInfoToUpdate.Name== "")
		{//check the name
			$scope.message_type = "ERROR";
			$scope.message = "You must enter a name";
			angular.element(Message_Modal).modal("show");
			return;
			
		}
		else
		{
			if(contactInfoToUpdate.Name.length > MAX_LETTERS_IN_NAME){//check the length of the name
			$scope.message_type = "WARNNING";
		    $scope.message = "This name is too long, therefore only "+ MAX_LETTERS_IN_NAME  +" characters including spaces will be saved";
		    angular.element(Message_Modal).modal("show");
			contactInfoToUpdate.Name=contactInfoToUpdate.Name.slice(0, MAX_LETTERS_IN_NAME);
			return;
			}
		}
		
		  
		if(status_role==undefined ||status_role=="") 
		{
			$scope.message = "You must choose a status";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		else if (status_role==new_status_option)
		{
		
		    if (status_role==new_status_option)
			{
				status_role = "";
			}
			status_role = contact_before_update.Status;
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
		
		var contact_history = $scope.changed_detailes(contactInfoToUpdate);
	 
	    if(contact_history==-1)
		{
		   var updated_contact={Name:contactInfoToUpdate.Name, Category:category, Status:status_role, PhoneNumber:contactInfoToUpdate.PhoneNumber, eMail:contactInfoToUpdate.eMail, Address:contactInfoToUpdate.Address};
		}
		else
		{
		   var updated_contact={Name:contactInfoToUpdate.Name, Category:category, Status:status_role, PhoneNumber:contactInfoToUpdate.PhoneNumber, eMail:contactInfoToUpdate.eMail, Address:contactInfoToUpdate.Address,History:contact_history};

		}
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
	
	$scope.save_updated_user = function(userToUpdate)
	{

		var re_username = /^[a-zA-Z]{3,10}$/;
		var re_name = /^[a-zA-Z\s\u0590-\u05fe]{2,20}$/;
		
		if($scope.role==null){
		    $scope.message = "You must choose role for user";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		if(userToUpdate.UserName==undefined ||!re_username.test(userToUpdate.UserName)){
		    $scope.message = "User name must contain only English letters ,minimum 3 leterrs and maximum 10 letters and no whitespace";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		if(userToUpdate.Name==undefined ||!re_name.test(userToUpdate.Name)){
			$scope.message = "The name must contain only English or Hebrew letters ,minimum 2 leterrs and maximum 20 letters ";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		var re_email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if(userToUpdate.eMail==undefined || !re_email.test(userToUpdate.eMail)){//check the email
			$scope.message = "This email is invalid ";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		$log.log("Role:" + userToUpdate.Role);
		var updated_user={Role:category.Role,UserName:userToUpdate.UserName, Name:userToUpdate.Name, eMail:userToUpdate.eMail};
		$http.post("http://localhost:3000/updateUser", {
				user_before_update: user_before_update,updated_user:updated_user
			}).then(
				function (response) { //success callback   

				$scope.users = response.data.users;
                   				
					
				},
				function (response) { //failure callback
					
					
				}
			);
	}
	
	$scope.repeat_message = function()
	{
		if(incorect_password == true)
		{
			angular.element(change_password_modal).modal("show");
			incorect_password = false;
		}
		if(incorect_current_password==true)
		{
		   angular.element(validation_current_password_modal).modal("show");
		   incorect_current_password =false;
		}
		if(missing_role_field == true)
		{
			angular.element(add_new_role_modal).modal("show");
		   missing_role_field =false;
		}
		if(missing_status_field ==true)
		{
			angular.element(add_new_status_modal).modal("show");
			missing_status_field =false;
		}
		if(missing_role_field_calendar == true)
		{
			angular.element(add_event).modal("show");
		   missing_role_field_calendar =false;
		}
	}
	
	$scope.change_password_function = function(new_password)
	{
		var re_password = /^((?!.*[\s])(?=.*[A-Z])(?=.*\d))(?=.*?[#?!@$%^&*-]).{8,15}$/;
		if($scope.new_password==undefined || !re_password.test($scope.new_password)){//check the length of the password
			$scope.message = "The password must contain at least 8 to 15 characters , at least : one capital letter or one small letter, one number, and one of the following special characters: #?! @ $% ^ & * -";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			$scope.new_password=undefined ;
			$scope.verify_new_password=undefined;
			incorect_password = true;
			return;
			
			
		}
		if($scope.new_password!=$scope.verify_new_password){//check if the two password equals
			$scope.message = "The two passwords do not match";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			$scope.verify_new_password=undefined;
		    incorect_password = true;
			return;
		}
		var logged_in_new_password ={username:logged_in_user.UserName,new_password:$scope.new_password};
		$http.post("http://localhost:3000/changeCurrentPassword", {	
			logged_in_new_password: logged_in_new_password,
		}).then(
		   function (response) { //success callback
				$scope.new_password=undefined ;
			    $scope.verify_new_password=undefined;
			  
				$scope.message_type = "SUCCESS";
			    $scope.message = response.data.success;
			    angular.element(Message_Modal).modal("show");
				
					

			},
			function (response) { //failure callback
				
			}
		);
	}
	
    $scope.verify_password = function(current_password)
	{
	  var logged_in_current_password ={username:logged_in_user.UserName , current_password:current_password};
		$http.post("http://localhost:3000/verificationCurrentPassword", {	
			logged_in_current_password: logged_in_current_password,
		}).then(
			function (response) { //success callback
				$scope.current_password = undefined;
			  	if(response.data.verified == true)//the current password was verified for this username
				{
					$log.log("change_password_div");
					angular.element(change_password_modal).modal("show");
					$log.log("change_password_div");
				}
				else//the current password was not verified for this username
				{
				   $scope.message_type = "ERROR";
				   $scope.message = response.data.not_verified;
				   angular.element(Message_Modal).modal("show");
				   incorect_current_password = true;
				}
				$scope.current_password = undefined;
					

			},
			function (response) { //failure callback
				
			}
		);
		
		
	}
	
	$scope.delete_status_system_settings = function()
	{
			
        angular.element(delete_status_from_system_modal).modal("show");
		$scope.getOptionsList();

	}
	
	$scope.delete_status_from_system = function()
	{
		if(deleted_status == undefined){
		    $scope.message = "You must choose a status";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		$http.post("http://localhost:3000/deleteStatusFromSystem", {
				status_to_delete : deleted_status,
			}).then(
				function (response) { //success callback   
				},
				function (response) { //failure callback
					
				}
			);
	}
	
	
	 $scope.delete_status_role_settings = function()
	 {
		 angular.element(delete_status_from_role_modal).modal("show");
		 $scope.getRolesList();
	 }
	 
	 $scope.delete_status_from_role = function()
	 {
		if(category == undefined){
		    $scope.message = "You must choose a category";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		if(status_role==undefined ||status_role=="") 
		{
			$scope.message = "You must choose a status";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		var status_to_delete = {Role:category.Role , Status:status_role}
		$http.post("http://localhost:3000/deleteStatusFromRole", {
				status_to_delete : status_to_delete
			}).then(
				function (response) { //success callback 
				   $scope.roles = response.data.roles; 
				   $scope.options = response.data.statuses;
				   $scope.item = $scope.options[0];
				   $scope.role = $scope.roles[0];
					if($scope.roles[1]!=undefined)
					{
						$scope.status_role = $scope.roles[1].Statuses[0];
					}
					
				},
				function (response) { //failure callback
					 
					
				}
			);
	 }
	 
	$scope.insure_delete_all_contacts = function()
	{
		$scope.message = "Are you sure you want to delede all the contacts from system ? if you press OK, all contacts will be deleted and the information will be lost. ";
		$scope.message_type = "WARNNING";
		angular.element(Message_Modal_With_Cancel).modal("show");
		delete_all_contacts_flag = true;
	}
	$scope.insure_delete_all_users = function()
	{
		$scope.message = "Are you sure you want to delede all the users from system ? if you press OK, all users will be deleted and the information will be lost. ";
		$scope.message_type = "WARNNING";
		angular.element(Message_Modal_With_Cancel).modal("show");
		delete_all_users_flag = true;
	}
	
	$scope.response_ok = function()
	{
		$log.log("entered response_ok " +delete_all_contacts_flag);
		if(delete_all_contacts_flag == true)
		{
			$scope.delete_all_contacts();
			delete_all_contacts_flag = false;

		}
		if(delete_all_users_flag == true)
		{
			$scope.delete_all_users();
			delete_all_users_flag = false;

		}
	}
	
	$scope.delete_all_contacts = function()
	{
		$log.log("entered delete_all_contacts");

		$http.get("http://localhost:3000/deleteAllContacts").then(
			function (response) {//success callback
				$scope.message = response.data.message;
				$scope.message_type = "SUCCESS";
			    angular.element(Message_Modal).modal("show");
			},
			function (response) {//failure callback
				
			}	
		);
	}
	
	$scope.delete_all_users = function()
	{
		$log.log("entered delete_all_users");

		$http.get("http://localhost:3000/deleteAllUsers").then(
			function (response) {//success callback
				$scope.message = response.data.message;
				$scope.message_type = "SUCCESS";
			    angular.element(Message_Modal).modal("show");
			},
			function (response) {//failure callback
				
			}	
		);
	}
	
	$scope.user_selected = function(username)
	{
		var res = username.split(",");
		var res1=res[1].split(":");
		
		username_to_delete = res1[1].split(" ");
		username_to_delete = String(username_to_delete[1]);
		$log.log(username_to_delete);

	}
	
	$scope.delete_user = function(flag)
	{
		$log.log(flag);
		if(flag == undefined)
		{
			username_to_delete = username_to_delete;
		}
		else
		{
			username_to_delete = flag;
		}
		$http.post("http://localhost:3000/deleteUser", {
				username : username_to_delete,
			}).then(
				function (response) { //success callback   
				$scope.users = response.data.users;
				},
				function (response) { //failure callback
					
				}
			);
		$log.log(username_to_delete);
	}
	
	$scope.delete_role = function(role)
	{
		$log.log(role);
		$http.post("http://localhost:3000/deleteRole", {
				role : role.Role,
			}).then(
				function (response) { //success callback   
				$scope.roles = response.data.roles;
				$scope.role = undefined;
				selected_items = undefined;
				
				},
				function (response) { //failure callback
					
				}
			);
		
	}
	
	
    $scope.change_password = function()
	{
		
	    angular.element(validation_current_password_modal).modal("show");
	}
	$scope.sign_out = function()
	{
		$scope.all_system = false;
		$scope.login_page = true;
		$scope.temp_password = "";
	   $scope.show_contacts = false;
	   $scope.show_users = false;
	   $scope.show_settings = false;
	   $scope.show_calendar = false;
	   $scope.account = true;
	}
	

	}]).directive('popOver', function ($compile, $templateCache) {
        var getTemplate = function () {
            $templateCache.put('popover.html', 'This is the content of the template');
            console.log($templateCache.get("popover.html"));
            return $templateCache.get("popover.html");
        }
        return {
            restrict: "A",
            transclude: true,
            template: "<span ng-transclude></span>",
            link: function (scope, element, attrs) {
                var popOverContent;
                if (scope.History) {
                    var html = getTemplate();
                    popOverContent = $compile(html)(scope);                    
                    var options = {
                        content: popOverContent,
                        placement: "bottom",
                        html: true,
                        title: scope.title
                    };
                    $(element).popover(options);
                }
            },
            scope: {
                History: '=',
                title: '@'
            }
        };
    })

})();