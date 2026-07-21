# Brief de maintenance — à donner au modèle en début de session

## Contexte
Simulateur REP 1300 P4 : **un seul fichier** `index.html` (~160 Ko), PWA GitHub Pages.
Physique **strictement déterministe**, nomenclature française exacte. L'utilisateur est
un professionnel du nucléaire : sur la physique et la conduite, ses corrections de
terrain font foi — les implémenter fidèlement, puis les valider numériquement.

## Méthode obligatoire
RÈGLE ABSOLUE DE DÉPLOIEMENT : bumper la clé de cache de sw.js à CHAQUE
livraison d index.html, même pour une ligne (sinon le service worker sert
l ancien index à jamais : constaté le 16/07, clé v24b inchangée sur 3
livraisons). Le build est visible à l écran (« version 2.4c ») : toujours
vérifier ce marqueur sur l appareil avant de conclure à un bug physique.
1. **Patches Python par ancres exactes** : remplacement de chaînes littérales avec
   `assert src.count(ancre)==1` AVANT toute écriture. Toujours `grep` l'ancre d'abord.
   Si un assert lève, le fichier n'est PAS écrit — c'est voulu, ne jamais contourner.
   Jamais de regex larges : les patches qui s'additionnent au lieu de remplacer ont
   déjà produit 15 carters empilés sur un couvercle de cuve.
2. **Banc Node.js après chaque patch** : extraire le `<script>`, stub DOM minimal dont
   `getElementById` ne sert que les ids réellement présents dans le HTML (un id
   manquant doit être SIGNALÉ : c'est un crash silencieux en production), boucle
   `physStep(0.05); slowStep(0.05); trips(); recTick();` puis `render()`.
   **Aucune affirmation sans validation numérique.** Tester l'état réel, pas l'intention.
3. **SVG** : collisions vérifiées par bounding boxes calculées ; largeurs de texte aux
   métriques réelles (PIL/DejaVu `getbbox`, pas d'estimation à l'œil). Après tout patch
   SVG, vérifier l'équilibre `<g>` / `</g>`.

## Pièges connus (payés cher)
- Ne jamais poser une variable que la physique **recalcule** (ex : `S.Pres = S.Pr1+S.Pr2`
  chaque pas — agir sur les sources, pas la somme).
- Toute écriture de `S.turb` doit synchroniser `S.turbSet` (sinon la rampe fait
  remonter la turbine toute seule).
- `trips()` n'a pas de `dt` : y chronométrer avec l'horloge simulée `S.t`.
- Les presets sans une propriété laissent la valeur précédente ; `Math.max(x, undefined)`
  = NaN qui tue toute la physique.
- Les gardes d'états s'évaluent sur l'état RÉEL de la tranche (pré-vérifiées avant
  traversée) ; en froid, `Ppzr` est ancrée sur `pzrSet`.
- iOS : `touch-action` ne s'hérite pas — la poser sur la CIBLE de l'événement.
- Release : bumper `CACHE` dans `sw.js`, sinon la PWA sert l'ancienne version.
- Agir sur les SOURCES, pas les grandeurs recalculées : `lvlCuve` suit `inv`,
  `Pres = Pr1+Pr2` — poser la somme est écrasé au pas suivant.
- Indicateurs (icônes pompes, dashes) = ÉTAT retenu, jamais une grandeur de
  régulation instantanée (`asgDemande` oscille dans sa bande PAR DESIGN).
- La dilution est PROPORTIONNELLE à la concentration (asymptote physique) ;
  un taux linéaire long finit par vaincre le scram, c'est irréaliste.
- Les fuites/brèches s'injectent dans les DEMANDES et bilans natifs (D vapeur,
  inventaires) — jamais en soustrayant à une grandeur relaxée/recalculée, qui
  annule la soustraction au pas suivant.
- Une variable d'affichage ne doit JAMAIS être définie différemment selon les
  branches chaud/froid : à la frontière, elle bat. La définir UNE fois en zone
  commune, sur sa grandeur physique, avec hystérésis (ex : tpsOk sur Psteam 10/7).

## Banc d'invariants (obligatoire à chaque session)
`node tests-invariants.js index.html` — encode la logique d'exploitation REP :
bilans, cohérences croisées, sous-refroidissement, détecteurs d'oscillation,
d'indicateurs battants et de zigzag, dans chaque état stabilisé ET les régimes
post-transitoires. C'est lui qui trouve les aberrations avant l'utilisateur.
Après tout patch : le lancer, viser zéro violation, requalifier en conscience.


## Physique pressuriseur (2.4)
La cible de pression chaude = max(pzrSet, Psat(Tbc)+8) − pertes d'inventaire.
Ne JAMAIS re-coupler la cible à Tavg : c'était le défaut qui effondrait P
post-AU et déclenchait l'IS. La dépressurisation est une ACTION (consigne).

## Histoire des pistes abandonnées (ne pas s'y référer)
La piste « 3.0 » (seconde interface type salle de commande, panneau ARE en SVG,
moteur 4 boucles) a été explorée puis ANNULÉE le 16/07 à la demande d'Antony.
Les fichiers associés (salle.html, panneau-are.html, gen-panneau.py,
gen-fragment.py, PLAN-3.0.md) ont été retirés des livrables : ils n'existent
plus et ne doivent pas être recherchés ni recréés. Aucune version 2.5 n'existe :
la lignée est 2.3 -> 2.4 (fiabilisation + correctifs), point.
La seule cible de travail est index.html (2.4) et sa fiabilisation continue.

## Environnement
Le conteneur peut être réinitialisé entre sessions : /mnt/user-data/outputs
est la seule persistance — toujours pouvoir reconstruire le travail depuis
index.html + tests-invariants.js de ce répertoire.

## Machines : critères d arrêt physiques (2.4e, données sourcées)
TPA (palier 1300) : 2×67 % du nominal, ~5000 t/h chacune, refoulement 80 bar,
aspiration bâche ADG (450 m³, 10 bar, 180 °C). Consommation vapeur des
turbines TPA dans D : 0,4 % à vide -> ~1,3 % à pleine charge. Arrêt sur
MINIMUM TECHNIQUE (besoin d eau <~10 % du nominal, hystérésis 9/13) : l AN/GV
se conduit à l ASG (les essais périodiques TPS se font en AN/GV). La recharge
ASG en régime résiduel est plafonnée ~une file (3,5 %) pour que le GCT
continue d évacuer (bascule douce, pas de choc froid bâche 20 °C).
Les TPA s arrêtent sur critère VAPEUR barillet (tpaCap, ~12 bar), JAMAIS sur
un seuil de puissance : l ex-condition Ptot>5 % (vestige anti-clignotement)
coupait l ARE post-AU, vidait le GV, déclenchait l ASG en catastrophe (choc
froid bâche 20 °C) et fermait le GCT 3 min. Post-AU : l ARE régule, l ASG
ne démarre que si l ARE est réellement perdue. Le banc surveille les deux
(détecteur de creux GCT >2 min + areOut tenu).

## Constantes de temps (2.4)
Toute température de process (T ARE, bâches...) doit porter la constante de
temps PHYSIQUE de son équipement, jamais une relaxation de commodité (le τ=40 s
de T ARE effondrait le poste d'eau au trip et fermait le GCT par choc froid).
Les bancs doivent échantillonner FIN les transitoires de bascule (ARE→ASG,
TPA→ASG...) : un pas de 10 min passe entre les gouttes.

## FINITIONS 2.5.1-2.5.8 (retours terrain PC)
2.5.1 : « 71 bar » statique retiré du titre synoptique. 2.5.2 : purge des
9 derniers résidus du thème sombre (bouton coreOpen inline, scrollbars
log/side, 3 rects SVG, toggle MWth/MWe JS) — grep #26313b/#2a5666/#0e2431
= 0. 2.5.3 : le guide nomme les commandes COMME L INTERFACE (« Vannes
admission HP », pas « Consigne turbine ») ; lexique côté machine (vannes
HP, HP/BP, condenseur, vide, source froide, aéroréfrigérant). 2.5.4 :
verrines translucides (dalle rgba sur caisson #2a2620, étiquette dans
l épaisseur, reflet ::after, rétroéclairage radial). 2.5.5 : PIÈGE — la
rotation des astuces était calée sur S.t (temps SIMULÉ) : à ×60 une
astuce toutes les 0,75 s réelles ; passée sur Date.now() (30 s réelles) ;
l auto-×60 du toggle Facile RETIRÉ (on informe, on n impose pas) ; stock
porté à 30 astuces sourcées. 2.5.6 : l étiquette AN/RRA de la chaussette
avait été AVALÉE par le replace à ancre ternaire de la 2.4m (leçon :
jamais d ancre conditionnelle courte type ">X</text>") — réinsérée,
vérif des 5 étiquettes de zones. 2.5.7 : selects en styles inline
sombres d époque (srcSel : fond #181f26 + var(--ink) devenue brune =
INVISIBLE sur PC) — srcSel en crème panneau, recPas en vert écran.
2.5.8 : lexique à DEUX NIVEAUX : entrées LEX en objets {d,p}, rendu
<details><summary>en savoir plus</summary> NATIF (zéro JS, PWA-safe),
18 développements mécanistes (vide 28 000:1 / 32-56-96 mbar / 30-40 MW,
iode 135→xénon, résiduelle 230 MW, sous-saturation 155 bar, 3 barrières,
RRA 180/31, accumulateurs passifs, Tmoy programme, TPS vapeur…).

## CHANTIER 2.5.0 — MODE FACILE + THÈME SDC AUTHENTIQUE
Palette SDC (réf. panneau ARE, IMG_3828) : panneaux beige #d8cfba/#c6bba1,
cadres marron #8a765a/#7a6850, encre brune #2b2318, plaques gravées h2
(#e9e1cc), boutons khaki dégradés, voyants ON vert radial lumineux, tuiles
d alarme = AMPOULES : éteintes plaques crème embossées, actives
radial-gradient + box-shadow glow 16px (ambre #f0a91c / rouge #e0392a).
Afficheurs .val et .p.v = LED vertes #3ae065 sur fond noir inset. Les
ÉCRANS restent sombres mais passent VERT-AUTOMATE (--scr #0a120c,
--scrInk #8fe89a) : journal, .mimic (châssis moniteur bord 3px), chaussette
(zones #183a20/#4ae06a, traînée ambre conservée). Pixelisation supervision :
#synop *{shape-rendering:crispEdges} + textes en mono. PIÈGES payés :
(1) mes émissions ont produit DEUX FOIS des caractères parasites
cyrilliques/chinois dans les chaînes CSS — TOUJOURS scanner les non-ASCII
après écriture (recette : set(style) filtré par codes) ; (2) apostrophes
droites françaises DANS des chaînes JS simples-quotes = syntaxe cassée —
utiliser l apostrophe typographique U+2019 dans tous les textes.
MODE FACILE : bouton bEasy (topbar) -> S.easy + accel 60 ; pupitre
formation #easyCard (jaune, pleine largeur au-dessus du layout) ;
LEX ~30 sigles traduits (RPE inclus) + bouton LEXIQUE ; moteur easyMsg()
~18 règles priorisées (dégâts > chaussette > IS > scram > jalons _blkDue/
_accDue/_reaDue > GV bas > par-état), rafraîchi 1 s sim dans render via
window.__easyMsg ; flags exposés : S._reaDue, S._ptBad. La physique est
INTOUCHÉE (bancs identiques). Panoplie 2.5 : 15 tests thème+facile,
TOUS verts avant le numéro de version — règle à conserver.

## AUDIT GLOBAL 2.4s (revue de code + bugs cachés)
Statique : zéro el() orphelin, zéro doublon d id, zéro fonction morte,
fantômes S.* tous en pattern (||0) sûr ; clé morte lastInhib purgée ;
scanner DOM de debug (DIAG UI, setInterval 2 s) RETIRÉ (outil du chantier
« décalage horizontal iOS », clos — recette : parcourir les feuilles du DOM
et logger celles dont getBoundingClientRect().right dépasse le viewport).
Boucle temps : sub-stepping (accel appels de physStep(0.05) par tick) —
stabilité numérique structurelle à ×300. Enregistreur : buffers bornés.
LE bug d exploitation caché : la page INHIBITIONS était une façade — les
6 points d application existaient (logInhib) mais AUCUN handler de bouton.
Câblés (2.4s) : inhIS, inhEAS, inhASG (couvre bascule AN/GV + MPS sur IS +
niveau très bas + TPS), inhIsoE (phase A sur IS + P enceinte), inhIsoV
(découplage RTV + via isolement enceinte), inhKrt. Bloc IS scindé en logs
granulaires. Campagne bugs cachés : panne mystère ×5 (pool, anti-répétition,
réparation) ; APRP en AN/RRA ; RTGV+CRF ; LOOP+H3 ; spam boutons ; consigne
175 bar -> AAR pression pressuriseur haute AVANT SEBIM (protection vérifiée).
Perte RRA en AN/RRA : borne froide rendue ASYMÉTRIQUE (refroidissement piloté
−30 °C/h, réchauffement libre +70) et loi de saturation froide ajoutée :
Ppzr ≥ psat(Tavg) hors brèche (le circuit fermé qui sature monte en
pression) — l accident mi-boucle devient lisible sur la chaussette.

## AUDIT DES ANNOTATIONS DE LA FIGURE 4.1 (2.4q)
Chaque annotation du schéma -> codée ? vérifiée ? comment :
· Tsat−30 : plancher pFloor + alarme + polygone — vérifiée (aller-retour).
· Tsat−110 : plafond pCeil + alarme + polygone — vérifiée (remontée).
· ΔP max plaques GV = 110 b : plafond pCeil + alarme — vérifiée (descente).
· Température Max du RRA (180 °C) : garde ANRRA + verticale — vérifiée.
· Couloir 25-31 b : plafond + alarme + yeux — vérifié (aller-retour).
· P tarage des soupapes GV : svf tarées 90 b — VÉRIFIÉE par transitoire
  (trip turbine pleine puissance, GCT condamné : pic 92,6 b, svf 66 %).
  Note : à l arrêt (Tavg 294) le cap Psteam≤psat(Tavg)=79 les rend
  inatteignables : c est leur vrai rôle (transitoires depuis la puissance).
· Limite NPSH des pompes primaires : garde ΔTsat<8 °C sur la branche
  chaude — RESSUSCITÉE (2.4q) : elle vivait dans trips(), coupée après
  l AU, avec Tavg+14 codé en dur ; déplacée en zone commune slowStep
  avec dTgm() vrai. Vérifiée : APRP -> GMPP stoppées t+2 min, log
  « circulation naturelle », cœur couvert. Invariant banc ajouté.
· Zones API/APR : gardes de température ALIGNÉES figure (APIF ≤70,
  APIO ≤50, APR/RCD ≤45 — étaient 90/80/70) — parcours vérifié.
· « Limite inférieure de connexion du RRA » (~66 b sur le schéma) :
  LECTURE À ARBITRER PAR ANTONY — candidates : pression max de
  dimensionnement/soupapes RRA ? borne haute de la fenêtre de connexion ?
  La garde codée reste P ≤ 31 b (aspiration).

## LA FIGURE EST LA LOI (2.4o) — leçon de méthode d Antony
« Si on sort des clous, c est qu il nous manque quelque chose » : on ne
déforme JAMAIS le domaine pour englober une trajectoire. Le « pied élargi »
(2.4m) était une rustine fausse : polygone restauré à la figure exacte
(bas Tsat−30 borné 27, verticale 180, zéro diagonale). Les manques réels,
trouvés grâce à ce principe : (1) la RÈGLE DU COULOIR — sous 180 °C le
domaine n existe qu à ≤31 bar — désormais au plafond de cible pCeil
(accidents exemptés : brèche/RTV/RTGV), dans l alarme aPT et dans les yeux ;
(2) la SÉQUENCE canonique : consigne pressuriseur 27 posée DÈS le début de
la descente (la pression longe le bord Tsat−30, atteint 27 vers 198 °C,
entre dans le couloir AVANT 180) ; (3) le BLOCAGE IS n appartient pas aux
états : applyEtat ne le reset plus jamais (seules sorties : délevée auto
P≥139, Réarmer IS) — sinon la remontée déclenchait l IS à P=25 bar et les
pompes de sûreté « remontaient » la pression à 150 bar sous 155 °C ;
(4) en REMONTÉE, applyEtat préserve aussi accIso (rappel CONDUITE de
réalignement à P>50) ; (5) cap vapeur net Psteam≤psat(Tavg). Trajectoire
aller-retour validée : couloir → Tsat−110 → 155 bar, zéro violation.

## RETOURS TERRAIN (2.4m) — 7 points d Antony
Carte chaussette : titre sans mention fig. 4.1 ; pied du polygone AN/GV
élargi 160-180 °C (la dépressurisation finale ~175 °C passait VISUELLEMENT
hors tracé — physique correcte, géométrie trop stricte) ; zones API et APR
ajoutées ; zoom pinch (mkPinch généralisé, partagé avec la synoptique,
bouton 1:1) ; padding-bottom 84px (barre de nav). Le « 64 bar infranchissable »
= le plancher Tsat−30 (psat(250+30)=64) : VOULU — nouveau log CONDUITE quand
la consigne est sous le plancher (« la pression suivra le refroidissement »).
Seuil d alarme GCT aligné sur l affichage (0.8 %). Le point fixe de remontée
vu en fin de session précédente n a PAS été reproduit sur le build livré
(remontée 117→294 °C à 58 °C/h validée) ; scénario remontée AJOUTÉ à la
grille des yeux pour surveillance permanente.

## LES YEUX DU PILOTE (2.4k) — yeux.js
Bibliothèque d auto-surveillance : ~20 règles de vraisemblance physique
évaluées à CHAQUE échantillon d une grille de 15 scénarios (usage :
`node yeux.js index.html`). Règles : bornes/NaN, ordre thermique, pincement
GV jamais négatif, marge de sous-saturation, rendement 30-38,5 % en régime
couplé, Tare ≤ Tsat(vapeur), MWe sans turbine, accus jamais re-remplis,
gradients SOUTENUS fenêtrés 10 min (Tavg ≤ 62 °C/h, Ppzr ≤ 7,5 bar/min hors
accident), résiduelle décroissante post-scram, bilan masse GV, matrice de
sens de réponse des actionneurs. Trouvailles autonomes de la session :
ΔT boucle corrigé 28→36 °C (dTgm 14→18, réf. 329/293) ; limiteur de
gradient de refroidissement 28 °C/h ajouté sur la rampe gctSet (log
CONDUITE). Leçon de calibration : vérifier les UNITÉS des détecteurs
(les premiers yeux confondaient minutes et secondes, facteur 60).
QUESTION DE DESIGN pour Antony : les presets d états téléportent encore
Tavg (ex. ANRRA : 178→120 d un coup) — faut-il une trajectoire continue
au RRA (~28 °C/h réels, soit ~24 s à ×300) comme on l a fait pour la
pression ? Les yeux excluent les 12 min post-transition en attendant.
PISTE RENDEMENT FERMÉE (2.4p) : Pelec était linéaire en turb SANS pertes
fixes -> le rendement MONTAIT à charge partielle (36,2 % à 30 %) au lieu de
baisser. Loi corrigée : pet=max(0,(turb/100)×1362×min(1.2,Psteam/71)×eta−62)
(~62 MWe de pertes fixes : auxiliaires + hors point de conception), calée
sur le réel : 34,7 / 34,0 / 33,0 / 31,5 % à 100/75/50/30 % — validée ±1,2 pt
aux quatre paliers. Le seuil ~4,5 % turb où la turbine ne couvre plus les
auxiliaires émerge naturellement. Règle yeux : dénominateur Ptot (la
résiduelle fait aussi de la vapeur), bande 29-36 %.', Gradient de la branche froide borné à
30 °C/h (2.4k) : le RRA ne refroidit plus en téléport après l admission.
Écart de jouabilité ASSUMÉ : pentes turbine 0,2-1,2 %/s vs ±5 %/min réels.

## CHAUSSETTE (2.4j) — carte du domaine P-T
Nouvel onglet « Chaussette » (5e bouton nav) : le diagramme fig. 4.1 tracé
en SVG (polygones AN/GV + AN/RRA précalculés aux formules psat, courbes
saturation / Tsat−30 / Tsat−110), le point (Tmoy, Ppzr) coloré vert/rouge
selon le domaine, et la TRAÎNÉE d une heure (buffer S._sock, 240 pts × 15 s,
préservé à travers les états pour voir toute la traversée). La limite
Tsat−110 (sous-refroidissement MAX, choc froid) est désormais codée au
plafond de cible : sous ~255 °C la dépressurisation auto suit min(ΔP plaques,
Tsat−110) — à 180 °C le plafond vaut ~74 bar, conforme au coin de la figure.

## FIGURE 4.1 — domaine P-T (2.4h, référence contractuelle d'Antony)
Codé « à la lettre » : plancher chaud = Psat(Tmoy+30) [courbe Tsat−30] ;
plafond = Psteam+110 [ΔP max plaques GV] avec dépressurisation AUTOMATIQUE
pilotée par le domaine (log CONDUITE) + rattrapage prioritaire (−0,25 bar/s
si P>plafond) ; alarme rouge « Domaine P-T » (aPT) sur toute sortie ;
RTGV = procédure réelle (refroidir ~260 °C PUIS égaliser — validée, 2,4 GBq).
Trajectoire mesurée : 155/292 → 141/224 → 130/190 : conforme au polygone.
CHANTIER FERMÉ (2.4i) : la « stagnation » à 42 bar était PHYSIQUE — les
accumulateurs RIS (tarage 42 bar) se vidangeaient dans le primaire et
clouaient la pression. Le manque était la CONDUITE : l'isolement des accus
(bouton ISOLER dans la carte RIS, rappel amber + alarme « Isolement accus »
vers 50 bar en descente, presets froids isolés, RP/ANGV alignés — l'APRP
garde ses accus). La garde d'admission AN/RRA « P ≤ 31 bar » est ACTIVE ;
la séquence complète de descente (fig. 4.1) : gctTgt bas (jamais gctSet :
il est rampé vers gctTgt), blocage IS < P11, isolement accus < ~50 bar,
consigne pressu 27, admission. Le banc joue cette conduite dans les
parcours d'états (ANRRA et APIO/APR/RCD).

## Pression primaire : trajectoire, jamais de saut (2.4g)
La pression suit la courbe P-T : montée bornée ~2 bar/min (chaufferettes),
descente ~4 bar/min (aspersion) dans LES DEUX branches (chaude et froide) ;
seules les décharges accidentelles (SEBIM/brèche/perte d inventaire) vont
vite. Les presets d état ne téléportent plus Ppzr : le clic pose la CONSIGNE
et la pression fait ses ~30 min de descente (6 s à ×300). L admission AN/RRA
peut être refusée par la résiduelle : la traversée s arrête, c est voulu.

## Données réelles injectées (campagne 17/07)
Résiduelle : 3 groupes calés ANS (2,6 %/300 s + 2,4 %/40 min + 0,9 %/36 h),
points 60 s:4,4 · 10 min:2,6 · 1 h:1,45 · 10 h:0,72 · 24 h:0,55 % (tous ±22 %).
Xénon : λI=2,87e-5, λXe=2,09e-5, σφ=8,5e-5 s⁻¹ (I/Xe équil.=3,3) -> pic ~2×
vers 9-11 h. Gradient de refroidissement mesuré 27 °C/h (réel : 28 normal).
Rendement 34-36 % à toute charge. TPA : 2×5000 t/h/80 bar, conso 0,4-1,3 %.
Une perte réseau SANS séquence d îlotage (ilote/runbk/gctB/rodDrop) déclenche
la chaîne LOOP -> AU : comportement voulu, ne pas « corriger ».

## LE FIL DU MW (référence d'audit — toute modification s'y confronte)
Cœur (Pn×3800 MWth) → +GMPP (~20 MW, source PRIMAIRE) → 4 boucles (Tavg, ΔT
via dTgm) → pressuriseur TIENT pzrSet (chaufferettes, indépendant de Tavg) →
GV (prod vapeur = Ptot si mouillés) → VVP 71 bar → turbine (D=turb/100 ;
soutirages implicites dans le rendement) + GCT-c (condenseur) + GCTa/soupapes
(atmosphère, amont VIV) → condenseur (CRF/CVI, vide) → CEX → ABP → bâche
dégazeuse → TPA (vapeur barillet) → AHP → ARE (Tare=45+185·turbf, τ 700 s
= inertie réchauffeurs ; turbine déclenchée mais VVP en pression : la bâche
est MAINTENUE en conditionnement par la vapeur du barillet, plancher ~140 °C —
précision d Antony 16/07, Tare ne retombe à 45 que sur isolement vapeur) → GV. Secours : ASG (MPS élec / TPS vapeur GV,
conso ∝ débit pompé) depuis la bâche ASG.
Règle : chaque source a un chemin et un puits VISIBLES ; toute relaxation
porte le τ physique de son équipement ; les bilans de bout en bout (rendement
31-37 %) sont des invariants du banc.

## RTV sans conduite = accident grave (voulu)
GV sec -> Tavg monte -> Psat pousse Ppzr -> SEBIM déchargent l inventaire ->
découvrement -> fusion. Chaîne accidentelle LÉGITIME testée comme telle
(sans action : dmg>50 % ; avec colmatage+réalimentation : sauvée).
Ne pas « corriger » cette dérive : c est la physique du GV sec.

## Audit vague G (constantes de temps, 15/07) — résultat
Toutes les relaxations passées en revue : saines, sauf UN candidat restant :
la repressurisation primaire (τ≈8 s vers la cible) est ~20× plus rapide que
les chaufferettes réelles (~1-2 bar/min). Sans conséquence de conduite depuis
que la pression est tenue ; à trancher avec Antony si l'on borne la remontée
(+0.03 bar/s). Penc relaxe vers 1 bar en branche froide : légitime (tranche
ouverte/ventilée). Le terme GMPP est une source PRIMAIRE (tgt et Pdry),
jamais une production directe — MAIS le flux traverse : prod inclut
gmppN×0.0013×w (GV couplés), sinon les 20 MW disparaissent du fil du MW
et le GCT retombe à ~0,2 % (constaté par Antony). Les seuils d affichage
(« Fermé ») ne doivent jamais masquer un organe qui débite (ex-seuil 2 %).

## Style de travail
Réponses techniques directes, corrections franches acceptées et attendues.
Tests sur iPhone (PWA installée). Anonymat du dépôt public : ni prénom, ni
employeur, ni site nucléaire nommé dans les fichiers livrés.
