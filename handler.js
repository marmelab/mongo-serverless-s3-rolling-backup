const util = require("util");
const AWS = require("aws-sdk");
const url = require("url");
const exec = util.promisify(require("child_process").exec);

const s3 = new AWS.S3();

const dump = async mongoUrl => {
  const { error, stdout } = await exec(
    `mongodump --gzip --archive --uri=${mongoUrl}`
  );
  if (error) {
    throw new Error(error);
  }
  return stdout;
};

const upload = async (path, data) => {
  const fileName = `${new Date().toISOString()}`;
  const { hostname, pathname } = url.parse(path);

  const response = await s3
    .upload({
      Bucket: hostname,
      Key: `${pathname.substr(1)}/${fileName}`,
      Body: data
    })
    .promise();

  if (response.errorMessage) {
    throw new Error(response.errorMessage);
  }
  return response.Location;
};

const prune = async (path, keep = 10) => {
  const { hostname, pathname } = url.parse(path);

  const listReponse = await s3
    .listObjectsV2({
      Bucket: hostname,
      Prefix: pathname.substr(1)
    })
    .promise();

  if (listReponse.errorMessage) {
    throw new Error(listReponse.errorMessage);
  }

  const files = listReponse.Contents.sort(
    (a, b) => a.LastModified - b.LastModified
  );
  const filesToRemove = files.slice(0, files.length - keep);
  if (!filesToRemove.length) {
    return [];
  }

  const deleteReponse = await s3
    .deleteObjects({
      Bucket: hostname,
      Delete: {
        Objects: filesToRemove.map(file => ({ Key: file.Key })),
        Quiet: false
      }
    })
    .promise();

  if (deleteReponse.errorMessage) {
    throw new Error(deleteReponse.errorMessage);
  }

  return filesToRemove;
};

const MONGO_URL = process.env.MONGO_URL;
const S3_PATH = process.env.S3_PATH;
const KEEP = process.env.KEEP;

module.exports.backup = async (event, context, cb) => {
  // set path so that lambda can execute local binaries
  process.env["PATH"] =
    process.env["PATH"] + ":" + process.env["LAMBDA_TASK_ROOT"];

  const data = await dump(MONGO_URL);
  const location = await upload(S3_PATH, data);
  console.log(`Backup successfully uploaded to ${location}`);

  const removedFiles = await prune(S3_PATH, parseInt(KEEP, 10));
  console.log(`Pruned ${removedFiles.length} file`);
};
