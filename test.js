const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: "ap-southeast-2",
  });

const sqs = new AWS.SQS();
const queueUrl = 'https://sqs.ap-southeast-2.amazonaws.com/901444280953/n11069449-sqs-queue';

const sendMessage = async (folderKey, fileKeys) => {
    const params = {
      MessageBody: JSON.stringify({ folderKey, fileKeys }),
      QueueUrl: queueUrl,
    };
  
    try {
      const data = await sqs.sendMessage(params).promise();
      console.log(`Message sent successfully. Message ID: ${data.MessageId}`);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  
  // Function to generate and send multiple messages
  const sendMultipleMessages = async (numberOfMessages) => {
    for (let i = 0; i < numberOfMessages; i++) {
      const folderKey = `1`;
      const fileKeys = [`1/1.mp4`]; // Replace with actual file keys
      await sendMessage(folderKey, fileKeys);
    }
  };
  
  // Replace 10 with the number of messages you want to send
  sendMultipleMessages(10);