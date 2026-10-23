# Projet Workflow

Le workflow n8n au format **TypeScript du SDK n8n** (`@n8n/workflow-sdk`).

| Fichier | Rôle |
|---|---|
| `briefing-matinal.workflow.ts` | Le workflow complet : 13 nœuds, prêt à être créé dans n8n |
| `generate_workflow_ts.py` | Régénère le `.ts` à partir des prompts de `../Workflow.ts/prompts/` |

## Mise à jour

Après une modification d'un prompt dans `Workflow.ts/prompts/` :

```bash
python3 "Projet Workflow/generate_workflow_ts.py"
```

## Points d'attention

- Le fichier utilise le sous-ensemble TypeScript du SDK n8n : il décrit le graphe du workflow, il ne s'exécute pas comme un script Node.
- Les identifiants sont déclarés avec `newCredential(...)` : à associer à tes comptes (Gemini, Brave Search, OpenAI, Gmail) dans n8n.
- Le destinataire du mail est `votre.adresse@example.com` : à remplacer.
- La structure du fichier a été validée par le validateur du SDK n8n. Les prompts y sont insérés par le script et vérifiés identiques aux fichiers de `Workflow.ts/prompts/`.
