const {exec}=require('child_process')
const path=require('path')

const fs=require('fs') //builtin file system module

const {S3Client,PutObjectCommand}=require('@aws-sdk/client-s3')

const mime=require('mime-types')
const Redis = require('ioredis')

const REDIS_URL = process.env.REDIS_URL || 'rediss://default:PASSWORD@HOST:PORT'
const publisher = new Redis(REDIS_URL)

function publishLog(log) {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }))
}

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1'
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY

const s3Client = new S3Client({
    region: AWS_REGION,
    ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && {
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY
        }
    })
})

const PROJECT_ID=process.env.PROJECT_ID 


async function init() {
  console.log('Executing script.js');
  publishLog('Build Started...');

  const totalStart = Date.now();

  const output_path = path.join(__dirname, 'output');

  //  NPM install + build
  const buildStart = Date.now();
  const p = exec(`cd ${output_path} && npm install && npm run build`);

  p.stdout.on('data', function (data) {
    console.log(data.toString());
    publishLog(data.toString());
  });

  p.stdout.on('error', function (data) {
    console.log('Error', data.toString());
    publishLog(`error: ${data.toString()}`);
  });

  p.on('close', async function () {
    const buildTime = ((Date.now() - buildStart) / 1000).toFixed(2);
    console.log('Build Complete');
    publishLog(`Build Complete`);
    publishLog(`npm_install_build took ${buildTime}s`);

    //  S3 upload
    const uploadStart = Date.now();
    const distFolderPath = path.join(__dirname, 'output', 'dist');
    const distFolderContent = fs.readdirSync(distFolderPath, { recursive: true });

    publishLog(`Starting to upload`);

    for (const file of distFolderContent) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;// as we dont want any folders in s3 we only wanna upload files to s3 we ignore any folders
            //we have to put objects in s3
        // we install mime types to handle the files of different content type in the users project
      publishLog(`uploading ${file}`);

      const S3_BUCKET = process.env.S3_BUCKET || 'vercel-clone-miniproject2'
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath)
      });

      await s3Client.send(command);
      console.log('uploading',filePath)
      publishLog(`uploaded ${file}`);
    }

    const uploadTime = ((Date.now() - uploadStart) / 1000).toFixed(2);
    publishLog(`s3_upload_time took ${uploadTime}s`);

    //  Total time
    const totalTime = ((Date.now() - totalStart) / 1000).toFixed(2);
    publishLog(`total_build_time took ${totalTime}s`);

    publishLog(`Done`);
    console.log('Done...');
  });
}

init()


