(function() {
"use strict";
var app = angular.module("CRM",  [ "ngResource",'ui.calendar','ui.bootstrap','ui.bootstrap.datetimepicker','ngSanitize', 'ui.select','ngAnimate','toaster'])
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



.controller('CRM_controller', ['$scope','$compile','$http','$log','$timeout','sampleUploadService' ,'uiCalendarConfig','toaster',function($scope,$compile, $http,$log,$timeout,sampleUploadService,uiCalendarConfig,toaster) {	

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
	var delete_contact_flag = false;
	var delete_user_flag = false;
	var delete_all_users_flag = false;
	var missing_role_field_calendar = false;
	var missing_date_field_calendar = false;
	var username_to_delete;
	var deleted_status;
	var contact_to_delete ='';
    var selected_items= [];
	var history_array =[];
	var start_date,end_date;
	var selected_contact;
	var edit_event_detailes;
	var user_to_delete;
	
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
	$scope.show_outside = true;


	$scope.contactsInfo=[];
	$scope.users=[];
	$scope.options=[];
    $scope.roles=[];
    $scope.files=[];
	$scope.roles_colors=[];
	
	
	

	/*
		a modal that pops up when press on delete file,
		delete file by running over file list
	*/
   $scope.show_delete_file_modal = function()
   {	
		//get file list
	    $scope.getFilesList();
	   	angular.element(delete_file_modal).modal("show");

   }
	/*
		a function to render the calendar
	*/
	$scope.renderCalender = function() {
		$log.log('renderCalender');
    //console.log($scope.events)
		//uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEventSource', sourceFullView, $scope.events);
		$timeout(function() {
        if(uiCalendarConfig.calendars.myCalendar){
					$log.log('myCalendar');

          $('#calendar').fullCalendar('render');
        }
      });
  };
  
  /*
	calendar parameters
  */
  $scope.uiCalendarConfig = uiCalendarConfig;
  $scope.events = [];
  $scope.eventSources = [$scope.events];

  /*
	format of calendar components
  */
  $scope.calendarConfig = {
	header:{
		 left: 'prev,next, today',
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

	aspectRatio: 1.5,
    selectable: true,
    selectHelper: true,
    editable: true,
	eventLimit:true,
	renderCalender: $scope.renderCalender(),

	/*
		select date whith clicking trigger 
		and save start and end date in format : "DD/MM/YYYY HH:mm"
	*/
	select: function(start, end, allDay, jsEvent) {
		$log.log("start: "+ moment(start).format("DD/MM/YYYY HH:mm"));
		//get start date
		start_date = moment(start).format();
		$log.log("end: "+ moment(end).format());
		//get end date
		end_date = moment(end).format();
		
		//date in format = 'starn date' - 'end date' 
        $scope.date = moment(start).format("DD/MM/YYYY HH:mm")+ ' - ' + moment(end).format("DD/MM/YYYY HH:mm");
		//get roles list
        $scope.getRolesList();
		$scope.role = $scope.roles[0].Role;
		$scope.contact_task = undefined;
		$scope.title = undefined;
	
		//show modal of add event
		angular.element(add_event).modal("show");

    },
	
	/*
		event trigger : click on the task in calenda to edit or delete it 
	*/
	eventClick: function(event, element) {
		//get details of edit event
		edit_event_detailes = event;
		
		//if a contact was not selected for the event, the event id is = "-1"
		if(edit_event_detailes.id != "-1")
		{
			//split title by ':'	
			var title = event.title.split(":");
			
			//save the event id
			$scope.contact_event = event.id;
			
			//save the event title
			$scope.event_title = title[1];
			
			//when contactSelected = true then there is a contact selected 
		    $scope.contactSelected = true;

		}
		
		//if no contact was selected for the event then $scope.contactSelected = false;
		else
		{
			$scope.event_title = event.title;
		    $scope.contactSelected = false;
		}

			
		$scope.event_start = event.start;
		$scope.event_end = event.end;
		$scope.event_date = moment(event.start).format("DD/MM/YYYY HH:mm")+ ' - ' + moment(event.end).format("DD/MM/YYYY HH:mm");
		$scope.taskIsEdit = false;

			//show modal for edit or delete event
			angular.element(edit_or_delete_event).modal("show");
		}
		
	
	
  };
	
	/*
		save edit event details :
		ID, title, start and end date, color of event
		
	*/
	$scope.save_edit_event = function() { 
		//$log.log("edit");
		
		edit_event_detailes.title = "Task for contact "+ selected_contact.Name +" "+ selected_contact.PhoneNumber+" : "+$scope.event_title;
		edit_event_detailes.start = $scope.event_start;
		edit_event_detailes.end = $scope.event_end;
		edit_event_detailes.color = $scope.role.Color;
		edit_event_detailes.id = selected_contact.Name +" "+ selected_contact.PhoneNumber;
		
		//update the event details in the calendar
		uiCalendarConfig.calendars.myCalendar.fullCalendar('updateEvent', edit_event_detailes);	
		$scope.selections = [];

	};
   
	/*
		when click on task for contact 
		go to the contact from contacts list
	*/
    $scope.go_to_contact = function() { 
		
		//get contacts phone number as an ID 
		var contact_phone_number = $scope.contact_event.split(" ");

		//get contacts list	
		$scope.get_contacts_function();

		//put contacts phone number in search bar 
		$scope.search_contats = contact_phone_number[1];
		
		//hide the 'edit_or_delete_event' modal 
	    angular.element(edit_or_delete_event).modal("hide");

	}; 
	
	//add event from button outside of the calendar
	$scope.add_even_outside_calendar = function() { 
	
		//show 'add_event_outside' modal
		angular.element(add_event_outside).modal("show");

	}; 
	
	
	$scope.calendarContact = function(contact) { 
	
	    /*var event_id = contact.Name +" "+ contact.PhoneNumber;
		$log.log("event_id : " + event_id);
	    $scope.events = uiCalendarConfig.calendars.myCalendar.fullCalendar('clientEvents', event_id);
	   
		$log.log("$scope.events : " + $scope.events);*/
	    $scope.calendar_function();
		
	};
  
   
	$scope.deleteEvent = function( event, element, view ) { 
        uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents', function (event) {
			
			/*
				delete event from mongodb 
				and from cotacts events list 
			*/
				return event == edit_event_detailes;
			});

    };
	
	$scope.eventRender = function( event, element, view ) { 
          $(element).popover({title: event.title, content: event.description, trigger: 'hover', placement: 'auto right', delay: {"hide": 300 }});             

    };
	
	//array of contacts
	$scope.selections = [];
  
	/*
		select contact from contacts list in the edit or delete modal
	*/
	$scope.selectionChanged = function(idx) {
		$log.log(idx, $scope.selections[idx]);
		
		//save details of selected contact
		selected_contact = $scope.selections[idx];
		//$scope.$apply();

	
	};
	
	$scope.selected = {};
	$scope.selectAll = function(flag,users_or_contacts){
		var arr;
		var id;
		
		if(users_or_contacts=='users')
		{
			 arr = $scope.users;
			 id = 'UserName';
		}
		else
		{
			 arr = $scope.contactsInfo;
			 id = 'PhoneNumber';


		}
		for (var i = 0; i < arr.length; i++) {
		var arrInfo = arr[i];
		
		
			if(id == 'UserName')
			{
				$scope.selected[arrInfo.UserName] = flag;
			}
			else
			{
				$scope.selected[arrInfo.PhoneNumber] = flag;

			}
			//$log.log("id : " +arrInfo.UserName);
			
	  } 
	
	  
	};
	
	$scope.send_email_to_selected_contacts = function(users_or_contacts){
		var emails_list_str="";
		var arr;
		var id;
		if(users_or_contacts=='users')
		{
			 arr = $scope.users;
			 id = 'UserName';
		}
		else
		{
			 arr = $scope.contactsInfo;
			 id = 'PhoneNumber';


		}
		
		
		for (var i = 0; i < arr.length; i++)
		{
			var arrInfo = arr[i];
			if(id == 'UserName')
			{
				if($scope.selected[arrInfo.UserName] == true)
				{
					emails_list_str = get_string_of_all_emails(emails_list_str,arrInfo,i);
				}

			}

			else
			{
				if($scope.selected[arrInfo.PhoneNumber] == true)
				{
					emails_list_str = get_string_of_all_emails(emails_list_str,arrInfo,i);

				}
			}

			
		}

		$scope.contact_email = emails_list_str;
		angular.element(Email_modal).modal("show");

	};
	
	function get_string_of_all_emails(emails_list_str,selected_email,i)
	{
		if(i%3===0)
		{
			$log.log("i = "+i );
			emails_list_str = emails_list_str+"\n"+ selected_email.eMail+','
		}
		else
		{
			emails_list_str = emails_list_str+ selected_email.eMail+','

		}
		
		return emails_list_str;
		
	}
	
	function convert_date_format(str) {
	  var date = new Date(str),
	  mnth = ("0" + (date.getMonth() + 1)).slice(-2),
	  day = ("0" + date.getDate()).slice(-2);
	  var MM = String(date.getMinutes()).padStart(2, '0');
	  var HH = String(date.getHours()).padStart(2, '0');
	  date =[day,mnth,date.getFullYear()].join("/");
	  var time = [HH,MM].join(":");
	  var full_date = [date,time].join(" ");
	  $log.log(full_date) ;
	  return full_date;
	 // $log.log([day,mnth,date.getFullYear()].join("/")) ;
    }
	  

	/*
		a function for adding a task from calendar when press on a day in calendar,
		there is an option to add a the task for a spesific contact 
	*/
	$scope.addEvent = function(task_with_contact,outside_modal) {
		/*
			save the dates in a range of dates in the task in format 'start_date - end_date'
			by splitting with "-"
		*/
		if(outside_modal==false)
		{
			var date = $scope.date.split("-");
			$log.log("start date : " + date[0]);
			$log.log("task_with_contact : " + task_with_contact);
			//$log.log("type "+typeof date[0]);
			$log.log("end date : " + date[1]);
			var start_date= moment(date[0], 'DD/MM/YYYY HH:mm').format("MM/DD/YYYY HH:mm");
			var end_date= moment(date[1], 'DD/MM/YYYY HH:mm').format("MM/DD/YYYY HH:mm");
			$log.log("start date : " + start_date);
			$log.log("start date : " + end_date);
		}
		else
		{
			if($scope.event_start == undefined || $scope.event_start == ""||$scope.event_end == undefined || $scope.event_end == "")
			{
				$scope.message = "start and end date are must fields, please fill them in";
				$scope.message_type = "ERROR";
				angular.element(Message_Modal).modal("show");
				missing_date_field_calendar= true;
				return;
			}
		    $log.log("start date outside $scope.event_start: " + $scope.event_start);
            var start_date = convert_date_format($scope.event_start);
            var end_date = convert_date_format($scope.event_end);

		}
		
		//$log.log("end date : " + formatDate(date[1]));
		$log.log("$scope.role : "+$scope.role.Role);
		
		//check if the role category was selected in the task modal - this is a must field
		if($scope.role.Role == undefined || $scope.role.Role == "" || $scope.role.Role == "-- Choose category for role --")
		{   
			$scope.message = "Category is a must field, please select one";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			if(outside_modal==false)
			{
				missing_role_field_calendar= true;
			}
			else
			{
				missing_date_field_calendar= true;
			}
			return;
		}
		
		//check if the title field was filled in the task modal - this is a must field
		if($scope.title == undefined || $scope.title == "")
		{   
			$scope.message = "Title is a must field, please fill it in";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			if(outside_modal==false)
			{
				missing_role_field_calendar= true;
			}
			else
			{
				missing_date_field_calendar= true;
			}
			return;
		}
		
		/*
			check if the task was chosen for a spesific contact - optional
			then id = "contact name" + " contact phone number"
		*/
		if(task_with_contact==true)
		{
			var description = "Task for contact "+ selected_contact.Name +" "+ selected_contact.PhoneNumber+" : "+$scope.title;
			var contact = selected_contact.Name +" "+ selected_contact.PhoneNumber;
		}
		
		//if the task is not for a spesific contact -> id of contact = '-1'
		else
		{
			var description = $scope.title;
			var contact = -1;	
		}
		
		$log.log("description: "+description);

		//add (push) event with details to events list
		$scope.events.push({
			title: description,
			start: start_date,
			end:  end_date,
			color: $scope.role.Color,
			id : contact,
			editable: true
		});
		$scope.selections = [];
		uiCalendarConfig.calendars.myCalendar.fullCalendar('refetchEvents');



	//  console.log($scope.pendingRequests);
    };

	//modal for sending mail to a contact
	$scope.sendMailModal = function(contact_email)
	{	
		$log.log("contact_email :"+contact_email);
		//check if the contact that was pressed on has an email address
		if(contact_email == "" || contact_email == null )
		{
		   toaster.pop('error', "No email for this contact", "");
		   return;
		}
		
		$scope.getFilesList();
		//save the chosen contacts email
		$scope.contact_email = contact_email;
		angular.element(Email_modal).modal("show");

		
	}	
	
	
	

	/*
		send email function and http post call to server 
		with contact and email details
	*/
	$scope.sendEmail = function(contact_email,email_subject,email_body,attachment_file_name='myfile.txt')
	{

		var email_data={mail_recipient:contact_email, mail_subject:email_subject,
			mail_text:email_body,attachment_file_name:attachment_file_name};
		$http.post("http://localhost:3000/sendEmail", {
			email_data:email_data
		}).then(
			function (response) {
				console.log(response.data.error)
				console.log(response.data.ok)
				$scope.contact_email = "";
				$scope.email_subject = "";
				$scope.email_body = "";
				$scope.email_file = false;
				$scope.selections = [];
				

				if(response.data.ok!=undefined)
				{
					toaster.pop('success', response.data.ok, "");
					return;
				}
				
				toaster.pop('error', response.data.error, "");

				


			},
			function (response) { //failure callback


			}
		);
	}	
	
	
	//first load of system when conect to it
	$http({method : "GET",
			url : "firstSystemLoad"
		  }).then(function(response) {
			  
		$scope.first_load = false;
		$scope.not_first_load = false;
		
		/*
			check if this is the first load of the system - 
			means that administrator has not yet changed the temporary password 
			that he got with the system	- then change now
		*/	
		if(response.data.admin_first_load == true || response.data.admin_changed_temp_password == false)//go to change password page
		{
			//save 'first_load = true'
			$scope.first_load = true;	
			
			//present the temp password page 
			$scope.temp_password_page = true;
			
        }
		
		/*
			if admin had changed the temporary password 
			so then it is not the firt load to yhe system
		*/
        else if(response.data.admin_changed_temp_password == true)	
		{
			//save taht not first load 'first_load = false'
			$scope.first_load = false;
			
			//save that is not the first load 'not_first_load = true' 
			$scope.not_first_load = true;
			
			//present the tamp password page for login in to the system
			$scope.temp_password_page = true;
		}

		/*
			after entering the system with the temp password 
			presents the login page for inserting personal details
			for admin the usae name field will be filled in automaticly 
			by the default with "Administrator" 
		*/
		else
		{
			$scope.login_page = true;
			$scope.first_load = false;	
		}
			
			}, function (response) {
    });	
 
 
	//a function for clicking on select file to system
	$scope.clickSelectFile = function () {
	   angular.element("#fileUploadField").click();
	};
	angular.element("#fileUploadField").bind("change", function(evt) {
	    if (evt) 
		{
			var fn = evt.target.value;
			if (fn && fn.length > 0) 
			{
				var idx = fn.lastIndexOf("/");
				if (idx >= 0 && idx < fn.length) 
			    {
					$scope.uploadFileName = fn.substring(idx+1);
			    } 
				else 
				{
					idx = fn.lastIndexOf("\\");
					if (idx >= 0 && idx < fn.length) 
					{
						$scope.uploadFileName = fn.substring(idx+1);
				    }
			   }
			}
			$scope.$apply();

	    }
	});
    /*
		a function for uploading a file
	*/
	$scope.doUpload = function () {
	    $scope.uploadSuccessful = false;
	    var elems = angular.element("#fileUploadField");
	    if (elems != null && elems.length > 0) {
		    if (elems[0].files && elems[0].files.length > 0) 
			{
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
		    } 
			else {
				toaster.pop('error', "No file has been selected for upload.", "");
				return;
		    }
	    }
	};

	//clear the field of the file name that has been uploaded
	function clearFileUpload()
	{
		$scope.uploadFileName = "";
		angular.element("#fileUploadField").val(null);
	}
	
	//add file to system function
	$scope.add_file = function () 
	{
		//show modal for add file
		angular.element(add_file_modal).modal("show");
		
	}
	
	/*
		a validation function with http.post request to server for temporary password
		checks if the temp password from client side 
		is equal to the temp password in server side
	*/
    $scope.validation_of_temp_password = function(tempPasswordFromClient)
	{
		//$log.log("validation_of_temp_password :" + tempPasswordFromClient);
		$http.post("http://localhost:3000/verifyTemporaryPassword", {
			tempPassword: tempPasswordFromClient,
		}).then(
			function (response) {//success callback

			//verified passwords (not for Admin user)
			if(response.data.verified == true)
			{
				$scope.new_temp_password_page = false;
				$scope.temp_password_page = false;
				$scope.register_page =true;
			}
			
			//admin did not yet change temp password that he got with the system
			else if(response.data.admin_changed_temp_password == false)  			
			{
				$scope.new_temp_password_page = true;
				$scope.temp_password_page = false;
				
				$scope.register_page = false;
			}
			
			//admin changed temp password that he got with the system
			else if(response.data.admin_changed_temp_password == true)  			
			{
				$scope.new_temp_password_page = false;
				$scope.temp_password_page = false;
				$scope.register_page =true;
				$scope.registration_user_name = "Admin";
				$scope.Admin = true;
			}
			
			//not correct temprorary password
			else
			{
				$scope.message = response.data.not_verified;
				$scope.message_type = "ERROR";
				angular.element(Message_Modal).modal("show");
			}
			},
			
			//failure callback
			function (response) {
			    
			}	
		);	
	}
	
	/*
		a function for administrator for changing the temp password
	*/
	$scope.change_temp_password = function()
	{
		//a regular expression for a valid password
		var re_password = /^((?!.*[\s])(?=.*[A-Z])(?=.*\d))(?=.*?[#?!@$%^&*-]).{8,15}$/;
		
		//check the length of the password and if it fits the regular expression pattern
		if($scope.new_temporary_password==undefined || !re_password.test($scope.new_temporary_password)){
			$scope.message = "The password must contain at least 8 to 15 characters , at least : one capital letter or one small letter, one number, and one of the following special characters: #?! @ $% ^ & * -";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//check if the two password equals
		if($scope.new_temporary_password!=$scope.new_temporary_validation_password){
			$scope.message = "The two passwords do not match";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
		    $scope.new_temporary_validation_password=undefined;
			return;
		}
		
		//an http request to server to update the temporary password
		var new_temp_password ={TempPassword:$scope.new_temporary_password};
		$http.post("http://localhost:3000/changeTemporaryPassword", {
			new_temp_password: new_temp_password,
		}).then(
			function (response) { //success callback
			  
				$scope.new_temporary_password = $scope.new_temporary_validation_password = undefined ;
				$scope.register_page = true;
				$scope.registration_user_name = "Admin";
				$scope.Admin = true;
				$scope.new_temp_password_page = false;
				$scope.first_load = false;
					
			},
			function (response) { //failure callback
				
			}
		);
	}
	
	/*
		when a user signes up / registers to the system 
		this function checks validation of users details 
		and send them when all are valid to server in an http post request
	*/
	$scope.signUp = function()
	{
	    var re_username = /^[a-zA-Z]{3,10}$/;
		var re_name = /^[a-zA-Z\s\u0590-\u05fe]{2,20}$/;
		
		//check if user name has been entered and if it is valid according to the matching regular expression pattern
		if($scope.registration_user_name==undefined ||!re_username.test($scope.registration_user_name)){
		    $scope.message = "User name must contain only English letters ,minimum 3 leterrs and maximum 10 letters and no whitespace";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//check if the name has been entered and if it is valid according to the matching regular expression pattern
		if($scope.registration_name==undefined ||!re_name.test($scope.registration_name)){
			$scope.message = "The name must contain only English or Hebrew letters ,minimum 2 leterrs and maximum 20 letters ";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		var re_email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		
		//check if the email has been entered and if it is valid according to the matching regular expression pattern
		if($scope.registration_email==undefined || !re_email.test($scope.registration_email)){
			$scope.message = "This email is invalid ";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		var re_password = /^((?!.*[\s])(?=.*[A-Z])(?=.*\d))(?=.*?[#?!@$%^&*-]).{8,15}$/;
		
		//check if a password has been entered and if it is valid according to the matching regular expression pattern
		if($scope.registration_password==undefined || !re_password.test($scope.registration_password)){
			$scope.message = "The password must contain at least 8 to 15 characters , at least : one capital letter or one small letter, one number, and one of the following special characters: #?! @ $% ^ & * -";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//check if the validation password is equal to the first password that was entered
		if($scope.registration_password!=$scope.registration_validation_password){
			$scope.message = "The two passwords do not match";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			$scope.registration_validation_password=undefined;
			return;
		}
		
		
		//save users valid details as a json object
		var user={UserName:$scope.registration_user_name, Name:$scope.registration_name,
				  eMail:$scope.registration_email,Password:$scope.registration_password};
		$log.log("befor call server");
		 //call server with http request
		$http.post("http://localhost:3000/addUser", {
			user: user,
		}).then(
			function (response) { //success callback
			
				//get response from server
			    var user_from_server = response.data.user;
				logged_in_user = user_from_server;
			    
				//check if this user name does not exist already
               	if(!response.data.user_exists)	
				{
					$log.log(user_from_server.Name);
					
					//clear all fields in registration page
					$scope.registration_user_name = undefined;
					$scope.registration_name = undefined;
					$scope.registration_email = undefined;
					$scope.registration_password = undefined;
					$scope.registration_validation_password = undefined;
					
					//show menu system components and user profile of account
					$scope.menu = true;
					$scope.all_system = true;
					$scope.account = true;
					$scope.name_of_user = user_from_server.Name;
					$scope.role_of_user = user_from_server.Role;
					$scope.register_page = false;
					
					//get lists of : optiont, roles, roles colors, contacts and files
					$scope.getOptionsList();
					$scope.getRolesList();
					$scope.getRolesColorsList();
					$scope.getContactsList();
					$scope.getFilesList();

					$scope.getUsersList('showUsers');
					
					//if user logged in is administrator show admin page and update that admin is logged in -> $scope.isAdmin = true
					if(user_from_server.is_admin==true)
					{
						$scope.admin_page = true;
						$scope.isAdmin = true;
						
					}
					
					//if not admin logged in hide admin page and update that not admin logged in -> $scope.isAdmin = false
					else
					{
						$scope.admin_page = false;
						$scope.isAdmin = false;
					}
					
					$log.log(user_from_server.UserName);
					
				}
				
				//if this user name already exists in system -> show error modal
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

	/*
		a function for login to system after the user is registed already
		login with user name and password 
		and verify details with thoes at server by sending the data in http request
	*/
	$scope.login = function(){
	$log.log("UserNameLogin "+$scope.UserNameLogin)
	
		//check if user name has been entered -> requierd
		if($scope.UserNameLogin == undefined || $scope.UserNameLogin == "")
		{
			$scope.message = "User name is required";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
			
		//check if password has been entered -> requierd 
		if($scope.PasswordLogin == undefined || $scope.PasswordLogin == "")
	    {
			$scope.message = "Password is required";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;

		}
				
		/*
			a function for saving the user that is logged in details
		*/
		var LoginUser={UserName:$scope.UserNameLogin, Password:$scope.PasswordLogin};
		$http.post("http://localhost:3000/login", {
			LoginUser: LoginUser,
		}).then(
			function (response) { //success callback 

				//get data from server response
				LoginUser = response.data.user_login;
				logged_in_user = LoginUser;
				
				//if there is a match between user name and password at server side
				if(!response.data.no_match)
				{
					//if admin show admin page and update that admin is logged in
					if(LoginUser.adminUser == true)
					{
						$scope.admin_page = true;
						$scope.isAdmin =true;
					}
					
					//if not admin hide admin page and update that not admin is logged in
					else
					{
						$scope.admin_page = false;
						$scope.isAdmin =false;
					}
					
					//clear fields in login page
					$scope.UserNameLogin = undefined;
					$scope.PasswordLogin = undefined;
					
					//show menu and user profile in account and hide the login page
					$scope.menu = true;
					$scope.account = true;
					$scope.login_page = false;
					
					$scope.name_of_user = LoginUser.Name;
					$log.log("role_of_user: "+LoginUser.Role);
					$scope.role_of_user = LoginUser.Role;
					$scope.all_system = true;
					
					//get lists of : optiont, roles, roles colors, contacts files and users
					$scope.getOptionsList();
					$scope.getRolesList();
					$scope.getRolesColorsList();
					$scope.getContactsList();
					$scope.getFilesList();
					$scope.getUsersList('showUsers');
					

				}
				
				//if there is no match show error modal
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
	
    /*
		a function for showing the list of contacts
	*/
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
    
	/*
		a function for checking if a color already exists in the colors list
		the function gets a color and runs over the lis of colors a nd checks if the color exists
		returns true if exists else returns false
	*/
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


	/*
		a function for saving a role with a list of statuses that have been selected
		each role has an uniq color
	*/
	$scope.save_new_role_status = function()
	{
		$log.log(document.getElementById("role_color").value);
		
		//get a color from user
		var role_color = document.getElementById("role_color").value;
		var color = role_color.toString();
		$log.log("color: "+ color);
		
		//check if color exists
		var existing_color = $scope.check_exsisting_color(color);
		$log.log("existing_color: "+ existing_color);
		
		//check if the role field in modal has been filled in if not show error modal
		if($scope.role_from_modal == undefined || $scope.role_from_modal == "")
		{
			$scope.message = "You must fill in the role field";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			missing_role_field = true;
		}
		
		//if color exists show error modal
		else if(existing_color == true)
		{
            $log.log("entered existing_color: "+ existing_color);

			$scope.message = "This color already exist, please choose different color";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			missing_role_field = true;
		}
		
		//if color does not exist send an http request to server with role details : role color and matching statuses list
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
	
	//a function for showing roles list
	$scope.display_role_list = function()
	{
		$scope.getRolesList();
		angular.element(delete_role_modal).modal('show');
	}

	
	/*
		a function for saving a new status in system with a list of matching roles
		and calling server with http request
	*/
	$scope.save_new_status_roles = function()
	{	
		//check if the status field in modal has been filled in if not show an error modal
		if($scope.status_from_modal == undefined || $scope.status_from_modal == "")
		{
			$scope.message = "You must fill in the status field";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			missing_status_field = true;
		}
		
		//if the status field is filled in
		else
		{
			//save details in json object : status and roles list and call server with http request
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
	
	/*
		a function for adding a new role with statuses there is an http call to server 
		for getting the status collection list
		for selecting matching statuses to this role
	*/
	$scope.add_new_role = function()
	{
		$log.log("entered add_new_role() = function()");
		$http.get("http://localhost:3000/getStatusOptions").then(
			function (response) {//success callback
			
				//return the list of the statusOptions
				$scope.options = response.data.statusOptions;
				$scope.item = $scope.options[0];
				//get roles colors list
				$scope.getRolesColorsList();
				angular.element(add_new_role_modal).modal("show");
				$scope.role_from_modal = undefined;
				
				//the list of selected items
				selected_items = [];
			},
			function (response) {//failure callback
				//if failed show error modal
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
	}

    /*
		a function for showing the calendar page
		and hiding all other pages that are not relevant
	*/
	$scope.calendar_function = function()
	{
	   $scope.login_page = false;
	   $scope.show_contacts = false;
	   $scope.show_calendar = true;
	   $scope.show_users = false;
	   $scope.show_settings = false;
	   $scope.account = false;
       $scope.getRolesList();
	   
	   //clearing the search field
	   $scope.search = "";
		//uiCalendarConfig.calendars['myCalendar'].fullCalendar('refetchEvents');
		setTimeout(function () {
		uiCalendarConfig.calendars['myCalendar'].fullCalendar('render');
        }, 5); // Set enough time to wait until animation finishes;
		


	   
	}
   
    /*
		a function for showing the settings page
		and hiding other pages that are not relevant
    */
	$scope.settings_function = function()
	{
		//$log.log("entered settings function");
		$scope.show_settings = true;
		$scope.login_page = false;
		$scope.show_contacts = false;
		$scope.show_users = false;
		$scope.show_calendar = false;
		
		//clearing the search field
		$scope.search = "";
	}
	
	/*
		a function for adding a new contact to system
		shows the matching 'div' in html page
	*/
	$scope.add_contact_function = function()
	{
		//update the parameter 'get_new_contact_details' to true for shoing the div
	    $scope.get_new_contact_details = true;
		$scope.click = false;
	}
	
	/*
		a function for closeing the option of contact addition
		and clearing fields to be undefined
	*/
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
	
	/*
		get the list of statuses from the server with an http request 
	*/
	$scope.getOptionsList = function()
	{
		$log.log("entered getStatusList() = function()");
		$http.get("http://localhost:3000/getStatusOptions").then(
			function (response) {//success callback
			
				//return the list of the statusOptions
				$scope.options = response.data.statusOptions;
				$scope.item = $scope.options[0];
			},
			function (response) {//failure callback
			
				//if fails show error modal
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
	   
	
	}
	
	/*
		get the the list of colors for roles from server 
		with http request to sever
	*/
	$scope.getRolesColorsList = function()
	{
		$log.log("entered getStatusList() = function()");
		$http.get("http://localhost:3000/getRolesColors").then(
			function (response) {//success callback
			
				//return the list of the colors
				$scope.roles_colors = response.data.colors;
				$log.log("roles_colors : " + $scope.roles_colors);
			},
			function (response) {//failure callback
			
				//if fails show error modal
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
	   
	
	}
	
	/*
		get the the list of roles from server 
		with http request to sever
	*/
	$scope.getRolesList = function()
	{
		$log.log("entered getRolesList() = function()");
		$http.get("http://localhost:3000/getRoles").then(
			function (response) {//success callback
			
				//return the list of the roles
				$scope.roles = response.data.roles;
				$scope.role = $scope.roles[0];
				
				//if there  are statuses for this role
				if($scope.roles[1] != undefined)
				{
					//returns the status list for the current role
					$scope.status_role = $scope.roles[1].Statuses[0];
				}
			},
			function (response) {//failure callback
			
				//if fails show error modal
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
	   
	
	}

    /*
		a function for saving the deatailes of contact before update
	*/
	$scope.update_contact_function = function(contact)
	{	
		//get all details of contact in json format
		contact_before_update = {Category:contact.Category, Name:contact.Name,Status:contact.Status, PhoneNumber:contact.PhoneNumber, eMail:contact.eMail, Address:contact.Address};
		$scope.update_status = contact_before_update.Status;
	}
	
	/*
		a function for saving the deatailes of user before update
		the function gets the parameter 'user' that contains selected users details
	*/
	$scope.update_user_function = function(user)
	{
		//get all details of user in json format
		user_before_update = {Role:user.Role,Name:user.Name,UserName:user.UserName, eMail:user.eMail};	
	}

    /*
		a function for showing the modal with a new status addition
		the parameter 'option' is the chosen status
	*/
	$scope.onChange = function(option){
		$log.log("option : "+option);
		status_role = option;
		if(option == new_status_option)
		{
		    angular.element(add_new_status_modal).modal("show");
		}
	}

	/*
		a function for saving the role that was chosen
	*/
	$scope.onChangeCategory = function(option,flag){
		$log.log("option : "+option.Role);
		category = option;
		if(flag == 'update role')
		{
			category = option.Role;
		}
	}
	
	
	/*
		a function for saving selected items from selected lists
		save according to flag
	*/
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
	
	/*
		a function for deleting file from the system (from server as well)
		with http request to server with the selected file
	*/
	$scope.delete_file = function(file)
	{
		
	    $log.log("file :"+ file.FileName);

		
		var file = {FileName:file.FileName}
		$http.post("http://localhost:3000/deleteFile", {
				file: file,
			}).then(
				function (response) { //success callback  
                    
				},
				function (response) { //failure callback
					
				}
			);
		
	}
	
	
	/*
		a function for adding a new status to a role
		with an http request to server 
	*/
	$scope.add_new_status_to_role = function()
	{
		
		$log.log("entered add_new_role() = function()");
		$http.get("http://localhost:3000/getRoles").then(
			function (response) {//success callback
			
				//return the list of the roles
				$scope.roles = response.data.roles;
	            $scope.role = $scope.roles[0];
				
				//if there are statuses for this role return its arry of statuse
				if($scope.roles[1]!=undefined)
				{
					$scope.status_role = $scope.roles[1].Statuses[0];
				}
				//show modal for adding a new status
			    angular.element(add_new_status_modal).modal("show");

			},
			function (response) {//failure callback
			
				//if fails show error modal
			    $scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);

	}

	/*
		a function for shoing the modal for 
		adding a new status to the system
	*/
	$scope.add_new_status_to_system = function()
	{
		//get the status list
		$scope.getOptionsList();
		
		//show add new status modal
		angular.element(add_new_status_to_system_modal).modal("show");
	}
	
    /*
		a function for saveing the new status from the modal in server
		with http request
	*/
	$scope.save_new_system_status = function()
	{
		//if there was chosen a ststus in modal
		if($scope.system_status_from_modal != undefined && $scope.system_status_from_modal != "")
		{
			//save the chosen status in json format
			var new_status= {Status:$scope.system_status_from_modal};
			$http.post("http://localhost:3000/addOption", {
			new_status: new_status,
			}).then(
			function (response) { //success callback
			
				//clear the field of new status and get the updated ststuses list 
				$scope.newStatus="";			  
			    $scope.getOptionsList();				
			},
			function (response) { //failure callback
			
				//if fails show error modal
				$scope.message = response.data.error;
				$scope.message_type = "ERROR";
				angular.element(Message_Modal).modal("show");
			}
			);
			
		}
		
		//if there was no status selected in modal
		else
		{
			//show error modal
			$scope.message = "You must enter a status";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			
		}
		
		//clear the field in modal
		$scope.system_status_from_modal =undefined;
	}
	
	
	/*
		 a function for shoing modal of update role
	*/
	$scope.update_role = function()
	{
		angular.element(update_role_modal).modal("show");
	}
	
	/*
		a function for updating a role with new statuses
		and sending it to server 
	*/
	$scope.update_role_with_statuses = function()
	{
		//if there was no role chosen show an error modal
		if(category == undefined)
		{
		    $scope.message = "You must choose a role";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//if there were no statuses selected for the role show an error modal
		if(selected_items == undefined) 
		{
			$scope.message = "You must choose a status";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//save in json format the role that was chosen with the statuses that were selected 
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
					
					//if fails show error modal
					$scope.message = response.data.error;
					$scope.message_type = "ERROR";
					angular.element(Message_Modal).modal("show");
				}
			);
		
	}
	
		
	/*
		get the contacts list from server with http request
	*/
	$scope.getContactsList = function(){
		 $http.get("http://localhost:3000/getContacts").then(
			function (response) {//success callback
			
				//return the list of the contacts
				$scope.contactsInfo = response.data.contacts;
				
			},
			function (response) {//failure callback
				
			}	
		);
		
	}	
	
	/*
		get the files list from server with http request
	*/
	$scope.getFilesList = function(){
		 $http.get("http://localhost:3000/getFiles").then(
			function (response) {//success callback
			
				//return the list of the files
				$scope.files = response.data.files;
			},
			function (response) {//failure callback
			}	
		);
	}
	
	/*
		a function for getting the list of users from server with http request
	*/
	$scope.getUsersList = function(flag){
		$log.log("flag : " + flag);
		 $http.post("http://localhost:3000/getUsers", {	
			status_flag: flag,
		}).then(
			function (response) {//success callback
			
			//return the list of the users
			$scope.users = response.data.users;
			
			//if was chosen to delete the user
			if(response.data.deleteUser == true)
			{
				//show modal for deleting the user
				$scope.message_type = "Choose user to delete";
		        angular.element(delete_modal).modal("show");
			}
							
			},
			function (response) {//failure callback
			
				//if faild show error modal
				$scope.message = response.data.error;
				$scope.message_type = "ERROR";
			    angular.element(Message_Modal).modal("show");
			}	
		);
		
	}
	
	/*
		a function for shing the users list in page in html 
		and getting the list of the users and list of roles
	*/ 
	$scope.get_users_function = function(flag){
		$scope.show_users = true;
		
		//hide the parts in html that are not relevant to users tab 
		$scope.show_settings = false;
		$scope.show_contacts = false;
		$scope.show_calendar = false;
		
		$scope.account = true;
		$scope.getUsersList(flag);
		$scope.getRolesList();
		
	}
 
 
    /*
		a validation function for checking all new contact fildes
		if there was an error in 1 field show error modal
	*/
	$scope.check_and_save_details = function()
	{
		//check if a role was chosen
	    if(category == undefined)
		{
		    $scope.message = "You must choose a category";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//check if status has been chosen
		if(status_role == undefined || status_role == "") 
		{
			$scope.message = "You must choose a status";
			$scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//if the status that was chosen is equal to "add a new status"
		else if(status_role == new_status_option)
		{
			//then clear the field of the status
			if (status_role == new_status_option)
			{
				status_role = "";
			}
			
			//save the status that was before the update
			status_role = contact_before_update.Status;
		}
	
		//check the name field if there was entered a new name 
		if($scope.newName==undefined || $scope.newName== "")
		{
			$scope.message_type = "ERROR";
			$scope.message = "You must enter a name";
			angular.element(Message_Modal).modal("show");
			return;
			
		}
		
		//if there was a new name entered
		else
		{
			//save the new name
			var name = $scope.newName;
			
			//check the length of the name
			if(name.length > MAX_LETTERS_IN_NAME)
			{
				$scope.message_type = "WARNNING";
				$scope.message = "This name is too long, therefore only "+ MAX_LETTERS_IN_NAME  +" characters including spaces will be saved";
				angular.element(Message_Modal).modal("show");
				$scope.newName=$scope.newName.slice(0, MAX_LETTERS_IN_NAME);
				return;
			}
		}
	
		//check if no new status was chosen
		if($scope.newStatus==undefined || $scope.newStatus=="" || $scope.newStatus==new_status_option) 
		{
			$scope.newStatus="";
		}
	  
		//check the phone number field if not entered show an error modal -> this field is a munst field
		if($scope.newPhoneNumber==undefined || $scope.newPhoneNumber== "")
		{
		    $scope.message_type = "ERROR";
		    $scope.message = "You must enter a phone number";
		    angular.element(Message_Modal).modal("show");
		    return;
			
		}
		
		//if a phone number was entered 
		else
		{
			//a regular expression for a valid phone number
		    var valid_phone_number =  /^\+?([0-9]{2})?[0-9]{7,10}$/;
			
			//check if the phone number is valid according to regular expression
		    if(!valid_phone_number.test($scope.newPhoneNumber))
			{
				//if not valid show an error modal
			    $scope.message_type = "ERROR";
		        $scope.message = "This phone number is invalid";
		        angular.element(Message_Modal).modal("show");
				$scope.newPhoneNumber=undefined;
				return;
			}
		}
			
		//check if an email address was entered
		if($scope.newEmail!=undefined)
		{
			//save a regular expression for a valid email address
			var valid_email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			
			//check if the email address is valid according to regular expression
			if( !valid_email.test($scope.newEmail)){
				
				//if not valid show an error modal
				$scope.message_type = "ERROR";
				$scope.message = "This email is invalid";
				angular.element(Message_Modal).modal("show");
				$scope.newEmail=undefined;
				return;
			}
		}
		
		//if no email address was entered
        else
		{
		   $scope.newEmail= undefined ;
        }		
		
		//check if an address was entered
		if($scope.newAddress!=undefined)
		{
			//save the address
		    var address = $scope.newAddress;
			
			//check the length of the address
			if(address.length > MAX_LETTERS_IN_ADDRESS){
		        $scope.message_type = "WARNNING";
		        $scope.message = "This address is too long, therefore only "+ MAX_LETTERS_IN_ADDRESS +" characters including spaces will be saved";
			    angular.element(Message_Modal).modal("show");
				$scope.newAddress=$scope.newAddress.slice(0, MAX_LETTERS_IN_ADDRESS);
				return;
			}
			
		}
		
		//if no address was entered 
		else
		{
		   $scope.newAddress = "";
		}
		
		$scope.click = true;
		
		//call the function to add the new contact
		$scope.addNewContact();
	}
	
	/*
		a function that return the current date in format 'mm/dd/yyyy HH:MM'
	*/
	$scope.getCurrentDate = function()
	{
		var date = new Date();
		var MM = String(date.getMinutes()).padStart(2, '0');
		var HH = String(date.getHours()).padStart(2, '0');
		var dd = String(date.getDate()).padStart(2, '0');
		var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
		var yyyy = date.getFullYear();

		date = mm + '/' + dd + '/' + yyyy+' '+HH+':'+MM;
		
		return date;
	}
	
    /*
		a function for adding a new contact to system 
		with http request to server 
	*/
	$scope.addNewContact = function(){
		//save the current date
		var contact_history	= 'Date : ' + $scope.getCurrentDate() +'\n\nContact Addition\n ';
		
		//add to history the action
		history_array.push(contact_history);
		$log.log("contact_history :" + contact_history);
		var contact={Name:$scope.newName, Category:category, Status:status_role, PhoneNumber:$scope.newPhoneNumber, eMail:$scope.newEmail, Address:$scope.newAddress, History:history_array};
		$http.post("http://localhost:3000/addContact", {
				contact: contact,
			}).then(
				function (response) { //success callback  
				
                    //check if the phone number exists in system					
					if(!response.data.phone_exists)
					{				
						$scope.get_new_contact_details=false;
						$scope.getContactsList();
						$scope.newName=undefined;
						$scope.newPhoneNumber=undefined;
						$scope.newEmail=undefined;
						$scope.newAddress=undefined;

					}
					
					//if exists show error modal
					else
					{
					   $scope.message_type = "ERROR";
                       $scope.message = response.data.phone_exists;
				       angular.element(Message_Modal).modal("show");
					}				
					
				},
				function (response) { //failure callback
				
					//clear fields of new contact that was edit
					$scope.newName=undefined;
					$scope.newPhoneNumber=undefined;
					$scope.newEmail=undefined;
					$scope.newAddress=undefined;
					
					//if fails show error modal
					$scope.message_type = "ERROR";
                    $scope.message = response.data.error;
				    angular.element(Message_Modal).modal("show");
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
					contact_to_delete = '';
				},
				function (response) { //failure callback
					
				}
			);
	}
	
	/*
		 a function for catching any chane in contact 
		 and save changes in history of contact
	*/
	$scope.changed_detailes = function(contactInfoToUpdate)
	{
		var updated_contact_history="";
		var change = -1;
		var contact_history = -1;
		if(category.Role!=contact_before_update.Category.Role)
		{
			updated_contact_history = "Role changed : " + contact_before_update.Category.Role+ " <- : " +category.Role+"\n";
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
		   contact_history="Date: "+$scope.getCurrentDate()+"\n\nContact Edit\n\n"+updated_contact_history+"\n";
			
		}
		return contact_history;	
	}
	
	 
	
	/*
		a function for checking validation of all updated contact fildes 
		and if they are corcect send them to the server
	*/
	$scope.save_updated = function(contactInfoToUpdate)
	{
	 
	    
		$log.log("Category before: "+ contact_before_update.Category.Role);
		$log.log("Category after : "+ category);
		
		//check if role was celected
		if(category == undefined){
		    $scope.message = "You must choose a category";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//check if no name was entered if so show an error modal
		if(contactInfoToUpdate.Name==undefined || contactInfoToUpdate.Name== "")
		{
			$scope.message_type = "ERROR";
			$scope.message = "You must enter a name";
			angular.element(Message_Modal).modal("show");
			return;
			
		}
		
		//if a name was entered
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
		
		 //check if no status was selected if so show an error modal
		if(status_role==undefined ||status_role=="") 
		{
			$scope.message = "You must choose a status";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//if there was chosen the default empty status
		else if (status_role==new_status_option)
		{
		
		    if (status_role==new_status_option)
			{
				status_role = "";
			}
			status_role = contact_before_update.Status;
		}
		
		//check if phone number was entered and if it is valid
		if(contactInfoToUpdate.PhoneNumber!=undefined && contactInfoToUpdate.PhoneNumber!= "")
		{
			var valid_phone_number =  /^\+?([0-9]{2})?[0-9]{7,10}$/;
			//if the phone number is invalid shoe an error modal
		    if(!valid_phone_number.test(contactInfoToUpdate.PhoneNumber))
			{
				$scope.message_type = "ERROR";
		        $scope.message = "This phone number is invalid";
		        angular.element(Message_Modal).modal("show");
				return;
			}
		}
		
		//if no phone number was entered show an error modal
		else
		{
		    $scope.message_type = "ERROR";
		    $scope.message = "You must enter a phone number";
		    angular.element(Message_Modal).modal("show");
		   return;
		}
			
		//check if an email address was entered and if it is valid
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
		
		//if no email address was entered
        else
		{
		   contactInfoToUpdate.eMail="";
        }		
		
		//if a address was entered
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
		
		//save the changes on contact in the history
		var contact_history = $scope.changed_detailes(contactInfoToUpdate);
		
		//save the details of the updated contact in a json format
		var updated_contact={Name:contactInfoToUpdate.Name, Category:category, Status:status_role, PhoneNumber:contactInfoToUpdate.PhoneNumber, eMail:contactInfoToUpdate.eMail, Address:contactInfoToUpdate.Address,History:contact_history};

		//call server with an http request
		$http.post("http://localhost:3000/updateContact", {
				contact_before_update: contact_before_update,updated_contact:updated_contact
			}).then(
				function (response) { //success callback   
					//check if the phone number does not exist already
					if(!response.data.phone_exists)
					{
                         $scope.getContactsList();
					}
					
					//if the phone already exsist show an error modal
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
	
	/*
		a function for updating a user in the system
	*/
	$scope.save_updated_user = function(userToUpdate)
	{
		//regular expression for a valid user name
		var re_username = /^[a-zA-Z]{3,10}$/;
		
		//regular expression for a valid name
		var re_name = /^[a-zA-Z\s\u0590-\u05fe]{2,20}$/;
		
		//if no role was selected show an error modal
		if($scope.role==null)
		{
		    $scope.message = "You must choose role for user";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//if a user name was not entered or was invalid show an error modal
		if(userToUpdate.UserName==undefined ||!re_username.test(userToUpdate.UserName))
		{
		    $scope.message = "User name must contain only English letters ,minimum 3 leterrs and maximum 10 letters and no whitespace";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//if a name was not entered or was invalid show an error modal
		if(userToUpdate.Name==undefined ||!re_name.test(userToUpdate.Name))
		{
			$scope.message = "The name must contain only English or Hebrew letters ,minimum 2 leterrs and maximum 20 letters ";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		var re_email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		
		//check if an email address was entered and if it is valid
		if(userToUpdate.eMail==undefined || !re_email.test(userToUpdate.eMail))
		{
			$scope.message = "This email is invalid ";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//save the updated details of the user
		var updated_user={Role:category.Role,UserName:userToUpdate.UserName, Name:userToUpdate.Name, eMail:userToUpdate.eMail};
		
		//call server with http request
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
	
	/*
		a function for repeating a message modal in match to the slected modal
	*/
	$scope.repeat_message = function()
	{
		//modal for incorect password
		if(incorect_password == true)
		{
			angular.element(change_password_modal).modal("show");
			incorect_password = false;
		}
		
		//modal for incorect current password
		if(incorect_current_password==true)
		{
		   angular.element(validation_current_password_modal).modal("show");
		   incorect_current_password =false;
		}
		
		//modal for missing role field
		if(missing_role_field == true)
		{
			angular.element(add_new_role_modal).modal("show");
			missing_role_field =false;
		}
		
		//modal for missing status field
		if(missing_status_field ==true)
		{
			angular.element(add_new_status_modal).modal("show");
			missing_status_field =false;
		}
		
		//modal for missing role field in calendar event
		if(missing_role_field_calendar == true)
		{
			angular.element(add_event).modal("show");
		   missing_role_field_calendar =false;
		}
		if(missing_date_field_calendar == true)
		{
			angular.element(add_event_outside).modal("show");
		    missing_date_field_calendar =false;
		}
	}
	
	/*
		a function for changing the password
		the function gets the new password
	*/
	$scope.change_password_function = function(new_password)
	{
		var re_password = /^((?!.*[\s])(?=.*[A-Z])(?=.*\d))(?=.*?[#?!@$%^&*-]).{8,15}$/;
		
		//check the new password is valid according to regular expression
		if($scope.new_password==undefined || !re_password.test($scope.new_password))
		{
			//if not valid show error modal
			$scope.message = "The password must contain at least 8 to 15 characters , at least : one capital letter or one small letter, one number, and one of the following special characters: #?! @ $% ^ & * -";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			$scope.new_password=undefined ;
			$scope.verify_new_password=undefined;
			incorect_password = true;
			return;
		}
		
		//check if the two password equals = the new one and the varify one
		if($scope.new_password != $scope.verify_new_password){
			$scope.message = "The two passwords do not match";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			$scope.verify_new_password=undefined;
		    incorect_password = true;
			return;
		}
		
		//save the new password in server with an hyyp request
		var logged_in_new_password ={username:logged_in_user.UserName,new_password:$scope.new_password};
		$http.post("http://localhost:3000/changeCurrentPassword", {	
			logged_in_new_password: logged_in_new_password,
		}).then(
		   function (response) { //success callback
				$scope.new_password=undefined ;
			    $scope.verify_new_password=undefined;
			  
				//show a success modal if the password has been changed successfully
				$scope.message_type = "SUCCESS";
			    $scope.message = response.data.success;
			    angular.element(Message_Modal).modal("show");
			},
			function (response) { //failure callback
				
			}
		);
	}
	
	/*
		a function for verifing the passord that was entered 
		with the password in server for the current user name
	*/
    $scope.verify_password = function(current_password)
	{
	  var logged_in_current_password ={username:logged_in_user.UserName , current_password:current_password};
		$http.post("http://localhost:3000/verificationCurrentPassword", {	
			logged_in_current_password: logged_in_current_password,
		}).then(
			function (response) { //success callback
				$scope.current_password = undefined;
				
				//the current password was verified for this username
			  	if(response.data.verified == true)
				{
					angular.element(change_password_modal).modal("show");
				}
				
				//the current password was not verified for this username
				else
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
	
	/*
		a function for showing a modal for deleting role from system
	*/
	$scope.delete_status_system_settings = function()
	{
			
        angular.element(delete_status_from_system_modal).modal("show");
		$scope.getOptionsList();

	}
	
	/*
		a function for deleting status from system
	*/
	$scope.delete_status_from_system = function()
	{
		//if no status was selected for deleting show an error moal
		if(deleted_status == undefined){
		    $scope.message = "You must choose a status";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//call server with http request to delete status from system
		$http.post("http://localhost:3000/deleteStatusFromSystem", {
				status_to_delete : deleted_status,
			}).then(
				function (response) { //success callback   
				},
				function (response) { //failure callback
					
				}
			);
	}
	
	/*
		a function for showing modal for deleting status from role (from settings tab)
	*/
	$scope.delete_status_role_settings = function()
	{
		angular.element(delete_status_from_role_modal).modal("show");
		$scope.getRolesList();
	}
	
	/*
		a function for deleting status from role
	*/
	$scope.delete_status_from_role = function()
	{
		//if no category was selected show an error modal
		if(category == undefined){
		    $scope.message = "You must choose a category";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//if no status was selected show an error modal
		if(status_role==undefined ||status_role=="") 
		{
			$scope.message = "You must choose a status";
		    $scope.message_type = "ERROR";
			angular.element(Message_Modal).modal("show");
			return;
		}
		
		//save the status to delete and from which role to delete
		var status_to_delete = {Role:category.Role , Status:status_role}
		
		//call server with http request for deleting status from role
		$http.post("http://localhost:3000/deleteStatusFromRole", {
				status_to_delete : status_to_delete
			}).then(
				function (response) { //success callback 
				   $scope.roles = response.data.roles; 
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
	
	//a function for showing a modal for insuring the delition of all contacts from syetem
	$scope.insure_delete_all_contacts = function()
	{
		$scope.message = "Are you sure you want to delede all the contacts from system ? if you press OK, all contacts will be deleted and the information will be lost. ";
		$scope.message_type = "WARNNING";
		angular.element(Message_Modal_With_Cancel).modal("show");
		delete_all_contacts_flag = true;
	}
	//a function for showing a modal for insuring the delition of contact from syetem
	$scope.insure_delete_contact = function(contact)
	{
		contact_to_delete = contact;
		$scope.message = "Are you sure you want to delede this contact from system ? if you press OK, the information of this contact will be lost. ";
		$scope.message_type = "WARNNING";
		angular.element(Message_Modal_With_Cancel).modal("show");
		delete_contact_flag = true;
	}
	//a function for showing a modal for insuring the delition of user from syetem
	$scope.insure_delete_user = function(user)
	{
		user_to_delete = user;
		$scope.message = "Are you sure you want to delede this user from system ? if you press OK, the information of this user will be lost. ";
		$scope.message_type = "WARNNING";
		angular.element(Message_Modal_With_Cancel).modal("show");
		delete_user_flag = true;
	}
	
	//a function for showing a modal for insuring the delition of all users from syetem
	$scope.insure_delete_all_users = function()
	{
		$scope.message = "Are you sure you want to delede all the users from system ? if you press OK, all users will be deleted and the information will be lost. ";
		$scope.message_type = "WARNNING";
		angular.element(Message_Modal_With_Cancel).modal("show");
		delete_all_users_flag = true;
	}
	
	/*
		a function for deleting all contacts or users depends on 'flag' parameter
	*/
	$scope.response_ok = function()
	{
		$log.log("entered response_ok " +delete_all_contacts_flag);
		if(delete_all_contacts_flag == true)
		{
			//call function for deleting all contacts from server
			$scope.delete_all_contacts();
			delete_all_contacts_flag = false;

		}
		if(delete_contact_flag == true)
		{
			//call function for deleting contact from server
			$scope.delete_contact_function(contact_to_delete);
			delete_contact_flag = false;

		}
		if(delete_user_flag == true)
		{
			//call function for deleting user from server
			$scope.delete_user(user_to_delete);
			delete_user_flag = false;

		}
		
		//call function for deleting all users from server
		if(delete_all_users_flag == true)
		{
			$scope.delete_all_users();
			delete_all_users_flag = false;

		}
	}
	
	/*
		a function for deleting all contacts from srever
		with an http request
	*/
	$scope.delete_all_contacts = function()
	{
		$http.get("http://localhost:3000/deleteAllContacts").then(
			function (response) {//success callback
			
				//show success modal
				$scope.message = response.data.message;
				$scope.message_type = "SUCCESS";
			    angular.element(Message_Modal).modal("show");
			},
			function (response) {//failure callback
				
			}	
		);
	}
	
	/*
		a function for deleting all users from srever
		with an http request
	*/
	$scope.delete_all_users = function()
	{
		$log.log("entered delete_all_users");

		$http.get("http://localhost:3000/deleteAllUsers").then(
			function (response) {//success callback
				
				//show success modal
				$scope.message = response.data.message;
				$scope.message_type = "SUCCESS";
			    angular.element(Message_Modal).modal("show");
			},
			function (response) {//failure callback
				
			}	
		);
	}
	
	/*
		a function for saving the user name of user to delete that was selected at modal
	*/
	$scope.user_selected = function(username)
	{
		var res = username.split(",");
		var res1=res[1].split(":");
		
		username_to_delete = res1[1].split(" ");
		username_to_delete = String(username_to_delete[1]);
		$log.log(username_to_delete);

	}
	
	/*
		a function for deleting user from server
	*/
	$scope.delete_user = function(flag)
	{
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
	
	/*
		a function for deleting role from server
	*/
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
				user_to_delete = "";
				
				},
				function (response) { //failure callback
					
				}
			);
		
	}
	
	//a function for showing the modal for chaging password
    $scope.change_password = function()
	{
	    angular.element(validation_current_password_modal).modal("show");
	}
	
	/*
		a function for sign out from syetem show only login page and hide all other pages
	*/
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
	

	

	}]).directive('popOver', function ($compile, $templateCache,$log) {//pop over option for history

			$('body').on('click', function (e) {
			//only buttons
			if ($(e.target).data('toggle') !== 'templateId.html'
				&& $(e.target).parents('.templateId.html.in').length === 0) { 
							$log.log(" body")

				$('[data-toggle="popover"]').popover('hide');
			}
		});
        var getTemplate = function () {
            $templateCache.put('templateId.html', 'This is the content of the template');
            console.log($templateCache.get("popover_template.html"));
            return $templateCache.get("popover_template.html");
        }
        return {
            restrict: "A",
            transclude: true,
            template: "<span ng-transclude></span>",
            link: function (scope, element, attrs) {
                var popOverContent;
                if (scope.history) {
                    var html = getTemplate();
                    popOverContent = $compile(html)(scope);                    
                    var options = {
                        content: popOverContent,
                        placement: "right",
                        html: true,
                        title: scope.title
                    };
                    $(element).popover(options);
                }
            },
            scope: {
                history: '=',
                title: '@'
            }
        };
    })

})();