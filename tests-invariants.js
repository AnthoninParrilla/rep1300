// Banc d invariants d exploitant REP — usage : node tests-invariants.js [index.html]
// ================= BANC D'INVARIANTS D'EXPLOITANT REP =================
global.window={addEventListener(){},scrollX:0,scrollTo(){}};global.setInterval=function(){};
const fs=require('fs');
const html=fs.readFileSync(process.argv[2]||'index.html','utf8');
const i0=html.lastIndexOf('<script>');
let src0=html.slice(i0+8,html.indexOf('</'+'script>',i0));
global.__logs=[];src0=src0.replace('function log(txt,cls){','function log(txt,cls){global.__logs.push(txt);');
const ids=new Set();for(const mm of html.slice(0,i0).matchAll(/id="([^"]+)"/g))ids.add(mm[1]);
function mk(){return {classList:{_c:{},toggle(cl,v){this._c[cl]=!!v;},add(){},remove(){}},style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(){},appendChild(){},querySelector(){return mk();},querySelectorAll(){return [];},children:[],dataset:{},value:'10',disabled:false,checked:true,textContent:'',innerHTML:'',onclick:null,closest(){return null},insertBefore(){},removeChild(){},firstChild:null,scrollTop:0,scrollHeight:0,clientHeight:0,scrollWidth:100,scrollIntoView(){}};}
function fresh(){const dn={};global.document={getElementById(i){if(!ids.has(i))return null;dn[i]=dn[i]||mk();return dn[i];},createElement(){return mk();},createTextNode(){return {};},body:mk()};global.performance={now:()=>0};global.requestAnimationFrame=()=>{};global.navigator={};let s=src0.replace('window.__sim={S:S,physStep:physStep,slowStep:slowStep,trips:trips};','window.__sim={S:S,physStep:physStep,slowStep:slowStep,trips:trips,render:render,setEtat:setEtat,recTick:recTick,doScram:doScram};');eval(s);window.__sim.dn=dn;return window.__sim;}
function R(m){return (w,a)=>{a=a||1;for(let i=0;i<w/0.05;i++){for(let k=0;k<a;k++){m.physStep(0.05);m.slowStep(0.05);m.trips();m.recTick();}}for(let f=0;f<6;f++)m.render();};}
const Psat=T=>Math.pow(10,5.11564-1687.537/(T+230.17))*0.986923/1.01325*1.01325; // Antoine, bar abs approx
let V=[];function inv(tag,name,cond,info){if(!cond)V.push(tag+' | '+name+(info?' ['+info+']':''));}

// --- mesure de régime : échantillonne 10 min, retourne stats + oscillation ---
function regime(m,mins){regime._h=null;
  const r=R(m);const ks=['Psteam','Tavg','Ppzr','Pn','gct','asg','gv','Pelec'];
  const acc={};ks.forEach(k=>acc[k]=[]);let flips=0,lastSig='';
  for(let s=0;s<mins*6;s++){r(10,60); // 10 min sim par pas si mins*6 pas de 10 min? -> r(10,60)=600 s sim
    ks.forEach(k=>acc[k].push(m.S[k]||0));
    const sig=[m.S.tpaRun,m.S.tpsOk,m.S.scram,m.S.gmppN,m.S.tpsA,m.S.tpsB,m.S.mpsA,m.S.mpsB,m.S.isBlk].join(","); // états vrais seulement — les régulateurs (GCT/ASG) modulent par design
    if(lastSig&&sig!==lastSig)flips++;lastSig=sig;}
  const st={};ks.forEach(k=>{const a=acc[k],mu=a.reduce((x,y)=>x+y,0)/a.length;
    let invs=0,lastD=0;const span=Math.max(...a)-Math.min(...a);
    const noise={Pn:0.02,Psteam:2,Tavg:2,Ppzr:2,gct:0.008,asg:0.006,gv:2,Pelec:40}[k]||span*0.12;
    const thr=Math.max(span*0.12,noise); // ignorer le bruit de régulation (crans de grappes, bandes mortes)
    for(let i=1;i<a.length;i++){const d=a[i]-a[i-1];if(Math.abs(d)>thr&&span>1e-6){if(lastD&&Math.sign(d)!==Math.sign(lastD))invs++;lastD=d;}}
    st[k]={mu:mu,pp:span,invs:invs};});
  st.flips=flips;return st;
}
// --- invariants universels (tout état, tout régime établi) ---
function universal(m,tag){
  const S=m.S;
  inv(tag,'aucun NaN vital',['Pn','Tavg','Ppzr','Psteam','Cb','Xe','inv','gv'].every(k=>Number.isFinite(S[k])));
  inv(tag,'bornes physiques',S.Pn>=-.001&&S.Pn<1.3&&S.inv<=100.6&&S.gv>=-1&&S.gv<=101&&S.Penc<9,'Pn='+(S.Pn*100).toFixed(1)+' inv='+S.inv.toFixed(0));
  if(S.gmppN>0&&S.Tavg>120&&!S.scram)
    inv(tag,'sous-refroidissement : Ppzr > Psat(Tbc)+5',S.Ppzr>Psat(S.Tavg+14)+5,'P='+S.Ppzr.toFixed(0)+' Psat(Tbc)='+Psat(S.Tavg+14).toFixed(0));
  inv(tag,'Pelec>0 implique turbine et coeur',!(S.Pelec>30)||(S.turb>1&&S.Pn>0.04),'Pelec='+Math.round(S.Pelec)+' turb='+S.turb.toFixed(0)+' Pn='+(S.Pn*100).toFixed(0));
  inv(tag,'asg>0 implique pompes ASG en service',!(S.asg>0.001)||(S.mpsA||S.mpsB||S.tpsA||S.tpsB));
  inv(tag,'GV alimentés OU secs assumés',S.gv>20||S.asg>0||S.areOut>0||S.bacheASG<0.05||S.Ptot<0.005,'gv='+S.gv.toFixed(0));
}
// --- profils d'état (le savoir d'exploitant encodé) ---
function checkEtat(m,tag,st){
  const S=m.S;universal(m,tag);
  inv(tag,'régime établi : signaux d etat stables (flips<=2)',st.flips<=2,'flips='+st.flips);
  if(tag==='RP'){
    inv(tag,'Pn nominal',Math.abs(S.Pn-1)<0.08,'Pn='+(S.Pn*100).toFixed(0));
    inv(tag,'GCT fermé en production',st.gct.mu<0.006,'gct='+(st.gct.mu*100).toFixed(1)+'%');
    inv(tag,'ASG à l arrêt en production',st.asg.mu<0.002);
    inv(tag,'TPA en service',S.tpaRun===true);
    inv(tag,'Ppzr 155±2',Math.abs(S.Ppzr-155)<2,S.Ppzr.toFixed(1));
    inv(tag,'Pelec 1250-1360',S.Pelec>1250&&S.Pelec<1360,Math.round(S.Pelec));
  }
  if(tag==='ANGV'){
    inv(tag,'sous-critique',S.Pn<0.002,'Pn='+(S.Pn*100).toFixed(2));
    inv(tag,'GCT OUVERT et évacue la résiduelle',st.gct.mu>0.004&&Math.abs(st.gct.mu-S.Ptot)<0.02,'gct='+(st.gct.mu*100).toFixed(1)+'% Ptot='+(S.Ptot*100).toFixed(1)+'%');
    inv(tag,'Psteam 74±2 tenue',Math.abs(st.Psteam.mu-74)<2,st.Psteam.mu.toFixed(1));
    inv(tag,'Tavg ~297',Math.abs(S.Tavg-297)<6,S.Tavg.toFixed(0));
    inv(tag,'TPA arrêtées (minimum technique : l état établi se conduit à l ASG)',!S.tpaRun&&S.tpaN<3,'tpaN='+S.tpaN.toFixed(0));
    inv(tag,'ASG alimente (compense l évaporation)',st.asg.mu>0.002,'asg='+(st.asg.mu*100).toFixed(2)+'%');
    inv(tag,'grappes au fond',S.rod<2,'rod='+S.rod.toFixed(0));
    inv(tag,'dérive Tavg bornée (régime)',st.Tavg.pp<4,'pp='+st.Tavg.pp.toFixed(1));
  }
  if(tag==='ANRRA'){
    inv(tag,'froid tenu par le RRA',S.Tavg<80&&st.Tavg.pp<6,'Tavg='+S.Tavg.toFixed(0));
    inv(tag,'pression basse cohérente',S.Ppzr<40,S.Ppzr.toFixed(0));
    inv(tag,'TPA/TPS hors service',!S.tpaRun&&!S.tpsA&&!S.tpsB);
  }
  if(tag==='APIO'){
    inv(tag,'pression atmosphérique',S.Ppzr<3,S.Ppzr.toFixed(1));
    inv(tag,'couvercle EN PLACE (trou d homme pressu)',m.dn['gHead'].style.opacity==1);
    inv(tag,'ventilation en service : fond cheminée relevé',S.actDvn>1000,S.actDvn.toFixed(0));
  }
  if(tag==='APR'){inv(tag,'couvercle déposé',m.dn['gHead'].style.opacity==0);inv(tag,'cuve en eau',parseFloat(m.dn['vesselWater'].attrs.height)>100);}
  if(tag==='RCD'){
    inv(tag,'coeur en piscine : Pres=0 et Xe=0',S.Pres<1e-4&&S.Xe<0.01);
    inv(tag,'cuve en eau (protection biologique)',parseFloat(m.dn['vesselWater'].attrs.height)>100);
    inv(tag,'cheminée au fond, pas de fumée',m.dn['fDvn'].attrs.opacity==0);
  }
}
// ============== PARCOURS 1 : chaque état, stabilisé 40 min ==============
{const m=fresh();const r=R(m);r(30,1);
 const st=regime(m,4);checkEtat(m,'RP',st);}
{const m=fresh();const r=R(m);r(30,1);m.setEtat('ANGV');r(30,60);
 const st=regime(m,4);checkEtat(m,'ANGV',st);}
{const m=fresh();const r=R(m);r(30,1);m.setEtat('ANGV');r(20,1);m.S.gctTgt=6;
 // CONDUITE de descente (fig. 4.1) : refroidir, bloquer IS < P11, isoler accus < 52 bar
 for(let k=0;k<90;k++){r(5,60);if(m.S.Ppzr<139)m.S.isBlk=true;if(m.S.Ppzr<52)m.S.accIso=true;if(m.S.Tavg<178)break;}
 m.S.accIso=true;m.S.pzrSet=27;r(45,60);
 m.setEtat('ANRRA');r(150,300);
 const st=regime(m,4);checkEtat(m,'ANRRA',st);}
{const m=fresh();const r=R(m);r(30,1);m.setEtat('ANGV');r(20,1);m.S.gctTgt=6;
 for(let k=0;k<90;k++){r(5,60);if(m.S.Ppzr<139)m.S.isBlk=true;if(m.S.Ppzr<52)m.S.accIso=true;if(m.S.Tavg<178)break;}
 m.S.accIso=true;m.S.pzrSet=27;r(45,60);
 m.setEtat('ANRRA');r(150,300);m.setEtat('APIO');r(90,300);
 const st=regime(m,3);checkEtat(m,'APIO',st);
 m.setEtat('APR');r(10,60);const st2=regime(m,2);checkEtat(m,'APR',st2);
 m.setEtat('RCD');r(20,60);const st3=regime(m,2);checkEtat(m,'RCD',st3);}
// ============== PARCOURS 2 : régimes post-transitoires établis ==============
// BILAN DE TRANCHE BOUT-EN-BOUT (le fil du MW, 16/07) : à toute charge,
// rendement Pelec/Pth dans [31,37] % — sinon un maillon de la chaîne ment
{const m=fresh();const r=R(m);r(30,1);
 inv('bilan100','rendement de cycle à 100 %',m.S.Pelec/(m.S.Pn*3800)>0.31&&m.S.Pelec/(m.S.Pn*3800)<0.37,'η='+(100*m.S.Pelec/(m.S.Pn*3800)).toFixed(1)+'%');
 m.S.turbSet=50;r(360,1);
 inv('bilan50','rendement à mi-charge',m.S.Pelec/(m.S.Pn*3800)>0.30&&m.S.Pelec/(m.S.Pn*3800)<0.38,'η='+(100*m.S.Pelec/(m.S.Pn*3800)).toFixed(1)+'% Pn='+(m.S.Pn*100).toFixed(0));}
// CONSERVATION (question d'Antony 15/07) : l'énergie vapeur VA quelque part de
// visible — échantillonnage FIN pour attraper les transitoires de bascule ARE->ASG
{const m=fresh();const r=R(m);r(20,1);m.doScram('essai banc : AAR');
 let worstGap=0,orphan=0,tareMax=0,lastTare=null;
 for(let s=0;s<360;s++){r(5,10); // toutes les 50 s sim pendant 5 h
  const D=(m.S.viv?m.S.turb/100:0)+m.S.gct*0.85+m.S.gctA*0.4+m.S.svf*0.7;
  const prod=m.S.Ptot+m.S.gmppN*0.0013;
  if(m.S.Psteam>60&&prod>0.012&&D<0.002&&(m.S.asg<0.001))orphan++;
  if(lastTare!==null)tareMax=Math.max(tareMax,Math.abs(m.S.Tare-lastTare)/50);
  lastTare=m.S.Tare;}
 universal(m,'conservation');
 // le creux de bascule (l aveuglement du 16/07) : GCT nul >2 min avec production
 // chaude et vapeur disponible = FAIL ; et l ARE tient post-AU (TPA sur vapeur)
 {const m2=fresh();const r2=R(m2);r2(20,1);m2.doScram('essai');
  let gap=0,maxGap=0;let areMin=999;
  for(let s=0;s<60;s++){r2(30,1);
   if(m2.S.gct<0.001&&m2.S.Ptot>0.01&&m2.S.Psteam>60&&m2.S.viv){gap+=30;maxGap=Math.max(maxGap,gap);}else gap=0;
   if(m2.S.t>1560)areMin=Math.min(areMin,m2.S.areOut);}
  inv('bascule','post-AU : le GCT ne ferme jamais >2 min (vapeur dispo)',maxGap<=120,'creux max='+maxGap+' s');
  inv('bascule','post-AU : jamais d entre-deux affamé (TPA portent OU l ASG a repris)',(m2.S.tpaRun&&m2.S.gv>45)||(!m2.S.tpaRun&&m2.S.asg>0.003&&m2.S.gv>40),'tpaRun='+m2.S.tpaRun+' asg='+(m2.S.asg*100).toFixed(1)+'% gv='+m2.S.gv.toFixed(0));}
 inv('conservation','production chaude => un exutoire visible (GCT/GCTa/soupapes/ASG)',orphan<=2,'orphelins='+orphan);
 inv('conservation','gradient T ARE réaliste (inertie réchauffeurs)',tareMax<0.5,'max='+tareMax.toFixed(2)+' °C/s');
 inv('conservation','exutoire actif ET primaire tenu par les GMPP (5 h)',m.S.gct>0.001&&m.S.Tavg>288,'gct='+(m.S.gct*100).toFixed(1)+'% Tavg='+m.S.Tavg.toFixed(0));}
// post-AAR simple, 40 min après
{const m=fresh();const r=R(m);r(30,1);m.doScram('essai banc : AAR');r(10,1);
 const st=regime(m,4);universal(m,'post-AAR');
 inv('post-AAR','GCT évacue la résiduelle',st.gct.mu>0.003,'gct='+(st.gct.mu*100).toFixed(1)+'%');
 inv('post-AAR','régime sans oscillation',st.flips<=2&&st.Psteam.pp<3,'flips='+st.flips+' ppPsteam='+st.Psteam.pp.toFixed(1));
 inv('post-AAR','Tavg tenue ~297 (GCT)',Math.abs(m.S.Tavg-297)<8,m.S.Tavg.toFixed(0));}
// post-AAR + CRF (le scénario d'Antony), 1 h après
{const m=fresh();const r=R(m);r(30,1);m.doScram('essai banc : AAR');m.S.crf=false;r(30,60);
 const st=regime(m,5);universal(m,'AAR+CRF 1h');
 inv('AAR+CRF 1h','pas d oscillateur thermique',st.Psteam.pp<2.5&&st.flips<=2,'pp='+st.Psteam.pp.toFixed(1)+' flips='+st.flips);
 inv('AAR+CRF 1h','refroidissement monotone ou plateau',st.Tavg.pp<8,'ppT='+st.Tavg.pp.toFixed(1));}
// post-îlotage établi
{const m=fresh();const r=R(m);r(30,1);m.S.reseau=false;m.S.ilote=true;m.S.runbk=true;m.S.gctB=9;m.S.rodDrop=10;r(60,60);for(let k=0;k<42;k++){m.S.dilu=(m.S.Pn<0.06&&!m.S.scram);r(10,1);} // conduite : dilution ASSERVIE contre la montée xénon (7 h)
 const st=regime(m,4);universal(m,'îloté');
 inv('îloté','Pn de maison ~5-12 %',m.S.Pn>0.04&&m.S.Pn<0.14,'Pn='+(m.S.Pn*100).toFixed(1));
 inv('îloté','régime stable : dérive xénon monotone, pas de zigzag',st.flips<=2&&st.Pn.invs<=2,'flips='+st.flips+' inversions='+st.Pn.invs+' ppPn='+(st.Pn.pp*100).toFixed(1)+'pts');}
// post-RTGV isolé (30 min après)
{const m=fresh();const r=R(m);r(20,1);m.S.fuiteGV=6;r(200,60);r(0.1,1);
 const st=regime(m,3);universal(m,'post-RTGV');
 inv('post-RTGV','tranche à l arrêt refroidissable',m.S.scram&&m.S.dmg<0.01);}
// question d'exploitant (13/07/2026) : VIV fermées, où va l'énergie ?
// -> compression, puis GCTa (amont VIV) en gavé-vapeur ASG ; GCT-c muet
{const m=fresh();const r=R(m);r(20,1);m.doScram('essai banc : AAR');m.S.viv=false;r(150,10);
 universal(m,'VIV fermées');
 inv('VIV fermées','GCT-c muet à travers l isolement',m.S.gct<0.005,'gct='+(m.S.gct*100).toFixed(1)+'%');
 inv('VIV fermées','l énergie a un chemin : GCTa ou soupapes VVP',(m.S.gctA>0.003||m.S.svf>0.01),'gctA='+(m.S.gctA*100).toFixed(1)+'%');
 inv('VIV fermées','Psteam bornée sous le tarage, Tavg tenue',m.S.Psteam<92&&Math.abs(m.S.Tavg-292)<12,'P='+m.S.Psteam.toFixed(0)+' T='+m.S.Tavg.toFixed(0));}
// ANGV atteint depuis une remontée avec consignes héritées quelconques
{const m=fresh();const r=R(m);r(30,1);m.S.gctSet=95;m.S.gctTgt=95;m.S.turbSet=37;m.setEtat('ANGV');r(30,60);
 const st=regime(m,3);universal(m,'ANGV(hérité)');
 inv('ANGV(hérité)','GCT évacue malgré consignes héritées',st.gct.mu>0.004,'gct='+(st.gct.mu*100).toFixed(1)+'%');}
// ================= RAPPORT =================
if(V.length===0)console.log('===== INVARIANTS : TOUT VERT =====');
else{console.log('===== VIOLATIONS ('+V.length+') =====');V.forEach(v=>console.log(' ✗ '+v));}
