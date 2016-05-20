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
    ,mailer=require("request-json").createClient('https://shibeta.org/')

co(function*(){
    mongo=(yield require('robe')
        .connect(process.env.MONGO_HOST+":"+process.env.MONGO_PORT+"/contracts_"))
        .collection('usr')
})
co(function*(){
    cts=(yield require('robe')
        .connect(process.env.MONGO_HOST+":"+process.env.MONGO_PORT+"/contracts_"))
        .collection('cts')
})

var app=koa()

app.proxy='nginx'
app.keys=['stcula','toy']
app.use(function*(next){
    yield next
    if(this.status==404){
        this.render('404')
        return this.status=404
    }
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
    var su=yield mongo.db.findOne({uin:"000000"})
    this.env={
        WEB_PORT:805,
        MASTER_MAIL:su.em,
        MASTER_TEL:su.tel
    }
    this.db=mongo
    this.mailer=mailer
    this.cts=cts//合同s
    this.redis=redis
    if(this.method==='POST') this.request.body=this.request.body.files?this.request.body:this.request.body.fields
    yield next
    if(this.task) console.log(1)
})
app.use(routes.routes())
app.use(routes.allowedMethods())

app.listen(8005)