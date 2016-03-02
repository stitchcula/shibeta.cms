"use strict"

var router=require('koa-router')()

var menu=require('directory-tree').directoryTree(__dirname+'/../dynamic/admin/tree').children
for(var r of menu){
    r=r.path//.substring(0,r.name.lastIndexOf("."))
    router.get('/'+r,function*(next){
        if(this.session&&(this.session.ol>new Date().getTime())&&this.session.ip==this.ip){
            if(this.path=="/admin/user") { //兼容jade
                return this.render(this.path, {
                    usr: new Buffer(this.session.usr, 'base64').toString(),
                    name: new Buffer(this.session.name, 'base64').toString(),
                    idf: this.session.idf,
                    pms: this.session.pms,
                    tel: this.session.tel,
                    em: this.session.em,
                    ding: this.session.job
                })
            }
            if(this.path=="/admin/cms_push"){
                return this.render(this.path,{
                    autosave:this.session.autosave
                })
            }
            this.render(this.path)
        }else return this.render('redirectLogin')
        yield next
    })
}

router.use('/',function*(next){//验证
    if(this.session&&(this.session.ol>new Date().getTime())&&this.session.ip==this.ip){
        this.session.ol+=7200000
    }else return this.render('redirectLogin')
    yield next
}).get('/',function*(next){
    this.render('admin/framework',{
        menu:[
            {
                inner:"通知",
                icon:"question_answer",
                href:"#notice"
            },
            {
                inner:"个人信息",
                icon:"perm_identity",
                href:"#user"
            },
            {
                inner:"合同管理",
                icon:"description",
                href:[
                    {
                        inner:"提交合同",
                        icon:"library_add",
                        href:"#cms_push"
                    },
                    {
                        inner:"真伪查询",
                        icon:"find_in_page",
                        href:"#cms_auth"
                    },
                    {
                        inner:"查看合同",
                        icon:"chrome_reader_mode",
                        href:"#cms_edit"
                    }
                ]
            },
            {
                inner:"控制面板",
                icon:"tune",
                href:[
                    {
                        inner:"用户群组",
                        href:"#users",
                        icon:"people_outline"
                    },
                    {
                        inner:"UI控制",
                        href:"#ui",
                        icon:"view_compact"
                    }
                ]
            },
            {
                inner:"注销",
                icon:"arrow_back",
                href:"#exit"
            },
        ],
        off_footer:1,
        title:"控制台"
    })
    yield next
}).put('/msg',function*(next){//修改信息
    var usr=yield this.db.findOne({uin:this.session.uin})
    if(usr){
        var usrObj={
            usr: new Buffer(this.request.body.fields.usr).toString('base64'),//
            em: this.request.body.fields.em,
            idf: this.request.body.fields.idf,
            name:new Buffer(this.request.body.fields.name).toString('base64'),
            tel:this.request.body.fields.tel,
            job:this.request.body.fields.job
        }
        yield this.db.update({uin:this.session.uin},{$set:usrObj})
        this.session.tel=usrObj.tel
        this.session.em=usrObj.em
        this.session.idf=usrObj.idf
        this.session.name=usrObj.name
        this.session.usr=usrObj.usr
        this.session.job=usrObj.job
        this.body={result:200}
    }else this.body={result:404}
    yield next
}).put('/pwd',function*(next){//修改密码
    var usr=yield this.db.findOne({uin:this.session.uin})
    if(usr){
        var usrObj={}
        if(this.request.body.fields.pwd&&this.request.body.fields.pwd==usr.pwd&&this.request.body.fields.newPwd!="da39a3ee5e6b4b0d3255bfef95601890afd80709"){
            usrObj.pwd=this.request.body.fields.newPwd
            yield this.db.update({uin:this.session.uin},{$set:usrObj})
            this.session.pwd=usrObj.pwd
            this.body={result:200}
        }else this.body={result:304}
    }else this.body={result:404}
    yield next
}).post('/',function*(next){//上传
    this.body="敬请期待！"
    yield next
}).del('/',function*(next){//注销
    this.session=null
    this.body={result:200}
    yield next
})


module.exports=router