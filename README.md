# Analyzing Images Stored in an Amazon S3 Bucket 

AWS CDK project to detect labels (e.g., objects, events, and concepts) uploaded to an Amazon S3 bucket using. Using **AWS Rekognition** and storing results in a **DynamoDB** table. 


## **Architecture**
The solution is fully implemented as **Infrastructure as Code (IaC)** using AWS CDK. 

 **S3 Bucket**
  ![S3 Bucket](./icons/s3.png) 

   - Acts as the input storage for images.
   - Triggers a Lambda function wh
   
   **Lambda**
  ![AWS Lambda](./icons/lambda.png) 

   - Processes S3 events.
   - Uses the Rekognition  [`detectFaces`](https://docs.aws.amazon.com/rekognition/latest/APIReference/API_DetectFaces.html) API to do facial image analysis.
   - Stores the detected labels in DynamoDB.

 
**Amazon DynamoDB Table**
 ![Amazon DynamoDB Table](./icons/ddb.png)

   - Stores metadata about the images and the labels detected by Rekognition.
   - Partition key: `Image` (name of the image).

**Amazon Rekognition**
 ![Amazon Rekognition](./icons/rkg.png)

- Stateless  API operation`detectFaces` for facial analysis identifies several facial attributes, including:
  - **Age Range**: Estimates the age range of individuals in the image.
  - **Emotions**: Detects emotions like happiness, sadness, surprise, etc. with confidence value
  ```bash
  "Emotions": [ 
            { 
               "Confidence": number,
               "Type": "string"
            }
  ]
  ```
  - **Smile**: Identifies if the person is smiling.


 

## **IaC**
``` bash .

cdk-app/
├── lambda/
│   ├── index.mjs #Lambda function for image analysis
├── bin/
│   ├── cdk-app.js #Entry script that initializes the CDK application
├── lib/
│   ├── cdk-app-stack.js #Contains the stack definitions and resource configurations
├── cdk.json #CDK configuration 
├── package.json
├── package-lock.json
├── node_modules/ # Local dependencies (installed via npm install)
├── jest.config.js 
├── README.md         
└── test/   

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

__Create dir cdk-app/__, changing name will cause an error
```bash
mkdir cdk-app
cd cdk-app/
```

__Initialize the application__
```bash
cdk init app --language javascript
```
Create Directory for Lambda 
-  Lambda layer should be in the same region where you are synthesizing and deploying the CDK stack.

```bash
mkdir lambda 
cd lambda
touch index.mjs
```
__Add layer for aws-sdk__
To use the lambdaLayerArn from the cdk.json context, you need to retrieve it in your cdk-app-stack.js file. Here's how you can do it:

Retrieve the context value from the cdk.json file.

- Add the ARN to cdk.json  file under the `context` section, like this:
- Reference it in your stack code with this.node.tryGetContext().

```json
{
  "context": {
    "lambdaLayerArn": "arn:aws:lambda:region:account-id:layer:layer-name:version"
  }
}
```

__Update cdk-app-stack.js__

```bash
cd .. to dir with cdk.json 
run cdk bootstrap
```
![✅  Environment aws://account_id/eu-region-1 bootstrapped.](./assets/cdkBootstrapScreen.png)
__Optionally generate the CF template of of the stack__
```bash
cdk synth  
```
To save  tempalte in current cdk-app dir
```bash
cdk synth > template.yaml
```
__Deploy the stack__

```bash 
cdk deploy
```

![✨ CdkAppStack Deployed ](./assets/cdkDeployScreen.png)

__To destroy the stack__
- Empty the s3
```bash
cdk destroy
```