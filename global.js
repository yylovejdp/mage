let token = window.localStorage['token'],session_login=window.sessionStorage['login']
let user_data={}
if(window.localStorage['user_data']){
	user_data=JSON.parse(window.localStorage['user_data'])
}
//console.log(user_data)
	 //用户token以及用户信息
let tk_date = parseInt(window.localStorage['token_time']),tk_over = parseInt(window.localStorage['over_time']) //token 获取时间//过期时间
let domain = 'http://business.mobilcom.cn'

//公司信息
let company={}
if(window.sessionStorage['company']){
	company=JSON.parse( window.sessionStorage['company'])
}
if(session_login=='true'){
	session_login=true
}
else{
	session_login=false
}
let user_login = {
	login_status:session_login,
	token: token,
	tk_date: tk_date,
	tk_over: tk_over,
	user_data:user_data,
	ex_index:0,
}
function GetQueryString(name) {
	var reg = new RegExp("(^|&)"+name + "=([^&]*)(&|$)");
	var r = window.location.search.substr(1).match(reg)
	//console.log(window.location.search)
	if (r != null) return unescape(r[2]);
	return null;
}
function GetQueryString_hash(name) {
	var reg = new RegExp("(^|&)"+name + "=([^&]*)(&|$)");
	if(window.location.href.match(/\?.*(&|$)/)){
		let search=window.location.href.match(/\?.*(&|$)/)[0].substr(1)
		var r = search.match(reg)
		if (r != null) return unescape(r[2]);
		return null;
	}
	else{
		return false
	}
}
// (function long_login(){	
// 	setTimeout(function(){
// 		check_token()
// 		long_login()
// 	},50000)
// 	
// })()
(function try_login() {	
	check_token().then((value) => {	
		let path=router.history.current.fullPath//首页不强制登录
		if(session_login==true){//如果现在是登录状态不要重复登录			
			return
		}
		if (value =='token_ing'||value =='token_refresh') {//如果没过期直接登录		
			userdata()
			return
		}		
		else{
			if(!GetQueryString('type')||path!='/index'){
				if(document.domain=="127.0.0.1"){
					window.location.href="/pc/view/tncode/login.html?type=login"
				}else{
					window.location.href="/view/tncode/login.html?type=login"
				}
			}
		}
	})
})()
function now_time() { //获取格式化当前时间
	let date = new Date
	// let y,m=date.getMonth()+1,d=date.getDate(),h=date.getHours(),mit=date.getMinutes(),s=date.getSeconds()
	// let arr=[m,d,h,mit,s]
	// for(let i=0;i<4;i++){
	// 	if(arr[i]<10){
	// 		arr[i]='0'+arr[i]
	// 	}
	// }
	// 
	date = (date.getTime() / 1000).toFixed(0)
	return parseInt(date)
}

function check_token() { //检查token有没有过期
	return new Promise(function(resolve, reject) {
		let time = now_time()
		if (tk_over - time >= 300) {//很新鲜不用刷新
			resolve('token_ing')
			return
		} 
		//console.log(tk_over-time)
		if(tk_over-time<500&&tk_over-time>0){//不新鲜刷新token
			$.ajax({
				type: "post",
				url: `${domain}/api/user/refresh`,
				beforeSend: function(request) {
					request.setRequestHeader("Authorization", token);
				},
				success: function(data) {
					token_local(data.data)
					resolve('token_refresh')
				}
			});
		}
		else{//过期
			window.sessionStorage['login']=false
			resolve('token_over')
			return 
		}
		
	})

}

function token_local(data) {
	token = data.access_token
	tk_date = now_time()
	tk_over = parseInt(tk_date) + data.expires_in
	window.localStorage['token'] = token
	window.localStorage['token_time'] = tk_date
	window.localStorage['over_time'] = tk_over
}

function user_int(mobile, password,code) { //用户登录
	$.ajax({
		type: "post",
		url: `${domain}/api/login`,
		data: {
			mobile: mobile,
			password: password,
			code:code
		},
		success: function(data) {
			console.log(data)
			if (data.code == 0) {
				token_local(data.data)
				userdata() //获取用户信息
			} else {
				layer.ready(() => {
					layer.msg(data.message, {
						time: 1500
					})
				})
			}

		}
	});
}
// $(document).ajaxStart(function(){
// 	alert(1111)
// });
// $(document).ajaxComplete(function(){
// 	alert(2222)
// });
function userdata() { //获取用户信息  
	$.ajax({
		type: "post",
		dataType: 'JSON',
		url: domain+"/api/user/me",
		crossDomain:true,
		beforeSend: function(request) {
			request.setRequestHeader("Authorization", token);
		},
		success: function(data) {
			//layer.close(loading);				
			if(data.code==0){
				window.localStorage['user_data'] =JSON.stringify(data)
				user_data=JSON.parse(window.localStorage['user_data']) 				
				window.sessionStorage['login']=true	
				if(GetQueryString('type')){
					layer.ready(() => {
						layer.msg('登录成功', {
							time: 1500
						})
					})
					setTimeout(() => {
						window.location.href="../../index.html"
					}, 1500)
				}
			}
			if(data.code==2){
				logout()
			}
		},
		
	});
}
function logout(){ //退出登录
	$.ajax({
		type: "post",
		global:false,
		url: `${domain}/api/user/logout`,
		beforeSend: function(request) {
			request.setRequestHeader("Authorization", token);
		},
		success: function(data) {
			window.sessionStorage['login']=false
			window.localStorage['token'] = ""
			window.localStorage['over_time'] =""
			window.localStorage['token_time'] =""		
			window.localStorage['user_data'] =""	
			layer.ready(() => {
				layer.msg('退出登录', {
					time: 1500
				})
			})		
			setTimeout(() => {
				let location=GetQueryString('type')
				console.log(location)
				if(location=="login"){
					return
				}
				else{
					if(document.domain=="127.0.0.1"){
						window.location.href="/pc/view/tncode/login.html?type=login"
					}else{
						window.location.href="/view/tncode/login.html?type=login"
					}
				}
			}, 1500)
		}
	});
}
// send_msg(13111111111)
// setTimeout(function(){
// 	register(13111111111,11111111,123456)
// },1000)
// 
function register(username, password, msg_code,tn_r) { //注册
	$.ajax({
		type: "post",
		url: `${domain}/api/login/register`,
		data: {
			mobile: username,
			password: password,
			code: msg_code,
			tn_r:tncode._mark_offset,
			promotion1:window.sessionStorage['promotion']
		},
		success: function(data) {			
			if(data.code==0){
				token_local(data.data)
				userdata()
				layer.ready(() => {
					layer.msg('注册成功', {
						time: 1500
					})
				})
				setTimeout(() => {
					window.location.href="../../index.html"
				}, 1500)
			}
			else{
				layer.ready(() => {
					layer.msg(data.message, {
						time: 1500
					})
				})
			}
		}
	});
}

function send_msg(mobile,type) { //请求验证码
	let nowtime = now_time()
	$.ajax({
		type: "post",
		url: `${domain}/api/login/send_msg`,
		data: {
			mobile: mobile,
			type:type,
			tn_r:tncode._mark_offset,
		},
		success: function(data) {
			console.log(data)
			if (data.code == 0) {
				let cd_tim = parseInt(now_time()) + 60
				window.localStorage['send_time'] = cd_tim
				window.localStorage['send_mobile']=login.username
				login.msg_clock()
				if (login.type == 'find_pwd0') {
					window.location.href = `login.html?mobile=${login.username}&type=find_pwd1`
				}
			}
			else{
				if(data.code==1){
					setTimeout(function(){
						window.location.reload()
					},1500)
				}
				layer.ready(() => {
					layer.msg(data.message, {
						time: 1500
					})
				})
			}
		}
	});
}
function forget(username, password,code) { //忘记密码
	let nowtime = now_time()
	$.ajax({
		type: "post",
		url: `${domain}/api/login/forget`,
		data: {
			mobile: username,
			password: password,
			code: code,
			tn_r:tncode._mark_offset,
		},
		success: function(data) {
			if(data.code==0){
				token = data.access_token
				layer.ready(() => {
					layer.msg('修改成功', {
						time: 1500
					})
				})
				setTimeout(() => {
					window.location.href="login.html?type=login"
				}, 1500)
			}
			else{
				layer.ready(() => {
					layer.message(data.msg, {
						time: 1500
					})
				})
			}
		}
	});
}

function scroll_top(id) {
	let target = document.getElementById(id) || document.getElementById('nav_narrow')
	target.scrollIntoView({
		behavior: "smooth"
	});
}
// layer.close(loading)
function m_ajax(){
	this.ajax_data={
		url:"",
		type:"post",
		global:true,
		header:{
			status:true,
			key:"Authorization",
			value:token
		},
		data:{
			
		},
		msg:true,
	},		
	this.send=function(){
		let _this=this	
		let loading=layer.load(1, {shade: [0.1,'#fff']})
		return new Promise(resolve => {
		$.ajax({
			global:_this.ajax_data.global,
			type:_this.ajax_data.type,
			url:_this.ajax_data.url,
			data:_this.ajax_data.data,
			beforeSend: function(request) {
				if(_this.ajax_data.header.status){				
					request.setRequestHeader(_this.ajax_data.header.key,_this.ajax_data.header.value);
				}
			},
			complete:function(event,xhr,opt){
				//console.log(xhr,opt)
				layer.close(loading)
			},
			success: function(data) {
				//console.log(loading)
				if(_this.ajax_data.msg){
					//console.log(_this.ajax_data.msg)
					layer.msg(data.message, {
						time: 1500
					})	
				}
				if(data.code==2){
					layer.ready(()=>{
						layer.msg(data.message, {
							time: 1500
						})	
						setTimeout(()=>{
							logout()
						},1500)
					})
				}
				console.log(data)
				resolve(data) 
			}
			});
		})	
	}
}
function decide(){
	var ua = navigator.userAgent.toLowerCase();
	var isWeixin = ua.indexOf('micromessenger') != -1;
	if (isWeixin) {
		return true;
	}else{
		return false;
	}
}