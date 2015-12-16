"use strict"

var koa=require('koa')
    ,routes=require('./routes')
    ,serve=require('koa-static')
    ,body=require('koa-better-body')
    ,co=require('co')
    ,stylus=require('koa-stylus')
    ,jade=require('jade')
    ,session=require('koa-session-redis')
    ,redis=require('co-redis')((function(){
        var _=require('redis').createClient(process.env.REDIS_PORT,process.env.REDIS_HOST);
        _.auth(process.env.REDIS_AUTH);
        return _
    })())
    ,mongo,cts
    ,mailer=require('nodemailer').createTransport({
    host:"smtp.mxhichina.com",
    port:25,
    auth:{
        user:process.env.MAILER_USER,
        pass:process.env.MAILER_PASS
    }
})

co(function*(){
    co(function*(){mongo=(yield require('robe')
        .connect(process.env.MONGO_HOST+":"+process.env.MONGO_PORT+"/contracts_"))
        .collection('usr')})
})
co(function*(){
    co(function*(){cts=(yield require('robe')
        .connect(process.env.MONGO_HOST+":"+process.env.MONGO_PORT+"/contracts_"))
        .collection('cts')})
})

var app=koa()

app.proxy='nginx'
app.keys=['stcula','toy']
app.use(function*(next){
    yield next
    if(this.status==404) this.render('404')
})
app.use(stylus('./dynamic'))
app.use(session({store:{host:process.env.REDIS_HOST,port:process.env.REDIS_PORT,ttl:600,auth:process.env.REDIS_AUTH}}))
app.use(body())
app.use(serve(__dirname + '/dynamic'))
app.use(serve(__dirname))
app.use(function *(next){
    this.render=function(file,opt){
        return this.body=jade.renderFile(__dirname+'/dynamic/'+file+'.jade',opt,undefined)
    }
    this.env={
        WEB_PORT:8005,
        MASTER_MAIL:"liudingli16@qq.com"
    }
    this.db=mongo
    this.cts=cts//合同s
    this.redis=redis
    this.mailer=mailer
    if(this.method==='POST') this.request.body=this.request.body.files?this.request.body:this.request.body.fields
    yield next
    if(this.task) console.log(1)
})
app.use(routes.routes())
app.use(routes.allowedMethods())

app.listen(8005)
