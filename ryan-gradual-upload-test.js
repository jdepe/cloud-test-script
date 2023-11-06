const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configure AWS with environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN, // if necessary
  region: process.env.AWS_REGION || "ap-southeast-2",
});

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const bucketName = 'n11069449-compress-store'; // Assuming the same bucket for source and destination
const sourceFolderName = 'New folder/';
const queueUrl = 'https://sqs.ap-southeast-2.amazonaws.com/901444280953/n11069449-sqs-queue';

async function duplicateAndQueueJobs(numberOfDuplicates) {
  for (let i = 0; i < numberOfDuplicates; i++) {
    const uniqueId = uuidv4();
    const newFolderKey = `${uniqueId}/New folder/`;
    const fileKeys = [];
    const sourceObjects = await listObjects(bucketName, sourceFolderName);

    for (const object of sourceObjects) {
      const sourceKey = object.Key;
      const newKey = sourceKey.replace(sourceFolderName, newFolderKey);
      await copyObject(bucketName, sourceKey, bucketName, newKey);
      fileKeys.push(newKey);
    }

    await sendMessageToQueue(queueUrl, fileKeys, newFolderKey, uniqueId);
  }
}

async function listObjects(bucket, prefix) {
  const params = {
    Bucket: bucket,
    Prefix: prefix
  };
  const s3Objects = await s3.listObjectsV2(params).promise();
  return s3Objects.Contents;
}

async function copyObject(sourceBucket, sourceKey, targetBucket, targetKey) {
  const copyParams = {
    Bucket: targetBucket,
    CopySource: `${sourceBucket}/${sourceKey}`,
    Key: targetKey
  };
  await s3.copyObject(copyParams).promise();
}

async function sendMessageToQueue(queueUrl, fileKeys, folderKey, uniqueId) {
  const params = {
    MessageBody: JSON.stringify({ fileKeys, folderKey, uniqueId }),
    QueueUrl: queueUrl
  };

  try {
    const data = await sqs.sendMessage(params).promise();
    console.log(`Message sent to queue. Message ID: ${data.MessageId}`);
  } catch (err) {
    console.error('Error sending message to queue:', err);
  }
}

// Call the function with the desired number of duplicates, e.g., 10
duplicateAndQueueJobs(25);
