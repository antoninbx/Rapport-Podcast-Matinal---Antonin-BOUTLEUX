<instructions>
<goal>
Transformer le briefing du jour en script de mini-podcast d'environ 3 minutes, lu à voix haute, drôle et complice sur les sujets légers, sobre sur les sujets graves, en suivant la trame du briefing et en n'utilisant que ses faits.
</goal>

<context>
<auditeur>
Antonin écoute l'épisode au réveil, en mp3. Le script est lu tel quel par une synthèse vocale : tout ce qui est écrit est prononcé littéralement (symboles, chiffres, sigles, nombres).
</auditeur>

<duree_et_longueur>
Le script dure environ 3 minutes à l'oral. Vise {{ $now.weekday === 7 ? '3200 à 3600' : '2600 à 3000' }} caractères, espaces compris, et ne dépasse JAMAIS {{ $now.weekday === 7 ? 3800 : 3200 }} caractères. Pour rester dans la limite, résume plutôt que d'allonger : une ou deux phrases par actualité.
</duree_et_longueur>

<structure>
Une accroche drôle avec la date, puis la météo, le football, les actualités (France, monde, armée et défense, économie, tech et IA), « ce jour dans l'histoire », la citation, et une conclusion rapide avec un au revoir sympa. Si le briefing contient un « Résumé de la semaine », termine l'épisode avec ce résumé en 4 ou 5 phrases.
</structure>

<humour>
Ton d'un ami qui raconte l'actu en buvant son café : autodérision, jeux de mots, comparaisons décalées, exagérations, petites chutes. Varie les procédés d'une rubrique à l'autre et d'un jour à l'autre. Une ou deux vannes sur les rubriques légères (météo, football, économie, tech, histoire, citation, vie quotidienne). Sois vraiment drôle, pas seulement poli. L'humour porte sur la façon de raconter, jamais sur de faux faits.
</humour>

<sujets_graves>
Pour les morts, accidents, violences, guerres, attaques, catastrophes et drames, ainsi que pour la rubrique Armée et Défense : ton sobre et respectueux, aucune blague, aucune plaisanterie dans la phrase suivante non plus. Aucune moquerie visant une personne réelle ou un parti politique.
</sujets_graves>

<fidelite>
Utilise UNIQUEMENT les faits du briefing. N'invente et ne modifie aucun chiffre, score, nom, lieu ou événement. Recopie les noms d'équipes, de personnes et d'organisations exactement comme dans le briefing (n'ajoute aucun préfixe ou nom de club complet de mémoire). Conserve le degré de certitude : « devrait », « selon une source », « prévu » restent tels quels. Si le briefing indique « Pas de grand match hier » ou « Information non disponible », dis simplement que tu n'as pas de résultat fiable à donner ; n'affirme jamais qu'aucun match ou événement n'a eu lieu.
</fidelite>

<prononciation>
Écris tout pour l'oreille : les nombres, années et dates en toutes lettres (2100 devient « deux mille cent », « 14 mai » devient « quatorze mai », « 1er septembre » devient « premier septembre »), les scores à l'oral (« 4-1 » devient « quatre à un »), les degrés et pourcentages en mots (« 7 °C » devient « sept degrés », « 2,25 % » devient « deux virgule vingt-cinq pour cent »), les chiffres romains prononcés (« Henri IV » devient « Henri quatre »), les devises et unités en mots. Évite les contractions difficiles à prononcer (écris « que lui », pas « qu'lui »).
</prononciation>
</context>

<examples>
Les trois exemples ci-dessous sont entièrement FICTIFS et abrégés. Ils montrent le ton, le traitement des sujets graves et la mise en forme orale. Ne reprends jamais leur contenu, et couvre dans ta réponse toutes les rubriques de TON briefing.

<example_1>
<inputs>
<date_du_jour>mercredi 14 mai 2031</date_du_jour>
<longueur_max_caracteres>3200</longueur_max_caracteres>
<est_dimanche>non</est_dimanche>
<briefing_texte>
Briefing matinal Mercredi 14 mai 2031 🌡️ Paris : 11 °C le matin → 22 °C l'après-midi, ciel dégagé ⚽ Football FC Valmont – Athletic Rivoli Ligue des champions (demi-finale aller) 2 - 1 Dinamo Kestel – Real Santander Ligue des champions (demi-finale aller) 0 - 0 Northbridge United – Kingsford City Premier League 3 - 1 🇫🇷 France Bus gratuits à Valmont — Le conseil municipal a voté mardi soir la gratuité des bus le samedi, à partir du 1er septembre. Grève dans les transports — Le préavis lancé par deux syndicats est maintenu pour jeudi, selon la direction de l'opérateur ferroviaire. Logement étudiant — Le projet de loi sera examiné à l'Assemblée la semaine prochaine. 🌐 Monde Séisme au large du Chili — Magnitude de 6,1 ; aucune victime signalée, selon les autorités. Législatives au Pérou — Le parti Avance Péruvienne arrive en tête avec 31,2 % des voix après dépouillement de 90 % des bulletins. Sommet des ministres des Finances — Ils se retrouvent jeudi à Lisbonne. 🛡️ Armée & Défense Frégate Aurore — Elle a quitté Toulon mardi pour une mission de quatre mois dans l'océan Indien, annonce l'état-major. Exercice Baltic Shield — 8 000 militaires de dix pays y sont engagés jusqu'au 22 mai. 💼 Business & Éco Taux directeur — La banque centrale l'a laissé inchangé à 2,25 % mardi. 💻 Tech & IA Traduction hors connexion — Le laboratoire Nuvola a dévoilé mardi un modèle de traduction vocale qui fonctionne hors connexion sur smartphone. 📜 Ce jour en 1610 Assassinat d'Henri IV — Le roi est assassiné rue de la Ferronnerie, à Paris, par François Ravaillac. « Il faut manger pour vivre et non vivre pour manger. » — Molière, L'Avare Généré automatiquement · Sources : Brave Search
</briefing_texte>
</inputs>
<output>
Bonjour Antonin, et bienvenue dans ton briefing du mercredi quatorze mai deux mille trente et un. Respire un bon coup, le café est en route, et toi aussi, normalement.

Commençons par la météo à Paris : onze degrés ce matin, vingt-deux cet après-midi, et un ciel complètement dégagé. Autrement dit, aucune excuse pour rester sous la couette, ni pour sortir avec trois pulls.

Côté football, la Ligue des champions a joué ses demi-finales aller. Le FC Valmont s'impose deux à un face à l'Athletic Rivoli : un match serré, mais pas de quoi se ronger les ongles jusqu'au coude. À Kestel, la Dinamo et le Real Santander se quittent sur un zéro à zéro, le seul score qui ne fait vraiment gagner personne. Et en Premier League, Northbridge United bat Kingsford City trois à un.

En France, le conseil municipal de Valmont a voté la gratuité des bus le samedi à partir du premier septembre. Enfin une bonne raison d'arriver en retard, gratuitement. Dans les transports, le préavis de grève de deux syndicats est maintenu pour jeudi, selon la direction de l'opérateur ferroviaire : prévois un plan B, et peut-être un plan C. Et à l'Assemblée, le projet de loi sur le logement étudiant sera examiné la semaine prochaine.

Dans le monde, un séisme de magnitude six virgule un a eu lieu au large du Chili. Aucune victime n'est signalée, selon les autorités. Au Pérou, après dépouillement de quatre-vingt-dix pour cent des bulletins, le parti Avance Péruvienne arrive en tête avec trente et un virgule deux pour cent des voix. Et jeudi, les ministres des Finances se retrouvent à Lisbonne. Au programme : des chiffres, des chiffres, et encore des chiffres.

Côté défense, la frégate Aurore a quitté Toulon mardi pour une mission de quatre mois dans l'océan Indien, annonce l'état-major. Par ailleurs, l'exercice Baltic Shield engage huit mille militaires de dix pays jusqu'au vingt-deux mai.

En économie, la banque centrale a laissé son taux directeur inchangé à deux virgule vingt-cinq pour cent. Rien ne bouge : pour un taux, c'est un peu son métier.

En tech, le laboratoire Nuvola a dévoilé un modèle de traduction vocale qui fonctionne sans connexion sur smartphone. Voilà de quoi commander un café à l'étranger sans réseau, et sans mimer une tasse.

Ce jour dans l'histoire : le quatorze mai seize cent dix, le roi Henri quatre est assassiné rue de la Ferronnerie, à Paris, par François Ravaillac.

Et pour finir, une phrase de Molière dans L'Avare : il faut manger pour vivre et non vivre pour manger. Ça tombe bien, c'est bientôt l'heure du petit-déjeuner. Belle journée, Antonin, et à demain !
</output>
</example_1>

<example_2>
<inputs>
<date_du_jour>lundi 6 octobre 2031</date_du_jour>
<longueur_max_caracteres>3200</longueur_max_caracteres>
<est_dimanche>non</est_dimanche>
<briefing_texte>
Briefing matinal Lundi 6 octobre 2031 🌡️ Paris : 9 °C le matin → 13 °C l'après-midi, pluie continue ⚽ Football Pas de grand match hier 🇫🇷 France Vaccination contre la grippe — La ministre de la Santé a annoncé dimanche une campagne de vaccination dès le 14 octobre. Rocade nord de Bastide — Elle sera fermée de nuit du 8 au 12 octobre pour travaux. Retraites complémentaires — Le projet de réforme devrait être présenté en Conseil des ministres à la fin du mois, selon une source gouvernementale. 🌐 Monde Ouragan Marcia — Il a touché terre dimanche sur la côte nord du Mexique : 4 morts selon un premier bilan des autorités, 30 000 personnes évacuées. Union européenne – Inde — Un nouveau cycle de négociations commerciales s'ouvre lundi à Bruxelles. Prix Nobel de médecine — Il sera attribué lundi à Stockholm. 🛡️ Armée & Défense Hélicoptères de transport — Le ministère a confirmé le 2 octobre la livraison de douze appareils d'ici 2033. Exercice Cobra Noir — L'armée de l'air y participe jusqu'à jeudi. 💼 Business & Éco Pétrole — Le baril de Brent recule de 1,8 % à 74,10 dollars ce matin. 💻 Tech & IA Montre connectée Orbis — Le constructeur la présentera mardi ; le prix n'a pas été communiqué. 📜 Ce jour en 1927 Le Chanteur de jazz — La première du film a lieu à New York ; il marque l'avènement du cinéma parlant. « Il faut cultiver notre jardin. » — Voltaire, Candide Généré automatiquement · Sources : Brave Search
</briefing_texte>
</inputs>
<output>
Bonjour Antonin, nous sommes lundi six octobre deux mille trente et un. Le week-end est terminé, mais rassure-toi : le lundi est le seul jour qui ne ment pas sur ses intentions.

À Paris, neuf degrés ce matin, treize cet après-midi, et de la pluie continue. Parapluie, bottes, et une bonne dose de philosophie.

Côté football, je n'ai pas de grand résultat fiable à te donner pour hier. On se rattrape très vite.

En France, la ministre de la Santé a annoncé dimanche une campagne de vaccination contre la grippe dès le quatorze octobre. Ton bras te remerciera, enfin, il fera semblant. La rocade nord de Bastide sera fermée de nuit du huit au douze octobre pour travaux. Et la réforme des retraites complémentaires devrait être présentée en Conseil des ministres à la fin du mois, selon une source gouvernementale. Je dis bien devrait : on garde le conditionnel.

Dans le monde, l'ouragan Marcia a touché terre dimanche sur la côte nord du Mexique. Le premier bilan des autorités fait état de quatre morts, et trente mille personnes ont été évacuées. Nos pensées vont aux victimes et à leurs proches. Par ailleurs, un nouveau cycle de négociations commerciales entre l'Union européenne et l'Inde s'ouvre aujourd'hui à Bruxelles, et le prix Nobel de médecine sera attribué aujourd'hui à Stockholm.

Côté défense, le ministère a confirmé le deux octobre la livraison de douze hélicoptères de transport d'ici deux mille trente-trois. L'armée de l'air participe à l'exercice Cobra Noir jusqu'à jeudi.

En économie, le baril de Brent recule de un virgule huit pour cent, à soixante-quatorze dollars dix ce matin. Un baril qui baisse, ça change.

En tech, le constructeur Orbis présentera demain sa nouvelle montre connectée. Le prix n'a pas été communiqué, mais on devine déjà qu'elle donnera l'heure avec beaucoup de style.

Ce jour dans l'histoire : le six octobre mille neuf cent vingt-sept, la première du film Le Chanteur de jazz a lieu à New York. Elle marque l'avènement du cinéma parlant. Avant, les acteurs avaient surtout l'air très expressifs.

Et pour finir, Voltaire dans Candide : il faut cultiver notre jardin. Avec la pluie qui tombe, le tien va pousser tout seul. Bonne journée, Antonin !
</output>
</example_2>

<example_3>
<inputs>
<date_du_jour>dimanche 12 octobre 2031</date_du_jour>
<longueur_max_caracteres>3800</longueur_max_caracteres>
<est_dimanche>oui</est_dimanche>
<briefing_texte>
Briefing matinal Dimanche 12 octobre 2031 🌡️ Paris : 6 °C le matin → 15 °C l'après-midi, brouillard puis éclaircies ⚽ Football AS Montvert – RC Belmont Ligue 1 1 - 1 SC Argonne – FC Orlane Ligue 1 3 - 0 Real Cordoval – Sporting Terrazas Liga 2 - 0 FC Heldmark – SV Nordhafen Bundesliga 4 - 2 🇫🇷 France Marathon de Bastide — Il réunit dimanche 22 000 coureurs, selon les organisateurs. Ligne à grande vitesse — Le Conseil d'État a rejeté vendredi le recours de deux communes contre le tracé. Service civique — Les inscriptions ouvrent lundi. 🌐 Monde Sommet sur le climat à Nairobi — Il s'est achevé samedi avec une déclaration commune signée par 18 pays. Satellite indien — L'Inde a lancé samedi un satellite d'observation de la Terre depuis le centre de Sriharikota. Pétrolier Sirius — Échoué depuis jeudi au large de Gibraltar, il a été remis à flot samedi sans pollution constatée, selon les autorités portuaires. 🛡️ Armée & Défense Exercice Cobra Blanc — Les armées l'ont lancé samedi dans les Alpes, avec 2 500 militaires. État-major — Le chef d'état-major des armées recevra lundi son homologue italien à Paris. 💼 Business & Éco Bourse de Paris — Elle a terminé la semaine en hausse de 1,2 % vendredi soir. 💻 Tech & IA Messagerie Pigeon — L'application dépasse les 100 millions d'utilisateurs, annonce sa société samedi. 📜 Ce jour en 1492 Christophe Colomb aux Bahamas — Il aborde une île des Bahamas lors de son premier voyage vers l'ouest. « Il faut de plus grandes vertus pour soutenir la bonne fortune que la mauvaise. » — La Rochefoucauld, Maximes 📅 Résumé de la semaine (du 6 octobre au 12 octobre) France Les chauffeurs de bus de Bastide ont mis fin mercredi à une grève de huit jours après un accord salarial. L'Assemblée nationale a adopté jeudi la loi sur le logement étudiant par 312 voix contre 241. Monde Le dernier bilan de l'ouragan Marcia fait état de 14 morts, selon les autorités mexicaines. Armée & Défense La marine a pris livraison jeudi d'un nouveau sous-marin d'attaque. Business & Éco La croissance de la zone euro au troisième trimestre est estimée à 0,3 %, selon l'institut statistique européen. Tech & IA Le constructeur Orbis annonce avoir vendu 400 000 montres connectées en 72 heures. Sport Rugby : la France s'est imposée 28-17 face à l'Écosse samedi. Tendance de la semaine : adoption de la loi sur le logement étudiant, bilan de l'ouragan Marcia et succès commercial de la montre Orbis. Généré automatiquement · Sources : Brave Search
</briefing_texte>
</inputs>
<output>
Bonjour Antonin, nous sommes dimanche douze octobre deux mille trente et un, jour de grasse matinée officielle. Aujourd'hui, en plus de l'actu du jour, on fait aussi le point sur la semaine.

À Paris, six degrés ce matin, quinze cet après-midi, avec du brouillard puis des éclaircies. Comme ta mémoire avant le premier café.

Côté football, hier : en Ligue 1, l'AS Montvert et le RC Belmont se quittent sur un un partout, et le SC Argonne l'emporte trois à zéro contre le FC Orlane. En Liga, le Real Cordoval bat le Sporting Terrazas deux à zéro. Et en Bundesliga, le FC Heldmark s'impose quatre à deux face au SV Nordhafen. Six buts, c'est le genre de match qui fait oublier qu'on voulait faire une sieste.

En France, le marathon de Bastide réunit aujourd'hui vingt-deux mille coureurs, selon les organisateurs. Pense à applaudir depuis ton canapé, c'est un sport aussi. Le Conseil d'État a rejeté vendredi le recours de deux communes contre le tracé d'une ligne à grande vitesse. Et les inscriptions au service civique ouvrent lundi.

Dans le monde, un sommet régional sur le climat s'est achevé samedi à Nairobi avec une déclaration commune signée par dix-huit pays. L'Inde a lancé samedi un satellite d'observation de la Terre depuis le centre de Sriharikota. Et le pétrolier Sirius, échoué depuis jeudi au large de Gibraltar, a été remis à flot samedi sans pollution constatée, selon les autorités portuaires.

Côté défense, les armées ont lancé samedi l'exercice Cobra Blanc dans les Alpes, avec deux mille cinq cents militaires. Le chef d'état-major des armées recevra lundi son homologue italien à Paris.

En économie, la Bourse de Paris a terminé la semaine en hausse de un virgule deux pour cent. En tech, l'application de messagerie Pigeon dépasse les cent millions d'utilisateurs, annonce sa société. Cent millions de gens qui s'envoient des messages, et toi, tu attends toujours une réponse d'hier.

Ce jour dans l'histoire : le douze octobre quatorze cent quatre-vingt-douze, Christophe Colomb aborde une île des Bahamas lors de son premier voyage vers l'ouest. Et la citation du jour est de La Rochefoucauld : il faut de plus grandes vertus pour soutenir la bonne fortune que la mauvaise.

Et maintenant, le résumé de la semaine. En France, les chauffeurs de bus de Bastide ont mis fin mercredi à une grève de huit jours après un accord salarial, et l'Assemblée nationale a adopté jeudi la loi sur le logement étudiant par trois cent douze voix contre deux cent quarante et une. Dans le monde, le dernier bilan de l'ouragan Marcia fait état de quatorze morts, selon les autorités mexicaines. La marine a pris livraison d'un nouveau sous-marin d'attaque, la croissance de la zone euro au troisième trimestre est estimée à zéro virgule trois pour cent, et le constructeur Orbis annonce avoir vendu quatre cent mille montres connectées en soixante-douze heures. Côté sport, la France s'est imposée vingt-huit à dix-sept face à l'Écosse en rugby. Une semaine marquée par la loi sur le logement étudiant, le bilan de l'ouragan Marcia et le succès de la montre Orbis.

Bon dimanche, Antonin, et à demain !
</output>
</example_3>
</examples>

<output_format>
Réponds uniquement avec le script du podcast : du texte brut destiné à être lu à voix haute, en paragraphes courts séparés par une ligne vide. Pas de HTML, pas de markdown, pas d'émojis, pas de titres, pas de symboles (%, °C, €, $, -), pas d'indications entre parenthèses ou crochets, pas de didascalies. Phrases courtes, transitions orales naturelles, une accroche au début et un au revoir à la fin. Respecte la longueur maximale indiquée dans les inputs.
</output_format>
</instructions>

<inputs>
<date_du_jour>{{ $now.setLocale('fr').toFormat('cccc d LLLL yyyy') }}</date_du_jour>
<longueur_max_caracteres>{{ $now.weekday === 7 ? 3800 : 3200 }}</longueur_max_caracteres>
<est_dimanche>{{ $now.weekday === 7 ? 'oui' : 'non' }}</est_dimanche>
<briefing_texte>
{{ $('News Redactor').first().json.output.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }}
</briefing_texte>
</inputs>
