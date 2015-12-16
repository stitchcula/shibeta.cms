"use strict"

var router=require('koa-router')()

router.get('/vfc',function*(next){//验证页面
    this.render("vfc")
}).post('/vfc',function*(next) {//验证结果
    var idReg=/^[A-Z0-9]{14}$/
    if(idReg.test(this.request.body.id)) {
        var cts = yield this.cts.findOne({id: this.request.body.id,"status.0":1})
        if (cts) {
            //????????????????????权限4
            var newDate=new Date(cts.status[1])
            var ifGive=(cts.status[0])?(newDate.getFullYear()+"年"+(newDate.getMonth()+1)+"月"+newDate.getDate()+"日"):"未授权"
            var resHtml=jade.renderFile(__dirname+'/dynamic/_cts_search.jade',{id:this.request.body.id,name:cts.name,status:ifGive,p:[cts.ext.partys[0],cts.ext.partys[1],cts.ext.money,cts.ext.exp[0]+"到"+cts.ext.exp[1],cts.ext.time,cts.ext.location,cts.ext.rprs[0],cts.ext.rprs[1]]},undefined)
            this.body = {result:200,html:resHtml}
        } else this.body = {result: 200, html: '<p class="resp">查询不到该编号的合同，该合同为 浩盛消防 不认可的假合同。</p>'}
    }else this.status=403
    yield next
})

module.exports=router