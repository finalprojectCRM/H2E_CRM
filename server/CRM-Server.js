/*jshint unused:false*/
/* eslint-disable no-unused-vars */

const util = require('util');
const Express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('config');
const utils = require('./lib/utils');
const logging = require('./lib/utils/logging');
const logger = logging.mainLogger;
const serverApiRouter = require('./lib/routers/server-api-router');
const repo = require('./lib/repository');

const app = new Express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(helmet());
app.use(config.server.api.root, serverApiRouter);

//start server
app.listen(config.server.access.port, () => {
    logger.info(util.format('%s server is listening on port %s', config.server.name, config.server.access.port));
    (async function() {
        const status = await repo.init();
        if (status.code !== 200){
            logger.error(utils.getErrorStatus(util.format(config.server.errors.DB.ERROR_DB_CONNECTION_FAILED, config.storage, status.message)));
        }
    })();
});
