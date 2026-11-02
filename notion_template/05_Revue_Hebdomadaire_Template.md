# 🧭 Template de Revue Hebdomadaire (Lundi Matin - 45 min)

> **Date :** [Renseigner la date du lundi]  
> **Semaine N° :** [ex: S45]  
> **Objectif principal de la semaine :** [Une seule phrase claire]

---

## 1. 📊 Chiffres de la semaine passée (10 min)
*Ouvrir Plausible, Supabase SQL Editor et Lemon Squeezy.*

- **Visiteurs uniques :** `____`
- **Nouveaux inscrits :** `____`
- **Sessions créées :** `____`
- **⭐ North Star (Sessions avec >= 5 questions) :** `____`  
  *(Requête SQL : `select count(*) from sessions s where s.created_at > now() - interval '7 days' and (select count(*) from questions q where q.session_id = s.id) >= 5;`)*
- **Clients payants actifs :** `____`
- **MRR :** `____ $`
- **Prospects contactés la semaine passée :** `____`

---

## 2. 📥 Déchargement de l'Inbox Bear (10 min)
*Ouvrir l'application Bear (tag `#qalive/idee`) :*
- Quelles idées capturées cette semaine méritent d'entrer dans le Backlog ?
- Quelles idées doivent être supprimées ou archivées ?
- Mettre à jour les scores ICE dans Notion.

---

## 3. 🎯 Les 3 priorités Dev de la semaine (15 min)
*Ne choisir que 3 éléments maximum dans le Backlog :*

1. **Priorité 1 (Must-have stabilité ou critique) :**  
   - Ticket : `...`
   - Définition du terminé (DoD) : `...`
2. **Priorité 2 (Produit / activation) :**  
   - Ticket : `...`
   - Définition du terminé (DoD) : `...`
3. **Priorité 3 (Dette technique ou amélioration rapide) :**  
   - Ticket : `...`
   - Définition du terminé (DoD) : `...`

---

## 4. 📣 Plan d'action Marketing & Vente (10 min)
- **Niche ciblée cette semaine :** [ex: Profs d'université / Meetups tech]
- **Objectif de prospection :** 10 messages par jour (50 sur la semaine)
- **Contenu à publier :**
  - [ ] Post LinkedIn 1 : [Sujet]
  - [ ] Post LinkedIn 2 : [Sujet]
- **Démos / Appels planifiés :**
  - [ ] Démo avec : [Nom / Date]

---

## 5. 🛑 Ce que je refuse de faire cette semaine (Anti-distraction)
- [ ] *Ex : Pas de refonte CSS majeure avant d'avoir 5 clients payants.*
- [ ] *Ex : Pas de nouveau framework ou outil de monitoring sophistiqué.*

