0:01 Bonjour, je m'appelle Antonin. Pour ce projet, j'ai construit avec NUTEN un briefing matinal automatisé. Chaque matin, je reçois un mail avec l'actualité du jour et un petit podcast audio.
0:12 Je vais vous montrer le workflow, les commandes que j'utilise dans le terminal et je terminerai par un retour sur le cours.
0:19 Donc la démo de mon workflow. Le premier nœud, c'est celui-ci. Donc, tous les jour à 7 heures, donc c'est le déclencheur.
0:26 Il lance le workflow tous les matins à 7 heures sans que je n'ai rien à faire. Le deuxième, si c'est le week-end, ce nœud pose une question.
0:35 Donc si nous sommes samedi ou dimanche selon la réponse, le workflow prend deux chemins différents. Celui-ci, si c'est true, retardé de 2 heures, donc envoyé à 9 heures.
0:46 Ce nœud, c'est utilisé que le week-end. donc il attend deux heures de plus pour que le mail arrive à 9h au lieu de 7h et on se met donc si c'est false, il saute cette étape là et on passe directement au rédacteur des infos.
1:02 Donc ça c'est en fait le coeur du workflow, c'est un agent d'intelligence artificielle qui rédige le mail, donc il a besoin de trois choses qui sont branchées ensemble.
1:19 On a tout d'abord l'utilisation de Gemini Flashlight Latest qui du coup ne nécessite pas de mise à jour, donc c'est son cerveau en fait, le modèle d'IA de Google.
1:31 En cas d'erreur de ce premier modèle Gemini, on passe à un second. Donc un fallback, c'est son modèle de secours en fait, si le premier tombe en panne.
1:42 C'est en fait l'utilisation d'un autre modèle de G-mini. On utilise également des recherches internet sur Brave, ça c'est en fait son outil de recherche puisque l'agent fait au minimum dix recherches d'actualité en France, dans le monde.
1:56 La défense, économie, tech, résultat de football de la veille. météo de Paris, événement historique du jour et citations. Donc à partir de ces résultats, il écrit directement le mail en html.
2:10 Pour limiter les erreurs, j'ai imposé des règles strictes dans son prompt. Chaque information doit venir d'une source. Si une source dit « prévue » ou « devrait », l'agent n'a pas le droit d'écrire « adopté ».
2:22 Et pour le football, il affiche au maximum 5 matchs. avec leur score exact. On passe ensuite au nœud suivant qui est le rédacteur du podcast.
2:39 Donc ça c'est mon deuxième agent. Lui il lit le mail et le transforme en script oral d'environ trois minutes. Donc il y ajoute une touche d'humour sur les sujets qui sont légers et un ton sérieux.
2:48 sur les sujets qui sont graves. Comme le premier, il a un modèle principal et un modèle de secours, ce sont donc les deux nœuds Gemini qui sont juste en dessous.
2:58 Le nœud suivant, c'est donc la génération d'un audio. Ce nœud utilise OpenAI et il lit le script du podcast avec une voie de synthèse est produit à fichier mp3.
3:11 On a ensuite un noeud qui est qui est en fait un petit morceau de code qui vient simplement renommer le fichier puisque sans lui la pièce jointe aurait un nom générique.
3:20 Donc il la renomme avec la date du jour, par exemple briefing du 26 octobre 2026, pour qu'elle s'ouvre directement comme un fichier audio.
3:30 Et ensuite le dernier nœud donc envoie par gmail, il envoie le mail html avec le fichier mp3 en pièces jointes.
3:37 et donc le dimanche le mail contient en plus un résumé de la semaine, donc de toutes les actualités de la semaine.
3:44 Donc je vais vous montrer les résultats dans ma boîte mail qui est ouverte juste ici. Donc la présentation est assez moderne, on y a donc tous les sujets qui existaient juste avant, le football, les actualités en France, dans le monde, les sujets de défense, business, tech, On a une petite info sur ce
4:03 qui s'est passé à cette même date d'une autre année et une citation et en bas on a le fameux podcast que je vais lancer quelques secondes.
4:29 Voilà, comme vous pouvez le voir, il y une petite touche d'humour qui est ajoutée, ça rend la chose moins ennuyante.
4:35 Donc le dernier point sur la fiabilité, c'est que j'ai rencontré une vraie limite avec le quota gratuit de Gemini et les 20 requêtes par jour, qui a bloqué l'envoi de certains matins, puisque j'avais fait pas mal de tests pour mettre en place le quota.
4:49 le projet, donc la solution serait forcément d'ajouter la facturation, mais pour le travail ici je ne l'ai forcément pas fait.
5:02 Donc je vais maintenant passer aux commandes, donc je vais ouvrir mon terminal. Pour gagner du temps, j'ai préparé les commandes.
5:11 Donc, la première commande, c'est, c'est le N8NCLI Help, qui lui permet de lister toutes les commandes disponibles. C'est la première chose que je lance.
5:26 Voilà, là en fait on a la liste de tout ce qui est possible de faire. Ensuite le N8NCLI Project. Donc lui il permet de lister mes projets N8N avec leur identifiant, c'est comme ça que je retrouve l'identifiant de mon projet personnel.
5:47 Donc voilà, project et personnel. Voilà c'est les deux projets que j'ai. Ensuite on a N8N pool, qui lui permet de télécharger mon workflow pour depuis n8n, le transformer en fichier TypeScript.
6:05 Donc ça, ça sert pour sauvegarder, pour voir exactement ce qui est en ligne. On a également n8n status, qui permet de voir si mes fichiers locaux ont changé par rapport à n8n.
6:22 Voilà, it's up to date. Ensuite n8n validation. date, qui permet de vérifier que le code de mon workflow est valide sans rien envoyer.
6:32 Donc là vous voyez, il répond, valide, juste ici, donc ça évite d'envoyer un workflow qui est cassé. N8nExec, ça permet de lancer une exécution de mon workflow, donc là je ne vais pas le faire parce que je pense que je n'ai plus assez de jetons pour l'essayer.
6:50 On a également N8n Publish qui permet de publier mon workflow pour que celui-ci soit actif, ou encore N8n Push qui lui permet d'envoyer des modifications vers mon N8n.
7:04 Donc voilà pour ce qui est des commandes. Enfin, je terminerai par un retour sur le cours. Donc voilà, ce cours a été très intéressant.
7:13 Ce que j'ai aimé c'est le côté pratique, on est tout de suite acteur, on avance sur notre propre sujet au lieu d'écouter en fait la théorie, donc ça c'est très motivant et c'est ce qui m'a permis de bien apprendre.
7:26 Ce que j'aurais préféré non moins c'est peut-être de commencer par une présentation plus en profondeur de l'outil N8n où tu nous expliques peut-être davantage les nœuds, les expressions, la façon d dont les données circulent d'un nœud à l'autre.
7:40 En fait, avec cette base, j'aurais peut-être mieux compris au moment de lancer mon projet et j'aurais peut-être perdu moins de temps sur des erreurs qu'ensuite à corriger clôt de code.
7:50 En tout cas, je te remercie pour la qualité de ton cours et pour l'accompagnement que tu nous as donné. Et puis, au plaisir de se revoir.
8:00 Merci.