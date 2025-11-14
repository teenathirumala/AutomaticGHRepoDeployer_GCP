console.time("startup_time_api");

const express= require('express')
const {generateSlug}=require('random-word-slugs')
const {ECSClient,RunTaskCommand}= require('@aws-sdk/client-ecs')
const { Server } = require('socket.io')
const Redis = require('ioredis')
const cors = require('cors');

const app=express()
const PORT=9000

app.use(cors({
  origin: 'http://localhost:3000',   // your Next.js frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));


const REDIS_URL = process.env.REDIS_URL || 'rediss://default:PASSWORD@HOST:PORT'
const subscriber = new Redis(REDIS_URL)

const io = new Server({ cors: '*' })

io.on('connection', socket => {
    socket.on('subscribe', channel => {
        const start = Date.now();
        socket.join(channel)
        socket.emit('message', `Joined ${channel}`);
        console.log(`[Socket] Subscribed to ${channel} in ${Date.now() - start}ms`);
    })
})

console.time("startup_time_socket");
io.listen(9002, () => {
    console.timeEnd("startup_time_socket");
    console.log('Socket Server 9002')
}
)

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1'
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY

const ecsClient = new ECSClient({
    region: AWS_REGION,
    ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && {
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY
        }
    })
})
const config = {
    CLUSTER: process.env.AWS_ECS_CLUSTER || 'arn:aws:ecs:ap-south-1:ACCOUNT:cluster/CLUSTER_NAME',
    TASK: process.env.AWS_ECS_TASK_DEFINITION || 'arn:aws:ecs:ap-south-1:ACCOUNT:task-definition/TASK_NAME'
}
app.use(express.json())

//time
// Add this before defining routes
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.url} - ${duration}ms`);
  });

  next();
});
//

app.post('/project',async(req,res)=>{
    const { gitURL,slug }=req.body
    const projectSlug= slug ? slug :generateSlug()

// spin the container
const command= new RunTaskCommand({
    cluster:config.CLUSTER,
    taskDefinition:config.TASK,
    launchType:'FARGATE',
    count: 1,
    networkConfiguration:{
        awsvpcConfiguration:{
            assignPublicIp: 'ENABLED',
            subnets: ['subnet-05ed7c05eda7958c4','subnet-0da853b66b337af08','subnet-01436c679be2da3ea'],
            securityGroups: ['sg-0e85763e9f2df880e']
        }
    },
    overrides: {
            containerOverrides: [
                {
                    name: 'builder-image',
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: gitURL },
                        { name: 'PROJECT_ID', value: projectSlug }
                    ]
                }
            ]
    }
})
await ecsClient.send(command);

    return res.json({ status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000` } })

})

async function initRedisSubscribe() {
    console.log('Subscribed to logs....')
    subscriber.psubscribe('logs:*')
    subscriber.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message', message)
    })
}

initRedisSubscribe()

app.listen(PORT,()=>
    {
        console.timeEnd("startup_time_api");
        console.log(`API Server Running... ${PORT}`)
    }
)