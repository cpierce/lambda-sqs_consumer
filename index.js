/**
 * SQS Consumer
 *
 * Consumes SQS Messages and invokes a lambda worker for processing.
 *
 * @version 1.0.0
 */
'use strict';

/**
 * AWS SDK Load
 *
 * @const
 * @type  {object}
 */
const AWS = require('aws-sdk');

/**
 * Async Library Load
 *
 * @const
 * @type  {object}
 */
const ASYNC = require('async');

/**
 * SQS Class Constructor
 *
 * @const
 * @type  {object}
 */
const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });

/**
 * Lambda Class Constructor
 *
 * @const
 * @type  {object}
 */
const Lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

/**
 * Environment Variable for SQS Queue URL
 *
 * @const
 * @type  {string}
 */
const QUEUE_URL = process.env.queueUrl;

/**
 * Environment Variable for Lambda Worker Name
 *
 * @const
 * @type  {string}
 */
const LAMBDA_WORKER = process.env.lambdaWorker;

/**
 * Invoke Worker method.
 *
 * @param  {object} context
 * @param  {string} message
 * @return {Promise}
 */
function invokeWorker(message, callback) {
    var params = {
        FunctionName: LAMBDA_WORKER,
        InvocationType: 'Event',
        Payload: new Buffer(JSON.stringify(message)),
    };

    Lambda.invoke(params, (err, data) => {
        if (err) {
            console.error(err, err.stack);
            callback(err);
        } else {
            callback(null, data);
        }
    });
}

/**
 * Consume Messages method.
 *
 * @param {Function} callback
 */
function consumeMessages(callback) {
    var params = {
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 10
    };

    // batch request messages
    SQS.receiveMessage(params, (err, data) => {
        if (err) {
            console.error(err, err.stack);
            callback(err);
        } else {
            callback(null, data.Messages);
        }
    });
}

/**
 * Handle SQS Message Queue method.
 *
 * @param {object}   context
 * @param {Function} callback
 */
function handleSQSMessageQueue(context, callback) {
    consumeMessages((err, messages) => {
        if (messages && messages.length > 0) {
            var invocations = [];
            messages.forEach((message) => {
                invocations.push((callback) => {
                    invokeWorker(message, callback);
                });
            });

            ASYNC.parallel(invocations, (err) => {
                if (err) {
                    console.error(err, err.stack);
                    callback(err);
                } else {
                    if (context.getRemainingTimeInMillis() > 20000) {
                        handleSQSMessageQueue(context, callback);
                    } else {
                        callback(null, 'PAUSE');
                    }
                }
            });
        } else {
            callback(null, 'DONE');
        }
    });
}

/**
 * Event Handler constructor invoked by cloud watch schedule.
 *
 * @param {object}   event
 * @param {object}   context
 * @param {Function} callback
 */
exports.handler = (event, context, callback) => {
    handleSQSMessageQueue(context, callback);
};
