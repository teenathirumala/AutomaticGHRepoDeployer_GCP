console.time("startup_time_reverse_proxy");

const express= require('express')
const httpProxy = require('http-proxy')

const app=express()
const PORT=8000

const BASE_PATH='https://vercel-clone-miniproject2.s3.ap-south-1.amazonaws.com/__outputs'

const proxy=httpProxy.createProxy()
//time
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`[Proxy] ${req.method} ${req.url} - ${Date.now() - start}ms`);
  });
  next();
});
//
app.use((req,res)=>{
    const hostname=req.hostname;
    const subdomain=hostname.split('.')[0];

    const resolvesTo=`${BASE_PATH}/${subdomain}`

    return proxy.web(req,res,{target: resolvesTo, changeOrigin: true})
})

proxy.on('proxyReq',(proxyReq,req,res)=>{
    const url=req.url;
    if(url==='/')
        proxyReq.path+='index.html'

})

app.listen(PORT,()=>{
    console.timeEnd("startup_time_reverse_proxy");
    console.log(`Reverse Proxy Running... ${PORT}`)
}
)