import type { AWS } from '@serverless/typescript';

import hello from '@functions/hello';

const serverlessConfiguration: AWS = {
  service: 'serverless-sample',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-deployment-bucket'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    deploymentBucket: { name: 'serverless-sample-bucket' },
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    iam: {
      role: 'ServerlessSampleLambdaRole'
    }
  },
  functions: { hello },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
  resources: {
    Resources: {
      ServerlessSampleLambdaRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: 'serverless-sample-lambda-role',
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: ['lambda.amazonaws.com']
                },
                Action: ['sts:AssumeRole']
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::${aws:accountId}:policy/serverless-sample-lambda-managed-policy'
          ]
        },
        DependsOn: ['ServerlessSampleLambdaManagedPolicy']
      },
      ServerlessSampleLambdaManagedPolicy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Properties: {
          ManagedPolicyName: 'serverless-sample-lambda-managed-policy',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'log',
                Effect: 'Allow',
                Action: ['logs:CreateLogStream', 'logs:CreateLogGroup', 'logs:PutLogEvents'],
                Resource: 'arn:aws:logs:${aws:region}:${aws:accountId}:log-group:/aws/lambda/serverless-sample-${sls:stage}'
              }
            ]
          }
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
