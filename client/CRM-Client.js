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
                let contactBeforeUpdate;
                let userBeforeUpdate;
                const MAX_LETTERS_IN_NAME = 25;
                const MAX_LETTERS_IN_ADDRESS = 35;
                let category = undefined;
                let statusRole;
                let loggedInUser;
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
                let deleteAllContactsFlag = false;
                let deleteContactFlag = false;
                let deleteUserFlag = false;
                let deleteAllUsersFlag = false;
                let missingDetailInsideAddEvent = false;
                let missingDetailsOutsideAddEvent = false;
                let missingDetailsEditEvent = false;
                let missingUserToDelete = false;
                let invalidTempPassword = false;
                let selectedItemPart1;
                let selectedItemPart2;
                let deletedStatus;
                let contactToDelete = '';
                let selectedItems = [];
                let historyArray = [];
                let editEventDetails = {};
                let evenBeforeUpdate;
                let userToDelete;
                let contactsPhone = [];
                const SERVER_URI = 'http://localhost:5000';

                $scope.account = false;
                $scope.click = false;
                $scope.menu = false;
                $scope.showCalendar = false;
                $scope.showContacts = false;
                $scope.showWorkersEvents = false;
                $scope.getNewContactDetails = false;
                $scope.showSettings = false;
                $scope.loginPage = false;
                $scope.registerPage = false;
                $scope.adminPage = false;
                $scope.firstLoad = false;
                $scope.Admin = false;
                $scope.showUsers = false;
                $scope.addEvent = false;
                $scope.taskIsEdit = false;
                $scope.chooseContactToEmail = false;
                $scope.contactsInfo = [];
                $scope.users = [];
                $scope.options = [];
                $scope.roles = [];
                $scope.files = [];
                $scope.rolesColors = [];
                $scope.retreivedCalendarEvents = [];

                function refreshCalendarEvents() {
                    $log.log('refreshCalendarEvents');
                    $http.get(SERVER_URI + '/getUserEvents/' + loggedInUser.UserName).then(
                        function (response) {//success callback
                            $scope.retreivedCalendarEvents = response.data.userEvents;
                            //$scope.retreivedCalendarEvents = Object.assign({}, response.data.userEvents);
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

                function refreshCustomerCalendarEvents(eventId) {
                    $log.log('refreshCustomerCalendarEvents');
                    $http.get(SERVER_URI + '/getCustomerEvents/' + loggedInUser.UserName + '/' + eventId).then(
                        function (response) {//success callback
                            $scope.retreivedCalendarEvents = response.data.customerEvents;
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
                function updateContactHistory(history ,contactPhoneNumber){
                    const updateHistory = {contactPhoneNumber: contactPhoneNumber, contactHistory: history};
                    $http.post(SERVER_URI + '/updateContactHistory', {
                        updateHistory: updateHistory
                    }).then(
                        function (response){
                            historyArray = [];
                            contactsPhone = [];
                            $scope.getContactsList();
                        }, function (response) { //failure callback
                        }
                    );

                }

                function getIndexOfSelectedItem(item, flag, status) {
                    if (flag === 'status_list') {
                        for (let i = 0; i < $scope.roles.length; i++) {
                            if (item === $scope.roles[i].Role) {
                                $log.log('entered if ##: ');
                                for (let j = 0; j < $scope.roles[i].Statuses.length; j++) {
                                    if (status === $scope.roles[i].Statuses[j]) {
                                        $log.log('j: ' + j);
                                        return j;
                                    }
                                }
                            }
                        }
                    } else if (flag === 'role_list') {
                        for (let i = 0; i < $scope.roles.length; i++) {
                            if (item === $scope.roles[i].Role) {
                                return i;
                            }
                        }
                    } else if (flag === 'color_of_role') {
                        for (let i = 0; i < $scope.roles.length; i++) {
                            if (item === $scope.roles[i].Color) {
                                return i;
                            }
                        }
                    } else if (flag === 'contact_list') {
                        $log.log('item of contact list : ' + item);
                        for (let i = 0; i < $scope.contactsInfo.length; i++) {

                            if (item === $scope.contactsInfo[i].PhoneNumber) {
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


                function updateEventInDataBase(eventAfterUpdate, eventBeforeUpdate, user) {
                    let startDate = changeDateFormat($scope.eventStart);
                    let endDate = changeDateFormat($scope.eventEnd);

                    const eventAfterUpdateDB = {
                        title: eventAfterUpdate.title,
                        start: startDate,
                        end: endDate,
                        color: eventAfterUpdate.color,
                        id: eventAfterUpdate.id,
                        editable: eventAfterUpdate.editable, allDay: eventAfterUpdate.allDay
                    };
                    $log.log('after update :' + eventAfterUpdate.title + ' ' +
                        eventAfterUpdate.start + ' ' + eventAfterUpdate.end + ' ' + eventAfterUpdate.color + ' ' +
                        eventAfterUpdate.id + ' ' + eventAfterUpdate.editable + ' ' + eventAfterUpdate.allDay);

                    startDate = changeDateFormat(eventBeforeUpdate.start);
                    endDate = changeDateFormat(eventBeforeUpdate.end);

                    const eventBeforeUpdateDB = {
                        title: eventBeforeUpdate.title,
                        start: startDate,
                        end: endDate,
                        color: eventBeforeUpdate.color,
                        id: eventBeforeUpdate.id,
                        editable: eventBeforeUpdate.editable, allDay: eventBeforeUpdate.allDay
                    };
                    $log.log('before update :' + eventBeforeUpdate.title + ' ' + eventBeforeUpdate.start + ' ' + eventBeforeUpdate.end + ' ' +
                        eventBeforeUpdate.color + ' ' + eventBeforeUpdate.id + ' ' + eventBeforeUpdate.editable + ' ' + eventBeforeUpdate.allDay);

                    const updatEvent = {
                        eventBeforeUpdate: eventBeforeUpdateDB,
                        eventAfterUpdate: eventAfterUpdateDB,
                        user: user
                    };
                    $http.post(SERVER_URI + '/updateEvent', {
                        updatEvent: updatEvent
                    }).then(
                        function (response) {
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
                    $scope.showContacts = false;
                    $scope.showUsers = false;
                    $scope.showSettings = false;
                    $scope.showWorkersEvents = true;
                    $scope.click = true;
                    $scope.showCalendar = false;
                    $scope.account = true;

                    refreshCalendarEvents();
                    $scope.userEvents = Object.assign({}, $scope.retreivedCalendarEvents);
                    $scope.retreivedCalendarEvents.forEach(function(event, index) {
                        let title = event.title;
                        if (event.id !== -1 && title.includes(':')) {
                            title = title.split(':')[1].trim();
                        }
                        $scope.userEvents[index].title = title;
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

                    /*events: function (start, end, timezone, callback) { // Fetch your events here
                        $log.log('retreivedCalendarEvents=' + $scope.retreivedCalendarEvents);
                        // This could be an ajax call or you could get the events locally
                        callback($scope.retreivedCalendarEvents);
                    },*/
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
                        $scope.contactTask = undefined;
                        $scope.title = undefined;

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
                            editable: event.editable, allDay: event.allDay
                        };
                        const indexRole = getIndexOfSelectedItem(event.color, 'color_of_role');
                        $log.log('indexRole : ' + indexRole);
                        $scope.role = $scope.roles[indexRole];

                        //if a contact was not selected for the event, the event id is = '-1'
                        if (editEventDetails.id !== -1) {
                            //split title by ':'
                            const title = event.title.split(':');

                            //save the event id
                            $scope.contactEvent = event.id;
                            $log.log('contact id: ' + event.id);
                            const splitContactPhone = event.id.split(' ');
                            const contactPhone = splitContactPhone[splitContactPhone.length - 1];
                            $log.log('contactPhone: ' + contactPhone);
                            const contact = $scope.contactsInfo[getIndexOfSelectedItem(contactPhone, 'contact_list')];
                            $scope.selectedContact = event.id;
                            $log.log('$scope.contact :' + $scope.contact);
                            //save the event title
                            $scope.eventTitle = title[1];
                            //when contactSelected = true then there is a contact selected
                            $scope.contactSelected = true;
                            $scope.taskIsEdit = true;
                            $scope.contactTask = true;
                        } else { //if no contact was selected for the event then $scope.contactSelected = false;
                            $scope.eventTitle = event.title;
                            $scope.contactSelected = false;
                        }
                        $scope.eventStart = event.start;
                        $scope.eventEnd = event.end;
                        $scope.eventDate = moment(event.start).format('DD/MM/YYYY HH:mm') + ' - ' + moment(event.end).format('DD/MM/YYYY HH:mm');
                        $scope.taskIsEdit = false;
                        //show modal for edit or delete event
                        angular.element(document.querySelector('#editOrDeleteEvent')).modal('show');
                    }
                };

                /*
                    save edit event details :
                    ID, title, start and end date, color of event

                */
                $scope.saveEditEvent = function (taskWithContact) {
                    let description;
                    let contact;
                    let startDate;
                    let endDate;

                    console.log('1: $scope.eventTitle=' + $scope.eventTitle);
                    if ($scope.role === undefined || $scope.role === '' || $scope.role.Role === undefined || $scope.role.Role === '' || $scope.role.Role === '-- Choose category for role --') {
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
                        check if the task was chosen for a spesific contact - optional
                        then id = 'contact name' + ' contact phone number'
                    */
                    $log.log('taskWithContact : ' + taskWithContact);
                    if (taskWithContact) {
                        $log.log('$scope.contact :' + $scope.contact);
                        $log.log('selectedItemPart1 :' + selectedItemPart1);
                        $log.log('selectedItemPart2 :' + selectedItemPart2);
                        if ($scope.contact === '' || selectedItemPart1 === undefined || selectedItemPart2 === undefined || selectedItemPart1 === '' || selectedItemPart2 === '') {
                            $scope.message = 'You have selected the option for a costumer task and therefore a costumer must be selected';
                            $scope.messageType = 'ERROR';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            missingDetailsEditEvent = true;

                            selectedItemPart1 = undefined;
                            selectedItemPart2 = undefined;
                            return;
                        } else {
                            description = 'Task for contact ' + selectedItemPart1 + ' ' + selectedItemPart2 + ' : ' + $scope.eventTitle;
                            contact = selectedItemPart1 + ' ' + selectedItemPart2;
                            selectedItemPart1 = undefined;
                            selectedItemPart2 = undefined;
                        }
                    } else { //if the task is not for a spesific contact -> id of contact = '-1'
                        description = $scope.eventTitle;
                        console.log('description=' + description);
                        contact = -1;
                    }
                    console.log('description=' + description);

                    editEventDetails.title = description;
                    editEventDetails.start = $scope.eventStart;
                    editEventDetails.end = $scope.eventEnd;
                    editEventDetails.color = $scope.role.Color;
                    editEventDetails.id = contact;

                    let eventForUpdate = {};

                    eventForUpdate = Object.assign({}, editEventDetails);
                    //update the event details in the calendar
                    //uiCalendarConfig.calendars.myCalendar.fullCalendar('updateEvent', editEventDetails);
                    updateEventInDataBase(eventForUpdate, evenBeforeUpdate, loggedInUser);
                    $scope.selections = [];
                };

                /*
                    when click on task for contact
                    go to the contact from contacts list
                */
                $scope.goToContact = function () {

                    //get contacts phone number as an ID
                    const contactPhoneNumber = $scope.contactEvent.split(' ');

                    //get contacts list
                    $scope.getContactsFunction();

                    //put contacts phone number in search bar
                    $scope.searchContacts = contactPhoneNumber[contactPhoneNumber.length - 1];

                    //hide the 'document.querySelector('#editOrDeleteEvent')' modal
                    angular.element(document.querySelector('#editOrDeleteEvent')).modal('hide');

                };

                //add event from button outside of the calendar
                $scope.addEventOutsideCalendar = function () {

                    //show 'document.querySelector('#addEventOutside')' modal
                    angular.element(document.querySelector('#addEventOutside')).modal('show');

                };

                $scope.calendarContact = function (contact) {
                    const eventId = String(contact.Name + ' ' + contact.PhoneNumber);
                    //let contact_name = contact.Name;
                    const contactPhone = contact.PhoneNumber;
                    $log.log('eventId : ' + eventId);
                    $scope.retreivedCalendarEvents = refreshCustomerCalendarEvents(eventId);
                    $scope.calendarFunction();
                };

                function deleteEventFromDataBase(event, user) {
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

                    const deleteEvent = {event: eventToDelete, user: user};
                    $http.post(SERVER_URI + '/deleteEvent', {
                        deletevent: deleteEvent
                    }).then(
                        function (response) {
                        },
                        function (response) { //failure callback
                        }
                    );
                }

                $scope.deleteEvent = function (event, element, view) {
                    uiCalendarConfig.calendars['myCalendar'].fullCalendar('removeEvents', function (event) {

                        deleteEventFromDataBase(event, loggedInUser);

                        /*
                            delete event from mongodb
                            and from cotacts events list
                        */
                        return event === editEventDetails;
                    });
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

                //array of contacts
                $scope.selections = [];
                /*
                    select contact from contacts list in the edit or delete modal
                */
                $scope.selected = {};
                $scope.selectAll = function (flag, usersOrContacts) {
                    let arr;
                    let id;

                    if (usersOrContacts === 'users') {
                        arr = $scope.users;
                        id = 'UserName';
                    } else {
                        arr = $scope.contactsInfo;
                        id = 'PhoneNumber';
                    }

                    for (let i = 0; i < arr.length; i++) {
                        const arrInfo = arr[i];
                        if (id === 'UserName') {
                            $scope.selected[arrInfo.UserName] = flag;
                        } else {
                            $scope.selected[arrInfo.PhoneNumber] = flag;

                        }
                        //$log.log('id : ' +arrInfo.UserName);
                    }
                };

                $scope.sendEmailToSelectedContacts = function (usersOrContacts) {
                    let emailsListStr = '';
                    let arr;
                    let id;
                    if (usersOrContacts === 'users') {
                        arr = $scope.users;
                        id = 'UserName';
                    } else {
                        arr = $scope.contactsInfo;
                        id = 'PhoneNumber';
                    }

                    for (let i = 0; i < arr.length; i++) {
                        const arrInfo = arr[i];
                        if (id === 'UserName') {
                            if ($scope.selected[arrInfo.UserName]) {
                                emailsListStr = getStringofAllEmails(emailsListStr, arrInfo, i);
                            }

                        } else {
                            if ($scope.selected[arrInfo.PhoneNumber]) {
                                contactsPhone.push(arrInfo.PhoneNumber);
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
                    $scope.contactEmail = emailsListStr;
                    $scope.chooseContactToEmail = false;
                    $scope.chooseUserToEmail = false;
                    $scope.showSendOrCancelMultipleButtonContacts = false;
                    angular.element(document.querySelector('#emailModal')).modal('show');
                };



                function addEventToDataBase(event, user) {
                    const newEvent = {event: event, user: user};
                    $http.post(SERVER_URI + '/addEvent', {
                        newEvent: newEvent
                    }).then(
                        function (response) {
                            //retreivedCalendarEvents = response.data.Events;
                            //$log.log('retreivedCalendarEvents=' + retreivedCalendarEvents);
                            $log.log('selectedItemPart2: '+ selectedItemPart2)
                            contactsPhone.push(selectedItemPart2);
                            updateContactHistory(historyArray ,contactsPhone);

                            $scope.role = '';
                            $scope.contactTask = false;
                            $scope.contact = undefined;
                            $scope.title = '';
                            $scope.eventStart = '';
                            $scope.eventEnd = '';
                            $scope.date = '';
                            category = undefined;
                            selectedItemPart1 = undefined;
                            selectedItemPart2 = undefined;
                            $scope.selectedContact = '';


                        },
                        function (response) { //failure callback
                        }
                    );
                }
                function addHistoryToContactEvent(description,startDate,endDate,color,contact){
                    let history='';
                    history = 'New Task\n\n'+'Start Date : '+ startDate+'\n' +'End Date : '+endDate+'\n';
                    history = history+'Category : '+$scope.roles[getIndexOfSelectedItem(color,'color_of_role')].Role+'\n';
                    history = history+description+'\n';
                    $log.log(history);
                    return history;
                }

                /*
                    a function for adding a task from calendar when press on a day in calendar,
                    there is an option to add a the task for a spesific contact
                */
                $scope.addEventToCalendar = function (taskWithContact, outsideModal) {
                    /*
                        save the dates in a range of dates in the task in format 'startDate - endDate'
                        by splitting with '-'
                    */
                    let sameDate;
                    let description;
                    let contact;
                    let startDate;
                    let endDate;
                    let contactHistory;

                    if (!outsideModal) {
                        const date = $scope.date.split('-');
                        $log.log('start date : ' + date[0]);
                        $log.log('taskWithContact : ' + taskWithContact);
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
                            if (!outsideModal) {
                                missingDetailInsideAddEvent = true;
                            } else {
                                missingDetailsOutsideAddEvent = true;
                            }
                            return;
                        }
                    }
                    /*
                        check if the task was chosen for a spesific contact - optional
                        then id = 'contact name' + ' contact phone number'
                    */
                    $log.log('taskWithContact : ' + taskWithContact);
                    if (taskWithContact) {

                        $log.log('$scope.contact :' + $scope.contact);
                        $log.log('selectedItemPart1 :' + selectedItemPart1);
                        $log.log('selectedItemPart2 :' + selectedItemPart2);
                        if ($scope.contact === '' || selectedItemPart1 === undefined || selectedItemPart2 === undefined || selectedItemPart1 === '' || selectedItemPart2 === '') {
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
                            description = 'Task for contact ' + selectedItemPart1 + ' ' + selectedItemPart2 + ' : ' + $scope.title;
                            contact = selectedItemPart1 + ' ' + selectedItemPart2;
                            contactHistory = addHistoryToContactEvent(description,startDate,endDate,$scope.role.Color,contact);
                            historyArray.push(contactHistory);

                        }
                    } else { //if the task is not for a spesific contact -> id of contact = '-1'
                        description = $scope.title;
                        contact = -1;
                    }

                    $log.log('description: ' + description);
                    const eventToAdd = {
                        title: description,
                        start: startDate,
                        end: endDate,
                        color: $scope.role.Color,
                        id: contact,
                        editable: true,
                        allDay: false
                    };
                    $scope.selections = [];
                    uiCalendarConfig.calendars['myCalendar'].fullCalendar('renderEvent', eventToAdd, true);
                    addEventToDataBase(eventToAdd, loggedInUser);
                    //uiCalendarConfig.calendars['myCalendar'].fullCalendar('refetchEvents');


                    //  console.log($scope.pendingRequests);
                };
                //cancel function from modal in calendar
                $scope.cancelEvent = function () {

                    $scope.role = '';
                    $scope.contactTask = false;
                    $scope.contact = undefined;
                    $scope.title = '';
                    $scope.eventStart = '';
                    $scope.eventEnd = '';
                    $scope.date = '';
                    selectedItemPart1 = undefined;
                    selectedItemPart2 = undefined;
                    $scope.selectedContact = '';
                    category = undefined;
                };

                function updateContactHistoryEmail(){
                    const history = 'Date : '+moment().format('DD/MM/YYYY HH:mm')+'\n\nMail has been sended\n';
                    historyArray.push(history);
                    updateContactHistory(historyArray, contactsPhone);
                }

                //modal for sending mail to a contact
                $scope.sendMailModal = function (contactEmail) {
                    $log.log('contactEmail :' + contactEmail.eMail);
                    contactsPhone.push(contactEmail.PhoneNumber);
                    //check if the contact that was pressed on has an email address
                    if (contactEmail.eMail === undefined || contactEmail.eMail === '') {
                        toaster.pop('error', 'No email for this contact');
                        return;
                    }

                    $scope.getFilesList();
                    //save the chosen contacts email
                    $scope.contactEmail = contactEmail.eMail;
                    angular.element(document.querySelector('#emailModal')).modal('show');
                };
                /*
                    send email function and http post call to server
                    with contact and email details
                */
                $scope.sendEmail = function (contactEmail, emailSubject, emailBody) {

                    $log.log('file:' + category);

                    let attachmentFileName;
                    if ($scope.emailFile) {
                        attachmentFileName = category;

                    } else {
                        attachmentFileName = false;

                    }

                    $log.log('attachmentFileName :' + attachmentFileName);
                    const emailData = {
                        mailRecipient: contactEmail, mailSubject: emailSubject,
                        mailText: emailBody, attachmentFileName: attachmentFileName
                    };
                    $http.post(SERVER_URI + '/sendEmail', {
                        emailData: emailData
                    }).then(
                        function (response) {
                            console.log(response.data.error);
                            console.log(response.data.ok);
                            $scope.contactEmail = '';
                            $scope.emailSubject = '';
                            $scope.emailBody = '';
                            $scope.emailFile = false;
                            $scope.fileToMail = false;
                            category = undefined;
                            $scope.selections = [];



                            if (response.data.ok) {
                                toaster.pop('success', response.data.ok);
                                updateContactHistoryEmail();
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
                        data: {file: file} //pass file as data, should be user ng-model
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
                            //verified passwords (not for Admin user)
                            if (response.data.verified) {
                                console.log('is verified');
                                if(loggedInUser!==undefined && loggedInUser.adminUser) {
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
                                $scope.registrationUserName = 'Admin';
                                $scope.Admin = true;
                            } else { //not correct temprorary password
                                console.log('validationOfTempPassword: response.data.notVerified=' + response.data.notVerified);
                                // eslint-disable-next-line no-undef
                                if(loggedInUser!==undefined && loggedInUser.adminUser) {
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
                            $log.log('loggedInUser ;'+loggedInUser);
                            $log.log('loggedInUser.isAdmin ;'+loggedInUser.isAdmin);
                            if(loggedInUser!==undefined && loggedInUser.adminUser){
                                if(response.data.success) {
                                    toaster.pop('success', response.data.success, '');
                                    return;
                                }
                            }
                            $scope.registerPage = true;
                            $scope.registrationUserName = 'Admin';
                            $scope.Admin = true;
                            $scope.newTempPasswordPage = false;
                            $scope.firstLoad = false;

                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                    when a user signes up / registers to the system
                    this function checks validation of users details
                    and send them when all are valid to server in an http post request
                */
                $scope.signUp = function () {
                    const reUserName = /^[a-zA-Z]{3,10}$/;
                    const reName = /^[a-zA-Z\s\u0590-\u05fe]{2,20}$/;

                    //check if user name has been entered and if it is valid according to the matching regular expression pattern
                    if ($scope.registrationUserName === undefined || !reUserName.test($scope.registrationUserName)) {
                        $scope.message = 'User name must contain only English letters ,minimum 3 leterrs and maximum 10 letters and no whitespace';
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


                    //save users valid details as a json object
                    const user = {
                        UserName: $scope.registrationUserName, Name: $scope.registrationName,
                        eMail: $scope.registrationEmail, Password: $scope.registrationPassword
                    };
                    $log.log('before call server');
                    //call server with http request
                    $http.post(SERVER_URI + '/addUser', {
                        user: user
                    }).then(
                        function (response) { //success callback

                            //get response from server
                            const userFromServer = response.data.user;
                            loggedInUser = userFromServer;

                            //check if this user name does not exist already
                            if (!response.data.userExists) {
                                $log.log(userFromServer.Name);

                                //clear all fields in registration page
                                $scope.registrationUserName = undefined;
                                $scope.registrationName = undefined;
                                $scope.registrationEmail = undefined;
                                $scope.registrationPassword = undefined;
                                $scope.registrationValidationPassword = undefined;

                                //show menu system components and user profile of account
                                $scope.menu = true;
                                $scope.allSystem = true;
                                $scope.account = true;
                                $scope.nameOfUser = userFromServer.Name;
                                $scope.roleOfUser = userFromServer.Role;
                                $scope.registerPage = false;

                                //get lists of : optiont, roles, roles colors, contacts and files
                                $scope.getOptionsList();
                                $scope.getRolesList();
                                $scope.getRolesColorsList();
                                $scope.getContactsList();
                                $scope.getFilesList();

                                $scope.getUsersList('showUsers');

                                //if user logged in is administrator show admin page and update that admin is logged in -> $scope.isAdmin = true
                                if (userFromServer.isAdmin) {
                                    $scope.adminPage = true;
                                    $scope.isAdmin = true;

                                } else { //if not admin logged in hide admin page and update that not admin logged in -> $scope.isAdmin = false
                                    $scope.adminPage = false;
                                    $scope.isAdmin = false;
                                }

                                $log.log(userFromServer.UserName);

                            } else { //if this user name already exists in system -> show error modal
                                $scope.message = response.data.userExists;
                                $scope.messageType = 'ERROR';
                                angular.element(document.querySelector('#msgModal')).modal('show');
                                $scope.registrationUserName = undefined;

                            }


                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                    a function for login to system after the user is registed already
                    login with user name and password
                    and verify details with thoes at server by sending the data in http request
                */
                $scope.login = function () {
                    $log.log('UserNameLogin ' + $scope.UserNameLogin);

                    //check if user name has been entered -> requierd
                    if ($scope.UserNameLogin === undefined || $scope.UserNameLogin === '') {
                        $scope.message = 'User name is required';
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
                        a function for saving the user that is logged in details
                    */
                    let LoginUser = {UserName: $scope.UserNameLogin, Password: $scope.PasswordLogin};
                    $http.post(SERVER_URI + '/login', {
                        LoginUser: LoginUser
                    }).then(
                        function (response) { //success callback

                            //get data from server response
                            LoginUser = response.data.userLogin;
                            loggedInUser = LoginUser;

                            //if there is a match between user name and password at server side
                            if (!response.data.noMatch) {
                                // $scope.events = LoginUser.Events;
                                //$scope.retreivedCalendarEvents = LoginUser.Events;
                                refreshCalendarEvents();
                                //$log.log('Events : ' + $scope.events);

                                //if admin show admin page and update that admin is logged in
                                if (LoginUser.adminUser) {
                                    $scope.adminPage = true;
                                    $scope.isAdmin = true;
                                } else { //if not admin hide admin page and update that not admin is logged in
                                    $scope.adminPage = false;
                                    $scope.isAdmin = false;
                                }

                                //clear fields in login page
                                $scope.UserNameLogin = undefined;
                                $scope.PasswordLogin = undefined;

                                //show menu and user profile in account and hide the login page
                                $scope.menu = true;
                                $scope.account = true;
                                $scope.loginPage = false;

                                $scope.nameOfUser = LoginUser.Name;
                                $log.log('roleOfUser: ' + LoginUser.Role);
                                $scope.roleOfUser = LoginUser.Role;
                                $scope.allSystem = true;

                                //get lists of : optiont, roles, roles colors, contacts files and users
                                $scope.getOptionsList();
                                $scope.getRolesList();
                                $scope.getRolesColorsList();
                                $scope.getContactsList();
                                $scope.getFilesList();
                                $scope.getUsersList('showUsers');
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
                    a function for showing the list of contacts
                */
                $scope.getContactsFunction = function () {
                    /*
                    $scope.showUpdateExpression = true;
                    $scope.showUpdateInput = false;
                     */
                    $scope.loginPage = false;
                    $scope.showContacts = true;
                    $scope.showUsers = false;
                    $scope.showSettings = false;
                    $scope.click = true;
                    $scope.showCalendar = false;
                    $scope.account = true;
                    $scope.showWorkersEvents = false;



                    $scope.getContactsList();
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

                    //get a color from user
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
                    $http.post(SERVER_URI + '/addStatutsWithRoles', {
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
                $scope.calendarFunction = function () {
                    $scope.loginPage = false;
                    $scope.showContacts = false;
                    $scope.showCalendar = true;
                    $scope.showUsers = false;
                    $scope.showSettings = false;
                    $scope.showWorkersEvents = false;
                    $scope.account = false;
                    $scope.calendarNavColor = '#ff0066';
                    $scope.contactsNavColor = '#004d99';
                    $scope.getRolesList();

                    //clearing the search field
                    $scope.search = '';
                    //uiCalendarConfig.calendars['myCalendar'].fullCalendar('refetchEvents');
                    setTimeout(function () {
                        uiCalendarConfig.calendars['myCalendar'].fullCalendar('render');

                    }, 5); // Set enough time to wait until animation finishes;*/
                };

                /*
                    a function for showing the settings page
                    and hiding other pages that are not relevant
                */
                $scope.settingsFunction = function () {
                    //$log.log('entered settings function');
                    $scope.showSettings = true;
                    $scope.loginPage = false;
                    $scope.showContacts = false;
                    $scope.showUsers = false;
                    $scope.showCalendar = false;
                    $scope.showWorkersEvents = false;


                    //clearing the search field
                    $scope.search = '';
                };

                /*
                    a function for adding a new contact to system
                    shows the matching 'div' in html page
                */
                $scope.addContactFunction = function () {
                    //update the parameter 'getNewContactDetails' to true for shoing the div
                    $scope.getNewContactDetails = true;
                    $scope.click = false;
                };

                /*
                    a function for closeing the option of contact addition
                    and clearing fields to be undefined
                */
                $scope.cancelFunction = function () {
                    $scope.getNewContactDetails = false;
                    $scope.click = true;
                    $scope.newName = '';
                    $scope.newStatus = '';
                    $scope.newPhoneNumber = '';
                    $scope.newEmail = '';
                    $scope.newAddress = '';
                    $scope.role = '';
                    $scope.statusRole = '';
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
                    a function for saving the deatailes of contact before update
                */
                $scope.updateContactFunction = function (contact) {
                    //get all details of contact in json format
                    contactBeforeUpdate = {
                        Category: contact.Category,
                        Name: contact.Name,
                        Status: contact.Status,
                        PhoneNumber: contact.PhoneNumber,
                        eMail: contact.eMail,
                        Address: contact.Address
                    };
                    const indexRole = getIndexOfSelectedItem(contactBeforeUpdate.Category.Role, 'role_list');
                    console.log('indexRole=' + indexRole);
                    $scope.roleCategory = $scope.roles[indexRole];
                    console.log('$scope.roleCategory=' + JSON.stringify($scope.roleCategory));
                    $scope.statusRole = $scope.roles[indexRole].Statuses[getIndexOfSelectedItem(contactBeforeUpdate.Category.Role, 'status_list', contactBeforeUpdate.Status)];
                    console.log('$scope.statusRole=' + $scope.statusRole);
                    $scope.updateStatus = contactBeforeUpdate.Status;
                    console.log('contactBeforeUpdate.Status=' + contactBeforeUpdate.Status);
                };

                /*
                    a function for saving the deatailes of user before update
                    the function gets the parameter 'user' that contains selected users details
                */
                $scope.updateUserFunction = function (user) {
                    //get all details of user in json format
                    userBeforeUpdate = {Role: user.Role, Name: user.Name, UserName: user.UserName, eMail: user.eMail};
                    $scope.role = $scope.roles[getIndexOfSelectedItem(userBeforeUpdate.Role, 'role_list')];
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
                        $http.post(SERVER_URI + '/addOption', {
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
                    get the contacts list from server with http request
                */
                $scope.getContactsList = function () {
                    $http.get(SERVER_URI + '/getContacts').then(
                        function (response) {//success callback

                            //return the list of the contacts
                            $scope.contactsInfo = response.data.contacts;
                            $scope.role = '';
                            $scope.statusRole = '';
                            $scope.newName = '';
                            $scope.newPhoneNumber = '';
                            $scope.newEmail = '';
                            $scope.newAddress = '';
                            $scope.roleCategory = '';
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

                /*
                    a function for getting the list of users from server with http request
                */
                $scope.getUsersList = function (flag) {
                    $log.log('flag : ' + flag);
                    $http.post(SERVER_URI + '/getUsers', {
                        statusFlag: flag
                    }).then(
                        function (response) {//success callback

                            //return the list of the users
                            $scope.users = response.data.users;

                            //if was chosen to delete the user
                            if (response.data.deleteUser) {
                                //show modal for deleting the user
                                $scope.messageType = 'Choose user to delete';
                                angular.element(document.querySelector('#deleteModal')).modal('show');
                            }

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
                    a function for shing the users list in page in html
                    and getting the list of the users and list of roles
                */
                $scope.getUsersFunction = function (flag) {
                    $scope.showUsers = true;

                    //hide the parts in html that are not relevant to users tab
                    $scope.showSettings = false;
                    $scope.showContacts = false;
                    $scope.showCalendar = false;
                    $scope.showWorkersEvents = false;
                    $scope.account = true;
                    $scope.getUsersList(flag);
                    $scope.getRolesList();
                };


                /*
                    a validation function for checking all new contact fildes
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

                    //call the function to add the new contact
                    $scope.addNewContact();
                };



                /*
                    a function for adding a new contact to system
                    with http request to server
                */
                $scope.addNewContact = function () {
                    //save the current date
                    const contactHistory = 'Date : ' + moment().format('MM/DD/YYYY HH:mm') + '\n\nContact Addition\n ';

                    //add to history the action
                    historyArray.push(contactHistory);
                    $log.log('contactHistory :' + contactHistory);
                    const contact = {
                        Name: $scope.newName,
                        Category: category,
                        Status: statusRole,
                        PhoneNumber: $scope.newPhoneNumber,
                        eMail: $scope.newEmail,
                        Address: $scope.newAddress,
                        History: historyArray
                    };
                    $http.post(SERVER_URI + '/addContact', {
                        contact: contact
                    }).then(
                        function (response) { //success callback

                            //check if the phone number exists in system
                            if (!response.data.phoneExists) {
                                $scope.getNewContactDetails = false;
                                $scope.getContactsList();
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

                            //clear fields of new contact that was edit
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

                //delete a contact from server
                $scope.deleteContactFunction = function (contact) {

                    $http.post(SERVER_URI + '/deleteContact', {
                        contact: contact
                    }).then(
                        function (response) { //success callback
                            $scope.getContactsList();
                            contactToDelete = '';
                        },
                        function (response) { //failure callback

                        }
                    );
                };

                /*
                     a function for catching any chane in contact
                     and save changes in history of contact
                */
                $scope.changedDtails = function (contactInfoToUpdate) {
                    let updatedContactHistory = '';
                    let change = -1;
                    let contactHistory = '';
                    if (category.Role !== contactBeforeUpdate.Category.Role) {
                        updatedContactHistory = 'Role changed from : ' + contactBeforeUpdate.Category.Role + ' to : ' + category.Role + '\n';
                        change = 0;
                    }
                    if (statusRole !== contactBeforeUpdate.Status) {
                        updatedContactHistory += 'Status changed from : ' + contactBeforeUpdate.Status + ' to : ' + statusRole + '\n';
                        change = 0;
                    }
                    if (contactInfoToUpdate.Name !== contactBeforeUpdate.Name) {
                        updatedContactHistory += 'Name changed from : ' + contactBeforeUpdate.Name + ' to : ' + contactInfoToUpdate.Name + '\n';
                        change = 0;
                    }
                    if (contactInfoToUpdate.PhoneNumber !== contactBeforeUpdate.PhoneNumber) {
                        updatedContactHistory += 'Phone number changed from : ' + contactBeforeUpdate.PhoneNumber + ' to : ' + contactInfoToUpdate.PhoneNumber + '\n';
                        change = 0;
                    }
                    if (contactInfoToUpdate.eMail !== contactBeforeUpdate.eMail) {
                        updatedContactHistory += 'Email changed from : ' + contactBeforeUpdate.eMail + 'to : ' + contactInfoToUpdate.eMail + '\n';
                        change = 0;
                    }
                    if (contactInfoToUpdate.Address !== contactBeforeUpdate.Address) {
                        updatedContactHistory += 'Address changed from : ' + contactBeforeUpdate.Address + 'to : ' + contactInfoToUpdate.Address + '\n';
                        change = 0;
                    }

                    if (change === 0) {
                        contactHistory = 'Date: ' + moment().format('MM/DD/YYYY HH:mm') + '\n\nContact Edit\n\n' + updatedContactHistory + '\n';

                    }
                    return contactHistory;
                };


                /*
                    a function for checking validation of all updated contact fildes
                    and if they are corcect send them to the server
                */
                $scope.saveUpdated = function (contactInfoToUpdate) {
                    $log.log('Category before: ' + contactBeforeUpdate.Category.Role);
                    $log.log('Category after : ' + JSON.stringify(category));

                    //check if role was celected
                    if (category === undefined) {
                        category = contactBeforeUpdate.Category;
                        if (statusRole === undefined) {
                            statusRole = contactBeforeUpdate.Status;
                        }
                    }


                    //check if no name was entered if so show an error modal
                    if (contactInfoToUpdate.Name === undefined || contactInfoToUpdate.Name === '') {
                        $scope.messageType = 'ERROR';
                        $scope.message = 'You must enter a name';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    } else { //if a name was entered
                        if (contactInfoToUpdate.Name.length > MAX_LETTERS_IN_NAME) {//check the length of the name
                            $scope.messageType = 'WARNNING';
                            $scope.message = 'This name is too long, therefore only ' + MAX_LETTERS_IN_NAME + ' characters including spaces will be saved';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            contactInfoToUpdate.Name = contactInfoToUpdate.Name.slice(0, MAX_LETTERS_IN_NAME);
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
                    if (contactInfoToUpdate.PhoneNumber && contactInfoToUpdate.PhoneNumber !== '') {
                        const validPhoneNumber = /^\+?([0-9]{2})?[0-9]{7,10}$/;
                        //if the phone number is invalid shoe an error modal
                        if (!validPhoneNumber.test(contactInfoToUpdate.PhoneNumber)) {
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
                    if (contactInfoToUpdate.eMail && contactInfoToUpdate.eMail !== '') {
                        const validEmail = /^(([^<>()[\]\\.,;:\s@\']+(\.[^<>()[\]\\.,;:\s@\']+)*)|(\'.+\'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        if (!validEmail.test(contactInfoToUpdate.eMail)) {//check the email
                            $scope.messageType = 'ERROR';
                            $scope.message = 'This email is invalid';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            return;
                        }
                    } else { //if no email address was entered
                        contactInfoToUpdate.eMail = '';
                    }

                    //if a address was entered
                    if (contactInfoToUpdate.Address) {
                        if (contactInfoToUpdate.Address.length > MAX_LETTERS_IN_ADDRESS) {//check the length of the address
                            $scope.messageType = 'WARNNING';
                            $scope.message = 'This address is too long, therefore only ' + MAX_LETTERS_IN_ADDRESS + ' characters including spaces will be saved';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            $scope.newAddress = $scope.newAddress.slice(0, MAX_LETTERS_IN_ADDRESS);
                            contactInfoToUpdate.Address = contactInfoToUpdate.Address.slice(0, MAX_LETTERS_IN_ADDRESS);
                            return;
                        }
                    } else {
                        contactInfoToUpdate.Address = '';
                    }

                    //save the changes on contact in the history
                    const contactHistory = $scope.changedDtails(contactInfoToUpdate);

                    //save the details of the updated contact in a json format
                    const updatedContact = {
                        Name: contactInfoToUpdate.Name,
                        Category: category,
                        Status: statusRole,
                        PhoneNumber: contactInfoToUpdate.PhoneNumber,
                        eMail: contactInfoToUpdate.eMail,
                        Address: contactInfoToUpdate.Address,
                        History: contactHistory
                    };

                    //call server with an http request
                    $http.post(SERVER_URI + '/updateContact', {
                        contactBeforeUpdate: contactBeforeUpdate, updatedContact: updatedContact
                    }).then(
                        function (response) { //success callback
                            //check if the phone number does not exist already
                            if (!response.data.phoneExists) {
                                $scope.getContactsList();
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
                    a function for updating a user in the system
                */
                $scope.saveUpdatedUser = function (userToUpdate) {
                    //regular expression for a valid user name
                    const reUserName = /^[a-zA-Z]{3,10}$/;

                    //regular expression for a valid name
                    const reName = /^[a-zA-Z\s\u0590-\u05fe]{2,20}$/;

                    $log.log('category : ' + category);
                    //if no role was selected show an error modal
                    if (category === undefined) {
                        $log.log('entered if : ' + userBeforeUpdate.Role);
                        category = userBeforeUpdate.Role;
                    } else {
                        $log.log('entered else : ' + category.Role);
                        category = category.Role;
                    }

                    //if a user name was not entered or was invalid show an error modal
                    if (userToUpdate.UserName === undefined || !reUserName.test(userToUpdate.UserName)) {
                        $scope.message = 'User name must contain only English letters ,minimum 3 leterrs and maximum 10 letters and no whitespace';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }

                    //if a name was not entered or was invalid show an error modal
                    if (userToUpdate.Name === undefined || !reName.test(userToUpdate.Name)) {
                        $scope.message = 'The name must contain only English or Hebrew letters ,minimum 2 leterrs and maximum 20 letters ';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }
                    const reMail = /^(([^<>()[\]\\.,;:\s@\']+(\.[^<>()[\]\\.,;:\s@\']+)*)|(\'.+\'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                    //check if an email address was entered and if it is valid
                    if (userToUpdate.eMail === undefined || !reMail.test(userToUpdate.eMail)) {
                        $scope.message = 'This email is invalid ';
                        $scope.messageType = 'ERROR';
                        angular.element(document.querySelector('#msgModal')).modal('show');
                        return;
                    }


                    //save the updated details of the user
                    const updatedUser = {
                        Role: category,
                        UserName: userToUpdate.UserName,
                        Name: userToUpdate.Name,
                        eMail: userToUpdate.eMail
                    };

                    //call server with http request
                    $http.post(SERVER_URI + '/updateUser', {
                        userBeforeUpdate: userBeforeUpdate, updatedUser: updatedUser
                    }).then(
                        function (response) { //success callback

                            $scope.users = response.data.users;
                            category = undefined;
                        },
                        function (response) { //failure callback

                        }
                    );
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
                    if (missingUserToDelete) {
                        $scope.messageType = 'Choose user to delete';

                        angular.element(document.querySelector('#deleteModal')).modal('show');
                        missingUserToDelete = false;
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
                    const loggedInNewPassword = {username: loggedInUser.UserName, newPassword: $scope.newPassword};
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
                    with the password in server for the current user name
                */
                $scope.verifyPassword = function (currenPassword) {
                    const loggedInCurrentPassword = {username: loggedInUser.UserName, currentPassword: currenPassword};
                    $http.post(SERVER_URI + '/verifyCurrentPassword', {
                        loggedInCurrentPassword: loggedInCurrentPassword
                    }).then(
                        function (response) { //success callback
                            $scope.currenPassword = undefined;

                            //the current password was verified for this username
                            if (response.data.verified) {
                                angular.element(document.querySelector('#changePasswordModal')).modal('show');
                            } else { //the current password was not verified for this username
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

                //a function for showing a modal for insuring the delition of all contacts from syetem
                $scope.insureDeleteAllContacts = function () {
                    $scope.message = 'Are you sure you want to delede all the contacts from system ? if you press OK, all contacts will be deleted and the information will be lost. ';
                    $scope.messageType = 'WARNNING';
                    angular.element(document.querySelector('#messageModalWithCancel')).modal('show');
                    deleteAllContactsFlag = true;
                };
                //a function for showing a modal for insuring the delition of contact from syetem
                $scope.insureDeleteContact = function (contact) {
                    contactToDelete = contact;
                    $scope.message = 'Are you sure you want to delede this contact from system ? if you press OK, the information of this contact will be lost. ';
                    $scope.messageType = 'WARNNING';
                    angular.element(document.querySelector('#messageModalWithCancel')).modal('show');
                    deleteContactFlag = true;
                };
                //a function for showing a modal for insuring the delition of user from syetem
                $scope.insureDeleteUser = function (user) {
                    userToDelete = user;
                    $scope.message = 'Are you sure you want to delede this user from system ? if you press OK, the information of this user will be lost. ';
                    $scope.messageType = 'WARNNING';
                    angular.element(document.querySelector('#messageModalWithCancel')).modal('show');
                    deleteUserFlag = true;
                };

                //a function for showing a modal for insuring the delition of all users from syetem
                $scope.ensureDeleteAllUsers = function () {
                    $scope.message = 'Are you sure you want to delede all the users from system ? if you press OK, all users will be deleted and the information will be lost. ';
                    $scope.messageType = 'WARNNING';
                    angular.element(document.querySelector('#messageModalWithCancel')).modal('show');
                    deleteAllUsersFlag = true;
                };
                /*
                    a function for deleting all contacts or users depends on 'flag' parameter
                */
                $scope.responseOk = function () {
                    $log.log('entered responseOk ' + deleteAllContactsFlag);
                    if (deleteAllContactsFlag) {
                        //call function for deleting all contacts from server
                        $scope.deleteAllContacts();
                        deleteAllContactsFlag = false;

                    }
                    if (deleteContactFlag) {
                        //call function for deleting contact from server
                        $scope.deleteContactFunction(contactToDelete);
                        deleteContactFlag = false;

                    }
                    if (deleteUserFlag) {
                        //call function for deleting user from server
                        $scope.deleteUser(userToDelete);
                        deleteUserFlag = false;

                    }

                    //call function for deleting all users from server
                    if (deleteAllUsersFlag) {
                        $scope.deleteAllUsers();
                        deleteAllUsersFlag = false;

                    }
                };

                /*
                    a function for deleting all contacts from srever
                    with an http request
                */
                $scope.deleteAllContacts = function () {
                    $http.get(SERVER_URI + '/deleteAllContacts').then(
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
                    a function for deleting all users from srever
                    with an http request
                */
                $scope.deleteAllUsers = function () {
                    $log.log('entered deleteAllUsers');

                    $http.get(SERVER_URI + '/deleteAllUsers').then(
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
                    a function for saving the user name of user to delete that was selected at modal
                */
                $scope.itemSelected = function (item, flag) {
                    $scope.selectedContact = item;

                    const res = item.split(',');

                    if (flag === 'contact_list') {
                        const res2 = res[0].split(':');//contact name
                        selectedItemPart1 = String(res2[1]).trim();
                    }

                    const res1 = res[1].split(':');

                    selectedItemPart2 = res1[1].split(' ');
                    selectedItemPart2 = String(selectedItemPart2[1]).trim();

                    $scope.selectedContact = selectedItemPart1 + ' ' + selectedItemPart2;
                    $log.log(selectedItemPart2);
                };

                /*
                    a function for deleting user from server
                */
                $scope.deleteUser = function (flag) {
                    if (flag === undefined) {
                        if (selectedItemPart2 === undefined) {
                            $scope.message = 'You did not select user to delete , Please select one';
                            $scope.messageType = 'Error';
                            angular.element(document.querySelector('#msgModal')).modal('show');
                            missingUserToDelete = true;
                            return;
                        }
                        //selectedItemPart2 = selectedItemPart2;
                    } else {
                        selectedItemPart2 = flag;
                    }
                    $http.post(SERVER_URI + '/deleteUser', {
                        username: selectedItemPart2
                    }).then(
                        function (response) { //success callback
                            $scope.users = response.data.users;
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
                            userToDelete = '';

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
                    $scope.showContacts = false;
                    $scope.showUsers = false;
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
