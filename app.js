function toggleMenu(){
  var s=document.getElementById("sidebar");
  var o=document.getElementById("overlay");
  if(s.classList.contains("open")){s.classList.remove("open");o.classList.remove("show")}
  else{s.classList.add("open");o.classList.add("show")}
}
function showPage(id,el){
  var pages=document.querySelectorAll(".page");
  for(var i=0;i<pages.length;i++){pages[i].classList.remove("active")}
  document.getElementById("page-"+id).classList.add("active");
  if(el){
    var btns=document.querySelectorAll(".menuBtn");
    for(var j=0;j<btns.length;j++){btns[j].classList.remove("active")}
    el.classList.add("active");
  }
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
  window.scrollTo(0,0);
}
function translateMsg(btn){
  var p=btn.parentElement.querySelector(".msgText");
  var orig=p.getAttribute("data-orig");
  var tr=p.getAttribute("data-tr");
  if(p.innerText==orig){p.innerText=tr;btn.innerText="Türkçeye Çevir"}
  else{p.innerText=orig;btn.innerText="Çevir • Translate"}
}
function sendMsg(){
  var inp=document.getElementById("chatInput");
  var txt=inp.value.trim();
  if(txt==""){return}
  var list=document.getElementById("chatList");
  var div=document.createElement("div");
  div.className="chatMsg";
  div.innerHTML="<b>Sen</b><p class=\"msgText\" data-orig=\""+txt+"\" data-tr=\""+txt+"\">"+txt+"</p><button class=\"btnGhost\" onclick=\"translateMsg(this)\">Çevir • Translate</button> <small>Şimdi</small>";
  list.appendChild(div);
  inp.value="";
}
function setTab(el,name){
  var tabs=document.querySelectorAll(".tabBtn");
  for(var i=0;i<tabs.length;i++){tabs[i].classList.remove("active")}
  el.classList.add("active");
  document.getElementById("tabContent").innerText=name+" sekmesi: içerikler burada görünecek.";
}
var score=0;
var best=localStorage.getItem("kageBest")||0;
var timer=null;
var timeLeft=30;
var playing=false;
document.getElementById("best").innerText=best;
function startGame(){
  score=0;timeLeft=30;playing=true;
  document.getElementById("score").innerText="0";
  clearInterval(timer);
  timer=setInterval(function(){
    timeLeft--;
    document.getElementById("time").innerText=timeLeft;
    if(timeLeft<=0){
      clearInterval(timer);playing=false;
      if(score>best){best=score;localStorage.setItem("kageBest",best);document.getElementById("best").innerText=best}
      alert("Süre bitti! Skorun: "+score);
    }
  },1000);
}
function clickCoin(){
  if(!playing){alert("Önce Oyunu Başlat");return}
  score+=5;
  document.getElementById("score").innerText=score;
}
document.addEventListener("click",function(e){
  if(e.target.classList.contains("rozet")){
    var all=document.querySelectorAll(".rozet");
    for(var i=0;i<all.length;i++){all[i].classList.remove("showTip")}
    e.target.classList.add("showTip");
  }
});
