const util = require('util');
const mongoClient = require('mongodb').MongoClient;
const config = require('config');
const mongoConfig = config.mongo;
const APP_NAME = require('os').hostname();
const ReadPreference = require('mongodb').ReadPreference;
let dbHandle;
let mongoConn;

const collections = {
    test: 'test',
    customer: 'customers',
    status: 'statuses',
    worker: 'workers',
    file: 'files',
    rolesWithStatus: 'roles with statuses',
    statusesWithRole: 'statuses with roles',
    color: 'colors'
};

function getMongoConnectionString() {
    let connectionString = '';
    if (!mongoConfig.authType || mongoConfig.authType === 'none') {
        if (mongoConfig.uriPrefix) {
            connectionString = util.format('%s://', mongoConfig.uriPrefix);
        }
        connectionString += util.format('%s/%s?', mongoConfig.clusterUrl, mongoConfig.dbName);
    } else if (mongoConfig.authType === 'SHA-1') {
        const dbWorkerName = process.env.mongo_workername ? process.env.mongo_workername : mongoConfig.dbDefaultWorkerName;
        const dbWorkerPassword = process.env.mongo_password ? process.env.mongo_password : mongoConfig.dbDefaultWorkerPassword;
        connectionString = util.format('%s://%s:%s@%s/%s?', mongoConfig.uriPrefix, dbWorkerName, dbWorkerPassword, mongoConfig.clusterUrl, mongoConfig.dbName);
    }
    const replicaSet = mongoConfig.replicaSet;
    if (replicaSet) {
        connectionString += util.format('replicaSet=%s&', replicaSet);
    }
    connectionString += util.format('readPreference=nearest&auto_reconnect=true&connectTimeoutMS=%s&retryWrites=true&w=majority', mongoConfig.connectTimeoutMS);
    return connectionString;
}

module.exports = {
    init: async function (mediator, logger) {
        let statusCode;
        let statusMessage;
        const connectionString = getMongoConnectionString();
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            readPreference: ReadPreference.NEAREST,
            //bufferMaxEntries: 100, // Sets a cap on how many operations the driver will buffer up before giving up on getting a working connection, default is -1 which is unlimited.
            connectTimeoutMS: mongoConfig.connectTimeoutMS,
            poolSize: 16,
            //autoReconnect: true,
            appname: APP_NAME
        };
        logger.info(util.format('MongoDB Connection Options: %s.', JSON.stringify(options)));
        if (mongoConn) {
            mongoConn.close();
        }
        const conn = await mongoClient.connect(connectionString, options).catch(err => {
            statusCode = 400;
            statusMessage = util.format('%s', err);
        });

        if (!conn) {
            return {
                statusCode: statusCode,
                statusMessage: statusMessage,
                dbHandle: null
            };
        }
        mongoConn = conn;
        dbHandle = mongoConn.db(mongoConfig.dbName);
        return {
            statusCode: 200,
            statusMessage: connectionString,
            dbHandle: dbHandle
        };
    },

    getCollection: function (type) {
        return dbHandle.collection(collections[type]);
    },

    addItem: async function (item, type) {
        return await dbHandle.collection(collections[type]).insertOne(item);
    },

    updateItem: async function (findItem, type, updatedItem = undefined, insertIfNotFound = false) {
        if (updatedItem) {
            if (insertIfNotFound) {
                return dbHandle.collection(collections[type]).updateOne(findItem, {$set: updatedItem}, {upsert: true});
            } else {
                return dbHandle.collection(collections[type]).updateOne(findItem, {$set: updatedItem});
            }
        } else {
            return dbHandle.collection(collections[type]).updateOne(findItem, {$set: findItem}, {upsert: true});
        }
    },

    updateItemByCondition: async function (findItem, updatedItem, type) {
        return dbHandle.collection(collections[type]).updateOne(findItem, updatedItem);
    },

    addItems: async function (items, type) {
        return await dbHandle.collection(collections[type]).insertMany(items);
    },

    countItems: async function (type) {
        return await dbHandle.collection(collections[type]).countDocuments({});
    },

    populateEmptyCollectionByDefaultValue: async function (item, type, logger) {
        const count = await module.exports.countItems(type);
        logger.info('found %s documents in %s collection', count, collections[type]);
        if (count === 0) {
            logger.info('collection %s is empty, so adding default item[%s]', collections[type], JSON.stringify(item));
            await module.exports.addItems(item, type);
        }
    },

    deleteItem: async function (item, type) {
        return dbHandle.collection(collections[type]).deleteOne(item);
    },

    deleteAllItems: async function (type, condition = {}) {
        return dbHandle.collection(collections[type]).remove(condition);
    },

    getItem: async function (item, type) {
        return await dbHandle.collection(collections[type]).findOne(item);
    },

    getAllItems: async function (type, condition) {
        return await dbHandle.collection(collections[type]).find(condition).toArray();
    },

    getItemByCondition: async function (condition, type) {
        return await dbHandle.collection(collections[type]).findOne(condition);
    }
};
