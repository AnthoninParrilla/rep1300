# REP 1300 — simulateur de tranche nucléaire

Un simulateur pédagogique d'une tranche REP 1300 MWe du palier P4, entièrement contenu dans **un seul fichier HTML** (~200 Ko, zéro dépendance). Il s'ouvre dans n'importe quel navigateur, s'installe comme application hors-ligne sur téléphone (PWA) et se pilote au doigt. L'ambition : que la physique et la conduite soient assez justes pour qu'un exploitant s'y retrouve — nomenclature du parc, ordres de grandeur réels, protections câblées comme sur le palier.

## Jouer

Ouvrir la page, c'est tout. La tranche démarre en **RP** (réacteur en production, 100 % Pn). Trois vitesses de simulation : ×1, ×60, ×300. Sur iPhone : « Ajouter à l'écran d'accueil » pour l'installer hors-ligne.

Premiers gestes : baisser la consigne turbine et regarder les grappes suivre ; déclencher un arrêt d'urgence et conduire le repli ; descendre la tranche jusqu'au cœur déchargé (RCD) en passant par tous les états intermédiaires — puis la remonter.

## Conduire

- **États de tranche** : RP · AN/GV · AN/RRA · API fermé · API ouvert · APR · RCD, avec traversée séquentielle et conditions physiques d'admission alignées sur le domaine (P,T) des états standards. Plus aucun téléport : température et pression suivent leurs trajectoires physiques bornées, à la descente comme à la remontée.
- **La Chaussette** : le diagramme (P,T) de la figure 4.1 tracé aux vraies formules, avec le point de fonctionnement en temps réel (vert dans le domaine, rouge dehors) et une traînée d'une heure. Zoom pinch. C'est la preuve visuelle continue que la simulation respecte le comportement de l'eau pressurisée.
- **Réactivité** : grappes AUTO/MANU, borication et dilution (effluents comptés vers le TEP), xénon calé sur les vraies constantes (pic ~2× à t+9 h), effet modérateur — la divergence se mérite, et la fenêtre d'empoisonnement existe.
- **Turbine** : consigne d'admission, pente de prise de charge sélectionnable (0,2 / 0,6 / 1,2 %/s), couplage, îlotage avec conduite xénon.
- **Pressuriseur** : la pression est tenue par la consigne (chaufferettes / aspersion) et **bornée par le domaine** — plancher Tsat−30, plafonds ΔP plaques et Tsat−110, couloir ≤31 bar sous 180 °C. La dépressurisation suit automatiquement le domaine en refroidissement.
- **Secondaire** : GCT condenseur et atmosphère avec limiteur de gradient (≤28 °C/h), ARE trois éléments ou manuel, TPA avec minimum technique et consommation vapeur réelle, ASG (motopompes et turbopompes), bascules automatiques loggées.
- **Signaux et conduite** : blocage IS sous P11 (rappel + délevée auto à P≥139), isolement/réalignement des accumulateurs RIS (rappels aux bons moments), réarmements AU et IS, isolement enceinte. Le blocage IS et l'isolement accus appartiennent à la conduite : les changements d'état ne les effacent pas.

## Survivre

Dix-sept incidents injectables, seuls ou combinés : déclenchement turbine, perte d'une ou des quatre GMPP, perte ARE, perte CVI, perte RRI, dilution intempestive, rupture de tuyauterie vapeur (RTV), brèche primaire (APRP), perte de la source extérieure, défaillance des diesels (H3), perte CRF, perte SEC, fuite de tube GV, perte RRA, RTGV franche, et la panne mystère à diagnostiquer — plus les ruptures de gaine au curseur, et un bouton de démonstration pour tout faire péter.

Les protections répondent comme sur le palier : AAR (flux, pressions, niveaux GV, déclenchement turbine > P7), permissifs P7/P11/P14, isolement vapeur, chaîne LOOP complète, arrêt GMPP sur perte du sous-refroidissement (ΔTsat < 8 °C), soupapes GV tarées 90 bar, isolement du GV affecté sur RTV. Sans conduite, les accidents vont au bout : GV secs, découvrement, fusion. La radioprotection suit (chaînes KRT, rejets cheminée et rejets accidentels en GBq).

## Sous le capot

- **Un fichier**, aucune bibliothèque. Boucle physique à 20 Hz, thermohydraulique à constantes de temps réelles, cinétique point avec contre-réactions.
- **Données réelles injectées** : 329/293 °C (ΔT boucle 36 °C), résiduelle à trois groupes calée sur la courbe ANS (±22 % de 60 s à 24 h), rendement net 34,7 / 33 / 31,5 % à 100/50/30 % de charge, TPA 2×5000 t/h à 80 bar, bâche ASG 1400 m³.
- **Deux bancs de test** : `tests-invariants.js` (les invariants d'exploitant, cycle complet RP→RCD→RP, incidents, conduites canoniques) et `yeux.js` (les « yeux du pilote » : ~20 règles de vraisemblance physique jugeant chaque échantillon d'une grille de 16 scénarios — bornes, pincements, gradients soutenus, bilans, sens de réponse des actionneurs). Usage : `node tests-invariants.js index.html` · `node yeux.js index.html`. Toute contribution passe par eux.
- **Instrumentation** : enregistreur 26 voies, journal d'événements horodaté, ~40 tuiles d'alarme. Le fichier MAINTENANCE.md documente la méthode, les données sourcées et les pièges connus.

## Historique

### Lignée 2.4 — fiabilisation

**2.4 → 2.4e — le poste d'eau remis d'équerre.** La pression primaire est tenue par sa consigne (découplée de Tmoy : la remontée post-AU redevient possible). Les TPA gagnent leur physique : consommation vapeur sourcée (0,4 → 1,3 % du débit selon la charge), arrêt sur **minimum technique** quand la demande s'étiole, et bascule automatique sur les motopompes ASG — l'AN/GV se conduit à l'ASG, comme sur le palier. Blocage IS assisté sous P11, trois pentes de turbine, GCT jamais refermé à tort.

**2.4f — la campagne des données réelles.** Résiduelle recalée en trois groupes sur la courbe ANS (elle faisait 0,08 % à 24 h au lieu de 0,55 : la tranche « s'éteignait » thermiquement) ; xénon recalé (σφ nominal : le pic post-trip passe de 1,3× à **1,97× à t+8,5 h**) ; RP 24 h sans dérive ; post-AU 12 h ; suivi de charge journalier validé.

**2.4g-h — la figure 4.1 entre dans le code.** Plus de saut de pression aux changements d'état : trajectoires bornées (~2 bar/min chaufferettes, ~4-7 aspersion). Plancher Tsat−30, plafond ΔP plaques = 110 bar avec **dépressurisation automatique pilotée par le domaine**, alarme « Domaine P-T », RTGV ramenée à la procédure réelle (refroidir vers 260 °C *puis* égaliser).

**2.4i — l'isolement des accumulateurs.** La « stagnation à 42 bar » élucidée : les accus RIS se vidangeaient dans le primaire. Nouveau bouton ISOLER, rappels de conduite, garde d'admission AN/RRA. La contre-épreuve punit l'oubli comme en vrai.

**2.4j — la Chaussette.** Le domaine (P,T) devient une carte vivante : polygones aux formules exactes, courbes de saturation, point coloré, traînée. En la dessinant « à la lettre », la limite Tsat−110 (choc froid) entre au plafond de cible.

**2.4k — les yeux du pilote.** Bibliothèque d'auto-surveillance (`yeux.js`) : 3 960 échantillons jugés par balayage. Premières prises autonomes : ΔT boucle corrigé 28→36 °C (les branches affichent 328/292 comme le palier), limiteur de gradient de refroidissement 28 °C/h.

**2.4l — Tavg sans téléportation.** Les presets d'état ne posent plus que les systèmes et les consignes : la température vit ses trajectoires (RRA borné 30 °C/h, remontée au rythme de l'énergie disponible — résiduelle + GMPP, ~58 °C/h). Lois de couplage : la vapeur ne dépasse jamais la saturation du primaire.

**2.4m-n — la figure est la loi.** Retours terrain intégrés (zoom, zones API/APR, marges d'écran, seuil d'alarme GCT) — et une leçon de méthode : on ne déforme jamais le domaine pour englober une trajectoire. La **règle du couloir** (≤31 bar sous 180 °C) manquait : elle entre au plafond, à l'alarme et aux yeux ; la séquence canonique de descente pose la consigne pressuriseur dès le début (la pression longe le bord Tsat−30).

**2.4o — la conduite n'appartient pas aux états.** Le blocage IS et l'isolement accus survivent aux changements d'état (la remontée déclenchait l'IS à 25 bar et « remontait » à 150 bar par les pompes de sûreté !). Aller-retour complet RP→AN/RRA→RP validé dans la chaussette, zéro violation.

**2.4p — le rendement d'une vraie tranche.** Pelec gagne ses pertes fixes (~62 MWe d'auxiliaires) : le rendement **baisse** désormais à charge partielle (34,7 → 31,5 % de 100 à 30 %), calé ±1,2 point aux quatre paliers, et le seuil de couplage (~4,5 % turbine) émerge naturellement.

**2.4q-r — l'audit des annotations.** Chaque annotation de la figure 4.1 vérifiée par test : soupapes GV (pic 92,6 bar mesuré), **limite NPSH ressuscitée** (la garde d'arrêt GMPP était morte après l'AU — marge de −18,5 °C sans réaction), gardes API/APR alignées (≤70/50/45 °C), et harmonisation couloir/garde d'admission (30,5/31 bar).

### Lignées antérieures

**2.3** — câblages inter-systèmes du palier, RTV, consignes automatisées, premier banc d'invariants. **2.2 et avant** — construction : états, incidents, chaînes KRT, enregistreur, PWA.

---
*by Claude & Anthonin — la physique d'abord, les clous de la figure ensuite, et les yeux ouverts en permanence.*
