const config = require('config');
const util = require('util');
const nodeMailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const pathLib = require('path');
const _ = require('lodash');
const logging = require('../utils/logging');
const logger = logging.mainLogger;

module.exports = {
    obj2Props: function (obj, sep = " ", escapeAll = false) {
        const escaped = {};
        const arr = [];
        Object.entries(obj).forEach(([key, value]) => {
            if (value != null) {
                if (escaped[key] || escapeAll) {
                    value = `"${value}"`;
                }
                arr.push(`${key}=${value}`);
            }
        });
        return arr.join(sep);
    },
    sendMail: function (emailData, response) {

        const mailOptions = {
            from: config.server.mail.user,
            to: emailData.mailRecipient,
            subject: emailData.mailSubject,
            text: emailData.mailText
        };

        //create an approach to send emails from the system by using node mailer library
        const transporter = nodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.server.mail.user,
                pass: config.server.mail.password
            }
        });

        if (emailData.attachmentFileName) {
            mailOptions.attachments = [{path: config.server.data.uploadFolder + emailData.attachmentFileName}];
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                logger.error(error);
                response.writeHead(500, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({error: 'mail failed to be sent to ' + emailData.mailRecipient}));
            } else {
                logger.info('Email sent: ' + info.response);
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({ok: 'mail has been sent successfully to ' + emailData.mailRecipient}));
            }
        });
    },
    uploadFile: function (req, res, handler) {
        const storage = multer.diskStorage({ //multers disk storage settings
            destination: function (req, file, cb) {
                cb(null, config.server.data.uploadFolder);
            },
            filename: function (req, file, cb) {
                cb(null, file.originalname);

            }
        });

        const upload = multer({ //multer settings
            storage: storage
        }).single('file');

        upload(req, res, function (err) {
            if (err || !req.file.originalname) {
                res.json({errorCode: 1, errDesc: err});
                return;
            }
            (async function () {
                await handler(req.file.originalname);
                res.json({errorCode: 0, errDesc: null});
            })();
        });
    },
    getErrorStatus: function (errorMessage, errorCode) {
        const status = {};
        status.code = errorCode ? errorCode : 400;
        status.message = {'error': util.format('%s', _.replace(errorMessage, /Error: /gi, ''))};
        return status;
    },
    handleInvalidRequest: async function (req, res) {
        const status = module.exports.getErrorStatus(util.format(config.server.errors.general.ERROR_UNSUPPORTED_API,
            req.url, req.method, req.headers), 404);
        logger.info('Response Status Code: ' + status.code);
        logger.info('Response Data: ' + status.message);
        res.status(status.code).send(status.message);
    },
    getFile: function (request, response, getDBConnectionStatus, isOnlyClientRoot = false, mainPage = '') {
        (async function () {
            const status = await getDBConnectionStatus();
            if (status.code !== 200) {
                logger.error(module.exports.getErrorStatus(util.format(config.server.errors.DB.ERROR_DB_CONNECTION_FAILED, config.storage, status.message)));
                response.status(status.code).send({'error': status.message});
            } else {
                let filePath;
                if (isOnlyClientRoot) {
                    filePath = util.format('%s%s', config.server.data.clientRoot, request.url);
                    if (mainPage) {
                        filePath += mainPage;
                    }
                } else {
                    filePath = util.format('%s/%s%s', config.server.data.clientRoot, config.server.data.clientModulesRoot, request.url);
                }
                const ext = pathLib.extname(filePath);
                let contentType = 'text/javascript';
                if (ext === '.css') {
                    contentType = 'text/css';
                }
                if (ext === '.html') {
                    contentType = 'text/html';
                }
                logger.info(util.format('rendering file: %s'), filePath);
                fs.readFile(filePath, function (error, data) {
                    if (error) {
                        logger.info(util.format('cannot get %s. Error: %s'), filePath, error);
                        const errorMessage = module.exports.getErrorStatus(util.format(config.server.errors.general.ERROR_NO_SUCH_FILE, filePath));
                        response.status(400).send({'error': errorMessage});
                    } else {
                        response.writeHead(200, {'Content-Type': contentType});
                        response.end(data);
                    }
                });
            }
        })();
    }
};
