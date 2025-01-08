const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const iam = require("aws-cdk-lib/aws-iam");
const lambda = require("aws-cdk-lib/aws-lambda");
const lambdaEventSource = require("aws-cdk-lib/aws-lambda-event-sources");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const { Stack } = cdk;
const imageBucketName = "cdk-rekn-uploadbucket";

class CdkAppStack extends Stack {
  /**
   * @param {cdk.App} scope - The parent construct.
   * @param {string} id - The unique identifier for the stack.
   * @param {cdk.StackProps} props - Stack properties.
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // S3 Bucket
    // ========================================
    const bucket = new s3.Bucket(this, imageBucketName, {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, "BucketName", { value: bucket.bucketName });

    // IAM Role for Lambda
    // ========================================
    const role = new iam.Role(this, "cdk-rekn-lambda-role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "rekognition:*", // Allow Rekognition service calls
          "logs:CreateLogGroup", // Allow log group creation
          "logs:CreateLogStream", // Allow log stream creation
          "logs:PutLogEvents", // Allow log event publishing
        ],
        resources: ["*"],
      })
    );

    // DynamoDB Table
    // ========================================
    const table = new dynamodb.Table(this, "cdk-rekn-imagetable", {
      partitionKey: { name: "Image", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, "TableName", { value: table.tableName });

    // Retrieve the lambdaLayerArn from the context
    const lambdaLayerArn = this.node.tryGetContext("lambdaLayerArn");

    if (!lambdaLayerArn) {
      throw new Error("lambdaLayerArn is not defined in the context");
    }
    const lambdaLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "CustomLayer",
      lambdaLayerArn
    );

    // AWS Lambda Function
    // ========================================
    const lambdaFn = new lambda.Function(this, "cdk-rekn-lambda-function", {
      code: lambda.Code.fromAsset("lambda"),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      role: role,
      environment: {
        TABLE: table.tableName,
        BUCKET: bucket.bucketName,
      },
      timeout: cdk.Duration.seconds(10), // defualt 3s not enough for large images
      layers: [lambdaLayer],
    });

    lambdaFn.addEventSource(
      new lambdaEventSource.S3EventSource(bucket, {
        events: [s3.EventType.OBJECT_CREATED],
      })
    );

    // Permissions to read from S3 bucket & write to DDB
    bucket.grantReadWrite(lambdaFn);
    table.grantFullAccess(lambdaFn);
  }
}

module.exports = { CdkAppStack };
