# 🚀 Checklist de Release Production (Vendredi Après-midi)

> **Règle absolue :** Pas de déploiement en production le week-end ou moins de 24h avant un événement client connu.

---

### Phase 1 : Contrôle Qualité Local & CI
- [ ] Branche locale synchronisée avec `develop`.
- [ ] Linter vérifié sans erreur : `npm run lint`.
- [ ] Build de production compilé localement avec succès : `npm run build:prod`.
- [ ] Aperçu local exécuté sans avertissement console : `npm run preview`.

### Phase 2 : Vérification du Chemin Critique
- [ ] Connexion Google OAuth fonctionnelle.
- [ ] Création d'une session de test avec titre et durée.
- [ ] Affichage correct du QR code et du lien `/ask/:slug`.
- [ ] Soumission d'une question depuis un mobile ou une fenêtre incognito.
- [ ] Affichage instantané en temps réel (WebSocket) sur la vue organisateur.
- [ ] Test de projection plein écran et navigation clavier (flèches gauche / droite).
- [ ] Test d'upload et de téléchargement d'un document PDF dans la session.

### Phase 3 : Vérification Paiement & Profil (si modifications liées)
- [ ] Achat test Lemon Squeezy en mode Sandbox réussi.
- [ ] Webhook Supabase déclenché et statut HTTP 200 renvoyé.
- [ ] Table `profiles` mise à jour avec `is_premium: true` et `plan: 'pro'`.
- [ ] Accès débloqué dans le dashboard (suppression session, durée personnalisée).

### Phase 4 : Déploiement & Observation
- [ ] Pull Request `develop` -> `main` créée et vérifiée sur GitHub.
- [ ] Déploiement automatique Vercel terminé au vert sur `app.qalive.ink`.
- [ ] Smoke test rapide sur la vraie production (1 question posée sur la session test).
- [ ] Tableau de bord Sentry sans pic d'erreur inhabituel après 15 minutes.
- [ ] Changelog rédigé et partagé (Notion / LinkedIn).

