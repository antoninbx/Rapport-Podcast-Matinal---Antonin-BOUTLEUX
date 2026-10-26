# ☀️ Briefing matinal automatisé : mail + podcast

Un workflow [n8n](https://n8n.io) qui, chaque matin, envoie par Gmail :

- un **mail HTML** : météo de Paris, football de la veille, actualités par rubrique, « ce jour dans l'histoire » et une citation ;
- un **podcast MP3 d'environ 3 minutes** en pièce jointe, drôle sur les sujets légers et sobre sur les sujets graves, qui suit la trame du mail ;
- le **dimanche**, en plus, un **résumé de la semaine**.

## Le workflow

<img width="1185" height="309" alt="image" src="https://github.com/user-attachments/assets/3f55c7eb-7f91-4dc5-aea2-6079880bde8d" />

Le fichier du workflow est [`Projet Workflow/workflow.ts`](Projet%20Workflow/workflow.ts). Il contient tout : les nœuds, les modèles et les prompts.

## Comment ça marche

| Étape | Nœud | Ce qu'il fait |
|---|---|---|
| 1 | **Tous les jours à 7h** | Déclenche le workflow chaque matin à 7h (heure de Paris). |
| 2 | **Si c'est le Week-end** | Teste si l'on est samedi ou dimanche. |
| 3 | **Retarder de 2h, donc envoyer à 9h** | Uniquement le week-end : attend 2 h, pour que le mail arrive à 9h. En semaine, cette étape est sautée. |
| 4 | **Rédacteur des infos** | Agent IA (Gemini). Il fait au moins 10 recherches sur internet avec **Recherches internet sur Brave**, puis rédige le mail en HTML. |
| 5 | **Rédacteur du podcast** | Agent IA (Gemini). Il transforme le mail en script de podcast, à lire à voix haute. |
| 6 | **Génération d'un Audio** | OpenAI lit le script avec la voix `nova` et produit un fichier MP3. |
| 7 | **Renommage du fichier MP3** | Nomme la pièce jointe `briefing-AAAA-MM-JJ.mp3`, avec la date du jour. |
| 8 | **Envoi par Gmail** | Envoie le mail HTML avec le MP3 en pièce jointe. |

### Le mail

Il contient, dans cet ordre : la date et la météo de Paris, le football de la veille (5 matchs au maximum, avec les scores), la France, le Monde, Armée & Défense, Business & Éco, Tech & IA, « Ce jour en [année] » et une citation. Le dimanche s'y ajoute un résumé de la semaine.

### Le podcast

Le script dure environ 3 minutes à l'oral. Il suit la trame du mail et n'utilise que ses informations : humour et complicité sur les sujets légers, sobriété sur les sujets graves. Il est écrit avec plus de créativité que le mail (température 0,9).

### Fiabilité

- **Zéro invention.** L'agent n'écrit que ce qu'un résultat de recherche affirme explicitement. Une information douteuse ou incomplète est retirée, jamais devinée.
- **Les nuances sont conservées.** « Prévu », « attendu » ou « devrait » ne deviennent jamais « adopté » ou « décidé ».
- **Les sources sont datées.** Les faits de plus de deux jours sont datés, et les simples titres de pages d'accueil sont écartés.
- **Les scores sont exacts.** Un match n'apparaît que si les deux équipes, la compétition et le score figurent dans les résultats.
- **Des relances automatiques.** Chaque agent a un modèle Gemini principal et un modèle de secours, et les étapes sont relancées en cas d'erreur.

### Les prompts

Les deux agents utilisent la même structure XML :

```
<role>          → le rôle de l'agent
<instructions>
  <goal>        → l'objectif
  <context>     → le contexte et les règles
  <examples>    → 3 exemples très variés
  <output_format>
</instructions>
<inputs>        → les données du jour (dates, résultats de recherche, briefing)
```

## Utiliser le workflow

1. Il faut une instance n8n et le nœud communautaire `@brave/n8n-nodes-brave-search`.
2. Créez les identifiants suivants dans n8n :

   | Nœuds | Identifiant |
   |---|---|
   | Les 4 nœuds Gemini | Google Gemini (PaLM) API |
   | Recherches internet sur Brave | Brave Search API |
   | Génération d'un Audio | OpenAI API |
   | Envoi par Gmail | Gmail OAuth2 |

3. Dans **Envoi par Gmail**, remplacez `votre.adresse@example.com` par votre adresse.
4. Testez avec *Execute workflow* (un vrai mail est envoyé), puis activez le workflow avec *Publish*.

## Skills

Le dossier [`Skills/`](Skills/) contient trois skills Claude utilisés pendant la construction du projet : `interview`, `hostile-review` et `doubt-driven-dev`.

## Licence

[MIT](LICENSE)
