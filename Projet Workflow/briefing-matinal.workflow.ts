import { workflow, node, trigger, ifElse, languageModel, tool, newCredential, fromAi, expr } from '@n8n/workflow-sdk';

const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Every Day at 07:00AM',
    parameters: { rule: { interval: [{ triggerAtHour: 7 }] } },
    position: [-416, -64]
  },
  output: [{}]
});

const isWeekend = ifElse({
  version: 2.4,
  config: {
    name: 'If It Is Week End',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 4 },
        conditions: [
          { leftValue: expr('{{ $now.weekday }}'), operator: { type: 'number', operation: 'gte' }, rightValue: 6 }
        ],
        combinator: 'and'
      }
    },
    position: [-192, -64]
  }
});

const waitUntilNine = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Delay 2h = Send At 09:00AM',
    parameters: { amount: 2, unit: 'hours' },
    position: [48, -192]
  },
  output: [{}]
});

const newsModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.2,
  config: {
    name: 'Using Gemini',
    parameters: { modelName: 'models/gemini-flash-latest', options: {} },
    credentials: { googlePalmApi: newCredential('Google Gemini (PaLM) API') },
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 3000,
    position: [264, 152]
  }
});

const newsFallbackModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.2,
  config: {
    name: 'Using Gemini (Fallback)',
    parameters: { modelName: 'models/gemini-flash-lite-latest', options: {} },
    credentials: { googlePalmApi: newCredential('Google Gemini (PaLM) API') },
    position: [392, 152]
  }
});

const braveSearch = tool({
  type: '@brave/n8n-nodes-brave-search.braveSearchTool',
  version: 1.1,
  config: {
    name: 'Searching On Internet',
    parameters: {
      query: fromAi('Query', 'Requête de recherche web', 'string'),
      count: 6,
      additionalParameters: {
        country: 'FR',
        search_lang: 'fr',
        ui_lang: 'fr-FR',
        text_decorations: false,
        result_filter: ['web'],
        extra_snippets: true
      }
    },
    credentials: { braveSearchApi: newCredential('Brave Search API') },
    position: [520, 152]
  }
});

const newsRedactor = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'News Redactor',
    parameters: {
      promptType: 'define',
      text: expr(
        "<instructions>\n"
      + "<goal>\n"
      + "Rédiger le briefing matinal d'Antonin pour aujourd'hui : un mail HTML moderne, en français, qui contient UNIQUEMENT des informations vérifiées dans les résultats de recherche Brave Search (football de la veille avec scores exacts, météo de Paris, actualités par rubrique, événement historique du jour, citation attestée et, le dimanche, un résumé de la semaine).\n"
      + "</goal>\n"
      + "\n"
      + "<context>\n"
      + "<lecteur>\n"
      + "Antonin vit à Paris. Il lit ce mail au réveil sur son téléphone (Gmail : seuls les styles inline fonctionnent). Il exige zéro erreur factuelle : une information douteuse ou incomplète doit être retirée et remplacée par une autre mieux documentée, jamais devinée, arrondie ou complétée de mémoire.\n"
      + "</lecteur>\n"
      + "\n"
      + "<outil_de_recherche>\n"
      + "Tu disposes de l'outil Brave Search (6 résultats par requête). Les extraits sont courts et peu fiables en l'état : ce sont souvent des titres de pages d'accueil de journaux (plusieurs titres juxtaposés sans détail), des pages de programmes ou de classements sans scores, ou des articles vieux de plusieurs jours. Chaque fait doit donc être appuyé par un extrait qui l'affirme explicitement, avec sa date.\n"
      + "</outil_de_recherche>\n"
      + "\n"
      + "<recherches_obligatoires>\n"
      + "Avant de rédiger, fais au minimum 10 recherches distinctes, une requête par sujet, sans jamais les regrouper : (1) actualité France aujourd'hui ; (2) actualité monde aujourd'hui ; (3) armée et défense actualité ; (4) business et économie actualité ; (5) tech et IA actualité ; (6) « Ligue des champions résultats » suivi de la date de la veille ; (7) « résultats football » suivi de la date de la veille et des championnats (Ligue 1, Premier League, Liga, Serie A, Bundesliga) ; (8) météo Paris aujourd'hui ; (9) événement historique survenu un <jour_et_mois_du_jour> (ce jour dans l'histoire) ; (10) citation célèbre d'un auteur clairement attesté. Si une recherche ne donne rien d'exploitable, reformule la requête et recommence avant de conclure. Les matchs de Ligue des champions se jouent les mardis et mercredis soirs.\n"
      + "</recherches_obligatoires>\n"
      + "\n"
      + "<regles_football>\n"
      + "Affiche AU MAXIMUM 5 grands matchs joués la veille (<date_de_la_veille>) : Ligue des champions en priorité, puis les grands championnats. Retiens uniquement les matchs dont un extrait donne les deux équipes, la compétition ET le score exact. Recopie les noms d'équipes exactement comme dans les extraits (n'ajoute aucun préfixe ni nom de club complet de mémoire). Un match « en direct », « à venir » ou sans score n'est pas un résultat. N'écris « Pas de grand match hier » (dans un item d'actualité, sans tableau) qu'après avoir fait les deux recherches football et seulement si aucun score exact n'a été trouvé.\n"
      + "</regles_football>\n"
      + "\n"
      + "<regles_de_fidelite>\n"
      + "1. Chaque chiffre, nom, lieu, score, date et verbe d'action doit figurer explicitement dans un extrait. Reformule sans rien ajouter.\n"
      + "2. Respecte le degré de certitude de la source : « prévu », « attendu », « devrait », « envisage », « étudie » ne deviennent jamais « adopté », « validé », « décidé » ou « déposé ». Un fait rapporté par une source unique ou anonyme reste attribué (« selon… »).\n"
      + "3. Ne déduis rien : ni lieu, ni acteur, ni pouvoir, ni chiffre, ni lien de cause à effet absent de l'extrait.\n"
      + "4. Date toute actualité de plus de 2 jours (« depuis le 4 octobre », « le 2 octobre ») ; n'écris jamais « aujourd'hui » ou « hier » pour un fait plus ancien.\n"
      + "5. Un fait qui n'apparaît que dans un titre de page d'accueil (titres juxtaposés sans détail) n'est pas utilisable : choisis une autre actualité mieux documentée, au besoin avec une nouvelle recherche plus précise.\n"
      + "6. Sujets graves (morts, attaques, guerres, catastrophes) : chiffres et attributions exactement comme dans la source (« selon un premier bilan des autorités »).\n"
      + "7. En cas de doute sur un détail, retire le détail. Si une rubrique ne peut pas être alimentée de façon fiable même après reformulation, écris dans son item « Information non disponible ».\n"
      + "</regles_de_fidelite>\n"
      + "\n"
      + "<regles_de_contenu>\n"
      + "- En-tête : date en toutes lettres + météo de Paris (température du matin → de l'après-midi, état du ciel), telles que dans les extraits.\n"
      + "- Cartes dans cet ordre : Football, France (3 points), Monde (3), Armée & Défense (2 maximum), Business & Éco (1), Tech & IA (1), Ce jour en [année] (1 item), Citation.\n"
      + "- Chaque point d'actualité : un titre court en gras + une phrase précise (qui, quoi, où). Interdit : les formules vagues (« de beaux matchs », « tensions au Proche-Orient », « les marchés surveillent l'inflation »).\n"
      + "- Événement historique : survenu exactement un <jour_et_mois_du_jour> (jour ET mois confirmés par un extrait ; sinon choisis-en un autre), année indiquée.\n"
      + "- Citation : auteur et œuvre attestés ; jamais une citation souvent attribuée à tort.\n"
      + "</regles_de_contenu>\n"
      + "</context>\n"
      + "\n"
      + "<examples>\n"
      + "Les trois exemples ci-dessous sont entièrement FICTIFS (dates, équipes, personnes, événements) : ils montrent le raisonnement et la mise en forme attendus. Ne reprends jamais leur contenu dans ta réponse ; utilise uniquement les résultats de tes propres recherches.\n"
      + "\n"
      + "<example_1>\n"
      + "<inputs>\n"
      + "<date_du_jour>mercredi 14 mai 2031</date_du_jour>\n"
      + "<date_de_la_veille>mardi 13 mai 2031</date_de_la_veille>\n"
      + "<jour_et_mois_du_jour>14 mai</jour_et_mois_du_jour>\n"
      + "<est_dimanche>non</est_dimanche>\n"
      + "<resultats_de_recherche>\n"
      + "France : [journal-regional.example, 14/05/2031] Le conseil municipal de Valmont a voté mardi soir la gratuité des bus le samedi, à partir du 1er septembre. | [info-nationale.example, 14/05/2031] Grève dans les transports : le préavis lancé par deux syndicats est maintenu pour jeudi, selon la direction de l'opérateur ferroviaire. | [info-nationale.example, 13/05/2031] Le projet de loi sur le logement étudiant sera examiné à l'Assemblée la semaine prochaine.\n"
      + "Monde : [monde.example, 14/05/2031] Séisme de magnitude 6,1 au large du Chili : aucune victime signalée, selon les autorités. | [monde.example, 14/05/2031] Législatives au Pérou : le parti Avance Péruvienne arrive en tête avec 31,2 % des voix après dépouillement de 90 % des bulletins. | [monde.example, 13/05/2031] Les ministres des Finances se retrouvent jeudi à Lisbonne pour un sommet.\n"
      + "Défense : [defense.example, 14/05/2031] La frégate Aurore a quitté Toulon mardi pour une mission de quatre mois dans l'océan Indien, annonce l'état-major. | [defense.example, 13/05/2031] Exercice Baltic Shield : 8 000 militaires de dix pays sont engagés jusqu'au 22 mai.\n"
      + "Éco : [eco.example, 13/05/2031] La banque centrale a laissé son taux directeur inchangé à 2,25 % mardi.\n"
      + "Tech : [tech.example, 13/05/2031] Le laboratoire Nuvola a dévoilé mardi un modèle de traduction vocale qui fonctionne hors connexion sur smartphone.\n"
      + "Ligue des champions : [sport.example, 14/05/2031] Demi-finales aller, mardi 13 mai : FC Valmont 2-1 Athletic Rivoli ; Dinamo Kestel 0-0 Real Santander.\n"
      + "Résultats football : [sport.example, 14/05/2031] Premier League, match en retard mardi : Northbridge United 3-1 Kingsford City. | [tv.example] Le programme TV du jour : football, tennis, rugby.\n"
      + "Météo : [meteo.example, 14/05/2031] Paris mercredi 14 mai : 11 °C le matin, 22 °C l'après-midi, ciel dégagé.\n"
      + "Histoire : [histoire.example] Le 14 mai 1610, Henri IV est assassiné rue de la Ferronnerie, à Paris, par François Ravaillac.\n"
      + "Citation : [litterature.example] « Il faut manger pour vivre et non vivre pour manger. » Molière, L'Avare, acte III, scène 1.\n"
      + "</resultats_de_recherche>\n"
      + "</inputs>\n"
      + "<output>\n"
      + "<div style='background:#eef1f6;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;'><div style='max-width:640px;margin:0 auto;'><div style='background:#1e3a8a;background-image:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);border-radius:20px;padding:28px;color:#ffffff;'><div style='font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:0.75;'>Briefing matinal</div><div style='font-size:28px;font-weight:700;margin:6px 0 10px;'>Mercredi 14 mai 2031</div><div style='font-size:15px;line-height:1.5;opacity:0.95;'>🌡️ Paris : 11 °C le matin → 22 °C l'après-midi, ciel dégagé</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#16a34a;margin-bottom:8px;'>⚽ Football</div><table style='width:100%;border-collapse:collapse;'><tr><td style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.4;'><b>FC Valmont – Athletic Rivoli</b><div style='font-size:12px;color:#6b7280;'>Ligue des champions (demi-finale aller)</div></td><td style='padding:10px 0;border-top:1px solid #eef1f6;text-align:right;white-space:nowrap;'><span style='background:#0f172a;color:#ffffff;font-weight:700;border-radius:8px;padding:4px 10px;font-size:14px;'>2 - 1</span></td></tr><tr><td style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.4;'><b>Dinamo Kestel – Real Santander</b><div style='font-size:12px;color:#6b7280;'>Ligue des champions (demi-finale aller)</div></td><td style='padding:10px 0;border-top:1px solid #eef1f6;text-align:right;white-space:nowrap;'><span style='background:#0f172a;color:#ffffff;font-weight:700;border-radius:8px;padding:4px 10px;font-size:14px;'>0 - 0</span></td></tr><tr><td style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.4;'><b>Northbridge United – Kingsford City</b><div style='font-size:12px;color:#6b7280;'>Premier League</div></td><td style='padding:10px 0;border-top:1px solid #eef1f6;text-align:right;white-space:nowrap;'><span style='background:#0f172a;color:#ffffff;font-weight:700;border-radius:8px;padding:4px 10px;font-size:14px;'>3 - 1</span></td></tr></table></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#2563eb;margin-bottom:8px;'>🇫🇷 France</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Bus gratuits à Valmont</b> — Le conseil municipal a voté mardi soir la gratuité des bus le samedi, à partir du 1er septembre.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Grève dans les transports</b> — Le préavis lancé par deux syndicats est maintenu pour jeudi, selon la direction de l'opérateur ferroviaire.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Logement étudiant</b> — Le projet de loi sera examiné à l'Assemblée la semaine prochaine.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#0891b2;margin-bottom:8px;'>🌐 Monde</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Séisme au large du Chili</b> — Magnitude de 6,1 ; aucune victime signalée, selon les autorités.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Législatives au Pérou</b> — Le parti Avance Péruvienne arrive en tête avec 31,2 % des voix après dépouillement de 90 % des bulletins.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Sommet des ministres des Finances</b> — Ils se retrouvent jeudi à Lisbonne.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#475569;margin-bottom:8px;'>🛡️ Armée & Défense</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Frégate Aurore</b> — Elle a quitté Toulon mardi pour une mission de quatre mois dans l'océan Indien, annonce l'état-major.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Exercice Baltic Shield</b> — 8 000 militaires de dix pays y sont engagés jusqu'au 22 mai.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#059669;margin-bottom:8px;'>💼 Business & Éco</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Taux directeur</b> — La banque centrale l'a laissé inchangé à 2,25 % mardi.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7c3aed;margin-bottom:8px;'>💻 Tech & IA</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Traduction hors connexion</b> — Le laboratoire Nuvola a dévoilé mardi un modèle de traduction vocale qui fonctionne hors connexion sur smartphone.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#d97706;margin-bottom:8px;'>📜 Ce jour en 1610</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Assassinat d'Henri IV</b> — Le roi est assassiné rue de la Ferronnerie, à Paris, par François Ravaillac.</div></div><div style='background:#4c1d95;background-image:linear-gradient(135deg,#1e1b4b 0%,#4c1d95 100%);border-radius:16px;padding:22px;margin-top:16px;color:#ffffff;text-align:center;'><div style='font-size:18px;line-height:1.5;font-style:italic;'>« Il faut manger pour vivre et non vivre pour manger. »</div><div style='font-size:13px;margin-top:10px;opacity:0.8;'>— Molière, L'Avare</div></div><div style='text-align:center;font-size:12px;color:#9ca3af;margin-top:20px;'>Généré automatiquement · Sources : Brave Search</div></div></div>\n"
      + "</output>\n"
      + "</example_1>\n"
      + "\n"
      + "<example_2>\n"
      + "<inputs>\n"
      + "<date_du_jour>lundi 6 octobre 2031</date_du_jour>\n"
      + "<date_de_la_veille>dimanche 5 octobre 2031</date_de_la_veille>\n"
      + "<jour_et_mois_du_jour>6 octobre</jour_et_mois_du_jour>\n"
      + "<est_dimanche>non</est_dimanche>\n"
      + "<resultats_de_recherche>\n"
      + "France : [grande-presse.example, page d'accueil, 06/10/2031] Le gouvernement durcit le ton — Pluie et vent sur tout le pays — Le procès s'ouvre — Nos conseils pour la rentrée | [agence.example, 06/10/2031] La ministre de la Santé a annoncé dimanche le lancement d'une campagne de vaccination contre la grippe dès le 14 octobre. | [journal-regional.example, 05/10/2031] La rocade nord de Bastide sera fermée de nuit du 8 au 12 octobre pour travaux. | [agence.example, 04/10/2031] Le projet de réforme des retraites complémentaires devrait être présenté en Conseil des ministres à la fin du mois, selon une source gouvernementale.\n"
      + "Monde : [monde.example, 06/10/2031] L'ouragan Marcia a touché terre dimanche sur la côte nord du Mexique : 4 morts selon un premier bilan des autorités, 30 000 personnes évacuées. | [monde.example, 06/10/2031] Un nouveau cycle de négociations commerciales entre l'Union européenne et l'Inde s'ouvre lundi à Bruxelles. | [monde.example, 06/10/2031] Le prix Nobel de médecine sera attribué lundi à Stockholm.\n"
      + "Défense : [defense.example, 02/10/2031] Le ministère a confirmé la livraison de douze hélicoptères de transport d'ici 2033. | [defense.example, 06/10/2031] L'armée de l'air participe à l'exercice Cobra Noir jusqu'à jeudi.\n"
      + "Éco : [eco.example, 06/10/2031] Le prix du baril de Brent recule de 1,8 % à 74,10 dollars ce matin.\n"
      + "Tech : [tech.example, 05/10/2031] Le constructeur Orbis présentera mardi sa nouvelle montre connectée ; le prix n'a pas été communiqué.\n"
      + "Ligue des champions : [sport.example, 06/10/2031] Aucun résultat pour cette date.\n"
      + "Résultats football : [sport.example, 05/10/2031] Programme du dimanche 5 octobre : Ligue 1, Serie A, Liga. Suivez les matchs en direct.\n"
      + "Météo : [meteo.example, 06/10/2031] Paris lundi 6 octobre : 9 °C le matin, 13 °C l'après-midi, pluie continue.\n"
      + "Histoire : [histoire.example] Le 6 octobre 1927, la première du film Le Chanteur de jazz a lieu à New York ; il marque l'avènement du cinéma parlant.\n"
      + "Citation : [litterature.example] « Il faut cultiver notre jardin. » Voltaire, Candide (1759).\n"
      + "</resultats_de_recherche>\n"
      + "</inputs>\n"
      + "<output>\n"
      + "<div style='background:#eef1f6;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;'><div style='max-width:640px;margin:0 auto;'><div style='background:#1e3a8a;background-image:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);border-radius:20px;padding:28px;color:#ffffff;'><div style='font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:0.75;'>Briefing matinal</div><div style='font-size:28px;font-weight:700;margin:6px 0 10px;'>Lundi 6 octobre 2031</div><div style='font-size:15px;line-height:1.5;opacity:0.95;'>🌡️ Paris : 9 °C le matin → 13 °C l'après-midi, pluie continue</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#16a34a;margin-bottom:8px;'>⚽ Football</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'>Pas de grand match hier</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#2563eb;margin-bottom:8px;'>🇫🇷 France</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Vaccination contre la grippe</b> — La ministre de la Santé a annoncé dimanche une campagne de vaccination dès le 14 octobre.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Rocade nord de Bastide</b> — Elle sera fermée de nuit du 8 au 12 octobre pour travaux.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Retraites complémentaires</b> — Le projet de réforme devrait être présenté en Conseil des ministres à la fin du mois, selon une source gouvernementale.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#0891b2;margin-bottom:8px;'>🌐 Monde</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Ouragan Marcia</b> — Il a touché terre dimanche sur la côte nord du Mexique : 4 morts selon un premier bilan des autorités, 30 000 personnes évacuées.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Union européenne – Inde</b> — Un nouveau cycle de négociations commerciales s'ouvre lundi à Bruxelles.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Prix Nobel de médecine</b> — Il sera attribué lundi à Stockholm.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#475569;margin-bottom:8px;'>🛡️ Armée & Défense</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Hélicoptères de transport</b> — Le ministère a confirmé le 2 octobre la livraison de douze appareils d'ici 2033.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Exercice Cobra Noir</b> — L'armée de l'air y participe jusqu'à jeudi.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#059669;margin-bottom:8px;'>💼 Business & Éco</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Pétrole</b> — Le baril de Brent recule de 1,8 % à 74,10 dollars ce matin.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7c3aed;margin-bottom:8px;'>💻 Tech & IA</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Montre connectée Orbis</b> — Le constructeur la présentera mardi ; le prix n'a pas été communiqué.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#d97706;margin-bottom:8px;'>📜 Ce jour en 1927</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Le Chanteur de jazz</b> — La première du film a lieu à New York ; il marque l'avènement du cinéma parlant.</div></div><div style='background:#4c1d95;background-image:linear-gradient(135deg,#1e1b4b 0%,#4c1d95 100%);border-radius:16px;padding:22px;margin-top:16px;color:#ffffff;text-align:center;'><div style='font-size:18px;line-height:1.5;font-style:italic;'>« Il faut cultiver notre jardin. »</div><div style='font-size:13px;margin-top:10px;opacity:0.8;'>— Voltaire, Candide</div></div><div style='text-align:center;font-size:12px;color:#9ca3af;margin-top:20px;'>Généré automatiquement · Sources : Brave Search</div></div></div>\n"
      + "</output>\n"
      + "</example_2>\n"
      + "\n"
      + "<example_3>\n"
      + "<inputs>\n"
      + "<date_du_jour>dimanche 12 octobre 2031</date_du_jour>\n"
      + "<date_de_la_veille>samedi 11 octobre 2031</date_de_la_veille>\n"
      + "<jour_et_mois_du_jour>12 octobre</jour_et_mois_du_jour>\n"
      + "<est_dimanche>oui</est_dimanche>\n"
      + "<periode_du_resume_de_la_semaine>du 6 octobre au 12 octobre</periode_du_resume_de_la_semaine>\n"
      + "<resultats_de_recherche>\n"
      + "France : [journal-regional.example, 12/10/2031] Le marathon de Bastide réunit dimanche 22 000 coureurs, selon les organisateurs. | [agence.example, 10/10/2031] Le Conseil d'État a rejeté vendredi le recours de deux communes contre le tracé d'une ligne à grande vitesse. | [agence.example, 11/10/2031] Les inscriptions au service civique ouvrent lundi.\n"
      + "Monde : [monde.example, 11/10/2031] Un sommet régional sur le climat s'est achevé samedi à Nairobi avec une déclaration commune signée par 18 pays. | [monde.example, 11/10/2031] L'Inde a lancé samedi un satellite d'observation de la Terre depuis le centre de Sriharikota. | [monde.example, 11/10/2031] Le pétrolier Sirius, échoué depuis jeudi au large de Gibraltar, a été remis à flot samedi sans pollution constatée, selon les autorités portuaires.\n"
      + "Défense : [defense.example, 11/10/2031] Les armées ont lancé samedi l'exercice Cobra Blanc dans les Alpes, avec 2 500 militaires. | [defense.example, 12/10/2031] Le chef d'état-major des armées recevra lundi son homologue italien à Paris.\n"
      + "Éco : [eco.example, 10/10/2031] La Bourse de Paris a terminé la semaine en hausse de 1,2 % vendredi soir.\n"
      + "Tech : [tech.example, 11/10/2031] L'application de messagerie Pigeon dépasse les 100 millions d'utilisateurs, annonce sa société samedi.\n"
      + "Ligue des champions : [sport.example, 12/10/2031] Pas de match de Ligue des champions cette semaine.\n"
      + "Résultats football : [sport.example, 11/10/2031] Ligue 1 : AS Montvert 1-1 RC Belmont ; SC Argonne 3-0 FC Orlane. Liga : Real Cordoval 2-0 Sporting Terrazas. Bundesliga : FC Heldmark 4-2 SV Nordhafen.\n"
      + "Météo : [meteo.example, 12/10/2031] Paris dimanche 12 octobre : 6 °C le matin, 15 °C l'après-midi, brouillard puis éclaircies.\n"
      + "Histoire : [histoire.example] Le 12 octobre 1492, Christophe Colomb aborde une île des Bahamas lors de son premier voyage vers l'ouest.\n"
      + "Citation : [litterature.example] « Il faut de plus grandes vertus pour soutenir la bonne fortune que la mauvaise. » La Rochefoucauld, Maximes.\n"
      + "Semaine (6 au 12 octobre) : France : [agence.example, 09/10/2031] Les chauffeurs de bus de Bastide ont mis fin mercredi à une grève de huit jours après un accord salarial. | [agence.example, 09/10/2031] La loi sur le logement étudiant a été adoptée jeudi par l'Assemblée nationale par 312 voix contre 241. Monde : [monde.example, 10/10/2031] Le dernier bilan de l'ouragan Marcia fait état de 14 morts, selon les autorités mexicaines. Défense : [defense.example, 09/10/2031] La marine a pris livraison jeudi d'un nouveau sous-marin d'attaque. Éco : [eco.example, 09/10/2031] La croissance de la zone euro au troisième trimestre est estimée à 0,3 %, selon l'institut statistique européen. Tech : [tech.example, 09/10/2031] Le constructeur Orbis annonce jeudi avoir vendu 400 000 montres connectées en 72 heures. Sport : [sport.example, 11/10/2031] Rugby : la France s'est imposée 28-17 face à l'Écosse samedi.\n"
      + "</resultats_de_recherche>\n"
      + "</inputs>\n"
      + "<output>\n"
      + "<div style='background:#eef1f6;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;'><div style='max-width:640px;margin:0 auto;'><div style='background:#1e3a8a;background-image:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);border-radius:20px;padding:28px;color:#ffffff;'><div style='font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:0.75;'>Briefing matinal</div><div style='font-size:28px;font-weight:700;margin:6px 0 10px;'>Dimanche 12 octobre 2031</div><div style='font-size:15px;line-height:1.5;opacity:0.95;'>🌡️ Paris : 6 °C le matin → 15 °C l'après-midi, brouillard puis éclaircies</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#16a34a;margin-bottom:8px;'>⚽ Football</div><table style='width:100%;border-collapse:collapse;'><tr><td style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.4;'><b>AS Montvert – RC Belmont</b><div style='font-size:12px;color:#6b7280;'>Ligue 1</div></td><td style='padding:10px 0;border-top:1px solid #eef1f6;text-align:right;white-space:nowrap;'><span style='background:#0f172a;color:#ffffff;font-weight:700;border-radius:8px;padding:4px 10px;font-size:14px;'>1 - 1</span></td></tr><tr><td style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.4;'><b>SC Argonne – FC Orlane</b><div style='font-size:12px;color:#6b7280;'>Ligue 1</div></td><td style='padding:10px 0;border-top:1px solid #eef1f6;text-align:right;white-space:nowrap;'><span style='background:#0f172a;color:#ffffff;font-weight:700;border-radius:8px;padding:4px 10px;font-size:14px;'>3 - 0</span></td></tr><tr><td style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.4;'><b>Real Cordoval – Sporting Terrazas</b><div style='font-size:12px;color:#6b7280;'>Liga</div></td><td style='padding:10px 0;border-top:1px solid #eef1f6;text-align:right;white-space:nowrap;'><span style='background:#0f172a;color:#ffffff;font-weight:700;border-radius:8px;padding:4px 10px;font-size:14px;'>2 - 0</span></td></tr><tr><td style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.4;'><b>FC Heldmark – SV Nordhafen</b><div style='font-size:12px;color:#6b7280;'>Bundesliga</div></td><td style='padding:10px 0;border-top:1px solid #eef1f6;text-align:right;white-space:nowrap;'><span style='background:#0f172a;color:#ffffff;font-weight:700;border-radius:8px;padding:4px 10px;font-size:14px;'>4 - 2</span></td></tr></table></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#2563eb;margin-bottom:8px;'>🇫🇷 France</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Marathon de Bastide</b> — Il réunit dimanche 22 000 coureurs, selon les organisateurs.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Ligne à grande vitesse</b> — Le Conseil d'État a rejeté vendredi le recours de deux communes contre le tracé.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Service civique</b> — Les inscriptions ouvrent lundi.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#0891b2;margin-bottom:8px;'>🌐 Monde</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Sommet sur le climat à Nairobi</b> — Il s'est achevé samedi avec une déclaration commune signée par 18 pays.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Satellite indien</b> — L'Inde a lancé samedi un satellite d'observation de la Terre depuis le centre de Sriharikota.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Pétrolier Sirius</b> — Échoué depuis jeudi au large de Gibraltar, il a été remis à flot samedi sans pollution constatée, selon les autorités portuaires.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#475569;margin-bottom:8px;'>🛡️ Armée & Défense</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Exercice Cobra Blanc</b> — Les armées l'ont lancé samedi dans les Alpes, avec 2 500 militaires.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>État-major</b> — Le chef d'état-major des armées recevra lundi son homologue italien à Paris.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#059669;margin-bottom:8px;'>💼 Business & Éco</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Bourse de Paris</b> — Elle a terminé la semaine en hausse de 1,2 % vendredi soir.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7c3aed;margin-bottom:8px;'>💻 Tech & IA</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Messagerie Pigeon</b> — L'application dépasse les 100 millions d'utilisateurs, annonce sa société samedi.</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#d97706;margin-bottom:8px;'>📜 Ce jour en 1492</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'><b>Christophe Colomb aux Bahamas</b> — Il aborde une île des Bahamas lors de son premier voyage vers l'ouest.</div></div><div style='background:#4c1d95;background-image:linear-gradient(135deg,#1e1b4b 0%,#4c1d95 100%);border-radius:16px;padding:22px;margin-top:16px;color:#ffffff;text-align:center;'><div style='font-size:18px;line-height:1.5;font-style:italic;'>« Il faut de plus grandes vertus pour soutenir la bonne fortune que la mauvaise. »</div><div style='font-size:13px;margin-top:10px;opacity:0.8;'>— La Rochefoucauld, Maximes</div></div><div style='background:#ffffff;border-radius:16px;padding:20px 22px;margin-top:16px;'><div style='font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#db2777;margin-bottom:8px;'>📅 Résumé de la semaine (du 6 octobre au 12 octobre)</div><div style='padding:10px 0 2px;font-size:15px;'><b>France</b></div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'>Les chauffeurs de bus de Bastide ont mis fin mercredi à une grève de huit jours après un accord salarial.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'>L'Assemblée nationale a adopté jeudi la loi sur le logement étudiant par 312 voix contre 241.</div><div style='padding:10px 0 2px;font-size:15px;'><b>Monde</b></div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'>Le dernier bilan de l'ouragan Marcia fait état de 14 morts, selon les autorités mexicaines.</div><div style='padding:10px 0 2px;font-size:15px;'><b>Armée & Défense</b></div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'>La marine a pris livraison jeudi d'un nouveau sous-marin d'attaque.</div><div style='padding:10px 0 2px;font-size:15px;'><b>Business & Éco</b></div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'>La croissance de la zone euro au troisième trimestre est estimée à 0,3 %, selon l'institut statistique européen.</div><div style='padding:10px 0 2px;font-size:15px;'><b>Tech & IA</b></div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'>Le constructeur Orbis annonce avoir vendu 400 000 montres connectées en 72 heures.</div><div style='padding:10px 0 2px;font-size:15px;'><b>Sport</b></div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:15px;line-height:1.55;'>Rugby : la France s'est imposée 28-17 face à l'Écosse samedi.</div><div style='padding:10px 0;border-top:1px solid #eef1f6;font-size:14px;line-height:1.55;color:#6b7280;'><i>Tendance de la semaine : adoption de la loi sur le logement étudiant, bilan de l'ouragan Marcia et succès commercial de la montre Orbis.</i></div></div><div style='text-align:center;font-size:12px;color:#9ca3af;margin-top:20px;'>Généré automatiquement · Sources : Brave Search</div></div></div>\n"
      + "</output>\n"
      + "</example_3>\n"
      + "</examples>\n"
      + "\n"
      + "<output_format>\n"
      + "Réponds UNIQUEMENT avec du code HTML : aucun texte avant ou après, aucun bloc de code markdown, aucun ```. Utilise des styles inline et suis EXACTEMENT la structure des exemples : début (conteneur gris + largeur 640 px), en-tête dégradé bleu avec la date et la météo, cartes blanches dans l'ordre Football (#16a34a), France (#2563eb), Monde (#0891b2), Armée & Défense (#475569), Business & Éco (#059669), Tech & IA (#7c3aed), Ce jour en [année] (#d97706), carte Citation (dégradé violet), puis pied de page.\n"
      + "- Football : un seul tableau, une ligne par match (équipes, compétition, score dans une pastille sombre) ; si aucun score exact n'est trouvé : un seul item avec « Pas de grand match hier ».\n"
      + "- Actualités : un item par point, avec le titre court en gras suivi d'une phrase précise.\n"
      + "- Aucun contenu inventé ; une rubrique sans information fiable contient l'item « Information non disponible ».\n"
      + "{{ $now.weekday === 7 ? `- SECTION SUPPLÉMENTAIRE (dimanche) : juste après la carte Citation et avant le pied de page, ajoute une carte « 📅 Résumé de la semaine (du ${$now.minus({ days: 6 }).setLocale('fr').toFormat('d MMMM')} au ${$now.setLocale('fr').toFormat('d MMMM')}) » de couleur #db2777, sur le modèle de l'exemple 3. Avant de la rédiger, fais une recherche Brave par rubrique sur la semaine écoulée (France, monde, armée et défense, business et économie, tech et IA, sport). Présente 5 à 7 faits marquants précis, groupés par rubrique (nom de la rubrique en gras avant ses items), chacun en 1 à 2 phrases datées si nécessaire, puis une dernière ligne en italique sur la tendance générale de la semaine, composée uniquement de faits déjà cités. Mêmes règles de fidélité que le reste du briefing.` : `- Ce n'est pas dimanche : n'ajoute PAS de carte Résumé de la semaine.` }}\n"
      + "</output_format>\n"
      + "</instructions>\n"
      + "\n"
      + "<inputs>\n"
      + "<date_du_jour>{{ $now.setLocale('fr').toFormat('cccc d LLLL yyyy') }}</date_du_jour>\n"
      + "<date_de_la_veille>{{ $now.minus({ days: 1 }).setLocale('fr').toFormat('cccc d LLLL yyyy') }}</date_de_la_veille>\n"
      + "<jour_et_mois_du_jour>{{ $now.setLocale('fr').toFormat('d MMMM') }}</jour_et_mois_du_jour>\n"
      + "<est_dimanche>{{ $now.weekday === 7 ? 'oui' : 'non' }}</est_dimanche>\n"
      + "<periode_du_resume_de_la_semaine>{{ $now.weekday === 7 ? 'du ' + $now.minus({ days: 6 }).setLocale('fr').toFormat('d MMMM') + ' au ' + $now.setLocale('fr').toFormat('d MMMM') : 'sans objet (ce n\\'est pas dimanche)' }}</periode_du_resume_de_la_semaine>\n"
      + "</inputs>"
      ),
      needsFallback: true,
      options: {
        systemMessage:
          "<role>\n"
      + "Tu es un journaliste-rédacteur de revue de presse personnelle, rigoureux et factuel. Chaque matin, tu rédiges en français le briefing HTML d'un lecteur unique, Antonin. Tu travailles comme un vérificateur de faits : tu utilises systématiquement l'outil Brave Search (plusieurs fois, une requête par sujet) et tu n'écris que ce que les résultats de recherche affirment explicitement. Tu réponds uniquement avec le code HTML demandé, sans aucun texte autour.\n"
      + "</role>",
        maxIterations: 20
      }
    },
    subnodes: { model: [newsModel, newsFallbackModel], tools: [braveSearch] },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 10000,
    position: [320, -64]
  },
  output: [{ output: "<div style='background:#eef1f6;padding:24px 12px;'>Briefing HTML</div>" }]
});

const podcastModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.2,
  config: {
    name: 'Using Gemini (Podcast)',
    parameters: { modelName: 'models/gemini-flash-latest', options: { temperature: 0.9 } },
    credentials: { googlePalmApi: newCredential('Google Gemini (PaLM) API') },
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 3000,
    position: [728, 152]
  }
});

const podcastFallbackModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
  version: 1.2,
  config: {
    name: 'Using Gemini (Podcast Fallback)',
    parameters: { modelName: 'models/gemini-flash-lite-latest', options: { temperature: 0.9 } },
    credentials: { googlePalmApi: newCredential('Google Gemini (PaLM) API') },
    position: [856, 152]
  }
});

const podcastWriter = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Podcast Writer',
    parameters: {
      promptType: 'define',
      text: expr(
        "<instructions>\n"
      + "<goal>\n"
      + "Transformer le briefing du jour en script de mini-podcast d'environ 3 minutes, lu à voix haute, drôle et complice sur les sujets légers, sobre sur les sujets graves, en suivant la trame du briefing et en n'utilisant que ses faits.\n"
      + "</goal>\n"
      + "\n"
      + "<context>\n"
      + "<auditeur>\n"
      + "Antonin écoute l'épisode au réveil, en mp3. Le script est lu tel quel par une synthèse vocale : tout ce qui est écrit est prononcé littéralement (symboles, chiffres, sigles, nombres).\n"
      + "</auditeur>\n"
      + "\n"
      + "<duree_et_longueur>\n"
      + "Le script dure environ 3 minutes à l'oral. Vise {{ $now.weekday === 7 ? '3200 à 3600' : '2600 à 3000' }} caractères, espaces compris, et ne dépasse JAMAIS {{ $now.weekday === 7 ? 3800 : 3200 }} caractères. Pour rester dans la limite, résume plutôt que d'allonger : une ou deux phrases par actualité.\n"
      + "</duree_et_longueur>\n"
      + "\n"
      + "<structure>\n"
      + "Une accroche drôle avec la date, puis la météo, le football, les actualités (France, monde, armée et défense, économie, tech et IA), « ce jour dans l'histoire », la citation, et une conclusion rapide avec un au revoir sympa. Si le briefing contient un « Résumé de la semaine », termine l'épisode avec ce résumé en 4 ou 5 phrases.\n"
      + "</structure>\n"
      + "\n"
      + "<humour>\n"
      + "Ton d'un ami qui raconte l'actu en buvant son café : autodérision, jeux de mots, comparaisons décalées, exagérations, petites chutes. Varie les procédés d'une rubrique à l'autre et d'un jour à l'autre. Une ou deux vannes sur les rubriques légères (météo, football, économie, tech, histoire, citation, vie quotidienne). Sois vraiment drôle, pas seulement poli. L'humour porte sur la façon de raconter, jamais sur de faux faits.\n"
      + "</humour>\n"
      + "\n"
      + "<sujets_graves>\n"
      + "Pour les morts, accidents, violences, guerres, attaques, catastrophes et drames, ainsi que pour la rubrique Armée et Défense : ton sobre et respectueux, aucune blague, aucune plaisanterie dans la phrase suivante non plus. Aucune moquerie visant une personne réelle ou un parti politique.\n"
      + "</sujets_graves>\n"
      + "\n"
      + "<fidelite>\n"
      + "Utilise UNIQUEMENT les faits du briefing. N'invente et ne modifie aucun chiffre, score, nom, lieu ou événement. Recopie les noms d'équipes, de personnes et d'organisations exactement comme dans le briefing (n'ajoute aucun préfixe ou nom de club complet de mémoire). Conserve le degré de certitude : « devrait », « selon une source », « prévu » restent tels quels. Si le briefing indique « Pas de grand match hier » ou « Information non disponible », dis simplement que tu n'as pas de résultat fiable à donner ; n'affirme jamais qu'aucun match ou événement n'a eu lieu.\n"
      + "</fidelite>\n"
      + "\n"
      + "<prononciation>\n"
      + "Écris tout pour l'oreille : les nombres, années et dates en toutes lettres (2100 devient « deux mille cent », « 14 mai » devient « quatorze mai », « 1er septembre » devient « premier septembre »), les scores à l'oral (« 4-1 » devient « quatre à un »), les degrés et pourcentages en mots (« 7 °C » devient « sept degrés », « 2,25 % » devient « deux virgule vingt-cinq pour cent »), les chiffres romains prononcés (« Henri IV » devient « Henri quatre »), les devises et unités en mots. Évite les contractions difficiles à prononcer (écris « que lui », pas « qu'lui »).\n"
      + "</prononciation>\n"
      + "</context>\n"
      + "\n"
      + "<examples>\n"
      + "Les trois exemples ci-dessous sont entièrement FICTIFS et abrégés. Ils montrent le ton, le traitement des sujets graves et la mise en forme orale. Ne reprends jamais leur contenu, et couvre dans ta réponse toutes les rubriques de TON briefing.\n"
      + "\n"
      + "<example_1>\n"
      + "<inputs>\n"
      + "<date_du_jour>mercredi 14 mai 2031</date_du_jour>\n"
      + "<longueur_max_caracteres>3200</longueur_max_caracteres>\n"
      + "<est_dimanche>non</est_dimanche>\n"
      + "<briefing_texte>\n"
      + "Briefing matinal Mercredi 14 mai 2031 🌡️ Paris : 11 °C le matin → 22 °C l'après-midi, ciel dégagé ⚽ Football FC Valmont – Athletic Rivoli Ligue des champions (demi-finale aller) 2 - 1 Dinamo Kestel – Real Santander Ligue des champions (demi-finale aller) 0 - 0 Northbridge United – Kingsford City Premier League 3 - 1 🇫🇷 France Bus gratuits à Valmont — Le conseil municipal a voté mardi soir la gratuité des bus le samedi, à partir du 1er septembre. Grève dans les transports — Le préavis lancé par deux syndicats est maintenu pour jeudi, selon la direction de l'opérateur ferroviaire. Logement étudiant — Le projet de loi sera examiné à l'Assemblée la semaine prochaine. 🌐 Monde Séisme au large du Chili — Magnitude de 6,1 ; aucune victime signalée, selon les autorités. Législatives au Pérou — Le parti Avance Péruvienne arrive en tête avec 31,2 % des voix après dépouillement de 90 % des bulletins. Sommet des ministres des Finances — Ils se retrouvent jeudi à Lisbonne. 🛡️ Armée & Défense Frégate Aurore — Elle a quitté Toulon mardi pour une mission de quatre mois dans l'océan Indien, annonce l'état-major. Exercice Baltic Shield — 8 000 militaires de dix pays y sont engagés jusqu'au 22 mai. 💼 Business & Éco Taux directeur — La banque centrale l'a laissé inchangé à 2,25 % mardi. 💻 Tech & IA Traduction hors connexion — Le laboratoire Nuvola a dévoilé mardi un modèle de traduction vocale qui fonctionne hors connexion sur smartphone. 📜 Ce jour en 1610 Assassinat d'Henri IV — Le roi est assassiné rue de la Ferronnerie, à Paris, par François Ravaillac. « Il faut manger pour vivre et non vivre pour manger. » — Molière, L'Avare Généré automatiquement · Sources : Brave Search\n"
      + "</briefing_texte>\n"
      + "</inputs>\n"
      + "<output>\n"
      + "Bonjour Antonin, et bienvenue dans ton briefing du mercredi quatorze mai deux mille trente et un. Respire un bon coup, le café est en route, et toi aussi, normalement.\n"
      + "\n"
      + "Commençons par la météo à Paris : onze degrés ce matin, vingt-deux cet après-midi, et un ciel complètement dégagé. Autrement dit, aucune excuse pour rester sous la couette, ni pour sortir avec trois pulls.\n"
      + "\n"
      + "Côté football, la Ligue des champions a joué ses demi-finales aller. Le FC Valmont s'impose deux à un face à l'Athletic Rivoli : un match serré, mais pas de quoi se ronger les ongles jusqu'au coude. À Kestel, la Dinamo et le Real Santander se quittent sur un zéro à zéro, le seul score qui ne fait vraiment gagner personne. Et en Premier League, Northbridge United bat Kingsford City trois à un.\n"
      + "\n"
      + "En France, le conseil municipal de Valmont a voté la gratuité des bus le samedi à partir du premier septembre. Enfin une bonne raison d'arriver en retard, gratuitement. Dans les transports, le préavis de grève de deux syndicats est maintenu pour jeudi, selon la direction de l'opérateur ferroviaire : prévois un plan B, et peut-être un plan C. Et à l'Assemblée, le projet de loi sur le logement étudiant sera examiné la semaine prochaine.\n"
      + "\n"
      + "Dans le monde, un séisme de magnitude six virgule un a eu lieu au large du Chili. Aucune victime n'est signalée, selon les autorités. Au Pérou, après dépouillement de quatre-vingt-dix pour cent des bulletins, le parti Avance Péruvienne arrive en tête avec trente et un virgule deux pour cent des voix. Et jeudi, les ministres des Finances se retrouvent à Lisbonne. Au programme : des chiffres, des chiffres, et encore des chiffres.\n"
      + "\n"
      + "Côté défense, la frégate Aurore a quitté Toulon mardi pour une mission de quatre mois dans l'océan Indien, annonce l'état-major. Par ailleurs, l'exercice Baltic Shield engage huit mille militaires de dix pays jusqu'au vingt-deux mai.\n"
      + "\n"
      + "En économie, la banque centrale a laissé son taux directeur inchangé à deux virgule vingt-cinq pour cent. Rien ne bouge : pour un taux, c'est un peu son métier.\n"
      + "\n"
      + "En tech, le laboratoire Nuvola a dévoilé un modèle de traduction vocale qui fonctionne sans connexion sur smartphone. Voilà de quoi commander un café à l'étranger sans réseau, et sans mimer une tasse.\n"
      + "\n"
      + "Ce jour dans l'histoire : le quatorze mai seize cent dix, le roi Henri quatre est assassiné rue de la Ferronnerie, à Paris, par François Ravaillac.\n"
      + "\n"
      + "Et pour finir, une phrase de Molière dans L'Avare : il faut manger pour vivre et non vivre pour manger. Ça tombe bien, c'est bientôt l'heure du petit-déjeuner. Belle journée, Antonin, et à demain !\n"
      + "</output>\n"
      + "</example_1>\n"
      + "\n"
      + "<example_2>\n"
      + "<inputs>\n"
      + "<date_du_jour>lundi 6 octobre 2031</date_du_jour>\n"
      + "<longueur_max_caracteres>3200</longueur_max_caracteres>\n"
      + "<est_dimanche>non</est_dimanche>\n"
      + "<briefing_texte>\n"
      + "Briefing matinal Lundi 6 octobre 2031 🌡️ Paris : 9 °C le matin → 13 °C l'après-midi, pluie continue ⚽ Football Pas de grand match hier 🇫🇷 France Vaccination contre la grippe — La ministre de la Santé a annoncé dimanche une campagne de vaccination dès le 14 octobre. Rocade nord de Bastide — Elle sera fermée de nuit du 8 au 12 octobre pour travaux. Retraites complémentaires — Le projet de réforme devrait être présenté en Conseil des ministres à la fin du mois, selon une source gouvernementale. 🌐 Monde Ouragan Marcia — Il a touché terre dimanche sur la côte nord du Mexique : 4 morts selon un premier bilan des autorités, 30 000 personnes évacuées. Union européenne – Inde — Un nouveau cycle de négociations commerciales s'ouvre lundi à Bruxelles. Prix Nobel de médecine — Il sera attribué lundi à Stockholm. 🛡️ Armée & Défense Hélicoptères de transport — Le ministère a confirmé le 2 octobre la livraison de douze appareils d'ici 2033. Exercice Cobra Noir — L'armée de l'air y participe jusqu'à jeudi. 💼 Business & Éco Pétrole — Le baril de Brent recule de 1,8 % à 74,10 dollars ce matin. 💻 Tech & IA Montre connectée Orbis — Le constructeur la présentera mardi ; le prix n'a pas été communiqué. 📜 Ce jour en 1927 Le Chanteur de jazz — La première du film a lieu à New York ; il marque l'avènement du cinéma parlant. « Il faut cultiver notre jardin. » — Voltaire, Candide Généré automatiquement · Sources : Brave Search\n"
      + "</briefing_texte>\n"
      + "</inputs>\n"
      + "<output>\n"
      + "Bonjour Antonin, nous sommes lundi six octobre deux mille trente et un. Le week-end est terminé, mais rassure-toi : le lundi est le seul jour qui ne ment pas sur ses intentions.\n"
      + "\n"
      + "À Paris, neuf degrés ce matin, treize cet après-midi, et de la pluie continue. Parapluie, bottes, et une bonne dose de philosophie.\n"
      + "\n"
      + "Côté football, je n'ai pas de grand résultat fiable à te donner pour hier. On se rattrape très vite.\n"
      + "\n"
      + "En France, la ministre de la Santé a annoncé dimanche une campagne de vaccination contre la grippe dès le quatorze octobre. Ton bras te remerciera, enfin, il fera semblant. La rocade nord de Bastide sera fermée de nuit du huit au douze octobre pour travaux. Et la réforme des retraites complémentaires devrait être présentée en Conseil des ministres à la fin du mois, selon une source gouvernementale. Je dis bien devrait : on garde le conditionnel.\n"
      + "\n"
      + "Dans le monde, l'ouragan Marcia a touché terre dimanche sur la côte nord du Mexique. Le premier bilan des autorités fait état de quatre morts, et trente mille personnes ont été évacuées. Nos pensées vont aux victimes et à leurs proches. Par ailleurs, un nouveau cycle de négociations commerciales entre l'Union européenne et l'Inde s'ouvre aujourd'hui à Bruxelles, et le prix Nobel de médecine sera attribué aujourd'hui à Stockholm.\n"
      + "\n"
      + "Côté défense, le ministère a confirmé le deux octobre la livraison de douze hélicoptères de transport d'ici deux mille trente-trois. L'armée de l'air participe à l'exercice Cobra Noir jusqu'à jeudi.\n"
      + "\n"
      + "En économie, le baril de Brent recule de un virgule huit pour cent, à soixante-quatorze dollars dix ce matin. Un baril qui baisse, ça change.\n"
      + "\n"
      + "En tech, le constructeur Orbis présentera demain sa nouvelle montre connectée. Le prix n'a pas été communiqué, mais on devine déjà qu'elle donnera l'heure avec beaucoup de style.\n"
      + "\n"
      + "Ce jour dans l'histoire : le six octobre mille neuf cent vingt-sept, la première du film Le Chanteur de jazz a lieu à New York. Elle marque l'avènement du cinéma parlant. Avant, les acteurs avaient surtout l'air très expressifs.\n"
      + "\n"
      + "Et pour finir, Voltaire dans Candide : il faut cultiver notre jardin. Avec la pluie qui tombe, le tien va pousser tout seul. Bonne journée, Antonin !\n"
      + "</output>\n"
      + "</example_2>\n"
      + "\n"
      + "<example_3>\n"
      + "<inputs>\n"
      + "<date_du_jour>dimanche 12 octobre 2031</date_du_jour>\n"
      + "<longueur_max_caracteres>3800</longueur_max_caracteres>\n"
      + "<est_dimanche>oui</est_dimanche>\n"
      + "<briefing_texte>\n"
      + "Briefing matinal Dimanche 12 octobre 2031 🌡️ Paris : 6 °C le matin → 15 °C l'après-midi, brouillard puis éclaircies ⚽ Football AS Montvert – RC Belmont Ligue 1 1 - 1 SC Argonne – FC Orlane Ligue 1 3 - 0 Real Cordoval – Sporting Terrazas Liga 2 - 0 FC Heldmark – SV Nordhafen Bundesliga 4 - 2 🇫🇷 France Marathon de Bastide — Il réunit dimanche 22 000 coureurs, selon les organisateurs. Ligne à grande vitesse — Le Conseil d'État a rejeté vendredi le recours de deux communes contre le tracé. Service civique — Les inscriptions ouvrent lundi. 🌐 Monde Sommet sur le climat à Nairobi — Il s'est achevé samedi avec une déclaration commune signée par 18 pays. Satellite indien — L'Inde a lancé samedi un satellite d'observation de la Terre depuis le centre de Sriharikota. Pétrolier Sirius — Échoué depuis jeudi au large de Gibraltar, il a été remis à flot samedi sans pollution constatée, selon les autorités portuaires. 🛡️ Armée & Défense Exercice Cobra Blanc — Les armées l'ont lancé samedi dans les Alpes, avec 2 500 militaires. État-major — Le chef d'état-major des armées recevra lundi son homologue italien à Paris. 💼 Business & Éco Bourse de Paris — Elle a terminé la semaine en hausse de 1,2 % vendredi soir. 💻 Tech & IA Messagerie Pigeon — L'application dépasse les 100 millions d'utilisateurs, annonce sa société samedi. 📜 Ce jour en 1492 Christophe Colomb aux Bahamas — Il aborde une île des Bahamas lors de son premier voyage vers l'ouest. « Il faut de plus grandes vertus pour soutenir la bonne fortune que la mauvaise. » — La Rochefoucauld, Maximes 📅 Résumé de la semaine (du 6 octobre au 12 octobre) France Les chauffeurs de bus de Bastide ont mis fin mercredi à une grève de huit jours après un accord salarial. L'Assemblée nationale a adopté jeudi la loi sur le logement étudiant par 312 voix contre 241. Monde Le dernier bilan de l'ouragan Marcia fait état de 14 morts, selon les autorités mexicaines. Armée & Défense La marine a pris livraison jeudi d'un nouveau sous-marin d'attaque. Business & Éco La croissance de la zone euro au troisième trimestre est estimée à 0,3 %, selon l'institut statistique européen. Tech & IA Le constructeur Orbis annonce avoir vendu 400 000 montres connectées en 72 heures. Sport Rugby : la France s'est imposée 28-17 face à l'Écosse samedi. Tendance de la semaine : adoption de la loi sur le logement étudiant, bilan de l'ouragan Marcia et succès commercial de la montre Orbis. Généré automatiquement · Sources : Brave Search\n"
      + "</briefing_texte>\n"
      + "</inputs>\n"
      + "<output>\n"
      + "Bonjour Antonin, nous sommes dimanche douze octobre deux mille trente et un, jour de grasse matinée officielle. Aujourd'hui, en plus de l'actu du jour, on fait aussi le point sur la semaine.\n"
      + "\n"
      + "À Paris, six degrés ce matin, quinze cet après-midi, avec du brouillard puis des éclaircies. Comme ta mémoire avant le premier café.\n"
      + "\n"
      + "Côté football, hier : en Ligue 1, l'AS Montvert et le RC Belmont se quittent sur un un partout, et le SC Argonne l'emporte trois à zéro contre le FC Orlane. En Liga, le Real Cordoval bat le Sporting Terrazas deux à zéro. Et en Bundesliga, le FC Heldmark s'impose quatre à deux face au SV Nordhafen. Six buts, c'est le genre de match qui fait oublier qu'on voulait faire une sieste.\n"
      + "\n"
      + "En France, le marathon de Bastide réunit aujourd'hui vingt-deux mille coureurs, selon les organisateurs. Pense à applaudir depuis ton canapé, c'est un sport aussi. Le Conseil d'État a rejeté vendredi le recours de deux communes contre le tracé d'une ligne à grande vitesse. Et les inscriptions au service civique ouvrent lundi.\n"
      + "\n"
      + "Dans le monde, un sommet régional sur le climat s'est achevé samedi à Nairobi avec une déclaration commune signée par dix-huit pays. L'Inde a lancé samedi un satellite d'observation de la Terre depuis le centre de Sriharikota. Et le pétrolier Sirius, échoué depuis jeudi au large de Gibraltar, a été remis à flot samedi sans pollution constatée, selon les autorités portuaires.\n"
      + "\n"
      + "Côté défense, les armées ont lancé samedi l'exercice Cobra Blanc dans les Alpes, avec deux mille cinq cents militaires. Le chef d'état-major des armées recevra lundi son homologue italien à Paris.\n"
      + "\n"
      + "En économie, la Bourse de Paris a terminé la semaine en hausse de un virgule deux pour cent. En tech, l'application de messagerie Pigeon dépasse les cent millions d'utilisateurs, annonce sa société. Cent millions de gens qui s'envoient des messages, et toi, tu attends toujours une réponse d'hier.\n"
      + "\n"
      + "Ce jour dans l'histoire : le douze octobre quatorze cent quatre-vingt-douze, Christophe Colomb aborde une île des Bahamas lors de son premier voyage vers l'ouest. Et la citation du jour est de La Rochefoucauld : il faut de plus grandes vertus pour soutenir la bonne fortune que la mauvaise.\n"
      + "\n"
      + "Et maintenant, le résumé de la semaine. En France, les chauffeurs de bus de Bastide ont mis fin mercredi à une grève de huit jours après un accord salarial, et l'Assemblée nationale a adopté jeudi la loi sur le logement étudiant par trois cent douze voix contre deux cent quarante et une. Dans le monde, le dernier bilan de l'ouragan Marcia fait état de quatorze morts, selon les autorités mexicaines. La marine a pris livraison d'un nouveau sous-marin d'attaque, la croissance de la zone euro au troisième trimestre est estimée à zéro virgule trois pour cent, et le constructeur Orbis annonce avoir vendu quatre cent mille montres connectées en soixante-douze heures. Côté sport, la France s'est imposée vingt-huit à dix-sept face à l'Écosse en rugby. Une semaine marquée par la loi sur le logement étudiant, le bilan de l'ouragan Marcia et le succès de la montre Orbis.\n"
      + "\n"
      + "Bon dimanche, Antonin, et à demain !\n"
      + "</output>\n"
      + "</example_3>\n"
      + "</examples>\n"
      + "\n"
      + "<output_format>\n"
      + "Réponds uniquement avec le script du podcast : du texte brut destiné à être lu à voix haute, en paragraphes courts séparés par une ligne vide. Pas de HTML, pas de markdown, pas d'émojis, pas de titres, pas de symboles (%, °C, €, $, -), pas d'indications entre parenthèses ou crochets, pas de didascalies. Phrases courtes, transitions orales naturelles, une accroche au début et un au revoir à la fin. Respecte la longueur maximale indiquée dans les inputs.\n"
      + "</output_format>\n"
      + "</instructions>\n"
      + "\n"
      + "<inputs>\n"
      + "<date_du_jour>{{ $now.setLocale('fr').toFormat('cccc d LLLL yyyy') }}</date_du_jour>\n"
      + "<longueur_max_caracteres>{{ $now.weekday === 7 ? 3800 : 3200 }}</longueur_max_caracteres>\n"
      + "<est_dimanche>{{ $now.weekday === 7 ? 'oui' : 'non' }}</est_dimanche>\n"
      + "<briefing_texte>\n"
      + "{{ $('News Redactor').first().json.output.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim() }}\n"
      + "</briefing_texte>\n"
      + "</inputs>"
      ),
      needsFallback: true,
      options: {
        systemMessage:
          "<role>\n"
      + "Tu es l'animateur d'un mini-podcast matinal francophone, drôle, complice et rigoureux : tu racontes l'actualité à Antonin comme un ami au petit-déjeuner, avec de l'humour sur les sujets légers et de la sobriété sur les sujets graves, sans jamais rien inventer. Tu ne produis que le texte à lire à voix haute, rien d'autre.\n"
      + "</role>"
      }
    },
    subnodes: { model: [podcastModel, podcastFallbackModel] },
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 5000,
    position: [720, -64]
  },
  output: [{ output: 'Bonjour Antonin, voici ton briefing du jour.' }]
});

const podcastVoice = node({
  type: '@n8n/n8n-nodes-langchain.openAi',
  version: 2.3,
  config: {
    name: 'Podcast Voice (MP3)',
    parameters: {
      resource: 'audio',
      model: 'tts-1-hd',
      input: expr('{{ $json.output.slice(0, 4090) }}'),
      voice: 'nova',
      options: { response_format: 'mp3', binaryPropertyOutput: 'data' }
    },
    credentials: { openAiApi: newCredential('OpenAI') },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    position: [1072, -64]
  },
  output: [{}]
});

const mp3Name = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Nom du fichier MP3',
    parameters: {
      jsCode:
        "const items = $input.all();\n"
        + "for (const item of items) {\n"
        + "  if (item.binary && item.binary.data) {\n"
        + "    item.binary.data.fileName = `briefing-${$now.toFormat('yyyy-MM-dd')}.mp3`;\n"
        + "    item.binary.data.mimeType = 'audio/mpeg';\n"
        + "  }\n"
        + "}\n"
        + "return items;"
    },
    position: [1296, -64]
  },
  output: [{}]
});

const sendFinalMail = node({
  type: 'n8n-nodes-base.gmail',
  version: 2.2,
  config: {
    name: 'Send Final Mail',
    parameters: {
      sendTo: 'votre.adresse@example.com',
      subject: expr("☀️ Mon Briefing du {{ $now.setLocale('fr').toFormat('cccc d LLLL yyyy') }}{{ $now.weekday === 7 ? ' + Résumé de la semaine' : '' }}"),
      message: expr("{{ $('News Redactor').first().json.output.replace(/^\\s*```(?:html)?\\s*/i, '').replace(/\\s*```\\s*$/, '') }}"),
      options: {
        appendAttribution: false,
        attachmentsUi: { attachmentsBinary: [{}] },
        senderName: 'Mon Briefing'
      }
    },
    credentials: { gmailOAuth2: newCredential('Gmail') },
    position: [1520, -64]
  },
  output: [{}]
});

export default workflow('oMqZi2yoA0TX7azo', 'Briefing matinal quotidien par mail + podcast audio')
  .add(scheduleTrigger)
  .to(
    isWeekend
      .onTrue(waitUntilNine.to(newsRedactor))
      .onFalse(newsRedactor)
  )
  .add(newsRedactor)
  .to(podcastWriter)
  .to(podcastVoice)
  .to(mp3Name)
  .to(sendFinalMail);
