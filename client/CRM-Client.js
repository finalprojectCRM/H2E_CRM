/*jshint unused:false*/
/*eslint-disable no-unused-vars*/
/*global angular, document, moment, $*/
/*eslint no-undef: "error"*/
/*eslint no-else-return: off*/

(function () {
    'use strict';
    const app = angular.module('CRM', ['ngResource', 'ui.calendar', 'ui.bootstrap', 'ui.bootstrap.datetimepicker', 'ngSanitize', 'ui.select', 'ngAnimate', 'toaster', 'ngFileUpload'])
        .controller('CRM_controller', ['$scope','$compile', '$http', '$log', '$timeout', 'uiCalendarConfig', 'toaster', 'Upload', '$filter', '$window',
            function ($scope, $compile, $http, $log, $timeout, uiCalendarConfig, toaster, Upload, $filter, $window) {
                let customerBeforeUpdate;
                let workerBeforeUpdate;
                const MAX_LETTERS_IN_NAME = 25;
                const MAX_LETTERS_IN_ADDRESS = 35;
                let category = undefined;
                let statusRole = undefined;
                let loggedInWorker;
                let incorectPassword = false;
                let incorectNewTempPassword = false;
                let incorectCurrentPassword = false;
                let missingStatusSystemFiled = false;
                let missingDeleteStatusSystemField = false;
                let missingDeleteStatusRoleField = false;
                let missingUpdateFields = false;
                let missingRoleToDelete = false;
                let problemWithFileSelection = false;
                let missingFileToDelete = false;
                let missingRoleField = false;
                let missingStatusOrRoleField = false;
                let deleteAllCustomersFlag = false;
                let deleteCustomerFlag = false;
                let deleteWorkerFlag = false;
                let deleteAllWorkersFlag = false;
                let missingDetailInsideAddEvent = false;
                let missingDetailsOutsideAddEvent = false;
                let missingDetailsEditEvent = false;
                let missingWorkerToDelete = false;
                let invalidTempPassword = false;
                let deleteWorkerEventsAndCustomers = false;
                let deleteWorkerWithEventsAndCustomers = false;
                let selectedItemPart1;
                let selectedItemPart2;
                let deletedStatus;
                let customerToDelete = '';
                let selectedItems = [];
                let historyArray = [];
                let editEventDetails = {};
                let evenBeforeUpdate;
                let workerToDelete;
                let customersPhone = [];
                const SERVER_URI = 'http://localhost:5000';

                $scope.account = false;
                $scope.click = false;
                $scope.menu = false;
                $scope.showCalendar = false;
                $scope.showCustomers = false;
                $scope.showWorkersEvents = false;
                $scope.getNewCustomerDetails = false;
                $scope.showSettings = false;
                $scope.loginPage = false;
                $scope.registerPage = false;
                $scope.adminPage = false;
                $scope.firstLoad = false;
                $scope.Admin = false;
                $scope.showWorkers = false;
                $scope.addEvent = false;
                $scope.taskIsEdit = false;
                $scope.chooseCustomerToEmail = false;
                $scope.customersInfo = [];
                $scope.workers = [];
                $scope.options = [];
                $scope.roles = [];
                $scope.files = [];
                $scope.rolesColors = [];
                $scope.retreivedCalendarEvents = [];
                $scope.assignedRoles = [];

                function refreshCalendarEvents() {
                    $log.log('refreshCalendarEvents');
                    $http.get(SERVER_URI + '/getWorkerEvents/' + loggedInWorker.workerName).then(
                        function (response) {//success callback
                            setTimeout(function () {
                                uiCalendarConfig.calendars['myCalendar'].fullCalendar('render');

                            }, 5); // Set enough time to wait until animation finishes;*/
                            $scope.retreivedCalendarEvents = response.data.workerEvents;
                            $log.log('response.data.workerEvents=' + JSON.stringify(response.data.workerEvents));
                            //$scope.retreivedCalendarEvents = Object.assign({}, response.data.workerEvents);
                            $log.log('retreivedCalendarEvents=' + JSON.stringify($scope.retreivedCalendarEvents));
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.retreivedCalendarEvents);
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('rerenderEvents');
                        },
                        function (response) {//failure callback
                            //if failed show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                }

                $scope.getAllEvents = function () {
                    refreshCalendarEvents();
                }

                $scope.getAllEventsWithCustomer = function () {
                    $log.log('/getAllEventsWithCustomer');
                    $http.get(SERVER_URI + '/getAllEventsWithCustomer').then(
                        function (response) {//success callback
                            $log.log('in /getAllEventsWithCustomer');
                            setTimeout(function () {
                                uiCalendarConfig.calendars['myCalendar'].fullCalendar('render');

                            }, 5); // Set enough time to wait until animation finishes;*/
                            $scope.retreivedCalendarEvents = response.data.Events;
                            $log.log('refreshCalendarEvent=' + JSON.stringify($scope.retreivedCalendarEvents));
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.retreivedCalendarEvents);
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('rerenderEvents');
                        },
                        function (response) {//failure callback
                            //if failed show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                }
                $scope.getAllEventsWithoutCustomer = function () {
                    $log.log('/getAllEventsWithCustomer');
                    $http.get(SERVER_URI + '/getAllEventsWithoutCustomer').then(
                        function (response) {//success callback
                            $log.log('in /getAllEventsWithCustomer');
                            $scope.retreivedCalendarEvents = response.data.Events;
                            $log.log('refreshCalendarEvent=' + JSON.stringify($scope.retreivedCalendarEvents));
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.retreivedCalendarEvents);
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('rerenderEvents');
                        },
                        function (response) {//failure callback
                            //if failed show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                }


                function refreshCalendarEvent(event) {
                    $log.log('refreshCalendarEvent');
                    $log.log('event : '+JSON.stringify(event));

                    /*$log.log('CalendarEvent: before retreivedCalendarEvents=' + JSON.stringify($scope.retreivedCalendarEvents));
                    $scope.retreivedCalendarEvents.splice(0, $scope.retreivedCalendarEvents.length);

                    $scope.retreivedCalendarEvents.push(event);
                    $log.log('CalendarEvent: after retreivedCalendarEvents=' + JSON.stringify($scope.retreivedCalendarEvents));
                    uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
                    uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.retreivedCalendarEvents);
                    uiCalendarConfig.calendars.myCalendar.fullCalendar('rerenderEvents');
                    uiCalendarConfig.calendars.myCalendar.fullCalendar('refetchResources');*/
                    $http.post(SERVER_URI + '/getEvent').then({
                        my: event
                    }).then(
                        function (response) {//success callback
                            $scope.retreivedCalendarEvents = response.data.Events;
                            $log.log('refreshCalendarEvent=' + JSON.stringify($scope.retreivedCalendarEvents));
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.retreivedCalendarEvents);
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('rerenderEvents');
                        },
                        function (response) {//failure callback
                            //if failed show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                }
                function displayEventsInCalendar(){
                    
                }

                function refreshCustomerCalendarEvents(eventId) {
                    $log.log('refreshCustomerCalendarEvents');
                    $http.get(SERVER_URI + '/getCustomerEvents/' + loggedInWorker.workerName + '/' + eventId).then(
                        function (response) {//success callback
                            $scope.retreivedCalendarEvents = response.data.customerEvents;
                            $log.log('retreivedCalendarEvents=' + JSON.stringify($scope.retreivedCalendarEvents));
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEvents');
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('addEventSource', $scope.retreivedCalendarEvents);
                            uiCalendarConfig.calendars.myCalendar.fullCalendar('rerenderEvents');
                            if($scope.retreivedCalendarEvents.length==0)
                            {
                                $scope.getCustomersFunction();
                                $scope.message = 'There are no events for this customer';
                                $scope.messageType = 'ERROR';
                                angular.element(document.querySelector('#msgModal')).modal('show');
                            }
                        },
                        function (response) {//failure callback
                            //if failed show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                }

                function changeDateFormat(date) {
                    const strDate = date.toString();
                    let dbDate;
                    $log.log('date=' + date);
                    $log.log('strDate=' + strDate);
                    if (strDate.includes('GMT+0000')) {
                        dbDate = moment(strDate).subtract({'hours': 3}).format('MM/DD/YYYY HH:mm');
                    } else {
                        dbDate = moment(strDate).format('MM/DD/YYYY HH:mm');
                    }
                    $log.log('dbDate=' + dbDate);
                    return dbDate;
                }
                function updateCustomerHistory(history ,customerPhoneNumber){
                    const updateHistory = {customerPhoneNumber: customerPhoneNumber, customerHistory: history};
                    $http.post(SERVER_URI + '/updateCustomerHistory', {
                        updateHistory: updateHistory
                    }).then(
                        function (response){
                            historyArray = [];
                            customersPhone = [];
                            $scope.getCustomersList();
                        }, function (response) { //failure callback
                        }
                    );

                }

                function getAssignedRoles() {
                    $http.get(SERVER_URI + '/getAssignedRoles').then(
                        function (response) {//success callback
                            //return the list of the assigned roles
                            $scope.assignedRoles = response.data.assignedRoles;
                        }, function (response) {//failure callback

                        }
                    );
                };

                function getIndexOfSelectedItem(item, flag, status) {
                    if (flag === 'status_list') {
                        for (let i = 0; i < $scope.assignedRoles.length; i++) {
                            if (item === $scope.assignedRoles[i].Role) {
                                $log.log('entered if ##: ');
                                for (let j = 0; j < $scope.assignedRoles[i].Statuses.length; j++) {
                                    if (status === $scope.assignedRoles[i].Statuses[j]) {
                                        $log.log('j: ' + j);
                                        return j;
                                    }
                                }
                            }
                        }
                    } else if (flag === 'role_list') {
                        for (let i = 0; i < $scope.assignedRoles.length; i++) {
                            if (item === $scope.assignedRoles[i].Role) {
                                return i;
                            }
                        }
                    } else if (flag === 'color_of_role') {
                        for (let i = 0; i < $scope.assignedRoles.length; i++) {
                            if (item === $scope.assignedRoles[i].Color) {
                                return i;
                            }
                        }
                    } else if (flag === 'customer_list') {
                        $log.log('item of customer list : ' + item);
                        for (let i = 0; i < $scope.customersInfo.length; i++) {

                            if (item === $scope.customersInfo[i].PhoneNumber) {
                                $log.log('index ' + i);
                                return i;
                            }
                        }
                    }
                }

                function validDates(startDate, endDate, flag, outsideModal = undefined) {
                    if (startDate === 'Invalid date' || endDate === 'Invalid date') {
                        startDate = '';
                        endDate = '';

                        $scope.message = 'Start or end date is Invalid Date ';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        if (flag === 'addEvent') {
                            if (!outsideModal) {
                                missingDetailInsideAddEvent = true;
                            } else {
                                missingDetailsOutsideAddEvent = true;
                            }
                        } else {
                            missingDetailsEditEvent = true;
                        }
                        return false;
                    }
                    return true;
                }

                function checkDateRangeValidation(startDate, endDate, callPlacement) {
                    const regExp = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/;
                    if (parseInt(endDate.replace(regExp, '$3$2$1')) < parseInt(startDate.replace(regExp, '$3$2$1'))) {
                        $scope.message = 'Start date must be earlier than end date';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        if (callPlacement === 'in_calendar') {
                            missingDetailInsideAddEvent = true;
                        } else if (callPlacement === 'out_of_calendar') {
                            missingDetailsOutsideAddEvent = true;

                        } else if (callPlacement === 'edit_task') {
                            missingDetailsEditEvent = true;
                        }
                        return true;
                    }
                    return false;
                }


                function updateEventInDataBase(eventAfterUpdate, eventBeforeUpdate, worker) {
                    let startDate = changeDateFormat($scope.eventStart);
                    let endDate = changeDateFormat($scope.eventEnd);

                    const eventAfterUpdateDB = {
                        title: eventAfterUpdate.title,
                        start: startDate,
                        end: endDate,
                        color: eventAfterUpdate.color,
                        id: eventAfterUpdate.id,
                        customerPhone:eventAfterUpdate.customerPhone,
                        workerName: eventAfterUpdate.workerName,
                        editable: eventAfterUpdate.editable,
                        allDay: eventAfterUpdate.allDay
                    };
                    $log.log('after update : ' +eventAfterUpdate.customerPhone+' '+ eventAfterUpdate.title + ' ' +
                        eventAfterUpdate.start + ' ' + eventAfterUpdate.end + ' ' + eventAfterUpdate.color + ' ' +
                        eventAfterUpdate.id + ' ' + eventAfterUpdate.editable + ' ' + eventAfterUpdate.allDay);
                    startDate = changeDateFormat(eventBeforeUpdate.start);
                    endDate = changeDateFormat(eventBeforeUpdate.end);

                    const eventBeforeUpdateDB = {
                        title: eventBeforeUpdate.title,
                        start: startDate,
                        end: endDate,
                        color: eventBeforeUpdate.color,
                        customerPhone:eventBeforeUpdate.customerPhone,
                        id: eventBeforeUpdate.id,
                        workerName: eventBeforeUpdate.workerName,
                        editable: eventBeforeUpdate.editable,
                        allDay: eventBeforeUpdate.allDay
                    };
                    $log.log('before update : ' +eventBeforeUpdate.customerPhone+' '+ eventBeforeUpdate.title + ' ' + eventBeforeUpdate.start + ' ' + eventBeforeUpdate.end + ' ' +
                        eventBeforeUpdate.color + ' ' + eventBeforeUpdate.id + ' ' + eventBeforeUpdate.editable + ' ' + eventBeforeUpdate.allDay);

                    const updatedEvent = {
                        eventBeforeUpdate: eventBeforeUpdateDB,
                        eventAfterUpdate: eventAfterUpdateDB
                    };
                    $http.post(SERVER_URI + '/updateEvent', {
                        updatedEvent: updatedEvent
                    }).then(
                        function (response) {
                            if (response.data.eventExists) {
                                $scope.message = response.data.eventExists;
                                $scope.messageType = 'ERROR';
                                angular.element(document.querySelector('#msgModal')).modal('show');
                                return;
                            }
                            refreshCalendarEvents();
                        },
                        function (response) { //failure callback
                            editEventDetails = {};
                        }
                    );
                }

                function getStringofAllEmails(emailsListStr, selectedEmail, i) {
                    if (i % 3 === 0) {
                        $log.log('i = ' + i);
                        emailsListStr = emailsListStr + '\n' + selectedEmail.eMail + ',';
                    } else {
                        emailsListStr = emailsListStr + selectedEmail.eMail + ',';

                    }
                    return emailsListStr;
                }

                function getPhoneNumberEventId(eventId){
                    let splitedStr = eventId.split(' ');
                    return splitedStr[splitedStr.length-1];

                }

                $scope.getCustomerEventByPhone = function (eventId)
                {
                    $log.log('eventId : '+eventId);
                    const phoneCustomer = getPhoneNumberEventId(eventId);
                    $log.log('phoneCustomer : '+phoneCustomer);

                    $http.get(SERVER_URI + '/getCustomer/' + phoneCustomer).then(
                        function (response) {
                            if(response.data.customers) {
                                if(response.data.customers.length == 0) {
                                    $scope.message = 'This customer does not exist';
                                    $scope.messageType = 'ERROR';
                                    angular.element(document.querySelector('#msgModal')).modal('show');
                                    return;
                                }
                                $scope.customersInfo = response.data.customers;
                                $scope.getCustomersFunction('customerEvent');

                            }
                            $log.log('customersInfo '+ $scope.customersInfo);
                        },
                        function (response) { //failure callback
                        }
                    );


                }


                /*
                    a modal that pops up when press on delete file,
                    delete file by running over file list
                */
                $scope.showDeleteFileModal = function () {
                    //get file list
                    $scope.getFilesList();
                    $scope.file = undefined;
                    selectedItems = [];
                    angular.element(document.querySelector('#deleteFileModal')).modal('show');

                }; /*
                    a modal that pops up when press on delete file,
                    delete file by running over file list
                */
                $scope.getSpecificEvents = function () {
                    $log.log('$scope.getSpecificEvents');
                    $scope.loginPage = false;
                    $scope.showCustomers = false;
                    $scope.showWorkers = false;
                    $scope.showSettings = false;
                    $scope.showWorkersEvents = true;
                    $scope.click = true;
                    $scope.showCalendar = false;
                    $scope.account = true;

                    refreshCalendarEvents();
                    $scope.workerEvents = Object.assign({}, $scope.retreivedCalendarEvents);
                    $scope.retreivedCalendarEvents.forEach(function(event, index) {
                        let title = event.title;
                        if (event.id !== -1 && title.includes(':')) {
                            title = title.split(':')[1].trim();
                        }
                        $scope.workerEvents[index].title = title;
                        $log.log('index: ' + index + ' ,title=' + title);
                    });
                };
                /*
                    a function to render the calendar
                */
                $scope.renderCalender = function () {
                    $log.log('renderCalender');
                    //console.log($scope.events)
                    //uiCalendarConfig.calendars.myCalendar.fullCalendar('removeEventSource', sourceFullView, $scope.events);
                };

                /*
                  calendar parameters
                */
                $scope.uiCalendarConfig = uiCalendarConfig;
                $scope.events = [];
                $scope.eventSource = [$scope.events];

                /*
                  format of calendar components
                */
                $scope.calendarConfig = {
                    header: {
                        left: 'prev,next, today',
                        center: 'title',
                        right: 'month,agendaWeek,agendaDay'
                    },
                    views: {
                        month: {columnHeaderFormat: 'ddd', displayEventEnd: true, eventLimit: 3},
                        week: {columnHeaderFormat: 'ddd DD', titleRangeSeparator: ' \u2013 '},
                        day: {columnHeaderFormat: 'dddd'}
                    },
                    columnFormat: {
                        month: 'ddd',
                        week: 'ddd D/M',
                        day: 'dddd'
                    },

                    aspectRatio: 1.5,
                    selectable: true,
                    selectHelper: true,
                    editable: true,
                    eventLimit: true,
                    renderCalender: $scope.renderCalender(),
                    vents: function (start, end, timezone, callback) { // Fetch your events here
                        $log.log('retreivedCalendarEvents=' + $scope.retreivedCalendarEvents);
                        // This could be an ajax call or you could get the events locally
                        callback($scope.retreivedCalendarEvents);
                    },
                    /*
                        select date with clicking trigger
                        and save start and end date in format : 'DD/MM/YYYY HH:mm'
                    */
                    select: function (start, end, allDay, jsEvent) {
                        $log.log('start: ' + moment(start).format('DD/MM/YYYY HH:mm'));
                        //get start date
                        /*startDate = moment(start).format();
                        $log.log('end: ' + moment(end).format());
                        //get end date
                        endDate = moment(end).format();*/

                        //date in format = 'starn date' - 'end date'
                        $scope.date = moment(start).format('DD/MM/YYYY HH:mm') + ' - ' + moment(end).format('DD/MM/YYYY HH:mm');
                        //get roles list
                        $scope.getRolesList();
                        $scope.customerTask = undefined;
                        $scope.title = undefined;
                        getAssignedRoles();
                        //show modal of add event
                        angular.element(document.querySelector('#addEvent')).modal('show');

                    },

                    /*
                        event trigger : click on the task in calenda to edit or delete it
                    */
                    eventClick: function (event, element) {

                        $log.log(event.title);
                        //get details of edit event
                        editEventDetails = event;
                        $log.log('start : ' + event.start + ' end : ' + event.end);

                        evenBeforeUpdate = {
                            title: event.title,
                            start: event.start,
                            end: event.end,
                            color: event.color,
                            id: event.id,
                            customerPhone: event.customerPhone,
                            workerName: event.workerName,
                            editable: event.editable,
                            allDay: event.allDay
                        };
                        const indexRole = getIndexOfSelectedItem(event.color, 'color_of_role');
                        $log.log('indexRole : ' + indexRole);

                        $scope.role = $scope.assignedRoles[indexRole];
                        $log.log(' $scope.role : ' +  $scope.role);
                        $log.log(' $scope.role : ' +  $scope.role.Role);


                        //if a customer was not selected for the event, the event id is = '-1'
                        if (editEventDetails.id !== -1) {
                            //split title by ':'
                            const title = event.title.split(':');

                            //save the event id
                            $scope.customerEvent = event.id;
                            $log.log('customer id: ' + event.id);
                            const splitCustomerPhone = event.id.split(' ');
                            const customerPhone = splitCustomerPhone[splitCustomerPhone.length - 1];
                            $log.log('customerPhone: ' + customerPhone);
                            const customer = $scope.customersInfo[getIndexOfSelectedItem(customerPhone, 'customer_list')];
                            $scope.selectedCustomer = event.id;
                            $log.log('$scope.customer :' + $scope.customer);
                            //save the event title
                            $scope.eventTitle = title[1];
                            //when customerSelected = true then there is a customer selected
                            $scope.customerSelected = true;
                            $scope.taskIsEdit = true;
                            $scope.customerTask = true;
                        } else { //if no customer was selected for the event then $scope.customerSelected = false;
                            $scope.eventTitle = event.title;
                            $scope.customerSelected = false;
                        }
                        $scope.eventStart = event.start;
                        $scope.eventEnd = event.end;
                        $scope.eventDate = moment(event.start).format('DD/MM/YYYY HH:mm') + ' - ' + moment(event.end).format('DD/MM/YYYY HH:mm');
                        $scope.taskIsEdit = false;
                        //show modal for edit or delete event
                        $log.log(' $scope.role : ' +  $scope.role);
                        $log.log(' $scope.role : ' +  $scope.role.Role);
                        angular.element(document.querySelector('#editOrDeleteEvent')).modal('show');
                        $log.log(' $scope.role : ' +  $scope.role);
                        $log.log(' $scope.role : ' +  $scope.role.Role);
                    }
                };

                /*
                    save edit event details :
                    ID, title, start and end date, color of event

                */
                $scope.saveEditEvent = function (taskWithCustomer) {
                    let description;
                    let customer;
                    let startDate;
                    let endDate;

                    console.log('1: $scope.eventTitle=' + $scope.eventTitle);
                    console.log('$scope.role=' + $scope.role);
                    if (!$scope.role ||$scope.role === undefined || $scope.role === '' || $scope.role.Role === undefined || $scope.role.Role === '' || $scope.role.Role === '-- Choose category for role --') {
                        $scope.message = 'Category is a must field, please select one';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingDetailsEditEvent = true;
                        return;
                    }

                    //check if the title field was filled in the task modal - this is a must field
                    if ($scope.eventTitle === undefined || $scope.eventTitle === '') {
                        $scope.message = 'Title is a must field, please fill it in';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingDetailsEditEvent = true;
                        return;
                    }
                    startDate = moment(String($scope.eventStart)).format('MM/DD/YYYY HH:mm');
                    endDate = moment(String($scope.eventEnd)).format('MM/DD/YYYY HH:mm');
                    if (!validDates(startDate, endDate, 'editEvent')) {
                        return;
                    }
                    if (checkDateRangeValidation(startDate, endDate, 'edit_task')) {
                        return;
                    }

                    let sameDate = [];

                    if ($scope.retreivedCalendarEvents) {
                        sameDate = $scope.retreivedCalendarEvents.filter(function (item) {
                            return item.start === startDate && item.end === endDate;
                        });
                        $log.log('sameDate : ' + sameDate);
                        if (sameDate.length > 0) {
                            startDate = '';
                            endDate = '';
                            sameDate = '';

                            $scope.message = 'There is a task already exists on this date, please select a different time for this task ';
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            missingDetailsEditEvent = true;
                            return;
                        }
                    }
                    /*
                        check if the task was chosen for a spesific customer - optional
                        then id = 'customer name' + ' customer phone number'
                    */
                    $log.log('taskWithCustomer : ' + taskWithCustomer);
                    if (taskWithCustomer) {
                        $log.log('$scope.customer :' + $scope.customer);
                        $log.log('selectedItemPart1 :' + selectedItemPart1);
                        $log.log('selectedItemPart2 :' + selectedItemPart2);
                        if ($scope.customer === '' || selectedItemPart1 === undefined || selectedItemPart2 === undefined || selectedItemPart1 === '' || selectedItemPart2 === '') {
                            $scope.message = 'You have selected the option for a costumer task and therefore a costumer must be selected';
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            missingDetailsEditEvent = true;

                            selectedItemPart1 = undefined;
                            selectedItemPart2 = undefined;
                            return;
                        } else {
                            editEventDetails.customerPhone = selectedItemPart2;

                            description = 'Task for customer ' + selectedItemPart1 + ' ' + selectedItemPart2 + ' : ' + $scope.eventTitle;
                            customer = selectedItemPart1 + ' ' + selectedItemPart2;
                            selectedItemPart1 = undefined;
                            selectedItemPart2 = undefined;
                        }
                    } else { //if the task is not for a spesific customer -> id of customer = '-1'
                        description = $scope.eventTitle;
                        console.log('description=' + description);
                        customer = -1;
                        editEventDetails.customerPhone = -1;


                    }
                    console.log('description=' + description);

                    editEventDetails.title = description;
                    editEventDetails.start = $scope.eventStart;
                    editEventDetails.end = $scope.eventEnd;
                    editEventDetails.color = $scope.role.Color;
                    editEventDetails.workerName = evenBeforeUpdate.workerName;
                    editEventDetails.id = customer;

                    let eventForUpdate = {};

                    eventForUpdate = Object.assign({}, editEventDetails);
                    //update the event details in the calendar
                    //uiCalendarConfig.calendars.myCalendar.fullCalendar('updateEvent', editEventDetails);
                    updateEventInDataBase(eventForUpdate, evenBeforeUpdate, loggedInWorker);
                    $scope.selections = [];
                };

                /*
                    when click on task for customer
                    go to the customer from customers list
                */
                $scope.goToCustomer = function () {

                    //get customers phone number as an ID
                    $scope.getCustomerEventByPhone( $scope.customerEvent);

                    //hide the 'document.querySelector('#editOrDeleteEvent')' modal
                    angular.element(document.querySelector('#editOrDeleteEvent')).modal('hide');

                };

                //add event from button outside of the calendar
                $scope.addEventOutsideCalendar = function () {
                    getAssignedRoles();
                    //show 'document.querySelector('#addEventOutside')' modal
                    angular.element(document.querySelector('#addEventOutside')).modal('show');

                };

                $scope.calendarCustomer = function (customer) {
                    const eventId = String(customer.Name + ' ' + customer.PhoneNumber);
                    //let customer_name = customer.Name;
                    const customerPhone = customer.PhoneNumber;
                    $log.log('eventId : ' + eventId);
                    //refreshCustomerCalendarEvents();
                    $scope.calendarFunction('customerEvents',customerPhone);
                };

                function deleteEventFromDataBase(event, worker) {
                    const date = $scope.eventDate.split('-');
                    $log.log('start date : ' + date[0]);
                    //$log.log('type '+typeof date[0]);
                    $log.log('end date : ' + date[1]);
                    const startDate = moment(String(date[0]), 'DD/MM/YYYY HH:mm').format('MM/DD/YYYY HH:mm');
                    const endDate = moment(String(date[1]), 'DD/MM/YYYY HH:mm').format('MM/DD/YYYY HH:mm');

                    const eventToDelete = {
                        title: event.title,
                        start: startDate,
                        end: endDate,
                        color: event.color,
                        id: event.id,
                        editable: event.editable, allDay: event.allDay
                    };

                    $http.post(SERVER_URI + '/deleteEvent', {
                        event: eventToDelete
                    }).then(
                        function (response) {
                            $log.log('response.data.Events: '+ JSON.stringify(response.data.Events));
                            $scope.retreivedCalendarEvents = response.data.Events;
                            refreshCalendarEvents();
                        },
                        function (response) { //failure callback
                        }
                    );
                }

                $scope.deleteEvent = function (event, element, view) {
                    // delete event from mongodb and from contacts events list
                    deleteEventFromDataBase(editEventDetails, loggedInWorker);
                };

                $scope.eventRender = function (event, element, view) {
                    $(element).popover({
                        title: event.title,
                        content: event.description,
                        trigger: 'hover',
                        placement: 'auto right',
                        delay: {'hide': 300}
                    });
                };

                //array of customers
                $scope.selections = [];
                /*
                    select customer from customers list in the edit or delete modal
                */
                $scope.selected = {};
                $scope.selectAll = function (flag, workersOrCustomers) {
                    let arr;
                    let id;

                    if (workersOrCustomers === 'workers') {
                        arr = $scope.workers;
                        id = 'workerName';
                    } else {
                        arr = $scope.customersInfo;
                        id = 'PhoneNumber';
                    }

                    for (let i = 0; i < arr.length; i++) {
                        const arrInfo = arr[i];
                        if (id === 'workerName') {
                            $scope.selected[arrInfo.workerName] = flag;
                        } else {
                            $scope.selected[arrInfo.PhoneNumber] = flag;

                        }
                        //$log.log('id : ' +arrInfo.workerName);
                    }
                };

                $scope.sendEmailToSelectedCustomers = function (workersOrCustomers) {
                    let emailsListStr = '';
                    let arr;
                    let id;
                    if (workersOrCustomers === 'workers') {
                        arr = $scope.workers;
                        id = 'workerName';
                    } else {
                        arr = $scope.customersInfo;
                        id = 'PhoneNumber';
                    }

                    for (let i = 0; i < arr.length; i++) {
                        const arrInfo = arr[i];
                        if (id === 'workerName') {
                            if ($scope.selected[arrInfo.workerName]) {
                                emailsListStr = getStringofAllEmails(emailsListStr, arrInfo, i);
                            }

                        } else {
                            if ($scope.selected[arrInfo.PhoneNumber]) {
                                customersPhone.push(arrInfo.PhoneNumber);
                                emailsListStr = getStringofAllEmails(emailsListStr, arrInfo, i);

                            }
                        }
                    }
                    if(emailsListStr.length === 0){
                        $scope.message = 'You did not select any one for sending email, please select one';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }
                    $scope.customerEmail = emailsListStr;
                    $scope.chooseCustomerToEmail = false;
                    $scope.chooseWorkerToEmail = false;
                    $scope.showSendOrCancelMultipleButtonCustomers = false;
                    angular.element(document.querySelector('#emailModal')).modal('show');
                };



                function addEventToDataBase(event, worker) {
                    const newEvent = {event: event, worker: worker};
                    $http.post(SERVER_URI + '/addEvent', {
                        newEvent: newEvent
                    }).then(
                        function (response) {
                            $log.log('response.data.Events: '+ JSON.stringify(response.data.Events));
                            $scope.retreivedCalendarEvents = response.data.Events;
                            $scope.role = '';
                            $scope.customerTask = false;
                            $scope.customer = undefined;
                            $scope.title = '';
                            $scope.eventStart = '';
                            $scope.eventEnd = '';
                            $scope.date = '';
                            category = undefined;
                            selectedItemPart1 = undefined;
                            selectedItemPart2 = undefined;
                            $scope.selectedCustomer = '';
                            if (response.data.eventExists) {
                                $scope.message = response.data.eventExists;
                                $scope.messageType = 'ERROR';
                                angular.element(document.querySelector('#msgModal')).modal('show');
                                return;
                            }
                            $log.log('selectedItemPart2: '+ selectedItemPart2);
                            if (selectedItemPart2 !== undefined) {
                                customersPhone.push(selectedItemPart2);
                                updateCustomerHistory(historyArray ,customersPhone);
                            }
                            refreshCalendarEvents();
                        },
                        function (response) { //failure callback
                        }
                    );
                }
                function addHistoryToCustomerEvent(description,startDate,endDate,color,customer){
                    let history='';
                    history = 'New Task\n\n'+'Start Date : '+ startDate+'\n' +'End Date : '+endDate+'\n';
                    history = history+'Category : '+$scope.assignedRoles[getIndexOfSelectedItem(color,'color_of_role')].Role+'\n';
                    history = history+description+'\n';
                    $log.log(history);
                    return history;
                }

                /*
                    a function for adding a task from calendar when press on a day in calendar,
                    there is an option to add a the task for a spesific customer
                */
                $scope.addEventToCalendar = function (taskWithCustomer, outsideModal) {
                    /*
                        save the dates in a range of dates in the task in format 'startDate - endDate'
                        by splitting with '-'
                    */
                    let sameDate;
                    let description;
                    let customer;
                    let startDate;
                    let endDate;
                    let customerHistory;
                    let customerId;

                    if (!outsideModal) {
                        const date = $scope.date.split('-');
                        $log.log('start date : ' + date[0]);
                        $log.log('taskWithCustomer : ' + taskWithCustomer);
                        //$log.log('type '+typeof date[0]);
                        $log.log('end date : ' + date[1]);
                        startDate = moment(String(date[0]), 'DD/MM/YYYY HH:mm').format('MM/DD/YYYY HH:mm');
                        endDate = moment(String(date[1]), 'DD/MM/YYYY HH:mm').format('MM/DD/YYYY HH:mm');

                        //let startDate = moment(date[0]);
                        //let endDate = moment(date[1]);
                        $log.log('start date inside: ' + startDate);
                        $log.log('end date inside: ' + endDate);
                        if (checkDateRangeValidation(date[0], date[1], 'in_calendar')) {
                            return;
                        }
                        if (!validDates(startDate, endDate, 'addEvent', outsideModal)) {
                            return;
                        }
                    } else {
                        if ($scope.eventStart === undefined || $scope.eventStart === '' || $scope.eventEnd === undefined || $scope.eventEnd === '') {
                            $scope.message = 'start and end date are must fields, please fill them in';
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            missingDetailsOutsideAddEvent = true;
                            return;
                        }
                        $log.log('start date outside $scope.eventStart: ' + $scope.eventStart);
                        startDate = moment(String($scope.eventStart)).format('MM/DD/YYYY HH:mm');
                        endDate = moment(String($scope.eventEnd)).format('MM/DD/YYYY HH:mm');
                        $log.log('start date outside: ' + startDate);
                        $log.log('start date outside: ' + endDate);
                        if (!validDates(startDate, endDate, 'addEvent', outsideModal)) {
                            return;
                        }
                        if (checkDateRangeValidation(startDate, endDate, 'out_of_calendar') === true) {
                            return;
                        }
                    }
                    //$log.log('end date : ' + formatDate(date[1]));
                    //check if the role category was selected in the task modal - this is a must field
                    if ($scope.role === undefined || $scope.role === '' || $scope.role.Role === undefined) {
                        $scope.message = 'Category is a must field, please select one';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        if (!outsideModal) {
                            missingDetailInsideAddEvent = true;
                        } else {
                            missingDetailsOutsideAddEvent = true;
                        }
                        return;
                    }
                    $log.log('$scope.role : ' + $scope.role.Role);
                    //check if the title field was filled in the task modal - this is a must field
                    if ($scope.title === undefined || $scope.title === '') {
                        $scope.message = 'Title is a must field, please fill it in';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        if (!outsideModal) {
                            missingDetailInsideAddEvent = true;
                        } else {
                            missingDetailsOutsideAddEvent = true;
                        }
                        return;
                    }
                    /*
                        check if the task was chosen for a spesific customer - optional
                        then id = 'customer name' + ' customer phone number'
                    */
                    $log.log('taskWithCustomer : ' + taskWithCustomer);
                    if (taskWithCustomer) {

                        $log.log('$scope.customer :' + $scope.customer);
                        $log.log('selectedItemPart1 :' + selectedItemPart1);
                        $log.log('selectedItemPart2 :' + selectedItemPart2);
                        if ($scope.customer === '' || selectedItemPart1 === undefined || selectedItemPart2 === undefined || selectedItemPart1 === '' || selectedItemPart2 === '') {
                            $scope.message = 'You have selected the option for a costumer task and therefore a costumer must be selected';
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            if (!outsideModal) {
                                missingDetailInsideAddEvent = true;
                            } else {
                                missingDetailsOutsideAddEvent = true;
                            }
                            selectedItemPart1 = undefined;
                            selectedItemPart2 = undefined;
                            return;
                        } else {
                            description = 'Task for customer ' + selectedItemPart1 + ' ' + selectedItemPart2 + ' : ' + $scope.title;
                            customerId = selectedItemPart2;
                            customer = selectedItemPart1 + ' ' + selectedItemPart2;
                            customerHistory = addHistoryToCustomerEvent(description,startDate,endDate,$scope.role.Color,customer);
                            historyArray.push(customerHistory);

                        }
                    } else { //if the task is not for a specific customer -> id of customer = '-1'
                        description = $scope.title;
                        customer = -1;
                        customerId = -1;
                    }

                    $log.log('description: ' + description);
                    const eventToAdd = {
                        title: description,
                        start: startDate,
                        end: endDate,
                        color: $scope.role.Color,
                        id: customer,
                        customerPhone: customerId,
                        editable: true,
                        allDay: false
                    };
                    $scope.selections = [];
                    //uiCalendarConfig.calendars['myCalendar'].fullCalendar('renderEvent', eventToAdd, true);
                    addEventToDataBase(eventToAdd, loggedInWorker);
                    //uiCalendarConfig.calendars['myCalendar'].fullCalendar('refetchEvents');
                    //  console.log($scope.pendingRequests);
                };
                $scope.getCalendarEvent = function (event) {
                    $log.log('event : '+JSON.stringify(event));
                    $scope.calendarFunction('calendarEvent',event);
                }
                //cancel function from modal in calendar
                $scope.cancelEvent = function () {
                    $scope.role = '';
                    $scope.customerTask = false;
                    $scope.customer = undefined;
                    $scope.title = '';
                    $scope.eventStart = '';
                    $scope.eventEnd = '';
                    $scope.date = '';
                    selectedItemPart1 = undefined;
                    selectedItemPart2 = undefined;
                    $scope.selectedCustomer = '';
                    category = undefined;
                };

                function updateCustomerHistoryEmail(){
                    const history = 'Date : '+moment().format('DD/MM/YYYY HH:mm')+'\n\nMail has sent\n';
                    historyArray.push(history);
                    updateCustomerHistory(historyArray, customersPhone);
                }

                //modal for sending mail to a customer
                $scope.sendMailModal = function (customerEmail) {
                    $log.log('customerEmail :' + customerEmail.eMail);
                    customersPhone.push(customerEmail.PhoneNumber);
                    //check if the customer that was pressed on has an email address
                    if (customerEmail.eMail === undefined || customerEmail.eMail === '') {
                        toaster.pop('error', 'No email for this customer');
                        return;
                    }

                    $scope.getFilesList();
                    //save the chosen customers email
                    $scope.customerEmail = customerEmail.eMail;
                    angular.element(document.querySelector('#emailModal')).modal('show');
                };
                /*
                    send email function and http post call to server
                    with customer and email details
                */
                $scope.sendEmail = function (customerEmail, emailSubject, emailBody) {

                    $log.log('file:' + category);

                    let attachmentFileName;
                    if ($scope.emailFile) {
                        attachmentFileName = category;

                    } else {
                        attachmentFileName = false;

                    }

                    $log.log('attachmentFileName :' + attachmentFileName);
                    const emailData = {
                        mailRecipient: customerEmail, mailSubject: emailSubject,
                        mailText: emailBody, attachmentFileName: attachmentFileName
                    };
                    $http.post(SERVER_URI + '/sendEmail', {
                        emailData: emailData
                    }).then(
                        function (response) {
                            console.log(response.data.error);
                            console.log(response.data.ok);
                            $scope.customerEmail = '';
                            $scope.emailSubject = '';
                            $scope.emailBody = '';
                            $scope.emailFile = false;
                            $scope.fileToMail = false;
                            category = undefined;
                            $scope.selections = [];



                            if (response.data.ok) {
                                toaster.pop('success', response.data.ok);
                                updateCustomerHistoryEmail();
                                return;
                            }

                            toaster.pop('error', response.data.error);


                        },
                        function (response) { //failure callback
                        }
                    );
                };


                //first load of system when conect to it
                $http({
                    method: 'GET',
                    url: 'firstSystemLoad'
                }).then(function (response) {

                    $scope.firstLoad = false;
                    $scope.notFirstLoad = false;
                    console.log('response.data.adminFirstLoad=' + response.data.adminFirstLoad);
                    console.log('response.data.adminChangedTempPassword=' + response.data.adminChangedTempPassword);
                    /*
                        check if this is the first load of the system -
                        means that administrator has not yet changed the temporary password
                        that he got with the system	- then change now
                    */
                    if (response.data.adminFirstLoad === true || response.data.adminChangedTempPassword === false) { //go to change password page
                        //save 'firstLoad = true'
                        $scope.firstLoad = true;

                        //present the temp password page
                        $scope.tempPasswordPage = true;

                    } else if (response.data.adminChangedTempPassword === true) {
                        /*
                        if admin had changed the temporary password
                        so then it is not the first load to yhe system
                    */
                        //save taht not first load 'firstLoad = false'
                        $scope.firstLoad = false;

                        //save that is not the first load 'notFirstLoad = true'
                        $scope.notFirstLoad = true;

                        //present the tamp password page for login in to the system
                        $scope.tempPasswordPage = true;
                    } else {
                        /*
                        after entering the system with the temp password
                        presents the login page for inserting personal details
                        for admin the usae name field will be filled in automaticly
                        by the default with 'Administrator'
                    */
                        $scope.loginPage = true;
                        $scope.firstLoad = false;
                    }

                }, function (response) {
                });


                //a function for clicking on select file to system
                $scope.submitUpload = function () {
                    $log.log('$scope.file : ' + $scope.file);
                    if ($scope.uploadForm.file.$error.maxSize) {
                        $scope.message = 'The file size is greater than 10 MB ';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        $scope.uploadForm.file.$error.maxSize = false;
                        $scope.file = '';
                        problemWithFileSelection = true;
                        return;

                    }
                    if ($scope.file === undefined || $scope.file === '') {
                        $scope.message = 'You did not select a file to upload, please select one';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        problemWithFileSelection = true;
                        return;
                    }

                    if ($scope.uploadForm.file.$valid && $scope.file) { //check if from is valid
                        //if (vm.file) { //check if from is valid
                        $scope.upload($scope.file); //call upload function
                    }


                };

                $scope.upload = function (file) {
                    Upload.upload({
                        url: SERVER_URI + '/uploadFile', //webAPI exposed to upload the file
                        data: {file: file} //pass file as data, should be worker ng-model
                    }).then(function (resp) { //upload function returns a promise
                        $scope.file = '';
                        if (resp.data.errorCode === 0) { //validate success
                            const successUploded = ' Success to upload the file : ' + resp.config.data.file.name;
                            toaster.pop('success', successUploded);

                        } else {
                            const errorUploded = 'an error occured';
                            toaster.pop('error', errorUploded);

                        }
                    }, function (resp) { //catch error
                        console.log('Error status: ' + resp.status);
                        $window.alert('Error status: ' + resp.status);
                    }, function (evt) {
                        console.log(evt);
                        const progressPercentage = parseInt(100.0 * evt.loaded / evt.total, 10);
                        console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                        $scope.progress = 'progress: ' + progressPercentage + '% '; // capture upload progress
                    });
                };

                //add file to system function
                $scope.addFile = function () {
                    //show modal for add file
                    $scope.file = undefined;
                    angular.element(document.querySelector('#addFileModal')).modal('show');
                };



                $scope.showModalCurTempPassword = function (){
                    angular.element(document.querySelector('#validationCurrentTempPasswordModal')).modal('show');

                };

                /*
                   a validation function with http.post request to server for temporary password
                   checks if the temp password from client side
                   is equal to the temp password in server side
               */
                $scope.validationOfTempPassword = function (tempPasswordFromClient) {
                    $log.log('validationOfTempPassword :' + tempPasswordFromClient);
                    $http.post(SERVER_URI + '/verifyTemporaryPassword', {
                        tempPassword: tempPasswordFromClient
                    }).then(
                        function (response) {//success callback
                            console.log('validationOfTempPassword: response.data.adminChangedTempPassword=' + response.data.adminChangedTempPassword);
                            console.log('validationOfTempPassword: response.data.verified=' + response.data.verified);
                            console.log('validationOfTempPassword: response.data.notVerified=' + response.data.notVerified);
                            //verified passwords (not for Admin worker)
                            if (response.data.verified) {
                                console.log('is verified');
                                if(loggedInWorker!==undefined && loggedInWorker.adminWorker) {
                                    angular.element(document.querySelector('#changeTemporaryPasswordModal')).modal('show');
                                    return;

                                }
                                $scope.newTempPasswordPage = false;
                                $scope.tempPasswordPage = false;
                                $scope.registerPage = true;
                            } else if (response.data.adminChangedTempPassword === false) { //admin did not yet change temp password that he got with the system
                                console.log('validationOfTempPassword: !response.data.adminChangedTempPassword=' + response.data.adminChangedTempPassword);
                                $scope.newTempPasswordPage = true;
                                $scope.tempPasswordPage = false;

                                $scope.registerPage = false;
                            } else if (response.data.adminChangedTempPassword) { //admin changed temp password that he got with the system
                                console.log('validationOfTempPassword: response.data.adminChangedTempPassword=' + response.data.adminChangedTempPassword);
                                $scope.newTempPasswordPage = false;
                                $scope.tempPasswordPage = false;
                                $scope.registerPage = true;
                                $scope.registrationworkerName = 'Admin';
                                $scope.Admin = true;
                            } else { //not correct temprorary password
                                console.log('validationOfTempPassword: response.data.notVerified=' + response.data.notVerified);
                                // eslint-disable-next-line no-undef
                                if(loggedInWorker!==undefined && loggedInWorker.adminWorker) {
                                    $scope.message = 'Invalid temporary password , please try again.';
                                    invalidTempPassword = true;
                                }
                                else {
                                    $scope.message = response.data.notVerified;

                                }
                                $scope.messageType = 'ERROR';
                                angular.element(document.querySelector('#msgModal')).modal('show');
                            }
                        },

                        //failure callback
                        function (response) {

                        }
                    );
                };

                /*
                    a function for administrator for changing the temp password
                */
                $scope.changeTempPassword = function (newTemporaryPassword,newTemporaryValidationPassword) {
                    //a regular expression for a valid password
                    const rePassword = /^((?!.*[\s])(?=.*[A-Z])(?=.*\d))(?=.*?[#?!@$%^&*-]).{8,15}$/;

                    //check the length of the password and if it fits the regular expression pattern
                    if (newTemporaryPassword === undefined || !rePassword.test(newTemporaryPassword)) {
                        $scope.message = 'The password must contain at least 8 to 15 characters , at least : one capital letter or one small letter, one number, and one of the following special characters: #?! @ $% ^ & * -';
                        $scope.messageType = 'ERROR';
                        $scope.newTempPasswordSettings = undefined;
                        $scope.verifyNewTempPasswordSettings = undefined;
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        incorectNewTempPassword = true;
                        return;
                    }

                    //check if the two password are equal
                    if (newTemporaryPassword !== newTemporaryValidationPassword) {
                        $scope.message = 'The two passwords do not match';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        $scope.newTemporaryValidationPassword = undefined;
                        incorectNewTempPassword = true;

                        return;
                    }

                    //an http request to server to update the temporary password
                    const newTempPassword = {TempPassword: newTemporaryPassword};
                    $http.post(SERVER_URI + '/changeTemporaryPassword', {
                        newTempPassword: newTempPassword
                    }).then(
                        function (response) { //success callback
                            $log.log("response.data=" + JSON.stringify(response.data));
                            if(response.data.error) {
                                toaster.pop('error', response.data.error, '');
                                return;
                            }
                            $scope.newTemporaryPassword = $scope.newTemporaryValidationPassword = $scope.newTempPasswordSettings =$scope.verifyNewTempPasswordSettings = undefined;
                            $log.log('loggedInWorker ;'+loggedInWorker);
                            if(loggedInWorker !== undefined && loggedInWorker.adminWorker){
                                if(response.data.success) {
                                    toaster.pop('success', response.data.success, '');
                                    return;
                                }
                            }
                            $scope.registerPage = true;
                            $scope.registrationworkerName = 'Admin';
                            $scope.Admin = true;
                            $scope.newTempPasswordPage = false;
                            $scope.firstLoad = false;

                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                    when a worker signes up / registers to the system
                    this function checks validation of workers details
                    and send them when all are valid to server in an http post request
                */
                $scope.signUp = function () {
                    const reworkerName = /^[a-zA-Z]{3,10}$/;
                    const reName = /^[a-zA-Z\s\u0590-\u05fe]{2,20}$/;

                    //check if worker name has been entered and if it is valid according to the matching regular expression pattern
                    if ($scope.registrationworkerName === undefined || !reworkerName.test($scope.registrationworkerName)) {
                        $scope.message = 'Worker name must contain only English letters ,minimum 3 leterrs and maximum 10 letters and no whitespace';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }

                    //check if the name has been entered and if it is valid according to the matching regular expression pattern
                    if ($scope.registrationName === undefined || !reName.test($scope.registrationName)) {
                        $scope.message = 'The name must contain only English or Hebrew letters ,minimum 2 leterrs and maximum 20 letters ';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }
                    const reMail = /^(([^<>()[\]\\.,;:\s@\']+(\.[^<>()[\]\\.,;:\s@\']+)*)|(\'.+\'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                    //check if the email has been entered and if it is valid according to the matching regular expression pattern
                    if ($scope.registrationEmail === undefined || !reMail.test($scope.registrationEmail)) {
                        $scope.message = 'This email is invalid ';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }
                    const rePassword = /^((?!.*[\s])(?=.*[A-Z])(?=.*\d))(?=.*?[#?!@$%^&*-]).{8,15}$/;

                    //check if a password has been entered and if it is valid according to the matching regular expression pattern
                    if ($scope.registrationPassword === undefined || !rePassword.test($scope.registrationPassword)) {
                        $scope.message = 'The password must contain at least 8 to 15 characters , at least : one capital letter or one small letter, one number, and one of the following special characters: #?! @ $% ^ & * -';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }

                    //check if the validation password is equal to the first password that was entered
                    if ($scope.registrationPassword !== $scope.registrationValidationPassword) {
                        $scope.message = 'The two passwords do not match';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        $scope.registrationValidationPassword = undefined;
                        return;
                    }


                    //save workers valid details as a json object
                    const worker = {
                        workerName: $scope.registrationworkerName, Name: $scope.registrationName,
                        eMail: $scope.registrationEmail, Password: $scope.registrationPassword
                    };
                    $log.log('before call server');
                    //call server with http request
                    $http.post(SERVER_URI + '/addWorker', {
                        worker: worker
                    }).then(
                        function (response) { //success callback

                            //get response from server
                            const workerFromServer = response.data.worker;
                            loggedInWorker = workerFromServer;

                            //check if this worker name does not exist already
                            if (!response.data.workerExists) {
                                $log.log(workerFromServer.Name);

                                //clear all fields in registration page

                                if (workerFromServer.workerName !== 'Admin') {
                                    //show menu system components and worker profile of account
                                    $scope.message = 'Thanks for signing up, you must wait for the administrator to assign you a role so you can sign in.';
                                    $scope.messageType = 'MESSAGE';
                                    angular.element(document.querySelector('#msgModal')).modal('show');
                                    setTimeout(function () {
                                        $window.location.reload();
                                    }, 7000); // Set enough time to wait until animation finishes;*/
                                    return;
                                }
                                $window.location.reload();
                            } else { //if this worker name already exists in system -> show error modal
                                $scope.message = response.data.workerExists;
                                $scope.messageType = 'ERROR';
                                angular.element(document.querySelector('#msgModal')).modal('show');
                                $scope.registrationworkerName = undefined;

                            }
                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                    a function for login to system after the worker is registed already
                    login with worker name and password
                    and verify details with thoes at server by sending the data in http request
                */
                $scope.login = function () {
                    $log.log('workerNameLogin ' + $scope.workerNameLogin);

                    //check if worker name has been entered -> requierd
                    if ($scope.workerNameLogin === undefined || $scope.workerNameLogin === '') {
                        $scope.message = 'Worker name is required';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }

                    //check if password has been entered -> requierd
                    if ($scope.PasswordLogin === undefined || $scope.PasswordLogin === '') {
                        $scope.message = 'Password is required';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;

                    }

                    /*
                        a function for saving the worker that is logged in details
                    */
                    let LoginWorker = {workerName: $scope.workerNameLogin, Password: $scope.PasswordLogin};
                    $http.post(SERVER_URI + '/login', {
                        LoginWorker: LoginWorker
                    }).then(
                        function (response) { //success callback

                            //get data from server response
                            LoginWorker = response.data.workerLogin;
                            loggedInWorker = LoginWorker;

                            //if there is a match between worker name and password at server side
                            if (!response.data.noMatch) {
                                // $scope.events = LoginWorker.Events;
                                //$scope.retreivedCalendarEvents = LoginWorker.Events;
                                //$log.log('Events : ' + $scope.events);
                                if(LoginWorker.Role==='new in the system')
                                {
                                    $scope.message = 'The administrator has not yet assigned you a role in the system, therefore can not sign in yet';
                                    $scope.messageType = 'ERROR';
                                    angular.element(document.querySelector('#msgModal')).modal('show');
                                    return;

                                }

                                //if admin show admin page and update that admin is logged in
                                if (LoginWorker.adminWorker) {
                                    $scope.adminPage = true;
                                    $scope.isAdmin = true;
                                } else { //if not admin hide admin page and update that not admin is logged in
                                    $scope.adminPage = false;
                                    $scope.isAdmin = false;
                                }

                                //clear fields in login page
                                $scope.workerNameLogin = undefined;
                                $scope.PasswordLogin = undefined;

                                //show menu and worker profile in account and hide the login page
                                $scope.menu = true;
                                $scope.account = true;
                                $scope.loginPage = false;

                                $scope.nameOfWorker = LoginWorker.Name;
                                $log.log('roleOfWorker: ' + LoginWorker.Role);
                                $scope.roleOfWorker = LoginWorker.Role;
                                $scope.allSystem = true;

                                //get lists of : optiont, roles, roles colors, customers files and workers
                                $scope.getOptionsList();
                                $scope.getRolesList();
                                $scope.getRolesColorsList();
                                $scope.getCustomersList();
                                $scope.getFilesList();
                                $scope.getWorkersList();
                                refreshCalendarEvents();

                            } else { //if there is no match show error modal
                                $scope.message = response.data.noMatch;
                                $scope.messageType = 'ERROR';
                                angular.element(document.querySelector('#msgModal')).modal('show');
                            }

                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                    a function for showing the list of customers
                */
                $scope.getCustomersFunction = function (flag) {
                    /*
                    $scope.showUpdateExpression = true;
                    $scope.showUpdateInput = false;
                     */
                    $scope.calendarNavColor = '#004d99';
                    $scope.spesificCustomersNavColor = '#004d99';
                    $scope.customersNavColor = '#ff0066';
                    $scope.loginPage = false;
                    $scope.showCustomers = true;
                    $scope.showWorkers = false;
                    $scope.showSettings = false;
                    $scope.click = true;
                    $scope.showCalendar = false;
                    $scope.account = true;
                    $scope.showWorkersEvents = false;


                    if(!flag)
                    {
                        $scope.getCustomersList();

                    }
                    $scope.getOptionsList();
                    $scope.getRolesList();
                };

                /*
                    a function for checking if a color already exists in the colors list
                    the function gets a color and runs over the lis of colors a nd checks if the color exists
                    returns true if exists else returns false
                */
                $scope.checkExsistingColor = function (color) {
                    $log.log('$scope.checkExsistingColor : color: ' + color);

                    for (let item = 0; item < $scope.rolesColors.length; item++) {
                        $log.log('$scope.rolesColors[item].Color: ' + $scope.rolesColors[item].Color);

                        if ($scope.rolesColors[item].Color === color) {
                            return true;
                        }
                    }
                    return false;
                };
                /*
                    a function for saving a role with a list of statuses that have been selected
                    each role has an uniq color
                */
                $scope.saveNewRoleStatus = function () {
                    $log.log(document.getElementById('roleColor').value);

                    //get a color from worker
                    const roleColor = document.getElementById('roleColor').value;
                    const color = roleColor.toString();
                    $log.log('color: ' + color);

                    //check if color exists
                    const existingColor = $scope.checkExsistingColor(color);
                    $log.log('existingColor: ' + existingColor);

                    //check if the role field in modal has been filled in if not show error modal
                    if ($scope.roleFromModal === undefined || $scope.roleFromModal === '') {
                        $scope.message = 'You must fill in the role field';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingRoleField = true;
                        return;
                    }

                    //if color exists show error modal
                    if (existingColor) {
                        $log.log('entered existingColor: ' + existingColor);

                        $scope.message = 'This color already exist, please choose different color';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingRoleField = true;
                        return;
                    }


                    if (selectedItems.length === 0) {

                        $scope.message = 'You must choose status/es for role';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingRoleField = true;
                        return;
                    }
                    //if color does not exist send an http request to server with role details : role color and matching statuses list
                    const roleWithStatuses = {
                        Role: $scope.roleFromModal,
                        Color: roleColor,
                        Statuses: selectedItems
                    };
                    $http.post(SERVER_URI + '/addRoleWithStatuses', {
                        roleWithStatuses: roleWithStatuses
                    }).then(
                        function (response) { //success callback
                            $scope.roleFromModal = undefined;
                            selectedItems = [];
                            $scope.getRolesList();
                        },
                        function (response) { //failure callback

                        }
                    );
                };

                //a function for showing roles list
                $scope.displayRoleList = function () {
                    $scope.getRolesList();
                    $scope.role = undefined;
                    selectedItems = [];
                    angular.element(document.querySelector('#deleteRoleModal')).modal('show');
                };
                /*
                    a function for saving a new status in system with a list of matching roles
                    and calling server with http request
                */
                $scope.saveNewSatusRoles = function () {
                    //check if the status field in modal has been filled in if not show an error modal
                    if ($scope.statusFromModal === undefined || $scope.statusFromModal === '') {
                        $scope.message = 'You must fill in the status field';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingStatusOrRoleField = true;
                        return;
                    }
                    if (selectedItems.length === 0) {
                        $scope.message = 'You must choose role/s';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingStatusOrRoleField = true;
                        return;
                    }

                    //if the status field is filled in

                    //save details in json object : status and roles list and call server with http request
                    const statusWithRoles = {Status: $scope.statusFromModal, Roles: selectedItems};
                    $http.post(SERVER_URI + '/addStatusWithRoles', {
                        statusWithRoles: statusWithRoles
                    }).then(
                        function (response) { //success callback
                            $scope.statusFromModal = undefined;
                            $scope.getOptionsList();
                            $scope.role = undefined;
                            $scope.item = undefined;
                            selectedItems = [];
                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                    a function for adding a new role with statuses there is an http call to server
                    for getting the status collection list
                    for selecting matching statuses to this role
                */
                $scope.addNewRole = function () {
                    $log.log('entered addNewRole() = function()');
                    $http.get(SERVER_URI + '/getStatusOptions').then(
                        function (response) {//success callback

                            //return the list of the statusOptions
                            $scope.options = response.data.statusOptions;
                            //get roles colors list
                            $scope.getRolesColorsList();
                            $scope.roleFromModal = undefined;
                            selectedItems = [];

                            angular.element(document.querySelector('#addNewRoleModal')).modal('show');

                            //the list of selected items
                            selectedItems = [];
                        },
                        function (response) {//failure callback
                            //if failed show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                };
                /*
                    a function for showing the calendar page
                    and hiding all other pages that are not relevant
                */
                $scope.calendarFunction = function (flag,value) {
                    $scope.loginPage = false;
                    $scope.showCustomers = false;
                    $scope.showCalendar = true;
                    $scope.showWorkers = false;
                    $scope.showSettings = false;
                    $scope.showWorkersEvents = false;
                    $scope.account = false;
                    $scope.calendarNavColor = '#ff0066';
                    $scope.calendarNavColor = '#004d99';
                    $scope.customersNavColor = '#004d99';
                   // $scope.getRolesList();
                    getAssignedRoles();


                    //clearing the search field
                    $scope.search = '';
                    //uiCalendarConfig.calendars['myCalendar'].fullCalendar('refetchEvents');
                    setTimeout(function () {
                        uiCalendarConfig.calendars['myCalendar'].fullCalendar('render');

                    }, 5); // Set enough time to wait until animation finishes;*/
                    if(flag=='customerEvents')
                    {

                        refreshCustomerCalendarEvents(value);
                        return;
                    }
                    if(flag=='calendarEvent')
                    {
                        $log.log('event : '+JSON.stringify(value));
                        refreshCalendarEvent(value);
                        return;

                    }
                    refreshCalendarEvents();
                };

                /*
                    a function for showing the settings page
                    and hiding other pages that are not relevant
                */
                $scope.settingsFunction = function () {
                    //$log.log('entered settings function');
                    $scope.showSettings = true;
                    $scope.loginPage = false;
                    $scope.showCustomers = false;
                    $scope.showWorkers = false;
                    $scope.showCalendar = false;
                    $scope.showWorkersEvents = false;


                    //clearing the search field
                    $scope.search = '';
                };

                /*
                    a function for adding a new customer to system
                    shows the matching 'div' in html page
                */
                $scope.addCustomerFunction = function () {
                    //update the parameter 'getNewCustomerDetails' to true for shoing the div
                    $scope.getNewCustomerDetails = true;
                    $scope.click = false;
                };

                /*
                    a function for closeing the option of customer addition
                    and clearing fields to be undefined
                */
                $scope.cancelFunction = function () {
                    $scope.getNewCustomerDetails = false;
                    $scope.click = true;
                    $scope.newName = '';
                    $scope.newStatus = '';
                    $scope.newPhoneNumber = '';
                    $scope.newEmail = '';
                    $scope.newAddress = '';
                    $scope.role = '';
                    $scope.statusRole = undefined;
                };

                /*
                    get the list of statuses from the server with an http request
                */
                $scope.getOptionsList = function () {
                    $log.log('entered getStatusList() = function()');
                    $http.get(SERVER_URI + '/getStatusOptions').then(
                        function (response) {//success callback

                            //return the list of the statusOptions
                            $scope.options = response.data.statusOptions;

                        },
                        function (response) {//failure callback

                            //if fails show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                };


                /*
                    get the the list of colors for roles from server
                    with http request to sever
                */
                $scope.getRolesColorsList = function () {
                    $log.log('entered getStatusList() = function()');
                    $http.get(SERVER_URI + '/getRolesColors').then(
                        function (response) {//success callback

                            //return the list of the colors
                            $scope.rolesColors = response.data.colors;
                        },
                        function (response) {//failure callback

                            //if fails show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                };

                /*
                    get the the list of roles from server
                    with http request to sever
                */
                $scope.getRolesList = function () {
                    $log.log('entered getRolesList() = function()');
                    $http.get(SERVER_URI + '/getRoles').then(
                        function (response) {//success callback

                            //return the list of the roles
                            $scope.roles = response.data.roles;

                        },
                        function (response) {//failure callback

                            //if fails show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                };

                /*
                    a function for saving the deatailes of customer before update
                */
                $scope.updateCustomerFunction = function (customer) {
                    //get all details of customer in json format
                    customerBeforeUpdate = {
                        Category: customer.Category,
                        Name: customer.Name,
                        Status: customer.Status,
                        PhoneNumber: customer.PhoneNumber,
                        eMail: customer.eMail,
                        Address: customer.Address
                    };
                    const indexRole = getIndexOfSelectedItem(customerBeforeUpdate.Category.Role, 'role_list');
                    console.log('indexRole=' + indexRole);
                    $scope.roleCategory = $scope.assignedRoles[indexRole];
                    console.log('$scope.roleCategory=' + JSON.stringify($scope.roleCategory));
                    $scope.statusRole = $scope.assignedRoles[indexRole].Statuses[getIndexOfSelectedItem(customerBeforeUpdate.Category.Role, 'status_list', customerBeforeUpdate.Status)];
                    console.log('$scope.statusRole=' + $scope.statusRole);
                    $scope.updateStatus = customerBeforeUpdate.Status;
                    console.log('customerBeforeUpdate.Status=' + customerBeforeUpdate.Status);
                };

                /*
                    a function for saving the deatailes of worker before update
                    the function gets the parameter 'worker' that contains selected workers details
                */
                $scope.updateWorkerFunction = function (worker) {
                    //get all details of worker in json format
                    workerBeforeUpdate = {Role: worker.Role, Name: worker.Name, workerName: worker.workerName, eMail: worker.eMail};
                    $scope.role = undefined;
                    if (worker.Role !== 'new in the system') {
                        $scope.role = $scope.roles[getIndexOfSelectedItem(workerBeforeUpdate.Role, 'role_list')];
                        $log.log('$scope.role=' + $scope.role);
                    }
                };

                /*
                    a function for showing the modal with a new status addition
                    the parameter 'option' is the chosen status
                */
                $scope.onChange = function (option) {
                    $log.log('option : ' + option);
                    statusRole = option;
                };

                /*
                    a function for saving the role that was chosen
                */
                $scope.onChangeCategory = function (option, flag) {
                    $log.log('option=' + JSON.stringify(option));
                    category = option;
                    if (flag === 'update role') {
                        category = option.Role;
                    }
                    if (flag === 'fileToMail') {
                        category = option.FileName;
                    }
                };
                /*
                    a function for saving selected items from selected lists
                    save according to flag
                */
                $scope.selectedItem = function (option, flag) {

                    if (flag === 'new status' || flag === 'update role') {
                        selectedItems.push(option.Status);
                    } else if (flag === 'new role') {
                        selectedItems.push(option.Role);
                    } else if (flag === 'delete status') {
                        deletedStatus = option.Status;
                    } else {
                        selectedItems.push(option);
                    }
                    $log.log('selectedItems :' + selectedItems);
                };

                /*
                    a function for deleting file from the system (from server as well)
                    with http request to server with the selected file
                */
                $scope.deleteFile = function (file) {
                    $log.log('$scope.file : ' + $scope.file);
                    $log.log('file : ' + file);
                    if (file === undefined || file === '') {
                        $scope.message = 'You did not select a file to delete, please select one';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingFileToDelete = true;
                        return;
                    }
                    const fileToDelete = {FileName: file.FileName};
                    $http.post(SERVER_URI + '/deleteFile', {
                        file: fileToDelete
                    }).then(
                        function (response) { //success callback
                            console.log(response.data.fileDeleted);
                            $scope.file = '';
                            if (response.data.fileDeleted) {
                                toaster.pop('success', response.data.fileDeleted, '');
                            }

                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                    a function for adding a new status to a role
                    with an http request to server
                */
                $scope.addNewStatusToRole = function () {

                    $log.log('entered addNewRole() = function()');
                    $http.get(SERVER_URI + '/getRoles').then(
                        function (response) {//success callback

                            //return the list of the roles
                            $scope.roles = response.data.roles;
                            $scope.statusFromModal = undefined;
                            $scope.role = undefined;
                            selectedItems = [];

                            //show modal for adding a new status
                            angular.element(document.querySelector('#addNewStatusModal')).modal('show');

                        },
                        function (response) {//failure callback

                            //if fails show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                };

                /*
                    a function for shoing the modal for
                    adding a new status to the system
                */
                $scope.addNewStatusToSystem = function () {
                    //get the status list
                    $scope.getOptionsList();
                    $scope.systemStatusFromModal = undefined;

                    //show add new status modal
                    angular.element(document.querySelector('#addNewStatusToSystemModal')).modal('show');
                };

                /*
                    a function for saveing the new status from the modal in server
                    with http request
                */
                $scope.saveNewSystemStatus = function () {
                    //if there was chosen a ststus in modal
                    if ($scope.systemStatusFromModal && $scope.systemStatusFromModal !== '') {
                        //save the chosen status in json format
                        const newSatus = {Status: $scope.systemStatusFromModal};
                        $http.post(SERVER_URI + '/addStatus', {
                            newSatus: newSatus
                        }).then(
                            function (response) { //success callback

                                //clear the field of new status and get the updated ststuses list
                                $scope.newStatus = '';
                                $scope.getOptionsList();
                            },
                            function (response) { //failure callback

                                //if fails show error modal
                                $scope.message = response.data.error;
                                $scope.messageType = 'ERROR';
                                angular.element(document.querySelector('#msgModal')).modal('show');
                            }
                        );
                    } else { //if there was no status selected in modal
                        //show error modal
                        $scope.message = 'You must enter a status';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingStatusSystemFiled = true;

                    }

                    //clear the field in modal
                    $scope.systemStatusFromModal = undefined;
                };
                /*
                     a function for shoing modal of update role
                */
                $scope.updateRole = function () {
                    $scope.role = undefined;
                    $scope.item = undefined;
                    category = undefined;
                    selectedItems = [];

                    angular.element(document.querySelector('#updateRoleModal')).modal('show');
                };

                /*
                    a function for updating a role with new statuses
                    and sending it to server
                */
                $scope.updateRoleWithStatuses = function () {
                    $log.log('Hiii');
                    //if there was no role chosen show an error modal
                    if (category === undefined) {
                        $scope.message = 'You must choose a role';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingUpdateFields = true;
                        return;
                    }

                    //if there were no statuses selected for the role show an error modal
                    if (selectedItems.length === 0) {
                        $scope.message = 'You must choose a status';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingUpdateFields = true;
                        return;
                    }
                    //save in json format the role that was chosen with the statuses that were selected
                    const roleToUpdate = {Role: category, Statuses: selectedItems};
                    $http.post(SERVER_URI + '/updateRole', {
                        roleToUpdate: roleToUpdate
                    }).then(
                        function (response) { //success callback

                        },
                        function (response) { //failure callback
                            $scope.newName = undefined;
                            $scope.newPhoneNumber = undefined;
                            $scope.newEmail = undefined;
                            $scope.newAddress = undefined;

                            //if fails show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                };

                /*
                    get the customers list from server with http request
                */
                $scope.getCustomersList = function (workerName = loggedInWorker.workerName ) {
                    $http.get(SERVER_URI + '/getCustomers/' + workerName).then(
                        function (response) {//success callback

                            //return the list of the customers
                            $scope.customersInfo = response.data.customers;
                            $scope.role = '';
                            $scope.statusRole = undefined;
                            $scope.newName = '';
                            $scope.newPhoneNumber = '';
                            $scope.newEmail = '';
                            $scope.newAddress = '';
                            $scope.roleCategory = '';

                            getAssignedRoles();

                        }, function (response) {//failure callback

                        }
                    );
                };

                /*
                    get the files list from server with http request
                */
                $scope.getFilesList = function () {
                    $http.get(SERVER_URI + '/getFiles').then(
                        function (response) {//success callback

                            //return the list of the files
                            $scope.files = response.data.files;
                        },
                        function (response) {//failure callback
                        }
                    );
                };

                $scope.getworkerNameCustomers = function (workerName)
                {
                    $scope.workersNavColor = '#004d99';
                    $scope.customersNavColor = '#ff0066';
                    $scope.getCustomersFunction(true);
                    $scope.getCustomersList(workerName);

                }

                /*
                    a function for getting the list of workers from server with http request
                */
                $scope.getWorkersList = function (flag) {
                    $log.log('flag : ' + flag);
                    $http.post(SERVER_URI + '/getWorkers', {
                        statusFlag: flag
                    }).then(
                        function (response) {//success callback

                            //return the list of the workers
                            $scope.workers = response.data.workers;

                            //if was chosen to delete the worker
                            if (response.data.deleteWorker) {

                                $log.log('deleteWorker');
                                //show modal for deleting the worker
                                $scope.messageType = 'Choose worker to delete';
                                angular.element(document.querySelector('#deleteModal')).modal('show');
                                return;
                            }
                            $scope.showWorkers = true;
                        },
                        function (response) {//failure callback

                            //if faild show error modal
                            $scope.message = response.data.error;
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                };

                /*
                    a function for shing the workers list in page in html
                    and getting the list of the workers and list of roles
                */
                $scope.getWorkersFunction = function (flag) {
                    $scope.showWorkers = true;

                    //hide the parts in html that are not relevant to workers tab
                    $scope.showSettings = false;
                    $scope.showCustomers = false;
                    $scope.showCalendar = false;
                    $scope.showWorkersEvents = false;
                    $scope.account = true;
                    $scope.getWorkersList(flag);
                    $scope.getRolesList();
                };


                /*
                    a validation function for checking all new customer fildes
                    if there was an error in 1 field show error modal
                */
                $scope.checkAndSaveDetails = function () {
                    //check if a role was chosen
                    if (category === undefined) {
                        $scope.message = 'You must choose a category';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }

                    //check if status has been chosen
                    if (statusRole === undefined || statusRole === '') {
                        $scope.message = 'You must choose a status';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }


                    //check the name field if there was entered a new name
                    if ($scope.newName === undefined || $scope.newName === '') {
                        $scope.messageType = 'ERROR';
                        $scope.message = 'You must enter a name';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    } else { //if there was a new name entered
                        //save the new name
                        const name = $scope.newName;

                        //check the length of the name
                        if (name.length > MAX_LETTERS_IN_NAME) {
                            $scope.messageType = 'WARNNING';
                            $scope.message = 'This name is too long, therefore only ' + MAX_LETTERS_IN_NAME + ' characters including spaces will be saved';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            $scope.newName = $scope.newName.slice(0, MAX_LETTERS_IN_NAME);
                            return;
                        }
                    }

                    //check if no new status was chosen
                    if ($scope.newStatus === undefined || $scope.newStatus === '') {
                        $scope.newStatus = '';
                    }

                    //check the phone number field if not entered show an error modal -> this field is a munst field
                    if ($scope.newPhoneNumber === undefined || $scope.newPhoneNumber === '') {
                        $scope.messageType = 'ERROR';
                        $scope.message = 'You must enter a phone number';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    } else { //if a phone number was entered
                        //a regular expression for a valid phone number
                        const validPhoneNumber = /^\+?([0-9]{2})?[0-9]{7,10}$/;

                        //check if the phone number is valid according to regular expression
                        if (!validPhoneNumber.test($scope.newPhoneNumber)) {
                            //if not valid show an error modal
                            $scope.messageType = 'ERROR';
                            $scope.message = 'This phone number is invalid';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            $scope.newPhoneNumber = undefined;
                            return;
                        }
                    }
                    $log.log('$scope.newEmail :' + $scope.newEmail);
                    //check if an email address was entered
                    if ($scope.newEmail && $scope.newEmail !== '') {
                        //save a regular expression for a valid email address
                        const validEmail = /^(([^<>()[\]\\.,;:\s@\']+(\.[^<>()[\]\\.,;:\s@\']+)*)|(\'.+\'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                        //check if the email address is valid according to regular expression
                        if (!validEmail.test($scope.newEmail)) {

                            //if not valid show an error modal
                            $scope.messageType = 'ERROR';
                            $scope.message = 'This email is invalid';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            return;
                        }
                    } else { //if no email address was entered
                        $scope.newEmail = '';
                    }

                    //check if an address was entered
                    if ($scope.newAddress && $scope.newAddress !== '') {
                        //save the address
                        const address = $scope.newAddress;

                        //check the length of the address
                        if (address.length > MAX_LETTERS_IN_ADDRESS) {
                            $scope.messageType = 'WARNNING';
                            $scope.message = 'This address is too long, therefore only ' + MAX_LETTERS_IN_ADDRESS + ' characters including spaces will be saved';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            $scope.newAddress = $scope.newAddress.slice(0, MAX_LETTERS_IN_ADDRESS);
                            return;
                        }
                    } else { //if no address was entered
                        $scope.newAddress = '';
                    }

                    $scope.click = true;

                    //call the function to add the new customer
                    $scope.addNewCustomer();
                };



                /*
                    a function for adding a new customer to system
                    with http request to server
                */
                $scope.addNewCustomer = function () {
                    //save the current date
                    const customerHistory = 'Date : ' + moment().format('MM/DD/YYYY HH:mm') + '\n\nCustomer Addition\n ';

                    //add to history the action
                    historyArray.push(customerHistory);
                    $log.log('customerHistory :' + customerHistory);
                    const customer = {
                        Name: $scope.newName,
                        Category: category,
                        Status: statusRole,
                        PhoneNumber: $scope.newPhoneNumber,
                        eMail: $scope.newEmail,
                        Address: $scope.newAddress,
                        History: historyArray
                    };
                    $http.post(SERVER_URI + '/addCustomer', {
                        customer: customer
                    }).then(
                        function (response) { //success callback

                            //check if the phone number exists in system
                            if (!response.data.phoneExists) {
                                $scope.getNewCustomerDetails = false;
                                $scope.getCustomersList();
                                $scope.newName = undefined;
                                $scope.newPhoneNumber = undefined;
                                $scope.newEmail = undefined;
                                $scope.newAddress = undefined;
                                historyArray = [];
                            } else { //if exists show error modal
                                $scope.messageType = 'ERROR';
                                $scope.message = response.data.phoneExists;
                                angular.element(document.querySelector('#msgModal')).modal('show');
                                historyArray = [];

                            }

                        },
                        function (response) { //failure callback

                            //clear fields of new customer that was edit
                            $scope.newName = undefined;
                            $scope.newPhoneNumber = undefined;
                            $scope.newEmail = undefined;
                            $scope.newAddress = undefined;

                            //if fails show error modal
                            $scope.messageType = 'ERROR';
                            $scope.message = response.data.error;
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        }
                    );
                };

                //delete a customer from server
                $scope.deleteCustomerFunction = function (customer) {

                    $http.post(SERVER_URI + '/deleteCustomer', {
                        customer: customer
                    }).then(
                        function (response) { //success callback
                            $scope.getCustomersList();
                            customerToDelete = '';
                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                     a function for catching any chane in customer
                     and save changes in history of customer
                */
                $scope.changedDtails = function (customerInfoToUpdate) {
                    let updatedCustomerHistory = '';
                    let change = -1;
                    let customerHistory = '';
                    if (category.Role !== customerBeforeUpdate.Category.Role) {
                        updatedCustomerHistory = 'Role changed from : ' + customerBeforeUpdate.Category.Role + ' to : ' + category.Role + '\n';
                        change = 0;
                    }
                    if (statusRole !== customerBeforeUpdate.Status) {
                        updatedCustomerHistory += 'Status changed from : ' + customerBeforeUpdate.Status + ' to : ' + statusRole + '\n';
                        change = 0;
                    }
                    if (customerInfoToUpdate.Name !== customerBeforeUpdate.Name) {
                        updatedCustomerHistory += 'Name changed from : ' + customerBeforeUpdate.Name + ' to : ' + customerInfoToUpdate.Name + '\n';
                        change = 0;
                    }
                    if (customerInfoToUpdate.PhoneNumber !== customerBeforeUpdate.PhoneNumber) {
                        updatedCustomerHistory += 'Phone number changed from : ' + customerBeforeUpdate.PhoneNumber + ' to : ' + customerInfoToUpdate.PhoneNumber + '\n';
                        change = 0;
                    }
                    if (customerInfoToUpdate.eMail !== customerBeforeUpdate.eMail) {
                        updatedCustomerHistory += 'Email changed from : ' + customerBeforeUpdate.eMail + 'to : ' + customerInfoToUpdate.eMail + '\n';
                        change = 0;
                    }
                    if (customerInfoToUpdate.Address !== customerBeforeUpdate.Address) {
                        updatedCustomerHistory += 'Address changed from : ' + customerBeforeUpdate.Address + 'to : ' + customerInfoToUpdate.Address + '\n';
                        change = 0;
                    }

                    if (change === 0) {
                        customerHistory = 'Date: ' + moment().format('MM/DD/YYYY HH:mm') + '\n\nCustomer Edit\n\n' + updatedCustomerHistory + '\n';

                    }
                    return customerHistory;
                };


                /*
                    a function for checking validation of all updated customer fildes
                    and if they are corcect send them to the server
                */
                $scope.saveUpdated = function (customerInfoToUpdate) {
                    $log.log('Category before: ' + customerBeforeUpdate.Category.Role);
                    $log.log('Category after : ' + JSON.stringify(category));

                    //check if role was celected
                    if (category === undefined) {
                        category = customerBeforeUpdate.Category;
                        if (statusRole === undefined) {
                            statusRole = customerBeforeUpdate.Status;
                        }
                    }


                    //check if no name was entered if so show an error modal
                    if (customerInfoToUpdate.Name === undefined || customerInfoToUpdate.Name === '') {
                        $scope.messageType = 'ERROR';
                        $scope.message = 'You must enter a name';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    } else { //if a name was entered
                        if (customerInfoToUpdate.Name.length > MAX_LETTERS_IN_NAME) {//check the length of the name
                            $scope.messageType = 'WARNNING';
                            $scope.message = 'This name is too long, therefore only ' + MAX_LETTERS_IN_NAME + ' characters including spaces will be saved';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            customerInfoToUpdate.Name = customerInfoToUpdate.Name.slice(0, MAX_LETTERS_IN_NAME);
                            return;
                        }
                    }

                    //check if no status was selected if so show an error modal
                    if (statusRole === undefined || statusRole === '') {
                        $scope.message = 'You must choose a status';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }


                    //check if phone number was entered and if it is valid
                    if (customerInfoToUpdate.PhoneNumber && customerInfoToUpdate.PhoneNumber !== '') {
                        const validPhoneNumber = /^\+?([0-9]{2})?[0-9]{7,10}$/;
                        //if the phone number is invalid shoe an error modal
                        if (!validPhoneNumber.test(customerInfoToUpdate.PhoneNumber)) {
                            $scope.messageType = 'ERROR';
                            $scope.message = 'This phone number is invalid';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            return;
                        }
                    } else { //if no phone number was entered show an error modal
                        $scope.messageType = 'ERROR';
                        $scope.message = 'You must enter a phone number';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }

                    //check if an email address was entered and if it is valid
                    if (customerInfoToUpdate.eMail && customerInfoToUpdate.eMail !== '') {
                        const validEmail = /^(([^<>()[\]\\.,;:\s@\']+(\.[^<>()[\]\\.,;:\s@\']+)*)|(\'.+\'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        if (!validEmail.test(customerInfoToUpdate.eMail)) {//check the email
                            $scope.messageType = 'ERROR';
                            $scope.message = 'This email is invalid';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            return;
                        }
                    } else { //if no email address was entered
                        customerInfoToUpdate.eMail = '';
                    }

                    //if a address was entered
                    if (customerInfoToUpdate.Address) {
                        if (customerInfoToUpdate.Address.length > MAX_LETTERS_IN_ADDRESS) {//check the length of the address
                            $scope.messageType = 'WARNNING';
                            $scope.message = 'This address is too long, therefore only ' + MAX_LETTERS_IN_ADDRESS + ' characters including spaces will be saved';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            $scope.newAddress = $scope.newAddress.slice(0, MAX_LETTERS_IN_ADDRESS);
                            customerInfoToUpdate.Address = customerInfoToUpdate.Address.slice(0, MAX_LETTERS_IN_ADDRESS);
                            return;
                        }
                    } else {
                        customerInfoToUpdate.Address = '';
                    }

                    //save the changes on customer in the history
                    const customerHistory = $scope.changedDtails(customerInfoToUpdate);

                    //save the details of the updated customer in a json format
                    const updatedCustomer = {
                        Name: customerInfoToUpdate.Name,
                        Category: category,
                        Status: statusRole,
                        PhoneNumber: customerInfoToUpdate.PhoneNumber,
                        eMail: customerInfoToUpdate.eMail,
                        Address: customerInfoToUpdate.Address,
                        History: customerHistory
                    };

                    //call server with an http request
                    $http.post(SERVER_URI + '/updateCustomer', {
                        customerBeforeUpdate: customerBeforeUpdate, updatedCustomer: updatedCustomer
                    }).then(
                        function (response) { //success callback
                            //check if the phone number does not exist already
                            if (!response.data.phoneExists) {
                                $scope.getCustomersList();
                                category = undefined;
                                statusRole = undefined;
                            } else { //if the phone already exsist show an error modal
                                $scope.messageType = 'ERROR';
                                $scope.message = response.data.phoneExists;
                                angular.element(document.querySelector('#msgModal')).modal('show');


                            }

                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                    a function for updating a worker in the system
                */
                $scope.saveUpdatedWorker = function (workerToUpdate) {
                    //regular expression for a valid worker name
                    const reworkerName = /^[a-zA-Z]{3,10}$/;

                    //regular expression for a valid name
                    const reName = /^[a-zA-Z\s\u0590-\u05fe]{2,20}$/;

                    $log.log('category: ' + category);
                    //if no role was selected show an error modal
                    if (category === undefined) {
                        $log.log('entered if : ' + workerBeforeUpdate.Role);
                        category = workerBeforeUpdate.Role;
                    }

                    //if a worker name was not entered or was invalid show an error modal
                    if (workerToUpdate.workerName === undefined || !reworkerName.test(workerToUpdate.workerName)) {
                        $scope.message = 'Worker name must contain only English letters ,minimum 3 leterrs and maximum 10 letters and no whitespace';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }

                    //if a name was not entered or was invalid show an error modal
                    if (workerToUpdate.Name === undefined || !reName.test(workerToUpdate.Name)) {
                        $scope.message = 'The name must contain only English or Hebrew letters ,minimum 2 leterrs and maximum 20 letters ';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }
                    const reMail = /^(([^<>()[\]\\.,;:\s@\']+(\.[^<>()[\]\\.,;:\s@\']+)*)|(\'.+\'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                    //check if an email address was entered and if it is valid
                    if (workerToUpdate.eMail === undefined || !reMail.test(workerToUpdate.eMail)) {
                        $scope.message = 'This email is invalid ';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }


                    //save the updated details of the worker
                    const updatedWorker = {
                        Role: category,
                        workerName: workerToUpdate.workerName,
                        Name: workerToUpdate.Name,
                        eMail: workerToUpdate.eMail
                    };
                    $log.log('updatedWorker=' + JSON.stringify(updatedWorker));
                    //call server with http request
                    $http.post(SERVER_URI + '/updateWorker', {
                        workerBeforeUpdate: workerBeforeUpdate, updatedWorker: updatedWorker
                    }).then(
                        function (response) { //success callback

                            $scope.workers = response.data.workers;

                            if (response.data.noWorkersWithThisRole) {
                                $scope.message = response.data.noWorkersWithThisRole;
                                $scope.messageType = 'WARNING';
                                angular.element(document.querySelector('#msgModal')).modal('show');
                                deleteWorkerEventsAndCustomers = true;
                                return;
                            }
                            category = undefined;
                        },
                        function (response) { //failure callback

                        }
                    );
                };

                function deleteWorkerEventsAndCustomersFromDb() {
                    $log.log('/deleteWorkerEventsAndCustomersFromDb');
                    const workerAfterUpdate = {
                        Role: category,
                        Name: workerBeforeUpdate.Name,
                        workerName: workerBeforeUpdate.workerName,
                        eMail: workerBeforeUpdate.eMail
                    };
                    $log.log('category=' + category);
                    $log.log('workerAfterUpdate=' + JSON.stringify(workerAfterUpdate));
                    $http.post(SERVER_URI + '/deleteWorkerEventsAndCustomers', {
                        workerBeforeUpdate: workerBeforeUpdate,
                        workerAfterUpdate: workerAfterUpdate
                    }).then(
                        function (response) { //success callback
                            //$scope.workers = response.data.workers;
                            selectedItemPart2 = undefined;
                            $log.log(JSON.stringify(response));
                            if (response.data.workers) {
                                $scope.workers = response.data.workers;
                                $scope.showWorkers = true;

                            }
                            selectedItemPart2 = undefined;
                        },
                        function (response) { //failure callback

                        }
                    );
                    $log.log(selectedItemPart2);
                };

                function deleteWorkerWithEventsAndCustomersFromDb() {
                    $log.log('/deleteWorkerWithEventsAndCustomersFromDb');
                    $http.post(SERVER_URI + '/deleteWorkerFinally', {
                        workerName: selectedItemPart2
                    }).then(
                        function (response) { //success callback
                            //$scope.workers = response.data.workers;
                            selectedItemPart2 = undefined;
                            $log.log(JSON.stringify(response));
                            if (response.data.workers) {
                                $scope.workers = response.data.workers;
                                $scope.showWorkers = true;

                            }
                            selectedItemPart2 = undefined;
                        },
                        function (response) { //failure callback

                        }
                    );
                    $log.log(selectedItemPart2);
                };

                /*
                    a function for repeating a message modal in match to the slected modal
                */
                $scope.repeatMessage = function () {
                    //modal for incorect password
                    if (incorectPassword) {
                        angular.element(document.querySelector('#changePasswordModal')).modal('show');
                        incorectPassword = false;
                    }
                    //modal for incorect password
                    if (incorectNewTempPassword) {
                        angular.element(document.querySelector('#changeTemporaryPasswordModal')).modal('show');
                        incorectNewTempPassword = false;
                    }

                    //modal for incorect current password
                    if (incorectCurrentPassword) {
                        angular.element(document.querySelector('#validationCurrentPasswordModal')).modal('show');
                        incorectCurrentPassword = false;
                    }

                    //modal for missing role field
                    if (missingRoleField) {
                        angular.element(document.querySelector('#addNewRoleModal')).modal('show');
                        missingRoleField = false;
                    }

                    //modal for missing status field
                    if (missingStatusOrRoleField) {
                        angular.element(document.querySelector('#addNewStatusModal')).modal('show');
                        missingStatusOrRoleField = false;
                    }

                    //modal for missing role field in calendar event
                    if (missingDetailInsideAddEvent) {
                        angular.element(document.querySelector('#addEvent')).modal('show');
                        missingDetailInsideAddEvent = false;
                    }
                    if (missingDetailsOutsideAddEvent) {
                        angular.element(document.querySelector('#addEventOutside')).modal('show');
                        missingDetailsOutsideAddEvent = false;
                    }
                    if (missingDetailsEditEvent) {
                        angular.element(document.querySelector('#editOrDeleteEvent')).modal('show');
                        missingDetailsEditEvent = false;
                    }
                    if (missingWorkerToDelete) {
                        $scope.messageType = 'Choose worker to delete';

                        angular.element(document.querySelector('#deleteModal')).modal('show');
                        missingWorkerToDelete = false;
                    }
                    if (missingStatusSystemFiled) {
                        angular.element(document.querySelector('#addNewStatusToSystemModal')).modal('show');
                        missingStatusSystemFiled = false;
                    }
                    if (missingDeleteStatusSystemField) {
                        angular.element(document.querySelector('#deleteStatusFromSystemModal')).modal('show');
                        missingDeleteStatusSystemField = false;
                    }
                    if (missingDeleteStatusRoleField) {
                        angular.element(document.querySelector('#deleteStatusFromRoleModal')).modal('show');
                        missingDeleteStatusRoleField = false;
                    }
                    if (missingUpdateFields) {
                        angular.element(document.querySelector('#updateRoleModal')).modal('show');
                        missingUpdateFields = false;
                    }
                    if (missingRoleToDelete) {
                        angular.element(document.querySelector('#deleteRoleModal')).modal('show');
                        missingRoleToDelete = false;
                    }
                    if (problemWithFileSelection) {
                        angular.element(document.querySelector('#addFileModal')).modal('show');
                        problemWithFileSelection = false;
                    }
                    if (missingFileToDelete) {
                        angular.element(document.querySelector('#deleteFileModal')).modal('show');
                        missingFileToDelete = false;
                    }
                    if (invalidTempPassword) {
                        angular.element(document.querySelector('#validationCurrentTempPasswordModal')).modal('show');
                        invalidTempPassword = false;
                    }
                    if (deleteWorkerWithEventsAndCustomers) {
                        deleteWorkerWithEventsAndCustomersFromDb();
                        deleteWorkerWithEventsAndCustomers = false;
                    }
                    if (deleteWorkerEventsAndCustomers) {
                        deleteWorkerEventsAndCustomersFromDb();
                        deleteWorkerEventsAndCustomers = false;
                    }
                };

                /*
                    a function for changing the password
                    the function gets the new password
                */
                $scope.changePasswordFunction = function (newPassword) {
                    const rePassword = /^((?!.*[\s])(?=.*[A-Z])(?=.*\d))(?=.*?[#?!@$%^&*-]).{8,15}$/;

                    //check the new password is valid according to regular expression
                    if ($scope.newPassword === undefined || !rePassword.test($scope.newPassword)) {
                        //if not valid show error modal
                        $scope.message = 'The password must contain at least 8 to 15 characters , at least : one capital letter or one small letter, one number, and one of the following special characters: #?! @ $% ^ & * -';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        $scope.newPassword = undefined;
                        $scope.verifyNewPassword = undefined;
                        incorectPassword = true;
                        return;
                    }

                    //check if the two password equals = the new one and the letify one
                    if ($scope.newPassword !== $scope.verifyNewPassword) {
                        $scope.message = 'The two passwords do not match';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        $scope.verifyNewPassword = undefined;
                        incorectPassword = true;
                        return;
                    }

                    //save the new password in server with an hyyp request
                    const loggedInNewPassword = {workerName: loggedInWorker.workerName, newPassword: $scope.newPassword};
                    $http.post(SERVER_URI + '/changeCurrentPassword', {
                        loggedInNewPassword: loggedInNewPassword
                    }).then(
                        function (response) { //success callback
                            $scope.newPassword = undefined;
                            $scope.verifyNewPassword = undefined;

                            //show a success modal if the password has been changed successfully
                            $scope.messageType = 'SUCCESS';
                            $scope.message = response.data.success;
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                    a function for verifing the passord that was entered
                    with the password in server for the current worker name
                */
                $scope.verifyPassword = function (currenPassword) {
                    const loggedInCurrentPassword = {workerName: loggedInWorker.workerName, currentPassword: currenPassword};
                    $http.post(SERVER_URI + '/verifyCurrentPassword', {
                        loggedInCurrentPassword: loggedInCurrentPassword
                    }).then(
                        function (response) { //success callback
                            $scope.currenPassword = undefined;

                            //the current password was verified for this workerName
                            if (response.data.verified) {
                                angular.element(document.querySelector('#changePasswordModal')).modal('show');
                            } else { //the current password was not verified for this workerName
                                console.log('verifyPassword: response.data.notVerified=' + response.data.notVerified);
                                $scope.messageType = 'ERROR';
                                $scope.message = response.data.notVerified;
                                angular.element(document.querySelector('#msgModal')).modal('show');
                                incorectCurrentPassword = true;
                            }
                            $scope.currenPassword = undefined;


                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                    a function for showing a modal for deleting role from system
                */
                $scope.deleteStatusSystemSettings = function () {

                    $scope.item = undefined;
                    deletedStatus = undefined;
                    angular.element(document.querySelector('#deleteStatusFromSystemModal')).modal('show');
                    $scope.getOptionsList();
                };

                /*
                    a function for deleting status from system
                */
                $scope.deleteStatusFromSystem = function () {
                    //if no status was selected for deleting show an error moal
                    if (deletedStatus === undefined) {
                        $scope.message = 'You must choose a status';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingDeleteStatusSystemField = true;
                        return;
                    }

                    //call server with http request to delete status from system
                    $http.post(SERVER_URI + '/deleteStatusFromSystem', {
                        statusToDelete: deletedStatus
                    }).then(
                        function (response) { //success callback
                            deletedStatus = undefined;
                        },
                        function (response) { //failure callback
                            deletedStatus = undefined;

                        }
                    );
                };

                /*
                    a function for showing modal for deleting status from role (from settings tab)
                */
                $scope.deleteStatusRoleSettings = function () {
                    $scope.role = undefined;
                    $scope.statusRole = undefined;
                    statusRole = undefined;
                    category = undefined;
                    angular.element(document.querySelector('#deleteStatusFromRoleModal')).modal('show');
                    $scope.getRolesList();
                };

                /*
                    a function for deleting status from role
                */
                $scope.deleteStatusFromRole = function () {
                    //if no category was selected show an error modal
                    if (category === undefined) {
                        $scope.message = 'You must choose a category';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingDeleteStatusRoleField = true;
                        return;
                    }

                    //if no status was selected show an error modal
                    if (statusRole === undefined || statusRole === '') {
                        $scope.message = 'You must choose a status';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingDeleteStatusRoleField = true;
                        return;
                    }

                    //save the status to delete and from which role to delete
                    const statusToDelete = {Role: category.Role, Status: statusRole};

                    //call server with http request for deleting status from role
                    $http.post(SERVER_URI + '/deleteStatusFromRole', {
                        statusToDelete: statusToDelete
                    }).then(
                        function (response) { //success callback
                            $scope.roles = response.data.roles;
                            category = undefined;
                            statusRole = undefined;

                        },
                        function (response) { //failure callback
                            category = undefined;
                            statusRole = undefined;


                        }
                    );
                };

                //a function for showing a modal for insuring the delition of all customers from syetem
                $scope.insureDeleteAllCustomers = function () {
                    $scope.message = 'Are you sure you want to delete all the customers from the system ? if you press OK, all customers will be deleted and the information will be lost.';
                    $scope.messageType = 'WARNNING';
                    angular.element(document.querySelector('#messageModalWithCancel')).modal('show');
                    deleteAllCustomersFlag = true;
                };
                //a function for showing a modal for insuring the delition of customer from syetem
                $scope.insureDeleteCustomer = function (customer) {
                    customerToDelete = customer;
                    $scope.message = 'Are you sure you want to delete this customer from system ? if you press OK, the information of this customer will be lost. ';
                    $scope.messageType = 'WARNNING';
                    angular.element(document.querySelector('#messageModalWithCancel')).modal('show');
                    deleteCustomerFlag = true;
                };
                //a function for showing a modal for insuring the delition of worker from syetem
                $scope.insureDeleteWorker = function (worker) {
                    workerToDelete = worker;
                    $scope.message = 'Are you sure you want to delete this worker from system ? if you press OK, the information of this worker will be lost. ';
                    $scope.messageType = 'WARNNING';
                    angular.element(document.querySelector('#messageModalWithCancel')).modal('show');
                    deleteWorkerFlag = true;
                };

                //a function for showing a modal for insuring the delition of all workers from syetem
                $scope.ensureDeleteAllWorkers = function () {
                    $scope.message = 'Are you sure you want to delete all the workers from system ? if you press OK, all workers will be deleted and the information will be lost. ';
                    $scope.messageType = 'WARNNING';
                    angular.element(document.querySelector('#messageModalWithCancel')).modal('show');
                    deleteAllWorkersFlag = true;
                };
                /*
                    a function for deleting all customers or workers depends on 'flag' parameter
                */
                $scope.responseOk = function () {
                    $log.log('entered responseOk ' + deleteAllCustomersFlag);
                    if (deleteAllCustomersFlag) {
                        //call function for deleting all customers from server
                        $scope.deleteAllCustomers();
                        deleteAllCustomersFlag = false;

                    }
                    if (deleteCustomerFlag) {
                        //call function for deleting customer from server
                        $scope.deleteCustomerFunction(customerToDelete);
                        deleteCustomerFlag = false;

                    }
                    if (deleteWorkerFlag) {
                        //call function for deleting worker from server
                        $scope.deleteWorker(workerToDelete);
                        deleteWorkerFlag = false;

                    }

                    //call function for deleting all workers from server
                    if (deleteAllWorkersFlag) {
                        $scope.deleteAllWorkers();
                        deleteAllWorkersFlag = false;

                    }
                };

                /*
                    a function for deleting all customers from srever
                    with an http request
                */
                $scope.deleteAllCustomers = function () {
                    $http.get(SERVER_URI + '/deleteAllCustomers').then(
                        function (response) {//success callback

                            //show success modal
                            $scope.message = response.data.message;
                            $scope.messageType = 'SUCCESS';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        },
                        function (response) {//failure callback

                        }
                    );
                };

                /*
                    a function for deleting all workers from srever
                    with an http request
                */
                $scope.deleteAllWorkers = function () {
                    $log.log('entered deleteAllWorkers');

                    $http.get(SERVER_URI + '/deleteAllWorkers').then(
                        function (response) {//success callback

                            //show success modal
                            $scope.message = response.data.message;
                            $scope.messageType = 'SUCCESS';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                        },
                        function (response) {//failure callback

                        }
                    );
                };

                /*
                    a function for saving the worker name of worker to delete that was selected at modal
                */
                $scope.itemSelected = function (item, flag) {
                    $scope.selectedCustomer = item;

                    const res = item.split(',');

                    if (flag === 'customer_list') {
                        const res2 = res[0].split(':');//customer name
                        selectedItemPart1 = String(res2[1]).trim();
                    }

                    const res1 = res[1].split(':');

                    selectedItemPart2 = res1[1].split(' ');
                    selectedItemPart2 = String(selectedItemPart2[1]).trim();

                    $scope.selectedCustomer = selectedItemPart1 + ' ' + selectedItemPart2;
                    $log.log(selectedItemPart2);
                };

                /*
                    a function for deleting worker from server
                */
                $scope.deleteWorker = function (flag) {
                    if (flag === undefined) {
                        if (selectedItemPart2 === undefined) {
                            $scope.message = 'You did not select worker to delete , Please select one';
                            $scope.messageType = 'Error';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            missingWorkerToDelete = true;
                            return;
                        }
                        //selectedItemPart2 = selectedItemPart2;
                    } else {
                        selectedItemPart2 = flag;
                    }
                    $http.post(SERVER_URI + '/deleteWorker', {
                        workerName: selectedItemPart2
                    }).then(
                        function (response) { //success callback
                            //$scope.workers = response.data.workers;

                            $log.log(JSON.stringify(response));
                            if (response.data.noWorkersWithThisRole) {
                                $scope.message = response.data.noWorkersWithThisRole;
                                $scope.messageType = 'WARNING';
                                angular.element(document.querySelector('#msgModal')).modal('show');
                                deleteWorkerWithEventsAndCustomers = true;
                                return;
                            }
                            selectedItemPart2 = undefined;
                        },
                        function (response) { //failure callback

                        }
                    );
                    $log.log(selectedItemPart2);
                };

                /*
                    a function for deleting role from server
                */
                $scope.deleteRole = function (role) {
                    if (selectedItems.length === 0) {
                        $scope.message = 'You did not select a role to delete, please select one';
                        $scope.messageType = 'Error';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        missingRoleToDelete = true;
                        return;
                    }

                    $log.log(role);
                    $http.post(SERVER_URI + '/deleteRole', {
                        role: role.Role
                    }).then(
                        function (response) { //success callback
                            $scope.roles = response.data.roles;
                            $scope.role = undefined;
                            selectedItems = undefined;
                            workerToDelete = '';

                        },
                        function (response) { //failure callback

                        }
                    );
                };

                //a function for showing the modal for chaging password
                $scope.changePassword = function () {
                    angular.element(document.querySelector('#validationCurrentPasswordModal')).modal('show');
                };

                /*
                    a function for sign out from syetem show only login page and hide all other pages
                */
                $scope.signOut = function () {
                    $scope.Admin = false;
                    $scope.adminPage = false;
                    $scope.allSystem = false;
                    $scope.loginPage = true;
                    $scope.tempPassword = '';
                    $scope.showCustomers = false;
                    $scope.showWorkers = false;
                    $scope.showSettings = false;
                    $scope.showCalendar = false;
                    $scope.account = true;
                    $window.location.reload();
                };
            }
        ]).directive('popOver', function ($compile, $templateCache, $log) {//pop over option for history

            $('body').on('click', function (e) {
                //only buttons
                if ($(e.target).data('toggle') !== 'templateId.html' &&
                    $(e.target).parents('.templateId.html.in').length === 0) {
                    $log.log(' body');
                    $('[data-toggle="popover"]').popover('hide');
                }
            });
            const getTemplate = function () {
                $templateCache.put('templateId.html', 'This is the content of the template');
                console.log($templateCache.get('popover_template.html'));
                return $templateCache.get('popover_template.html');
            };
            return {
                restrict: 'A',
                transclude: true,
                template: '<span ng-transclude></span>',
                link: function (scope, element, attrs) {
                    let popOverContent;
                    if (scope.history) {
                        const html = getTemplate();
                        popOverContent = $compile(html)(scope);
                        const options = {
                            content: popOverContent,
                            placement: 'right',
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
        });
})
();
