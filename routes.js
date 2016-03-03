"use strict"

var router=require('koa-router')()
    ,jade=require('jade')
    ,crypto=require('crypto')
    ,os=require('os')

var DEFPMS=[0,0,0,1,1,1]//法人，管理，普通

//task
router.use(function*(next){
    console.log(this.ip+" "+this.method+" "+this.path+" at "+new Date().toLocaleString())
    yield next
    if(this.task){
        this.task.time=new Date()
        if(yield this.redis.lpush(this.task.flag+'Task',JSON.stringify(this.task))) console.log("TASK pushed:"+this.task.type)
        else console.error("TASK push err:"+this.task)
    }
    //push redis to mongo
})

//load routes
var routes=require('dir-requirer')(__dirname)('./routes')
for(var r in routes){
    router.use('/'+r,routes[r].routes())
}

/*----------------------------------------------------------------*/

router.get('/test',function*(next){
    this.render('preload')
    yield next
})

router.get('/',function*(next){//跳转登陆
    this.redirect('/login')
    yield next
})

router.get('/login',function*(next){//登陆页面
    this.render('login',{
        title:"登陆",
        default_face:"/static/img/default_face.jpg",
        title_img:"/static/img/login_title_img.jpg",
        off_footer:1,
        slides:[
            {img:"/static/img/bg1.jpg"},
            {img:"/static/img/bg2.jpg"},
            {img:"/static/img/bg3.jpg"}
        ]
    })
    yield next
}).post('/login',function*(next){//登陆
    /*
     var usr={//强制注册
     uin: "000000",
     usr: new Buffer("stcula").toString('base64'),//->base64
     pwd: this.request.body.pwd,
     em:"1132463097@qq.com",
     pms: [0,0,0,0,0,1],
     time: new Date(),
     idf: "111111199706201111",
     name: new Buffer("李卓恒").toString('base64'),
     tel:"15917597227",
     job:new Buffer("无").toString('base64')
     }
     console.log(usr)
     this.body=yield this.db.insert(usr)
    */
    if(!this.request.body.usr||!this.request.body.pwd) return this.body={result:403}
    var msg=null
    if(/[@]/.test(this.request.body.usr)){
        msg=yield this.db.findOne({em:this.request.body.usr})
    }else if(/^[0-9]{11}$/.test(this.request.body.usr)){
        msg=yield this.db.findOne({tel:this.request.body.usr})
    }else if(/^(\w){6,12}$/.test(this.request.body.usr)){
        msg=yield this.db.findOne({usr:new Buffer(this.request.body.usr).toString('base64')})
    }
    console.log(JSON.stringify(msg))
    console.log(this.request.body)
    if(msg&&(this.request.body.pwd==msg.pwd)){
        this.session={job:msg.job,tel:msg.tel,em:msg.em,idf:msg.idf,name:msg.name,usr:msg.usr,uin:msg.uin,pms:msg.pms,ip:this.ip,ol:new Date().getTime()+7200000}
        this.body={result:200}
    }else{
        this.body={result:403}
        this.session=null
    }
    yield next
}).get('/t/:sid',function*(next){//改密
    var msg=yield this.redis.hgetall(this.params.sid)
    if(msg&&msg.ip==this.ip){
        yield this.db.update({uin:msg.uin},{$set:{pwd:msg.newPwd}})
        yield this.redis.del(this.params.sid)
        this.session={tel:msg.tel,em:msg.em,idf:msg.idf,name:msg.name,usr:msg.usr,uin:msg.uin,pms:msg.pms,ip:this.ip,ol:new Date().getTime()+7200000}
        this.body={result:200}
        this.redirect('/admin')
    }else this.status=404
    yield next
}).put('/t',function*(next){//忘记密码
    var msg=yield this.db.findOne({idf:this.request.body.fields.idf})
    if(msg){
        if((msg.name==new Buffer(this.request.body.fields.name).toString('base64'))&&this.request.body.fields.pwd&&(this.request.body.fields.pwd!="da39a3ee5e6b4b0d3255bfef95601890afd80709")) {
            var sid = crypto.createHmac('sha1', msg.em + Date.parse(new Date()).toString()).digest('hex')
            var MO={}
            MO.from = "浩盛消防"
            MO.to = msg.em
            MO.subject="浩盛消防在线平台密码重置"
            MO.html = '<h4>完成修改密码</h4><b>请点击以下链接完成您的修改：</b><br><a href="http://121.40.249.9:'+this.env.WEB_PORT+'/t/' + sid + '">http://121.40.249.9:800/t/' + sid + '</a>'
            this.mailer.post('api/mailer',MO,function(e,r,b){
                console.log(e)
                console.log(r.statusCode)
            })
            yield this.redis.hmset(sid, {
                ip:this.ip,
                tel:msg.tel,
                em:msg.em,
                idf:msg.idf,
                name:msg.name,
                usr:msg.usr,
                uin:msg.uin,
                pms:msg.pms,
                newPwd:this.request.body.fields.pwd})///???
            yield this.redis.expire(sid, 60 * 60)
            this.session.freq=new Date().getTime()
            this.body = {result: 200}
        }else this.body = {result: 403}
    }else this.body={result:404}
    yield next
})

router.get('/monitor',function*(next){
    if(this.session&&(this.session.ol>new Date().getTime())){
        this.session.ol+=7200000
        var data=yield rqGet("http://localhost:9615/")
            ,rep=JSON.parse(data[0].body)
        this.body={
            uptime:rep.system_info.uptime,
            mem:{
                free:rep.monit.free_mem,
                total:rep.monit.total_mem
            },
            cpu:{
                free:(rep.monit.cpu[0].times.idle+rep.monit.cpu[1].times.idle)/2,
                total:(rep.monit.cpu[0].times.idle+rep.monit.cpu[0].times.user+rep.monit.cpu[0].times.nice+rep.monit.cpu[0].times.sys+rep.monit.cpu[0].times.irq+rep.monit.cpu[1].times.idle+rep.monit.cpu[1].times.user+rep.monit.cpu[1].times.nice+rep.monit.cpu[1].times.sys+rep.monit.cpu[1].times.irq)/2
            },
            node:{
                mem:rep.processes[1].monit.memory+rep.processes[0].monit.memory,
                cpu:rep.processes[1].monit.cpu+rep.processes[0].monit.cpu,
                uptime:new Date().getTime()-rep.processes[1].pm2_env.created_at,
                restart:rep.processes[1].pm2_env.restart_time+rep.processes[0].pm2_env.restart_time
            }
        }
    }else return this.redirect('/login')
    yield next
})


module.exports=router


//function for monitor
function rqGet(url){
    return function(callback){
        require('request')(url,callback)
    }
}