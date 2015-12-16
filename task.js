
var Task=require('./lib/cTask.js')
    ,Gulp=require('./lib/cGulp.js')
    ,fs=require('co-fs')
    ,co=require('co')
    ,exec=require('child_process').exec

var task=new Task()

task.init(function(){
    //var gulp=new Gulp()
    //gulp.start()
})

task.fast('sync',function(err,task){
    exec('/ext/cms_/sync.sh',{cwd:'/ext/cms_/'},function(err,stdout,stderr){
        console.log(stdout)
    })
})


task.slow('loop',function(){
    co(function*(){
        while(1){
            var log=yield redis.rpop('TaskLog')
            if(log) yield fs.writeFile("../static/task.log",log+"\r\n",{flag:"a"})
            else break
        }
    })
})

task.start()
