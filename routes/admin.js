"use strict"

var router=require('koa-router')()

var menu=require('directory-tree').directoryTree(__dirname+'/../dynamic/admin/tree').children
for(var r of menu){
    r=r.path//.substring(0,r.name.lastIndexOf("."))
    router.get('/'+r,function*(next){
        if(this.session&&(this.session.ol>new Date().getTime())&&this.session.ip==this.ip){
            this.render(this.path)
        }else return this.redirect('/login')
        yield next
    })
}

router.use('/',function*(next){//验证
    if(this.session&&(this.session.ol>new Date().getTime())&&this.session.ip==this.ip){
        this.session.ol+=7200000
    }else return this.redirect('/login')
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
                inner:"性能监控",
                icon:"cloud_queue",
                href:[
                    {
                        inner:"总览",
                        icon:"equalizer",
                        href:"#3"
                    },
                    {
                        inner:"储存",
                        icon:"dns",
                        href:"#4"
                    },
                    {
                        inner:"交互",
                        icon:"swap_horiz",
                        href:"#4"
                    }
                ]
            },
            {
                inner:"控制面板",
                icon:"tune",
                href:[
                    {
                        inner:"用户群组",
                        href:"#usrs",
                        icon:"supervisor_account"
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
                href:"#1"
            },
        ],
        off_footer:1,
        title:"控制台"
    })
    yield next
}).put('/',function*(next){//修改信息
    var usr=yield this.db.findOne({uin:this.session.uin})
    if(usr){
        var usrObj={
            usr: new Buffer(this.request.body.fields.usr).toString('base64'),//
            em: this.request.body.fields.em,
            idf: this.request.body.fields.idf,
            name:new Buffer(this.request.body.fields.name).toString('base64'),
            tel:this.request.body.fields.tel,
        }
        if(this.request.body.fields.pwd&&this.request.body.fields.pwd==usr.pwd&&this.request.body.fields.newPwd!="da39a3ee5e6b4b0d3255bfef95601890afd80709")
            usrObj.pwd=this.request.body.fields.newPwd
        yield this.db.update({uin:this.session.uin},{$set:usrObj})
        this.body={result:200}
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