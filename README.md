# REP 1300 — simulateur de tranche nucléaire

Un simulateur pédagogique d'une tranche REP 1300 MWe du palier P4, entièrement
contenu dans **un seul fichier HTML** (~190 Ko, zéro dépendance). Il s'ouvre dans
n'importe quel navigateur, s'installe comme application hors-ligne sur téléphone
(PWA) et se pilote au doigt. L'ambition : que la physique et la conduite soient
assez justes pour qu'un exploitant s'y retrouve — nomenclature du parc, ordres de
grandeur réels, protections câblées comme sur le palier.

## Jouer

Ouvrir la page, c'est tout. La tranche démarre en **RP** (réacteur en production,
100 % Pn). Trois vitesses de simulation : ×1, ×60, ×300. Sur iPhone : « Ajouter à
l'écran d'accueil » pour l'installer hors-ligne.

Premiers gestes : baisser la consigne turbine et regarder les grappes suivre ;
déclencher un arrêt d'urgence et conduire le repli ; descendre la tranche
jusqu'au cœur déchargé (RCD) en passant par tous les états intermédiaires.

## Conduire

- **États de tranche** : RP · AN/GV · AN/RRA · API fermé · API ouvert · APR · RCD,
  avec traversée séquentielle et conditions physiques d'admission.
- **Réactivité** : grappes AUTO/MANU, borication et dilution (effluents comptés
  vers le TEP), xénon, effet modérateur — la divergence se mérite.
- **Turbine** : consigne d'admission, pente de prise de charge sélectionnable
  (0,2 / 0,6 / 1,2 %/s), couplage, îlotage.
- **Pressuriseur** : la pression est tenue par la consigne (chaufferettes /
  aspersion) ; la dépressurisation est une action de conduite.
- **Secondaire** : GCT condenseur et atmosphère, ARE trois éléments ou manuel,
  ASG (motopompes et turbopompes), gestion du niveau GV.
- **Signaux** : blocage IS sous P11 (avec alarme de rappel), réarmements AU et IS,
  isolement enceinte.

## Survivre

Dix-sept incidents injectables, seuls ou combinés : déclenchement turbine, perte
d'une ou des quatre GMPP, perte ARE, perte CVI, perte RRI, brèche primaire (APRP), perte de
la source extérieure, défaillance des diesels (H3), perte CRF, perte SEC, fuite
de tube GV, ruptures de gaine, perte RRA, RTGV franche, rupture de tuyauterie
vapeur (RTV), dilution intempestive, panne mystère à diagnostiquer — et un bouton
de démonstration pour tout faire péter.

Les protections répondent comme sur le palier : AAR (flux, pressions, niveaux GV,
déclenchement turbine > P7), permissifs P7/P11/P14, isolement vapeur sur
découplage pression/température, chaîne LOOP complète, consignes automatisées
(arrêt GMPP sur perte de sous-refroidissement, isolement du GV affecté sur RTV).
Sans conduite, les accidents vont au bout : GV secs, découvrement, fusion. La
radioprotection suit (chaînes KRT, rejets cheminée et rejets accidentels en GBq).

## Sous le capot

Un enregistreur 26 voies, un journal d'événements horodaté, et un banc de tests :
`node tests-invariants.js index.html` rejoue états, transitoires et accidents en
vérifiant les invariants d'exploitation (bilans fermés, rendement de cycle,
sous-refroidissement, absence d'oscillations). Toute contribution passe par lui.
Le fichier MAINTENANCE.md documente la méthode et les pièges connus.

## Versions

- **2.4** — fiabilisation : physique pressuriseur tenue par la consigne, pente de
  charge turbine, assistance au blocage IS, inertie du poste d'eau, échauffement
  GMPP au primaire, invariants de conservation.
- **2.3** — câblages inter-systèmes du palier, RTV, consignes automatisées,
  banc d'invariants.
- **2.2 et avant** — construction : états, incidents, KRT, enregistreur, PWA.

---

*by Claude & AnthoninP*
