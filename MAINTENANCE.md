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
