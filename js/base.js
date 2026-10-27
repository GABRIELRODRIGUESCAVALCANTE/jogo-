'use strict';
/* Estrela do Sertão — base: constantes, armazenamento e primitivas de desenho.
   Os scripts são carregados em ordem pelo index.html (base, audio, personagens, terreno,
   entidades, fases, jogo, telas) e compartilham o escopo global da página. */

const T = 16, VW = 320, VH = 208;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} },
};
const K_PERFIS='estrela-do-sertao:perfis', K_PARTIDA='estrela-do-sertao:partida:', K_PREF='estrela-do-sertao:prefs';

const fmt=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const ao=(g,m,f)=>g==='a'?f:m;   // concordância de gênero: ao(heroi.g,'menino','menina')
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const overlap=(a,b)=>Math.abs(a.x-b.x)*2<a.w+b.w && Math.abs(a.y-b.y)*2<a.h+b.h;

function hh(x,y,s){
  let n=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,982451653))|0;
  n=Math.imul(n^(n>>>13),1274126177); n^=n>>>16;
  return (n>>>0)/4294967296;
}

/* ---------- DESENHO EM PIXEL ---------- */
const cv = document.getElementById('tela');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
let dc = ctx, tint = null;   // dc: onde os sprites são desenhados (a tela do jogo ou um avatar de menu)
function S(c,x,y,w,h){ dc.fillStyle=tint||c; dc.fillRect(Math.round(x),Math.round(y),w,h); }
function shadow(x,y,w){ dc.fillStyle='rgba(50,25,5,.3)'; dc.fillRect(Math.round(x-w/2),Math.round(y-1),w,3); }
const flip=(x,y,face)=>(c,ox,oy,w,h)=>S(c, face>0? x+ox : x-ox-w, y+oy, w,h);
function noContexto(g,fn){ const antes=dc; dc=g; try{ fn(); } finally{ dc=antes; } }
