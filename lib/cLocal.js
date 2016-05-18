"use strict"

var co=require('co')
    ,request = require("co-request")

class Local{
    constructor(str,it){
        //var map = it.db.collection('localMap')
        return function(callback){
            co(function*(){
                if(/^[0-9.]{7,15}$/.test(str)){
                    var res =yield request({uri:"http://ip.taobao.com/service/getIpInfo.php?ip="+str,method: "GET"})
                    if(res.statusCode==200) res.body=JSON.parse(res.body)
                    if(!res.body.code)
                        callback(null,new Buffer(res.body.data.region+res.body.data.city,'utf8').toString())
                    else
                        callback("ERR:get ip information from ip.taobao.com","")
                }/*else if(/^[0-9]{6}$/.test(str)){
                    var res=yield map.findOne({code: parseInt(str)})
                    callback(null,res?res.local:"δ֪����")
                }else{
                    var res=yield map.findOne({local: str})
                    callback(null,res?res.code:-1)
                }*/
            })
        }
    }
}

/*
class Local{
    constructor(str,it){
        this.str=str
        this.map = it.db.collection('localMap')
        return this
    }
    getCode(){
        var str=this.str
        var map=this.map
        if(/^[0-9.]{7,15}$/.test(str)){

        }else{
            return function(callback){
                co(function*() {
                    callback(null,JSON.stringify(yield map.findOne({local: str})))
                })
            }
        }
    }
    getLocal(){
        var str=this.str
        var map=this.map
        if (/^[0-9]{6}$/.test(str)) {
            return function(callback){
                co(function*() {
                    callback(null,JSON.stringify(yield map.findOne({code: parseInt(str)})))
                })
            }
        }else if(/^[0-9.]{7,15}$/.test(str)){

        }else{

        }
    }
}
*/
module.exports=Local