import type { AWS } from "@serverless/typescript";

import { auctionsByInscriptionId } from "@functions/auctions-by-inscription-id";
import { auctionsByCollection } from "@functions/auctions-by-collection";
import { auction } from "@functions/auction";
import { getAuctionsByAddress } from "@functions/auctions-by-address";
import { auctions } from "@functions/auctions";
import { updateAuctionStatus } from "@functions/update-auction-status";
import { publishEvent } from "@functions/publish";
import { finishAuction } from "@functions/finish-auction";
import { version } from "@functions/version";

type AWSConfig = AWS & {
  stepFunctions?: object;
};

const serverlessConfiguration: AWSConfig = {
  configValidationMode: "warn",
  plugins: [
    "serverless-step-functions",
    "serverless-esbuild",
    "serverless-ssm-fetch",
    "serverless-offline",
  ],
  service: "dutch-auction",
  frameworkVersion: "3",
  provider: {
    name: "aws",
    runtime: "nodejs18.x",
    stage: "${opt:stage, 'dev'}",
    region: "us-east-1",
    environment: {
      STAGE: "${self:provider.stage}",
      AWS_ACCOUNT_ID: {
        Ref: "AWS::AccountId",
      },
      DYNAMODB_TABLE: "AuctionStates-${self:provider.stage}",
      NOSTR_PUBLIC_KEY:
        "be82246ca8d64881cc53407a773e33f9e220dc2153c52bb713a9ab1fe6a18d80",
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
            ],
            Resource: [
              {
                "Fn::Sub":
                  "arn:aws:dynamodb:${opt:region, self:provider.region}:${AWS::AccountId}:table/${self:provider.environment.DYNAMODB_TABLE}",
              },
              {
                "Fn::Sub":
                  "arn:aws:dynamodb:${opt:region, self:provider.region}:${AWS::AccountId}:table/${self:provider.environment.DYNAMODB_TABLE}/index/*",
              },
            ],
          },
          {
            Effect: "Allow",
            Action: ["states:StartExecution"],
            Resource: {
              "Fn::Sub":
                "arn:aws:states:${self:provider.region}:${AWS::AccountId}:stateMachine:DutchAuctionStateMachine-${self:provider.stage}",
            },
          },
          {
            Effect: "Allow",
            Action: ["lambda:InvokeFunction"],
            Resource: [
              {
                "Fn::Sub":
                  "arn:aws:lambda:${self:provider.region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-finishAuction",
              },
              {
                "Fn::Sub":
                  "arn:aws:lambda:${self:provider.region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-getAuctionsByAddress",
              },
              {
                "Fn::Sub":
                  "arn:aws:lambda:${self:provider.region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-auctionsByInscriptionId",
              },
              {
                "Fn::Sub":
                  "arn:aws:lambda:${self:provider.region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-auctionsByCollection",
              },
              {
                "Fn::Sub":
                  "arn:aws:lambda:${self:provider.region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-auctions",
              },
              {
                "Fn::Sub":
                  "arn:aws:lambda:${self:provider.region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-version",
              },
              {
                "Fn::Sub":
                  "arn:aws:lambda:${self:provider.region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-auction",
              },
              {
                "Fn::Sub":
                  "arn:aws:lambda:${self:provider.region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-updateAuctionStatus",
              },
              {
                "Fn::Sub":
                  "arn:aws:lambda:${self:provider.region}:${AWS::AccountId}:function:${self:service}-${self:provider.stage}-publishEvent",
              },
            ],
          },
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            Resource: {
              "Fn::Sub":
                "arn:aws:logs:${self:provider.region}:${AWS::AccountId}:log-group:/aws/lambda/${self:service}-${self:provider.stage}-auction:*",
            },
          },
          {
            Effect: "Allow",
            Action: ["ssm:Describe*", "ssm:Get*", "ssm:List*"],
            Resource: [
              {
                "Fn::Sub":
                  "arn:aws:ssm:${self:provider.region}:${AWS::AccountId}:parameter/NOSTR_PRIVATE_KEY",
              },
            ],
          },
        ],
      },
    },
  },
  functions: {
    version,
    auction,
    getAuctionsByAddress,
    auctions,
    updateAuctionStatus,
    publishEvent,
    finishAuction,
    auctionsByInscriptionId,
    auctionsByCollection,
  },
  stepFunctions: {
    stateMachines: {
      DutchAuctionStateMachine: {
        name: "DutchAuctionStateMachine-${self:provider.stage}",
        definition: {
          Comment:
            "A step function machine to manage the Dutch Auction process.",
          StartAt: "InitializeAuction",
          States: {
            InitializeAuction: {
              Type: "Pass",
              ResultPath: "$",
              Next: "WaitToStart",
            },
            WaitToStart: {
              Type: "Wait",
              TimestampPath: "$.scheduledISODate", // 'scheduledISODate' should be ISO8601 format
              Next: "updateAuctionStatus",
            },
            updateAuctionStatus: {
              Type: "Task",
              Resource: {
                "Fn::GetAtt": ["UpdateAuctionStatusLambdaFunction", "Arn"],
              },
              ResultPath: "$",
              Next: "IsAuctionFinished",
            },
            IsAuctionFinished: {
              Type: "Choice",
              Choices: [
                {
                  Variable: "$.currentPrice",
                  NumericLessThanEqualsPath: "$.reservePrice",
                  Next: "AuctionFinished",
                },
                {
                  Variable: "$.auctionFinished",
                  BooleanEquals: true,
                  Next: "AuctionFinished",
                },
              ],
              Default: "WaitRoundDuration",
            },
            WaitRoundDuration: {
              Type: "Wait",
              SecondsPath: "$.secondsBetweenEachDecrease",
              Next: "updateAuctionStatus",
            },
            AuctionFinished: {
              Type: "Task",
              Resource: {
                "Fn::GetAtt": ["FinishAuctionLambdaFunction", "Arn"],
              },
              End: true,
            },
          },
        },
      },
    },
  },
  resources: {
    Resources: {
      AuctionStatesTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "${self:provider.environment.DYNAMODB_TABLE}",
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
            {
              AttributeName: "btcAddress",
              AttributeType: "S",
            },
            {
              AttributeName: "inscriptionId",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          GlobalSecondaryIndexes: [
            {
              IndexName: "btcAddress-index",
              KeySchema: [
                {
                  AttributeName: "btcAddress",
                  KeyType: "HASH",
                },
              ],
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1,
              },
              Projection: {
                ProjectionType: "ALL",
              },
            },
            {
              IndexName: "inscriptionId-index",
              KeySchema: [
                {
                  AttributeName: "inscriptionId",
                  KeyType: "HASH",
                },
              ],
              ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1,
              },
              Projection: {
                ProjectionType: "ALL",
              },
            },
          ],
        },
      },
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: true,
      sourcemap: false,
      exclude: ["aws-sdk", "@aws-sdk"],
      target: "node18",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
    serverlessSsmFetch: {
      NOSTR_PRIVATE_KEY: "NOSTR_PRIVATE_KEY~true",
    },
    customHeaders: [
      "Content-Type",
      "X-Amz-Date",
      "Authorization",
      "X-Api-Key",
      "X-Amz-Security-Token",
      "X-Amz-User-Agent",
    ],
    cors: {
      origins: ["*"], // Update with specific allowed origins
      headers: ["Content-Type"],
      allowCredentials: false,
    },
  },
};

module.exports = serverlessConfiguration;
