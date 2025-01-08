import AWS from "aws-sdk";
const dynamodb = new AWS.DynamoDB.DocumentClient();
const rekognition = new AWS.Rekognition();

export const handler = async (event) => {
  const promises = event.Records.map(async (record) => {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    await rekFunction(bucket, key);
  });

  await Promise.all(promises);
};

async function rekFunction(bucket, key) {
  console.log(`Processing image from ${bucket}, Image Key -> ${key}`);

  const rekognitionParams = {
    Image: { S3Object: { Bucket: bucket, Name: key } },
    Attributes: ["ALL"],
  };

  try {
    const response = await rekognition.detectFaces(rekognitionParams).promise();

    if (!response.FaceDetails || response.FaceDetails.length === 0) {
      console.log("No faces detected");
      return;
    }

    const isQualityGood = checkImageQuality(response);
    if (!isQualityGood) {
      console.log("Low quality image, stopping processing.");
      return;
    }

    const tableName = process.env.TABLE;
    const smileConfidence = response.FaceDetails[0]?.Smile?.Confidence || 0;
    const emotions =
      response.FaceDetails[0]?.Emotions?.reduce((acc, e) => {
        acc[e.Type] = e.Confidence;
        return acc;
      }, {}) || {};

    const ageRange = {
      High: response.FaceDetails[0]?.AgeRange?.High || 0,
      Low: response.FaceDetails[0]?.AgeRange?.Low || 0,
    };

    const item = {
      Image: key, // Partition Key
      SmileConfidence: smileConfidence,
      Emotions: JSON.stringify(emotions),
      AgeRange: JSON.stringify(ageRange),
    };

    const putParams = {
      TableName: tableName,
      Item: item,
    };

    await dynamodb.put(putParams).promise();
  } catch (error) {
    console.error("Error processing Rekognition or DynamoDB:", error);
  }
}

function checkImageQuality(response) {
  if (!response.FaceDetails || response.FaceDetails.length === 0) {
    console.log("No faces detected in the image.");
    return false;
  }

  for (const face of response.FaceDetails) {
    const { Width, Height } = face.BoundingBox || {};
    // Check if the face width is 10% of the total image width
    if (!Width || !Height || Width < 0.1 || Height < 0.1) {
      console.log("Face too small in the image.");
      return false;
    }
  }

  if (response.FaceDetails.length > 1) {
    console.log("Multiple faces detected.");
    return false;
  }

  return true;
}
