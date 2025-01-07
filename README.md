# Analyzing Images Stored in an Amazon S3 Bucket 

AWS CDK project to detect labels (e.g., objects, events, and concepts) uploaded to an Amazon S3 bucket using. Using **AWS Rekognition** and storing results in a **DynamoDB** table. 


## **Architecture**
The solution is fully implemented as **Infrastructure as Code (IaC)** using AWS CDK. Below are the key resources:

1. **Amazon S3 Bucket**:
   - Acts as the input storage for images.
   - Triggers a Lambda function whenever a new image is uploaded.

2. **AWS Lambda**:
   - Processes S3 events.
   - Uses the Rekognition  [`detectFaces`](https://docs.aws.amazon.com/rekognition/latest/APIReference/API_DetectFaces.html) API to do facial image analysis.
   - Stores the detected labels in DynamoDB.

3. **Amazon DynamoDB Table**:
   - Stores metadata about the images and the labels detected by Rekognition.
   - Partition key: `Image` (name of the image).

 

## **IaC**
``` bash .

cdk-app/
├── lambda/
│   ├── index.mjs     # Lambda function for image analysis
│   ├── package.json
│   ├── package-lock.json
├── bin/
│   ├── cdk-app.js  # Entry script that initializes the CDK application
├── lib/
│   ├── cdk-app-stack.js  # Contains the stack definitions and resource configurations
├── cdk.json  # CDK configuration 
├── package.json
├── package-lock.json

```

## Init the project

```bash
npm install -g aws-cdk@latest 
#or
npm install -g aws-cdk 
```

```bash
cdk --version
```

Create dir cdk-app/, changing name will cause an error
```bash
mkdir cdk-app
cd cdk-app/
```

__Initialize the application
```bash
cdk init app --language javascript
```
Create Directory for Lambda 

```bash
mkdir lambda 
cd lambda
touch index.mjs
```
__Add layer for aws-sdk__
- Add the ARN to cdk.json.
- Reference it in your stack code with this.node.tryGetContext().

```json
{
  "app": "node bin/cdk-app.js",
  "layerArn": "arn:aws:lambda:eu-central-1:[ACCOUND_IID]:layer:nodesdk:1",
  "watch": {
    "include": [
      "
```

__Update cdk-app-stack.js__

```bash
cd .. to dir with cdk.json 
run cdk bootstrap
```
In terminal you should be ->  ✅  Environment aws://ACCOUNT_ID/eu-region-1 bootstrapped.

__Generate the CF template of of the stack__
```bash
cdk synth  
```
To save  tempalte in current cdk-app dir
```bash
cdk synth > template.yaml
```