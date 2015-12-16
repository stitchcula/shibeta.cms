$(function(){
    $.getJSON("/api/sms",function(data,status){
        console.log(data.url)
        console.log(data.body)
        $.post()
    })
    //$.post()
})