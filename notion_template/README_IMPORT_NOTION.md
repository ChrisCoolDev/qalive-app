# 🏠 QALive HQ - Guide d'Importation Notion en 2 Minutes

Tous les fichiers de ce dossier sont prêts à être importés dans votre espace Notion pour monter votre système opérationnel complet sans attendre le plugin.

---

## Étape 1 : Créer la page parente dans Notion
1. Dans Notion, créez une nouvelle page nommée **`🏠 QALive HQ`**.
2. Choisissez une icône de maison ou de fusée.

---

## Étape 2 : Importer les 4 Bases de Données (CSV)
Dans Notion, sur votre page `🏠 QALive HQ`, tapez `/import` ou cliquez sur **Import** en bas du menu latéral, puis choisissez **CSV** pour chaque fichier :

1. **`01_Backlog_Produit.csv`**
   - Importez le fichier. Notion crée automatiquement une base de données avec toutes les colonnes.
   - *Astuce vue :* Ajoutez une vue **Board (Kanban)** groupée par `Statut` et filtrez par `Priorite`.

2. **`02_CRM_Prospects.csv`**
   - Importez le fichier.
   - *Astuce vue :* Créez une vue **Board (Kanban)** groupée par `Statut` (À contacter ➔ Contacté ➔ Répondu ➔ Démo planifiée ➔ Essai Pro actif ➔ Client payant).
   - Ajoutez une vue Table filtrée : `Date_Relance` = *Aujourd'hui*.

3. **`03_Metriques_Hebdo.csv`**
   - Importez le fichier. Vous avez votre historique prêt à remplir chaque lundi matin.

4. **`04_Calendrier_Contenu.csv`**
   - Importez le fichier.
   - *Astuce vue :* Ajoutez une vue **Calendar** basée sur la colonne `Date_Publication`.

---

## Étape 3 : Créer les sous-pages de Process (Markdown)
Sur votre page `🏠 QALive HQ`, créez 3 sous-pages en glissant-déposant ou en copiant-collant le contenu de ces fichiers :

- **`05_Revue_Hebdomadaire_Template.md`** ➔ Créez une page nommée `🧭 Revue Hebdomadaire (Template)`.
- **`06_Checklist_Release_Production.md`** ➔ Créez une page nommée `🚀 Checklist de Release Prod`.
- **`07_Sequences_Emails_Onboarding.md`** ➔ Créez une page nommée `✉️ Séquences Emails Loops`.

---

## Résultat obtenu dans Notion

```
🏠 QALive HQ
├── 🗺️ Backlog Produit (Kanban par Statut & Priorité P0/P1/P2)
├── 🤝 CRM Prospects (Kanban pipe commercial + vue Relances)
├── 📊 Métriques Hebdomadaires (Tableau de bord de bord chaque lundi)
├── ✍️ Calendrier de Contenu (Vue Calendrier de publication)
├── 🧭 Template Revue du Lundi
├── 🚀 Checklist Release Vendredi
└── ✉️ Modèles d'Emails d'Onboarding
```

