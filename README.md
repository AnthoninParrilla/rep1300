# Simulateur de tranche REP 1300 MWe — palier P4

Simulateur pédagogique d'une tranche nucléaire française du palier P4 (1300 MWe), dans un **fichier HTML unique et autonome** (~160 Ko, aucune dépendance externe). Il tourne dans n'importe quel navigateur, s'installe comme application hors-ligne (PWA avec service worker) et s'héberge sur GitHub Pages. Esthétique de salle de commande sombre, utilisable au doigt sur mobile comme au clavier sur poste.

Ce n'est pas un code de calcul : c'est un modèle physique simplifié mais **causalement juste**, où chaque effet a sa cause réelle, avec la nomenclature authentique des tranches françaises de bout en bout. Version courante : **2.1**.

---

## Ce que le simulateur sait faire

### États de tranche et conduite normale

Les sept états standards sont modélisés avec leurs presets réalistes : **RP** (réacteur en production), **AN/GV**, **AN/RRA**, **API fermé**, **API ouvert**, **APR** (arrêt pour rechargement) et **RCD** (réacteur complètement déchargé). Les transitions descendantes sont soumises à des **gardes physiques évaluées sur l'état réel de la tranche** : puissance résiduelle, température moyenne, pression primaire. Impossible de sauter de la pleine puissance au cœur déchargé : la descente se mérite.

La conduite couvre : le suivi de charge par la turbine avec **rampe de charge limitée** (~0,6 %/s — la consigne du curseur est suivie à vitesse admissible, plus de transitoire brutal qui fait chuter la pression primaire), la borication/dilution, le refroidissement par abaissement de la consigne GCT à rampe limitée (≈ −28 °C/h), la mise en service du RRA, la **dépressurisation de fin de refroidissement** (la consigne pressuriseur descend en rampe : tenue ~25 bar sous RRA chaud, ~2 bar tranche froide, spray manuel pour accélérer), l'ouverture du circuit primaire, la manutention combustible.

**Gestion de réactivité à la manière du parc français** : la régulation automatique du groupe R travaille entre sa butée haute et une **butée basse d'exploitation (28 %)** — jamais les grappes au fond en fonctionnement. Si la régulation vient en butée, un message d'exploitation demande de **compenser par borication** pour remonter les grappes. Et le bore a un coût visible : chaque borication ou dilution alimente le compteur **« Effluents vers TEP »** (débit REA réaliste ~27 m³/h) — la gestion de réactivité privilégie les grappes, l'acide borique reste le réglage fin, et l'eau déplacée part à la station de traitement des effluents.

**Ouverture du circuit primaire sous xénon** : plutôt qu'un refus bloquant, l'ouverture anticipée met en service le **balayage EBA** avec **rejet contrôlé à la cheminée par DVN**, journalisé ; la ventilation reste ensuite en service tranche ouverte (le xénon produit par l'iode résiduel est repris en continu).

### Neutronique et cœur

Cinétique ponctuelle pilotée par la réactivité totale : grappes, bore, **xénon dynamique** (pic post-AAR, reprise par l'iode), défaut de puissance, contre-réaction modérateur, effet de vidange, AU. Calage critique au bore, **RPN trois chaînes** avec multiplication sous-critique en 1/(1−keff), RIC, niveau cuve post-accidentel.

La **carte du cœur** (bouton dédié dans la carte RPN/RIC) affiche les 193 assemblages en modale interactive : cinq modes de coloration, détail par assemblage, gestion trois tiers avec épuisements **déterministes** — aucun aléa dans tout le simulateur.

### Thermohydraulique primaire

Température moyenne assise sur la saturation secondaire, ΔT de boucle fonction du nombre de **GMPP (4, 3 ou 0)** avec thermosiphon. Pressuriseur : chaufferettes/aspersion auto-manu, pression naturelle fonction de température et inventaire, **soupapes SEBIM** déchargeant dans le **RDP** (disque de rupture — le scénario TMI se joue tel quel). Inventaire vivant : brèche, décharge, ébullitions, appoint RCV, **conservation stricte de l'eau** — la bâche ne se vide que du débit réellement injecté, et l'injection dans un **primaire plein le pressurise** (gavage) jusqu'au refoulement des pompes.

**Signal IS réarmable** : le signal latché se réarme par bouton dédié (refusé tant que la pression reste sous 122 bar), arrêt ISHP/ISBP — fini la bâche PTR qui se vide sur un signal oublié.

### Réserves d'eau finies

**Bâche ASG** (~1 400 m³, ~12 h, réappoint SEC), **bâche PTR** (3 000 m³) visible qui se vide en direct, bascule automatique en **recirculation sur les puisards**, et la règle qui fait tout tenir : recirculation sans SEC = recirculation chaude = fusion inexorable.

### Secondaire et évacuation d'énergie

GV avec bilan de niveau complet (ARE trois éléments, **ASG quatre pompes MPS/TPS** avec verrou opérateur, évaporation réduite GV isolé), turbine, GCT-c/GCTa, TPA conditionnées au vide et aux VIV, îlotage (repli stable, groupe R à mi-course — plus jamais au fond), condenseur avec les deux dégradations CRF (rapide) / CVI (lente), source froide quatre types × saisons, **aéroréfrigérant à silhouette hyperbolique générée**.

### Accidents — quatorze incidents réversibles

APRP, RTGV (isolement VVP automatique sur activité N-16 + AU), fuite tube, ruptures de gaines réglables, pertes CRF/CVI/SEC/RRA, perte 1 ou 4 GMPP, déclenchement turbine, îlotage, **H3/LLS**, perte ARE. Chaîne accident grave complète : découvrement → seuils métallurgiques (800/900/1 200/2 200 °C) → hydrogène → déflagration à 9,5 % → rupture du confinement. Séquences validées : **H1**, **perte totale de source froide**, **TMI**, **gavé-ouvert** (à puissance : AU sur basse pression pressuriseur d'abord, comme le veut le RPR).

### Protections, automatismes, inhibitions

AAR multi-causes, IS latchée/réarmable/blocable, isolements VVP et enceinte, EAS, démarrage auto ASG, déclenchements, runback. Les **sept inhibitions** se manipulent individuellement, chaque ordre inhibé tracé au journal.

### Instrumentation et enregistrement

Chaînes **KRT** en unités réelles avec formatage ingénieur : activité RCV (Bq/L), **chaîne VVP double valeur** (débit de fuite en L/h — l'affichage opérateur — et débit de dose), CVI, dose enceinte EBA. **Enregistreur multi-voies permanent** sous le journal : échantillonnage à **pas fixe en temps tranche** (1 s / 10 s / 1 min), une ligne complète par pas en colonnes alignées, **événements insérés dans le flux** (`***`) comme sur un listage de tranche, marche/arrêt strict, export complet, cadre redimensionnable, en-tête figé. Journal horodaté, bandeau d'alarmes.

### Synoptique

Mimique SVG complète au rendu vérifié (rasterizer d'inspection + détecteur numérique de collisions) : **cuve en coupe** aux proportions réalistes — fond et couvercle hémisphériques, brides boulonnées, **mécanismes de commande de grappes connectés par leurs adaptateurs de couvercle**, tubes-guides et grappes coulissantes, crayons à embouts, **eau primaire visible jusque dans le dôme** (elle suit le niveau cuve : on voit le découvrement), **pénétrations RIC par le fond** (spécificité du palier 1300), **plan de tubulures unique** — branche chaude à droite, branche froide revenant par la gauche à la même cote avec pont de croisement. **Pressuriseur** en capsule (chaufferettes en peigne, aspersion, SEBIM latérale) relié au **RDP** (niveau, disque). **Circuit d'injection fidèle** : aspiration commune à la bâche PTR, pompe **RIS** (ISHP/ISBP) vers la branche froide, pompe de charge **RCV vers les joints des GMPP** (débit permanent animé), **accumulateurs sous azote dans l'enceinte** à décharge passive visible, puisards, recirculation (rouge si chaude). GV, salle des machines, condenseur, aéroréfrigérant, grand afficheur MWth/MWe.

### Interface

Contrôles auto/manu partout, temps accéléré ×1–×300 à **ligne de temps unifiée** (aucun phénomène ne rate l'accéléré), **barre de navigation mobile** (Synoptique · Incidents · Inhibitions · Turbine), mise en page stable (les journaux défilent dans des cadres fixes, la page ne « respire » pas), reset, bouton ☢ de démonstration avec recadrage automatique sur la synoptique.

---

## Limites assumées

Modèle mono-boucle / mono-GV équivalent, cinétique ponctuelle, thermohydraulique à constantes de temps calibrées, pas de calcul de criticité fin. Un outil pour **comprendre les enchaînements** — pas pour dimensionner.

---

## Historique du développement

Construit en itérations serrées entre un professionnel du nucléaire (validation physique, corrections de terrain, nomenclature) et Claude (Anthropic), avec validation numérique systématique en Node.js avant chaque livraison.

**Fondations** : panneau RNR sodium, puis bascule REP 1300 P4 — synoptique, états, incidents, enregistreur, PWA GitHub Pages.

**Construction des systèmes** : GCT, VIV, pressuriseur, SEBIM, sources froides, cuve selon les états, RPN/RIC/carte du cœur, KRT, inhibitions.

**Corrections de terrain** : ASG quatre pompes et conduite sur turbopompes seules, CRF vs CVI, TPA au vide, GMPP et thermosiphon, ARE trois éléments, ligne de temps unifiée.

**Le chantier des réserves finies** : bâche ASG finie, assèchement H1, bâche PTR 3 000 m³, puisards, recirculation conditionnée à SEC, séquences de fusion sur les vrais seuils métallurgiques.

**Précisions d'expert** : chaîne KRT VVP en L/h, RDP et scénario TMI, suppression de tout aléa, aéroréfrigérant à l'équation de l'hyperboloïde.

**Révision générale (1.7)** : batterie systématique des incidents avec comparaisons croisées de logique — cinq bugs corrigés dont les gardes d'états aveugles (pré-vérification sur l'état réel), 23/23 scénarios au vert.

**Synoptique 2.0** : cuve et pressuriseur régénérés mathématiquement, RDP/PTR/puisards/recirculation dessinés, eau primaire visible, méthode « yeux bioniques » (rasterizer d'inspection maison + détecteur numérique de collisions) après plusieurs passes de corrections sur captures annotées.

**Conduite 2.1** : balayage EBA/rejet DVN à l'ouverture sous xénon, dépressurisation de fin de refroidissement, réarmement IS, conservation PTR et gavage primaire plein, rampe de charge turbine, **butée basse d'exploitation du groupe R** avec message de borication, **compteur d'effluents TEP**, circuit RIS/RCV/accumulateurs fidèle sur la mimique (charge aux joints GMPP), cuve trapue à plan de tubulures unique, carte du cœur dans RPN/RIC, navigation mobile.

---

*Conception, validation physique et corrections de terrain : un professionnel du nucléaire. Développement : Claude (Anthropic). Fichiers `index.html` + `sw.js`, hébergeables sur GitHub Pages, utilisables hors-ligne.*
