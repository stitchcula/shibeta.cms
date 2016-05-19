"use strict"

var router=require('koa-router')()
var crypto=require('crypto')

router.use('/',function*(next){//验证权限
    if(this.session&&(this.session.ol>new Date().getTime())&&this.session.ip==this.ip){//仅法人
        this.session.ol+=7200000
    }else return this.render('redirectLogin',{querystring:this.querystring})
    yield next
}).get('/',function*(next){//获取用户信息
    var pms=(this.query.status=="true")?1:0
    var pg=(this.query.pg)?this.query.pg:1
    var usrs=[]
    if(this.query.self||!this.session.pms[3]) {
        usrs=yield this.db.find({uin:this.session.uin})
    }else{
        if(this.query.kw){
            //盲搜分析
            if(/[@]/.test(this.query.kw)){
                usrs=yield this.db.find({"pms.4":{"$gte":pms},"pms.3":0,em:eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11})
            }else if(/^[0-9xX]{12,18}$/.test(this.query.kw)){
                usrs=yield this.db.find({"pms.4":{"$gte":pms},"pms.3":0,idf:eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11})
            }else if(/^[0-9xX]{6}$/.test(this.query.kw)){
                usrs=yield this.db.find({"pms.4":{"$gte":pms},"pms.3":0,idf:eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11})
            }else if(/^[0-9]{1,11}$/.test(this.query.kw)){
                usrs=yield this.db.find({"pms.4":{"$gte":pms},"pms.3":0,tel:eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11})
            }else if(/^[0-9A-Z]{1,6}$/.test(this.query.kw)){
                usrs=yield this.db.find({"pms.4":{"$gte":pms},"pms.3":0,uin:eval('/'+this.query.kw+'/')},{skip:pg*10-10,limit: 11})
            }else if(/^(\w){6,12}$/.test(this.query.kw)){
                usrs=yield this.db.find({"pms.4":{"$gte":pms},"pms.3":0,usr:eval('/'+new Buffer(this.query.kw).toString('base64')+'/')},{skip:pg*10-10,limit: 11})
            }else if(/^[\u4E00-\u9FA5]{1,4}$/.test(this.query.kw)){
                usrs=yield this.db.find({"pms.4":{"$gte":pms},"pms.3":0,name:eval('/'+new Buffer(this.query.kw).toString('base64')+'/')},{skip:pg*10-10,limit: 11})
            }
        }else {
            usrs=yield this.db.find({"pms.4":{"$gte":pms},"pms.3":0},{skip:pg*10-10,limit: 11})
        }
    }
    var resUsrs=[]
    for(var i=0;i<usrs.length;i++) resUsrs[i]={
        name:new Buffer(usrs[i].name,'base64').toString(),//base64->
        usr:new Buffer(usrs[i].usr,'base64').toString(),
        idf:usrs[i].idf,
        tel:usrs[i].tel,
        em:usrs[i].em,
        job:usrs[i].job,
        time:usrs[i].time,
        uin:usrs[i].uin,
        pm:usrs[i].pms[4]
    }
    this.body={result:200,users:resUsrs}
    yield next
}).post('/',function*(next){//新增用户
    if(this.session.pms[3]){
        if(!(yield this.db.findOne({$or:[
                {em: this.request.body.em},
                {idf: this.request.body.idf},
                {tel:this.request.body.tel},
                {usr:new Buffer(this.request.body.usr).toString('base64')},
                {name: new Buffer(this.request.body.name).toString('base64')}]}))){
            var usr={
                uin: getUsrId(""),
                usr: new Buffer(this.request.body.usr).toString('base64'),//->base64
                em: this.request.body.em,
                pms: [0,0,0,0,0,1],
                time: new Date(),
                idf: this.request.body.idf,
                name: new Buffer(this.request.body.name).toString('base64'),
                tel:this.request.body.tel,
                job:""
            }
            if(this.request.body.name&&usr.idf&&usr.tel){
                var sha1 = crypto.createHash('sha1');
                sha1.update(usr.idf.substr(12,6), 'utf8');
                usr.pwd=sha1.digest('hex');
                if(this.request.body.pm=="1") usr.pms[4]=1
                yield this.db.insert(usr)
                this.body = {result:200,uin:usr.uin}
            }else this.body={result:403}
        }else this.body={result:595}
    }else this.status=304
    yield next
}).put('/',function*(next){//修改用户
    if(this.session.pms[3]) {
        var usr=yield this.db.findOne({uin:this.request.body.fields.uin})
        if(usr){
            var usrObj={
                usr: new Buffer(this.request.body.fields.usr).toString('base64'),//
                em: this.request.body.fields.em,
                pms: [0,0,0,0,0,1],
                idf: this.request.body.fields.idf,
                name:new Buffer(this.request.body.fields.name).toString('base64'),
                tel:this.request.body.fields.tel
            }
            if(this.request.body.fields.pm=="1") usrObj.pms[4]=1
            else usrObj.pms[4]=0
            yield this.db.update({uin:this.request.body.fields.uin},{$set:usrObj})
            this.body={result:200}
        }else this.body={result:404}
    }else this.status=304
    yield next
}).del('/',function*(next){//删除用户
    if(this.session.pms[3]){
        yield this.db.remove({uin: this.query.uin})
        this.body={result:200}
    }else this.status=304
    yield next
})

module.exports=router

//function
var getUsrId=function(gtle){
    var random=crypto.createHmac('sha1',new Date().getTime().toString()).digest('hex')
    return random.substr(0,6).toUpperCase()//+random.substr(8,6).toUpperCase()
}