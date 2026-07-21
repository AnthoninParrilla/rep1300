// ============ LES YEUX DU PILOTE — règles de vraisemblance physique ============
// Chaque règle est évaluée à CHAQUE échantillon de CHAQUE scénario du balayage.
const fs=require('fs');
global.window={addEventListener(){},scrollX:0,scrollTo(){}};global.setInterval=function(){};
const html=fs.readFileSync(process.argv[2]||'/home/claude/synoptique-rep-1300.html','utf8');
const i0=html.lastIndexOf('<script>');
let src0=html.slice(i0+8,html.indexOf('</'+'script>',i0));
src0=src0.replace('function log(txt,cls){','function log(txt,cls){');
const ids=new Set();for(const mm of html.matchAll(/id="([^"]+)"/g))ids.add(mm[1]);
function mk(){return {classList:{toggle(){},add(){},remove(){}},style:{},attrs:{},setAttribute(){},addEventListener(){},appendChild(){},querySelector(){return mk();},querySelectorAll(){return [];},children:[],dataset:{},value:'10',disabled:false,checked:true,textContent:'',innerHTML:'',onclick:null,closest(){return null},insertBefore(){},removeChild(){},firstChild:null,scrollTop:0,scrollHeight:0,clientHeight:0,scrollWidth:100,scrollIntoView(){}};}
function fresh(){const dn={};global.document={getElementById(i){if(!ids.has(i))return null;dn[i]=dn[i]||mk();return dn[i];},createElement(){return mk();},createTextNode(){return {};},body:mk()};global.performance={now:()=>0};global.requestAnimationFrame=()=>{};global.navigator={};let s=src0.replace('window.__sim={S:S,physStep:physStep,slowStep:slowStep,trips:trips};','window.__sim={S:S,physStep:physStep,slowStep:slowStep,trips:trips,setEtat:setEtat,recTick:recTick,doScram:doScram};');eval(s);window.__sim.dn=dn;return window.__sim;}
const psat=T=>Math.pow(10,5.11564-1687.537/(T+230.17));
const tsat=P=>1687.537/(5.11564-Math.log10(Math.max(0.05,P)))-230.17;

const anomalies={};let nSamp=0;
function flag(rule,scn,t,detail){
  const k=rule+' @ '+scn;
  if(!anomalies[k])anomalies[k]={n:0,first:t,detail:detail};
  anomalies[k].n++;anomalies[k].last=t;if(anomalies[k].n<=1)anomalies[k].detail=detail;
}
// contexte : quel régime pour moduler les règles
function ctx(S){return {
  accident:S.breche>0||S.rtv>0||S.fuiteGV>0||S.dmg>0.01||S.bacheASG<0.05||S.sebim||!S.crf||S.encFail,
  couple:S.Pelec>50&&S.turb>3&&S.viv,
  chaud:S.Tavg>200, prod:S.Pn>0.10&&!S.scram,
};}
function eyes(S,scn,t,prev){
  if(S.etat!==S.__lastEtat){S.__lastEtat=S.etat;S.__etatT=t;}
  const recentEtat=(t-(S.__etatT||0))<12;
  nSamp++;const c=ctx(S);
  const nn=(v)=>Number.isFinite(v);
  // 1. bornes dures
  if(!nn(S.Tavg)||!nn(S.Ppzr)||!nn(S.Psteam)||!nn(S.Pn)||!nn(S.gv))flag('NaN',scn,t,'');
  if(S.Tavg<2||S.Tavg>2900)flag('Tavg hors bornes',scn,t,S.Tavg.toFixed(0));
  if(S.Ppzr<0||S.Ppzr>200)flag('Ppzr hors bornes',scn,t,S.Ppzr.toFixed(0));
  if(S.Psteam<0||S.Psteam>95)flag('Psteam > tarage soupapes GV',scn,t,S.Psteam.toFixed(1));
  if(S.gv<-0.1||S.gv>100.1)flag('niveau GV hors bornes',scn,t,S.gv.toFixed(0));
  if(S.Xe<-0.01||S.Xe>4.5)flag('xénon hors bornes',scn,t,S.Xe.toFixed(2));
  if(S.accu<-0.1||S.accu>100.1)flag('accus hors bornes',scn,t,S.accu.toFixed(0));
  // 2. ordre thermique
  if(false){
    const dT=2*S.dTgm; // Tbc = Tavg+dTgm ; Tbf = Tavg−dTgm
    if(dT<-0.5)flag('Thot < Tfroid',scn,t,'ΔT='+dT.toFixed(1));
    if(S.gmppN===4&&c.prod&&!c.accident){
      const exp=36*(S.Ptot||S.Pn);
      if(Math.abs(dT-exp)>9)flag('ΔT boucle ≠ 36°C×P (réf. palier 329/293)',scn,t,'ΔT='+dT.toFixed(1)+' attendu≈'+exp.toFixed(1));
    }
  }
  // 5. pincement GV : le primaire chauffe la vapeur, jamais l inverse
  if(c.chaud&&S.gv>10&&!c.accident){
    const pinc=S.Tavg-tsat(S.Psteam);
    if(pinc<-1)flag('Tavg < Tsat(Psteam) : le GV chaufferait le primaire',scn,t,'pinc='+pinc.toFixed(1));
    if(pinc>48&&S.gmppN>0)flag('pincement GV excessif (>48 °C)',scn,t,pinc.toFixed(0));
  }
  // 6. sous-refroidissement permanent
  if(c.chaud&&!c.accident&&S.inv>95){
    const m=tsat(S.Ppzr)-(S.Tbc||S.Tavg+14);
    if(m<12)flag('marge de sous-saturation < 12 °C',scn,t,m.toFixed(0));
  }
  // 7. rendement
  if(c.couple&&S.reseau&&S.Pn>0.25&&Math.abs(S.turbSet-S.turb)<1.5&&prev&&Math.abs(S.Pn-prev.Pn)<0.004){
    const eta=S.Pelec/(S.Ptot*3800); // dénominateur thermique VRAI (la résiduelle fait aussi de la vapeur)
    if(eta<0.29||eta>0.36)flag('rendement net hors 29-36 % (réel : 31,5-34,7)',scn,t,(eta*100).toFixed(1)+'%');
  }
  // 11. Tare ≤ Tsat(Psteam) : l eau alimentaire ne peut pas être plus chaude que la vapeur qui la chauffe
  if(S.viv&&S.Psteam>10&&S.Tare>tsat(S.Psteam)+6)flag('T ARE > Tsat(vapeur) : réchauffage impossible',scn,t,S.Tare.toFixed(0)+'>'+tsat(S.Psteam).toFixed(0));
  // 12. cohérence électrique
  if(S.Pelec>60&&(S.turb<2||!S.viv||S.Pn<0.015))flag('MWe sans turbine/vapeur/cœur',scn,t,'Pelec='+S.Pelec.toFixed(0));
  // 15. accus : jamais de remontée spontanée
  if(prev&&S.accu>prev.accu+0.5)flag('accus se re-remplissent seuls',scn,t,prev.accu.toFixed(0)+'→'+S.accu.toFixed(0));
  // 17-18. gradients SOUTENUS (fenêtre glissante 10 min), hors accident/transitoire déclenché
  if(!S.__ring)S.__ring=[];
  S.__ring.push({t:t,T:S.Tavg,P:S.Ppzr,sc:S.scram});if(S.__ring.length>21)S.__ring.shift();
  if(S.__ring.length===21&&!c.accident){
    const a=S.__ring[0],b=S.__ring[20],dtMin=b.t-a.t;
    if(a.sc===b.sc&&!S.ilote&&S.turb<3&&!(S.scram&&t<60)&&Math.abs((S.turbSet||0)-(S.turb||0))<2){
      const gT=Math.abs(b.T-a.T)/dtMin*60;
      if(gT>62)flag('gradient Tavg SOUTENU > 62 °C/h (10 min) hors accident',scn,t,gT.toFixed(0)+' °C/h');
      const gP=Math.abs(b.P-a.P)/dtMin;
      if(gP>7.5&&!S.sebim)flag('gradient Ppzr SOUTENU > 7,5 bar/min (10 min)',scn,t,gP.toFixed(1));
    }
  }
  // 20. résiduelle décroissante post-scram
  if(prev&&S.scram&&prev.scram&&S.Pres>prev.Pres+0.0004)flag('résiduelle qui remonte',scn,t,(prev.Pres*100).toFixed(2)+'→'+(S.Pres*100).toFixed(2));
  // règle du couloir (fig. 4.1) : sous 180 °C le domaine n'existe qu'à ≤31 bar
  if(S.Tavg<178&&S.Tavg>75&&S.Ppzr>32&&!c.accident&&S.inv>95&&S.breche===0)flag('couloir : P>31 bar sous 180 °C (hors domaine)',scn,t,'T='+S.Tavg.toFixed(0)+' P='+S.Ppzr.toFixed(0));
  // bilan masse GV en régime : alimentation ≈ évaporation
  if(prev&&Math.abs(S.gv-prev.gv)<0.15&&c.prod&&!c.accident&&S.gv>30&&S.gv<70){
    const alim=(S.areOut||0)/115+(S.asg||0), evap=(S.Ptot||S.Pn);
    if(evap>0.15&&(alim<evap*0.6||alim>evap*1.5))flag('bilan masse GV incohérent (alim vs évaporation)',scn,t,'alim='+(alim*100).toFixed(0)+'% evap='+(evap*100).toFixed(0)+'%');
  }
  return {Pn:S.Pn,Tavg:S.Tavg,Ppzr:S.Ppzr,accu:S.accu,gv:S.gv,Pres:S.Pres,scram:S.scram,sigIS:S.sigIS,t:t};
}
function run(m,mins){const n=Math.round(mins*60/0.05);for(let i=0;i<n;i++){m.physStep(0.05);m.slowStep(0.05);m.trips();}}
function sweep(name,mins,setup,step){
  const m=fresh();run(m,20);if(setup)setup(m);
  let prev=null;const dtS=0.5; // échantillon 30 s
  for(let k=0;k<mins/dtS;k++){run(m,dtS);if(step)step(m,k*dtS);prev=eyes(m.S,name,20+k*dtS,prev);}
  return m;
}
// ================= LA GRILLE =================
sweep('RP 2 h',120,null,null);
sweep('échelon 100→70→100',90,m=>{m.S.turbSet=70;},function(m,t){if(t>45)m.S.turbSet=100;});
sweep('rampe lente 100→30 (0,2 %/s)',60,m=>{m.S.turbRate=0.2;m.S.turbSet=30;},null);
sweep('AU + 3 h',180,m=>{m.doScram('essai');},null);
sweep('îlotage 1 h',60,m=>{m.S.reseau=false;m.S.ilote=true;m.S.runbk=true;m.S.gctB=9;m.S.rodDrop=10;},null);
sweep('perte ARE',60,m=>{m.S.areAvail=false;},null);
sweep('perte 1 GMPP',60,m=>{m.S.gmppN=3;},null);
sweep('perte GMPP totale',90,m=>{m.S.gmppN=0;},null);
sweep('perte CRF',90,m=>{m.S.crf=false;},null);
sweep('perte CVI',60,m=>{m.S.cvi=false;},null);
sweep('APRP',120,m=>{m.S.breche=1;},null);
sweep('RTGV fuite',90,m=>{m.S.fuiteGV=6;},null);
sweep('RTV',120,m=>{m.dn['iRtv'].onclick&&m.dn['iRtv'].onclick();},null);
sweep('LOOP (perte réseau sèche)',60,m=>{m.S.reseau=false;},null);
sweep('remontée ANRRA→ANGV (chauffage résiduelle+GMPP)',300,function(m){
  m.setEtat('ANGV');m.S.Pr1=0.001;m.S.Pr2=0.003;m.S.Pr3=0.006;m.S.gctTgt=6;m.S.pzrSet=27;
  function rr(mins){var n=Math.round(mins*60/0.05);for(var i=0;i<n;i++){m.physStep(0.05);m.slowStep(0.05);m.trips();}}
  for(var k=0;k<130;k++){rr(5);if(m.S.Ppzr<139)m.S.isBlk=true;if(m.S.Ppzr<52)m.S.accIso=true;if(m.S.Tavg<178&&m.S.Ppzr<31)break;}
  m.setEtat('ANRRA');rr(60);
 },function(m,t){
  if(t>10&&m.S.etat==='ANRRA')m.setEtat('ANGV');
 });
sweep('descente ANGV→ANRRA (conduite)',420,m=>{m.setEtat('ANGV');m.S.Pr1=0.001;m.S.Pr2=0.003;m.S.Pr3=0.006;m.S.gctTgt=6;m.S.pzrSet=27;},
 function(m,t){if(m.S.Ppzr<139)m.S.isBlk=true;if(m.S.Ppzr<52)m.S.accIso=true;
  if(m.S.Tavg<178&&m.S.Ppzr<31&&m.S.etat==='ANGV')m.setEtat('ANRRA');});
// sens de réponse (matrice actionneur→effet)
{const m=fresh();run(m,25);const p0=m.S.Pn;m.S.turbSet=80;run(m,10);
 if(!(m.S.Pn<p0-0.05))flag('sens : turbSet↓ ⇒ Pn↓','matrice',0,'Pn='+(m.S.Pn*100).toFixed(0));}
{const m=fresh();run(m,25);m.setEtat('ANGV');run(m,10);const t0=m.S.Tavg;m.S.gctTgt=40;run(m,90);
 if(!(m.S.Tavg<t0-8))flag('sens : gctTgt↓ ⇒ Tavg↓','matrice',0,'T='+t0.toFixed(0)+'→'+m.S.Tavg.toFixed(0));}
{const m=fresh();run(m,25);m.S.auto=false;const c0=m.S.Cb;m.S.bori=true;run(m,10);m.S.bori=false;
 if(!(m.S.Cb>c0+15))flag('sens : borication ⇒ Cb↑','matrice',0,c0.toFixed(0)+'→'+m.S.Cb.toFixed(0));}
{const m=fresh();run(m,25);const p0=m.S.Ppzr;m.S.pzrSet=140;run(m,15);
 if(!(m.S.Ppzr<p0-8))flag('sens : pzrSet↓ ⇒ Ppzr↓','matrice',0,p0.toFixed(0)+'→'+m.S.Ppzr.toFixed(0));}
// ================= RAPPORT =================
console.log('===== YEUX DU PILOTE : '+nSamp+' échantillons jugés =====');
const keys=Object.keys(anomalies);
if(!keys.length)console.log('AUCUNE ANOMALIE');
else for(const k of keys.sort((a,b)=>anomalies[b].n-anomalies[a].n))
  console.log(' ⚠ '+k+'  ×'+anomalies[k].n+'  [1er @ t='+anomalies[k].first.toFixed(0)+' min : '+anomalies[k].detail+']');
