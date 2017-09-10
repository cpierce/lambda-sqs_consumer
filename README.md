# SQS Consumer
The SQS Consumer is an AWS Polling worker that consumes SQS messages for processing
using a Lambda Worker.  The script is meant to be reused for other purposes
when other workers are needed.  The SQS message queue holds data that
is passed to the worker via JSON Encoded String:

## Important Notes
### Environment Variables
The following environment variables are in use with the script:

* `queueUrl` - SQS Queue URL for the callback.

* `lambdaWorker` - Used to tell the Consumer what the name of the worker script is called. This
must be set to an existing Lambda Worker Function.

These variables must be set so that you don't have any issues with the script running on Lambda.

### Deleting SQS Messages
Since the SQS Consumer doesn't know if the job is successful or not it does not
act as the processor for deleting messages from the SQS queue.  This can be done
by adding the following code to the called Lambda Worker:

```
const SQS = new AWS.SQS({ apiVersion: '2012-11-05' });
var delete_params = {
    QueueUrl: QUEUE_URL,
    ReceiptHandle: message.ReceiptHandle,
};

SQS.deleteMessage(delete_params, (err) => callback(err, message));
```

Note that QUEUE_URL would need to be set inside the worker for this to work properly.

### How is this consumer called
The SQS Consumer is called on an event trigger from Cloud Watch.  The trigger runs
every 1 minute and will ingest 100 maximum messages although this value can be
changed.  Each worker will take one message and process it, and the consumer will
continue to process messages until there are non in the queue.

### Scripts used for this package
This node script uses npm to install required scripts using the following command:

```
./bin/install.sh
```

This script runs NPM and sets everything up that you should need to both test and
deploy the script.

### Creating a deployment package
To build a deployment package (.zip) you'll need to run the following command:

```
./bin/build.sh
```

This will create the files you need in the appropriate zip file SQS_Consumer.zip.
This file is available on your local box for uploading to the Lambda Scripts.

### Testing this package
This package uses jshint/jslint to test the node code provided.  From time to time
the code may need to be altered.  If additional libraries are added they should be
added to the `package.json` file and the `/bin/create_package.sh` script.  You can
test new changes in code and updated dependancies using `npm test`.
