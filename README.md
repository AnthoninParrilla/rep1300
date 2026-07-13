# Simulateur de tranche REP 1300 MWe — palier P4

Simulateur pédagogique d'une tranche nucléaire française du palier P4 (1300 MWe), dans un **fichier HTML unique et autonome** (~170 Ko, aucune dépendance externe). Il tourne dans n'importe quel navigateur, s'installe comme application hors-ligne (PWA) et s'héberge sur GitHub Pages. Esthétique de salle de commande sombre, utilisable au doigt sur mobile comme au clavier.

Ce n'est pas un code de calcul : c'est un modèle physique simplifié mais **causalement juste**, où chaque effet a sa cause réelle, avec la nomenclature authentique des tranches françaises de bout en bout. Version courante : **2.2**.

---

## Ce que le simulateur sait faire

### États de tranche et conduite normale
Les sept états standards (RP, AN/GV, AN/RRA, API fermé, **API ouvert — couvercle boulonné, ouverture au trou d'homme pressuriseur**, APR — couvercle déposé, RCD) avec gardes physiques évaluées sur l'état réel. La **remontée depuis RCD passe par le rechargement** : résiduelle restaurée (~7 MW), repressurisation en rampe. En RCD, la **cuve reste en eau** (protection biologique des internes activés) et le xénon s'épuise (cœur en piscine).

Conduite : rampe de charge turbine (~0,6 %/s), refroidissement GCT à rampe limitée, dépressurisation de fin de refroidissement, RRA, ouverture, manutention. **Gestion de réactivité à la manière du parc** : butée basse d'exploitation du groupe R (28 %), message de borication en butée, **compteur d'effluents TEP** — les grappes pour la manœuvre, le bore en réglage fin, chaque m³ comptabilisé. **Feedback de borication temps réel** : bouton allumé pendant l'appui, concentration à la décimale avec flèche de tendance.

**Ouverture sous xénon** : balayage EBA avec rejet contrôlé à la cheminée par DVN — l'activité enceinte (KRT EBA) monte pendant le transit puis la ventilation, **en service permanent tranche ouverte**, assainit l'enceinte pendant que la **chaîne KRT cheminée DVN** affiche la concentration instantanée et le **cumul rejeté en GBq**.

### Neutronique et cœur
Cinétique pilotée par la réactivité complète (grappes, bore, xénon dynamique, défaut de puissance, modérateur, vidange, AU), calage critique calculé sur les constantes du modèle, RPN trois chaînes en 1/(1−keff), carte des 193 assemblages (bouton dédié dans RPN/RIC), gestion trois tiers déterministe. **Divergence hors production** : criticité atteinte à l'arrêt → excursion depuis le niveau source → AU haut flux ; **cœur ouvert (APR/RCD), plus de grappes mobilisables** : bouilloire critique auto-limitée, ébullition, évaporation de l'inventaire, découvrement et fusion à ciel ouvert si l'on ne reborique pas.

### Thermohydraulique, réserves, secondaire
Pressuriseur complet (SEBIM → RDP, disque), conservation stricte de l'eau (gavage d'un primaire plein jusqu'au refoulement ISHP), signal IS réarmable, bâches finies (ASG ~12 h, PTR 3 000 m³), recirculation puisards conditionnée à SEC. GV à bilan complet, **TPA conditionnées à la production** (à l'arrêt, l'ASG alimente — transition ARE→ASG réaliste), GCT-c/GCTa, îlotage à mi-course de grappes, condenseur CRF/CVI, quatre sources froides × saisons, **icônes de pompes sur l'état en service** (le débit s'exprime par le pointillé de refoulement, lissé — plus d'indicateur clignotant en régulation).

### Accidents — seize incidents réversibles
APRP, RTGV (isolement N-16 + AU), fuite tube, ruptures de gaines, pertes CRF/CVI/SEC/RRA/**RRI** (double théâtre : à l'arrêt le RRA perd sa source froide ; en puissance, échauffement de la barrière thermique jusqu'à la perte des GMPP et l'AU bas débit), perte 1 ou 4 GMPP, déclenchement turbine, îlotage, H3/LLS, perte ARE, et la **dilution intempestive** : appoint d'eau claire proportionnel (~3 ppm/min initial), **silencieuse** — pas d'alarme précoce, le comptage source qui monte est le seul témoin — puis alarme de bilan bore à Δ150 ppm ; conduite : isoler l'appoint REA, boriquer. Chaîne accident grave complète (seuils métallurgiques, hydrogène, confinement) ; séquences H1, perte totale de source froide, TMI, gavé-ouvert validées.

**🎲 Panne mystère** : tirage silencieux d'une anomalie adaptée à l'état de la tranche (sept en puissance, quatre à l'arrêt — dilution comprise), journal neutre, diagnostic aux instruments, bouton « révéler » qui donne la réponse et répare la cause. Le mode instructeur, sans scoring : la physique reste strictement déterministe, seul le choix d'exercice est tiré.

### Instrumentation, enregistrement, synoptique
Chaînes KRT en unités réelles (RCV, VVP double valeur, CVI, EBA, **cheminée DVN**), **enregistreur 26 voies** à pas fixe (dont groupe R, bore, xénon, admission, bâches, accumulateurs, DVN, effluents TEP), événements dans le flux, export.

Synoptique SVG vérifiée au pixel : cuve en coupe (MCG à adaptateurs de couvercle, RIC par le fond, eau visible jusque dans le dôme, plan de tubulures unique avec pont de croisement), pressuriseur avec **trou d'homme visible circuit ouvert**, circuit RIS/RCV fidèle (charge aux joints GMPP, accumulateurs N₂ à décharge passive), **cheminée DVN à escalier hélicoïdal** dont le sommet fume en vagues sur rejet réel, **panache d'aéroréfrigérant en cumulonimbus animé** — douze bouffées continues floutées au gaussien, du col au champignon, dont le **volume suit la charge** ; grand afficheur MWth/MWe.

### Interface
Temps ×1–×300 à ligne de temps unifiée (divergence ×1 vs ×300 mesurée nulle), **zoom pinch dédié à la synoptique** (deux doigts zoom, un doigt pan, reset 1:1 — la page ne bouge pas), barre de navigation mobile, verrous anti-décalage iOS, réglages auto/manu partout, bouton ☢ avec recadrage.

---

## Limites assumées
Modèle mono-boucle, cinétique ponctuelle, constantes de temps calibrées. Un outil pour **comprendre les enchaînements** — pas pour dimensionner.

---

## Historique
Construit en itérations serrées entre un professionnel du nucléaire (validation physique, corrections de terrain, nomenclature) et Claude (Anthropic), validation numérique systématique avant chaque livraison. Jalons : fondations et systèmes, corrections de terrain, réserves finies, révision générale 1.7 (23 scénarios), synoptique 2.0 (rasterizer + détecteur de collisions), conduite 2.1 (EBA/DVN, IS, conservation, rampes, butée R, effluents), **2.2 : dilution intempestive et criticité cœur ouvert, panne mystère, perte RRI, chaîne cheminée DVN et ventilation permanente, distinction APIO/APR (trou d'homme), rechargement à la remontée, TPA et indicateurs de pompes fidèles, panache cumulonimbus, zoom synoptique, 26 voies d'enregistrement** — banc de synthèse 13 scénarios au vert.

*Conception, validation physique et corrections de terrain : un professionnel du nucléaire. Développement : Claude (Anthropic). Fichiers `index.html` + `sw.js`, hors-ligne, GitHub Pages.*
