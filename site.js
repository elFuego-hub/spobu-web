/* SPOBU WEB — bendras JS (reveal animacijos, count-up, formos) */
(function(){
'use strict';

var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Scroll reveal: elementai su .reveal gauna .on kai įscrollinami.
   html.js klasė įjungia slėpimą (be JS viskas matoma — progressive enhancement). */
function initReveal(){
  var els=document.querySelectorAll('.reveal');
  if(reduced||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('on');});return;}
  document.documentElement.classList.add('js');
  /* animacijų startinės būsenos: skaičiai į 0, progreso juostos į 0% (markup'e — galutinės) */
  document.querySelectorAll('[data-count]').forEach(function(el){el.textContent='0';});
  document.querySelectorAll('.prog-fill[data-w]').forEach(function(el){el.style.width='0%';});
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('on');io.unobserve(en.target);runCounts(en.target);runProg(en.target);}
    });
  },{threshold:.25});
  els.forEach(function(e){io.observe(e);});
}

/* Count-up: <span data-count="196">0</span> */
function runCounts(root){
  root.querySelectorAll('[data-count]').forEach(function(el){
    if(el._done)return;el._done=true;
    var target=parseInt(el.getAttribute('data-count'),10)||0;
    if(reduced){el.textContent=target;return;}
    var t0=null,dur=1100;
    function tick(ts){
      if(!t0)t0=ts;
      var p=Math.min((ts-t0)/dur,1);p=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*p);
      if(p<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* Progreso juostos: .prog-fill su data-w="72" (%) */
function runProg(root){
  root.querySelectorAll('.prog-fill[data-w]').forEach(function(el){
    if(el._done)return;el._done=true;
    var w=el.getAttribute('data-w')+'%';
    if(reduced){el.style.width=w;return;}
    requestAnimationFrame(function(){el.style.width=w;});
  });
}

/* Formos siuntimas į Supabase PostgREST.
   <form data-table="partner_applications"> su name atitinkančiais stulpelius.
   Honeypot: laukas name="website" — jei užpildytas, tyliai "pavyksta". */
var SUPA_URL='';   /* užpildoma puslapiuose prieš paleidimą (iš app.js) */
var SUPA_KEY='';
window.SPOBU_WEB={setSupa:function(u,k){SUPA_URL=u;SUPA_KEY=k;}};

function initForms(){
  document.querySelectorAll('form[data-table]').forEach(function(f){
    var t0=Date.now();
    f.addEventListener('submit',function(ev){
      ev.preventDefault();
      var ok=f.querySelector('.msg-ok'),err=f.querySelector('.msg-err'),btn=f.querySelector('button[type=submit]');
      if(ok)ok.style.display='none';if(err)err.style.display='none';
      /* anti-spam: honeypot + per greitas submit (<3 s) */
      var hp=f.querySelector('[name=website]');
      if((hp&&hp.value)||Date.now()-t0<3000){if(ok)ok.style.display='block';f.reset();return;}
      var data={};
      Array.prototype.forEach.call(f.elements,function(el){
        if(el.name&&el.name!=='website'&&el.value)data[el.name]=el.value.slice(0,499);
      });
      if(btn){btn.disabled=true;btn.dataset.txt=btn.textContent;btn.textContent='Siunčiama…';}
      fetch(SUPA_URL+'/rest/v1/'+f.getAttribute('data-table'),{
        method:'POST',
        headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify(data)
      }).then(function(r){
        if(!r.ok)throw new Error('HTTP '+r.status);
        if(ok)ok.style.display='block';f.reset();
      }).catch(function(){
        if(err)err.style.display='block';
      }).finally(function(){
        if(btn){btn.disabled=false;btn.textContent=btn.dataset.txt;}
      });
    });
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){initReveal();initForms();});
else{initReveal();initForms();}
})();
