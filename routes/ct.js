"use strict"

var router=require('koa-router')()

var jade=require('jade')
var crypto=require('crypto')

router.use('/',function*(next){//验证权限
    if(this.path=="/ct")
        if(this.session&&(this.session.ol>new Date().getTime())&&this.session.ip==this.ip){
            this.session.ol+=7200000
        }else return this.render('redirectLogin')
    yield next
}).get('/',function*(next){//查看合同by kw,pg
    var pg=(this.query.pg)?this.query.pg:1
    var sort=(this.query.sort)?this.query.sort:-1
    var status=(this.query.status=="true")?0:1
    var cts=[]
    //console.log(this.query.kw)
    if(this.session.pms[4]){//所有用户

        if(/^[0-9a-zA-Z]{1,14}$/.test(this.query.kw))
            cts=yield this.cts.find({"status.0":{"$lte":status},id:eval('/'+this.query.kw.toUpperCase()+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
        else{
            cts=yield this.cts.find({"status.0":{"$lte":status},name:eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
            if(cts.length==0)
                cts=yield this.cts.find({"status.0":{"$lte":status},"ext.partys":eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
            if(cts.length==0)
                cts=yield this.cts.find({"status.0":{"$lte":status},"ext.rprs":eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
        /*
        if(!this.query.kw){
            cts=yield this.cts.find({},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
        }else{
            if(this.query.kw=="HS") cts=yield this.cts.find({},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
            else{
                if(/^[0-9a-zA-Z]{1,14}$/.test(this.query.kw))
                    cts=yield this.cts.find({id:eval('/'+this.query.kw.toUpperCase()+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
                else{
                    cts=yield this.cts.find({name:eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
                    if(cts.length==0)
                        cts=yield this.cts.find({"ext.partys":eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
                    if(cts.length==0)
                        cts=yield this.cts.find({"ext.rprs":eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
                }
            }*/
        }
    }else{//仅查看本用户
        if(/^[0-9a-zA-Z]{1,14}$/.test(this.query.kw))
            cts=yield this.cts.find({"status.0":{"$lte":status},uin:this.session.uin,id:eval('/'+this.query.kw.toUpperCase()+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
        else{
            cts=yield this.cts.find({"status.0":{"$lte":status},uin:this.session.uin,name:eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
            if(cts.length==0)
                cts=yield this.cts.find({"status.0":{"$lte":status},uin:this.session.uin,"ext.partys":eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
            if(cts.length==0)
                cts=yield this.cts.find({"status.0":{"$lte":status},uin:this.session.uin,"ext.rprs":eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
        }
        /*
        if(!this.query.kw){
            cts=yield this.cts.find({uin:this.session.uin},{skip:pg*10-10,limit: 11})
        }else{
            if(/^[0-9a-zA-Z]{1,14}$/.test(this.query.kw))
                cts=yield this.cts.find({uin:this.session.uin,id:eval('/'+this.query.kw.toUpperCase()+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
            else{
                cts=yield this.cts.find({uin:this.session.uin,name:eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
                if(cts.length==0)
                    cts=yield this.cts.find({uin:this.session.uin,"ext.partys":eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
                if(cts.length==0)
                    cts=yield this.cts.find({uin:this.session.uin,"ext.rprs":eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11,sort:{"ext.time":sort}})
            }
        }*/
    }
    for(var i=0;i<cts.length;i++) {
        cts[i]._id=""
        cts[i].key=new Buffer(cts[i].id+cts[i].key).toString('base64')
    }
    this.body={result:200,cts:cts}
    yield next
}).post('/autosave',function*(next){
    if(this.request.body!={})
        this.session.autosave=this.request.body
    else
        this.session.autosave=null
    this.body={result:200}
    yield next
}).post('/',function*(next){//新增合同
    //////////////验证格式
    var msg=yield this.db.findOne({uin:this.session.uin})
    if(msg){
        if(!(yield this.cts.findOne({name:this.request.body.name}))){
            var id=getCtId("HS"),now=new Date().getTime()//with changing /ct/:sid
            if(this.request.body.ifGive&&this.session.pms[3])   yield this.cts.insert({id:id[0],key:id[1],name:this.request.body.name,status:[1,now],ext:{partys:[this.request.body.a,this.request.body.b],time:this.request.body.time,location:this.request.body.location,exp:[this.request.body.begin,this.request.body.end],rprs:[this.request.body.aa,this.request.body.bb],money:this.request.body.money}})//0未授权，1授权，3过期，4删除
            else{
                var test=yield this.cts.insert({id:id[0],key:id[1],name:this.request.body.name,status:[0,now],uin:msg.uin,ext:{partys:[this.request.body.a,this.request.body.b],time:this.request.body.time,location:this.request.body.location,exp:[this.request.body.begin,this.request.body.end],rprs:[this.request.body.aa,this.request.body.bb],money:this.request.body.money}})//0未授权，1授权，3过期，4删除
                var ct=yield this.cts.findOne({id:id[0]})
                var MO={},SMS={}
                MO.from = "浩盛消防"
                MO.to = this.env.MASTER_MAIL
                MO.subject='浩盛消防 新的未授权合同'
                MO.html = jade.renderFile(__dirname + '/../dynamic/_ct.jade', {
                    submit:new Buffer(this.session.name, 'base64').toString(),
                    ct:[ct.id,ct.name,
                        ct.ext.partys[0],ct.ext.rprs[0],
                        ct.ext.partys[1],ct.ext.rprs[1],
                        ct.ext.time,ct.ext.location,
                        ct.ext.exp[0]+" 到 "+ct.ext.exp[1],
                        ct.ext.money
                    ],
                    address:new Buffer(id[0] + id[1]).toString('base64')
                }, undefined)
                this.mailer.post('api/mailer',MO,function(e,r,b){
                    console.log(e)
                    console.log(r.statusCode)
                })
                SMS.to=this.env.MASTER_TEL
                SMS.type="hs_submit_cts"
                SMS.param=" "+new Buffer(this.session.name,'base64').toString()+" , "+this.request.body.name+" "
                this.mailer.post('api/sms',SMS,function(e,r,b){
                    console.log(e)
                    console.log(r.statusCode)
                })
            }
            this.body = {result:200,id:id[0]}
        }else this.body={result:595}
    }else this.body={result:404}
    yield next
}).put('/',function*(next){//修改合同
    if(this.session.pms[3]){
        var cts=yield this.cts.findOne({id:this.request.body.fields.id})
        if(cts){
            var test=yield this.cts.update({id:this.request.body.fields.id},{$set:{name:this.request.body.fields.name,ext:{partys:[this.request.body.fields.a,this.request.body.fields.b],time:this.request.body.fields.time,location:this.request.body.fields.location,exp:[this.request.body.fields.begin,this.request.body.fields.end],rprs:[this.request.body.fields.aa,this.request.body.fields.bb],money:this.request.body.fields.money}}})
            var resCt=yield this.cts.findOne({id:this.request.body.fields.id})
            delete resCt._id
            resCt.key=new Buffer(resCt.id+resCt.key).toString('base64')
            this.body={result:200,cts:[resCt]}
        }
    }else this.status=403
    yield next
}).del('/',function*(next){//删除合同
    if(this.session.pms[3]){
        var cts=yield this.cts.findOne({id:this.query.id})
        if(cts) {
            if((this.query.safe!="0")?(yield this.cts.update({id: this.query.id}, {$set: {status: [4, new Date().getTime()]}})):(yield this.cts.remove({id: this.query.id}))){
                this.body={result:200}
            } else this.body={result:403}
        }else this.body={result:404}
    }else this.status=403
    yield next
})

router.get('/:sid',function*(next){//授权合同
    var sid=new Buffer(this.params.sid,'base64').toString(),
        id=sid.substr(0,14),//MTUwODE5Q0M2QTc5MzVDQzU0
        key=sid.substr(14,6),
        cts=yield this.cts.findOne({id:id},{key:1,status:1})
    if(cts&&cts.key==key){
        switch (cts.status[0]){
            case 0:
                if(cts.status[1]+24*60*6000>new Date().getTime()) {
                    if (yield this.cts.update({id: id}, {$set: {status: [1, new Date().getTime()]}})) {
                        var itmsg=yield this.db.findOne({uin:cts.uin})
                        var newDate=new Date(cts.status[1])
                        var GiveTime=newDate.getFullYear()+"年"+(newDate.getMonth()+1)+"月"+newDate.getDate()+"日"
                        var MO={},SMS={}
                        MO.from = "浩盛消防"
                        MO.to = itmsg.em
                        MO.subject="浩盛消防 合同授权通知"
                        MO.html = '<h4>合同授权通知</h4><b>你提交合同编号为'+id+'的合同已于'+GiveTime+'被成功授权。</b>'
                        this.mailer.post('api/mailer',MO,function(e,r,b){
                            console.log(e)
                            console.log(r.statusCode)
                        })
                        SMS.to=itmsg.tel
                        SMS.type="hs_reply_cts"
                        SMS.param=" "+cts.name+","+id+" "
                        this.mailer.post('api/sms',SMS,function(e,r,b){
                            console.log(e)
                            console.log(r.statusCode)
                        })
                        this.body = jade.renderFile(__dirname + '/../dynamic/gived.jade',{off_footer:1},undefined)
                    } else this.body = {result: 403}
                }else{
                    yield this.cts.update({id: id}, {$set: {status: [3, new Date().getTime()]}})//过期
                    this.body = {result:403,msg: "该合同由于提交时间过久已过期。请重新提交。"}
                }
                break
            /*
            case 1:
                this.redirect("/admin")
                //this.body={result: 595}
                break
            */
            default ://刷新成0???
                this.body = {result:402,msg: "该合同不存在或已经授权。"}
        }
    }else this.body = {result:401,msg: "该合同不存在或已经授权"}
    yield next
})

var getCtId=function(gtle){
    var now=new Date(),
        random=crypto.createHmac('sha1',new Date().getTime().toString()).digest('hex'),
        sid=[random.substr(0,6).toUpperCase(),random.substr(8,6).toUpperCase()],
        month=(now.getMonth()<9)?("0"+(now.getMonth()+1)):(now.getMonth()+1)
    return [gtle+(now.getFullYear()+"0").substr(2,2)+month+((now.getDate()<10)?("0"+now.getDate()):(now.getDate()))+sid[0],sid[1]]
}

module.exports=router