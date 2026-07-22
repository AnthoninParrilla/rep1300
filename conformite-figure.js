// CONFORMITÉ FIGURE 4.1 — chaque annotation du diagramme vérifiée sur le simulateur
// usage : node conformite-figure.js [index.html]
global.window={addEventListener(){},scrollX:0,scrollTo(){}};global.setInterval=function(){};
const fs=require('fs');const html=fs.readFileSync(process.argv[2]||'index.html','utf8');
const i0=html.lastIndexOf('<script>');
const src0=html.slice(i0+8,html.indexOf('</'+'script>',i0));
const ids=new Set();for(const mm of html.matchAll(/id="([^"]+)"/g))ids.add(mm[1]);
function mk(){return {classList:{toggle(){},add(){},remove(){}},style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(){},appendChild(){},querySelector(){return mk();},querySelectorAll(){return [];},children:[],dataset:{},value:'10',disabled:false,checked:true,textContent:'',innerHTML:'',onclick:null,closest(){return null},insertBefore(){},removeChild(){},firstChild:null,scrollTop:0,scrollHeight:0,clientHeight:0,scrollWidth:100,scrollIntoView(){}};}
function fresh(){const dn={};global.document={addEventListener:function(){},getElementById(i){if(!ids.has(i))return null;dn[i]=dn[i]||mk();return dn[i];},createElement(){return mk();},createTextNode(){return {};},body:mk(),querySelectorAll(){return [];}};global.performance={now:()=>0};global.requestAnimationFrame=()=>{};global.navigator={};let s=src0.replace('window.__sim={S:S,physStep:physStep,slowStep:slowStep,trips:trips};','window.__sim={S:S,physStep:physStep,slowStep:slowStep,trips:trips,setEtat:setEtat,recTick:recTick,doScram:doScram};');eval(s);return {m:window.__sim,dn};}
const psat=T=>Math.pow(10,5.11564-1687.537/(T+230.17));
let P=0,F=0;function ck(n,c,d){if(c)P++;else F++;console.log((c?'  ✓ ':'  ✗ ')+n+(d?'   ['+d+']':''));}
console.log('════════ CONFORMITÉ FIGURE 4.1 — build '+((html.match(/version (2\.[0-9.]+)/)||[])[1]||'?')+' ════════');
console.log('— Cadre RP (annotation A) —');
{const {m}=fresh();const S=m.S;function R(x){const n=Math.round(x*60/0.05);for(let i=0;i<n;i++){m.physStep(0.05);m.slowStep(0.05);m.trips();}}
 R(30);ck('RP : 155 bar / Tmoy ~310 °C / 100 % Pn',Math.abs(S.Ppzr-155)<1.5&&Math.abs(S.Tavg-310)<3&&S.Pn>0.97,S.Ppzr.toFixed(1)+' bar · '+S.Tavg.toFixed(0)+' °C');}
console.log('— Les quatre limites du domaine AN/GV, en dynamique (aller-retour complet) —');
{const {m}=fresh();const S=m.S;function R(x){const n=Math.round(x*60/0.05);for(let i=0;i<n;i++){m.physStep(0.05);m.slowStep(0.05);m.trips();}}
 R(20);m.setEtat('ANGV');S.Pr1=0.001;S.Pr2=0.003;S.Pr3=0.006;S.gctTgt=6;S.pzrSet=27;
 let v30=0,v110=0,vDP=0,vC=0;
 function judge(){
  if(S.Tavg>178&&S.Ppzr<psat(S.Tavg+30)-3)v30++;
  if(S.Tavg<=255&&S.Tavg>120&&S.Ppzr>psat(S.Tavg+110)+4)v110++;
  if(S.Ppzr>S.Psteam+112)vDP++;
  if(S.Tavg<178&&S.Tavg>75&&S.Ppzr>32)vC++;}
 for(let k=0;k<130;k++){R(5);judge();if(S.Ppzr<139)S.isBlk=true;if(S.Ppzr<52)S.accIso=true;if(S.Tavg<178&&S.Ppzr<31)break;}
 m.setEtat('ANRRA');R(60);judge();
 m.setEtat('ANGV');for(let k=0;k<95;k++){R(6);judge();if(S.accIso&&S.Ppzr>52)S.accIso=false;if(S.Tavg>288&&S.Ppzr>150)break;}
 ck('« Tsat−30 » : plancher jamais crevé (descente + remontée)',v30===0,'violations='+v30);
 ck('« Tsat−110 » : plafond choc froid respecté',v110===0,'violations='+v110);
 ck('« ΔP max plaques GV = 110 b » : jamais dépassé',vDP===0,'violations='+vDP);
 ck('« 25b/27b » : le couloir ≤31 bar sous 180 °C tenu',vC===0,'violations='+vC);
 ck('aller-retour complet RP↔AN/RRA dans le domaine',S.Tavg>288&&S.Ppzr>150,'retour '+S.Tavg.toFixed(0)+' °C / '+S.Ppzr.toFixed(0)+' bar');}
console.log('— « Température Max du RRA » (le mur à 180 °C) —');
{const {m}=fresh();const S=m.S;function R(x){const n=Math.round(x*60/0.05);for(let i=0;i<n;i++){m.physStep(0.05);m.slowStep(0.05);m.trips();}}
 R(20);m.setEtat('ANGV');S.Tavg=200;S.Ppzr=29;S.pzrSet=27;m.setEtat('ANRRA');
 ck('admission AN/RRA REFUSÉE à 200 °C',S.etat==='ANGV','resté '+S.etat);}
console.log('— « Courbe de saturation » : les deux lois du circuit fermé —');
{const {m}=fresh();const S=m.S;function R(x){const n=Math.round(x*60/0.05);for(let i=0;i<n;i++){m.physStep(0.05);m.slowStep(0.05);m.trips();}}
 R(15);let bad=0;for(let k=0;k<40;k++){R(2);if(S.Psteam>psat(S.Tavg)+0.3)bad++;}
 ck('à chaud : Psteam ≤ Psat(Tmoy) en permanence',bad===0,'');
 m.setEtat('ANGV');S.Pr1=0.001;S.Pr2=0.003;S.Pr3=0.006;S.gctTgt=6;S.pzrSet=27;
 for(let k=0;k<130;k++){R(5);if(S.Ppzr<139)S.isBlk=true;if(S.Ppzr<52)S.accIso=true;if(S.Tavg<178&&S.Ppzr<31)break;}
 m.setEtat('ANRRA');R(60);S.rraF=true;R(175); // assez long pour franchir Tsat(consigne)=224 °C : la saturation prend le pilotage
 ck('à froid (perte RRA) : la pression REMONTE le long de Psat(Tmoy)',Math.abs(S.Ppzr-psat(S.Tavg))<2&&S.Tavg>225,S.Tavg.toFixed(0)+' °C / '+S.Ppzr.toFixed(1)+' bar ≈ psat='+psat(S.Tavg).toFixed(1));}
console.log('— « P tarage des soupapes GV » —');
{const {m}=fresh();const S=m.S;function r2(x){const n=Math.round(x*60/0.05);for(let i=0;i<n;i++){m.physStep(0.05);m.slowStep(0.05);m.trips();S.gct=0;S.gctA=0;}}
 r2(25);S.viv=false;S.turb=0;let pMax=0,sv=0;for(let q=0;q<200;q++){r2(0.05);pMax=Math.max(pMax,S.Psteam);sv=Math.max(sv,S.svf);}
 ck('trip turbine, GCT condamné : soupapes crachent, pic 90-95 bar',sv>0.05&&pMax>90&&pMax<95.5,'pic '+pMax.toFixed(1)+' bar · svf '+(sv*100).toFixed(0)+' %');}
console.log('— « Limite NPSH des pompes primaires » —');
{const {m}=fresh();const S=m.S;function R(x){const n=Math.round(x*60/0.05);for(let i=0;i<n;i++){m.physStep(0.05);m.slowStep(0.05);m.trips();}}
 R(20);S.breche=1;let st=null;for(let q=0;q<60;q++){R(2);if(S.gmppN===0){st=(q+1)*2;break;}}
 ck('APRP : GMPP stoppées sur perte du sous-refroidissement (ΔTsat<8)',st!==null,'arrêt à t+'+st+' min');}
console.log('— Zones API / APR (annotation B) et AN/RRA établi —');
{const {m}=fresh();const S=m.S;function R(x){const n=Math.round(x*60/0.05);for(let i=0;i<n;i++){m.physStep(0.05);m.slowStep(0.05);m.trips();}}
 R(20);m.setEtat('ANGV');S.Pr1=0.001;S.Pr2=0.002;S.Pr3=0.004;S.gctTgt=6;S.pzrSet=27;
 for(let k=0;k<130;k++){R(5);if(S.Ppzr<139)S.isBlk=true;if(S.Ppzr<52)S.accIso=true;if(S.Tavg<178&&S.Ppzr<31)break;}
 m.setEtat('ANRRA');R(180);const Thot1=S.Tavg;
 m.setEtat('APIO');const ref=(S.etat==='ANRRA');R(280);
 m.setEtat('APIF');R(30);m.setEtat('APIO');R(60);m.setEtat('APR');R(30);
 ck('gardes figure : APIO refusé à '+Thot1.toFixed(0)+' °C, admissions ≤70/50/45 °C ensuite',ref&&(S.etat==='APR'||S.etat==='APIO'),'état final '+S.etat+' à '+S.Tavg.toFixed(0)+' °C');}
console.log('— Le tracé de la chaussette (statique) —');
{const zones=['>RP<','>AN/GV<','>AN/RRA<','>API<','>APR<'].every(z=>html.includes(z));
 const polys=(html.match(/class="skZ"/g)||[]).length;
 const curves=(html.match(/class="skC"/g)||[]).length;
 ck('5 étiquettes de zones · '+polys+' polygones · '+curves+' courbes limites tracées',zones&&polys===4&&curves===3,'');}
console.log('— Point documenté NON INTERPRÉTÉ —');
console.log('  ◦ « Limite inférieure de connexion du RRA » (~66 bar) : lecture d'+String.fromCharCode(0x2019)+'exploitant en attente ; la garde codée reste P ≤ 31 bar (aspiration).');
console.log('════════ '+P+' conformes / '+F+' écarts ════════');
