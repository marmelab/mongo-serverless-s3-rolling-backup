# mongo-serverless-s3-rolling-backup

Serverless scheduled rolling backups from mongo to s3

Inspired from [alonhar/lambda-mongodb-s3-backup](https://github.com/alonhar/lambda-mongodb-s3-backup).

## Usage

### Install

```
npm install
```

### Deploy

```
npm run deploy
```

Don't forget to set environment variables:

- MONGO_URL: [mongo connection string](https://docs.mongodb.com/manual/reference/connection-string/)
- S3_PATH: path as [S3Uri](https://docs.aws.amazon.com/cli/latest/reference/s3/index.html#path-argument-type)
- S3_NAME: name of your bucket
- SCHEDULE: [schedule expression](https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html)
- KEEP: number of backups to keep on s3, oldest will be pruned first

Example:

```
MONGO_URL=mongodb://admin:password@host:57844/database S3_PATH==s3://bucket/production S3_NAME=bucket SCHEDULE=cron(15 10 * * ? *) KEEP=30 npm run deploy
```

## Development

Install then run locally:

```
npm run local
```

Same environment variables apply.
