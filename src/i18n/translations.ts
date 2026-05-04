export type Locale = "fr" | "no" | "en";

export const translations = {
  // ---- Common ----
  "app.title": {
    fr: "Le Loup-Garou de Kristiansand",
    no: "Varulven fra Kristiansand",
    en: "The Werewolf of Kristiansand",
  },
  "app.subtitle": {
    fr: "Survivrez-vous a la nuit ?",
    no: "Vil du overleve natten?",
    en: "Will you survive the night?",
  },

  // ---- Landing ----
  "landing.join": {
    fr: "Rejoindre une partie",
    no: "Bli med i et spill",
    en: "Join a game",
  },
  "landing.create": {
    fr: "Creer une partie",
    no: "Opprett et spill",
    en: "Create a game",
  },
  "landing.code_placeholder": {
    fr: "Code de la partie",
    no: "Spillkode",
    en: "Game code",
  },
  "landing.pseudo_placeholder": {
    fr: "Votre pseudo",
    no: "Ditt kallenavn",
    en: "Your nickname",
  },
  "landing.how_to_play": {
    fr: "Comment jouer ?",
    no: "Hvordan spille?",
    en: "How to play?",
  },

  // ---- Roles ----
  "role.villageois": {
    fr: "Villageois",
    no: "Landsbyboer",
    en: "Villager",
  },
  "role.loup_garou": {
    fr: "Loup-Garou",
    no: "Varulv",
    en: "Werewolf",
  },
  "role.voyante": {
    fr: "Voyante",
    no: "Synske",
    en: "Seer",
  },
  "role.sorciere": {
    fr: "Sorciere",
    no: "Heks",
    en: "Witch",
  },
  "role.chasseur": {
    fr: "Chasseur",
    no: "Jeger",
    en: "Hunter",
  },
  "role.cupidon": {
    fr: "Cupidon",
    no: "Cupido",
    en: "Cupid",
  },

  // ---- Role descriptions ----
  "role.villageois.desc": {
    fr: "Aucun pouvoir. Votez intelligemment.",
    no: "Ingen kraft. Stem klokt.",
    en: "No power. Vote wisely.",
  },
  "role.loup_garou.desc": {
    fr: "Chaque nuit, devorez un villageois.",
    no: "Hver natt, spis en landsbyboer.",
    en: "Each night, devour a villager.",
  },
  "role.voyante.desc": {
    fr: "Chaque nuit, decouvrez l'identite d'un joueur.",
    no: "Hver natt, avslor identiteten til en spiller.",
    en: "Each night, discover a player's identity.",
  },
  "role.sorciere.desc": {
    fr: "Une potion de vie, une potion de mort.",
    no: "En livsdrikk, en dodsdrikk.",
    en: "One life potion, one death potion.",
  },
  "role.chasseur.desc": {
    fr: "En mourant, emportez quelqu'un avec vous.",
    no: "Nar du dor, ta noen med deg.",
    en: "When you die, take someone with you.",
  },
  "role.cupidon.desc": {
    fr: "Liez deux joueurs par l'amour eternel.",
    no: "Bind to spillere med evig kjarlighet.",
    en: "Bind two players with eternal love.",
  },

  // ---- Lobby ----
  "lobby.waiting": {
    fr: "En attente de joueurs...",
    no: "Venter pa spillere...",
    en: "Waiting for players...",
  },
  "lobby.players": {
    fr: "Joueurs",
    no: "Spillere",
    en: "Players",
  },
  "lobby.start": {
    fr: "Lancer la partie",
    no: "Start spillet",
    en: "Start game",
  },
  "lobby.copy_link": {
    fr: "Copier le lien",
    no: "Kopier lenke",
    en: "Copy link",
  },
  "lobby.composition": {
    fr: "Composition",
    no: "Sammensetning",
    en: "Composition",
  },
  "lobby.settings": {
    fr: "Parametres",
    no: "Innstillinger",
    en: "Settings",
  },
  "lobby.debate_duration": {
    fr: "Duree du debat",
    no: "Debattvarighet",
    en: "Debate duration",
  },
  "lobby.vote_duration": {
    fr: "Duree du vote",
    no: "Stemmevarighet",
    en: "Vote duration",
  },
  "lobby.seconds": {
    fr: "secondes",
    no: "sekunder",
    en: "seconds",
  },

  // ---- Game phases ----
  "phase.night": {
    fr: "Nuit",
    no: "Natt",
    en: "Night",
  },
  "phase.day": {
    fr: "Jour",
    no: "Dag",
    en: "Day",
  },
  "phase.debate": {
    fr: "Debat",
    no: "Debatt",
    en: "Debate",
  },
  "phase.vote": {
    fr: "Vote",
    no: "Avstemning",
    en: "Vote",
  },

  // ---- Narration ----
  "narration.night_falls": {
    fr: "La nuit tombe sur Kristiansand. Le village s'endort...",
    no: "Natten faller over Kristiansand. Landsbyen sovner...",
    en: "Night falls over Kristiansand. The village sleeps...",
  },
  "narration.voyante_wake": {
    fr: "Voyante, ouvrez les yeux. Qui voulez-vous sonder ?",
    no: "Synske, apne oynene. Hvem vil du undersoke?",
    en: "Seer, open your eyes. Who do you wish to investigate?",
  },
  "narration.loups_wake": {
    fr: "Loups-Garous, reveillez-vous et choisissez votre proie.",
    no: "Varulver, vakn opp og velg byttet deres.",
    en: "Werewolves, wake up and choose your prey.",
  },
  "narration.sorciere_wake": {
    fr: "Sorciere, reveillez-vous. Voici la victime des loups.",
    no: "Heks, vakn opp. Her er ulvenes offer.",
    en: "Witch, wake up. Here is the wolves' victim.",
  },
  "narration.cupidon_wake": {
    fr: "Cupidon, designez les deux amoureux.",
    no: "Cupido, velg de to elskende.",
    en: "Cupid, choose the two lovers.",
  },
  "narration.dawn": {
    fr: "Le village se reveille...",
    no: "Landsbyen vakner...",
    en: "The village wakes up...",
  },
  "narration.no_death": {
    fr: "Miracle ! Personne n'est mort cette nuit.",
    no: "Mirakel! Ingen dode i natt.",
    en: "Miracle! Nobody died tonight.",
  },
  "narration.death": {
    fr: "{pseudo} a ete retrouve(e) mort(e). C'etait un(e) {role}.",
    no: "{pseudo} ble funnet dod. Det var en {role}.",
    en: "{pseudo} was found dead. They were a {role}.",
  },
  "narration.debate_start": {
    fr: "Le village delibere. Qui sera elimine ?",
    no: "Landsbyen diskuterer. Hvem blir eliminert?",
    en: "The village deliberates. Who will be eliminated?",
  },
  "narration.vote_start": {
    fr: "Passez au vote !",
    no: "Stem na!",
    en: "Time to vote!",
  },
  "narration.eliminated": {
    fr: "{pseudo} a ete elimine(e). C'etait un(e) {role}.",
    no: "{pseudo} ble eliminert. Det var en {role}.",
    en: "{pseudo} was eliminated. They were a {role}.",
  },
  "narration.no_elimination": {
    fr: "Egalite ! Personne n'est elimine.",
    no: "Uavgjort! Ingen ble eliminert.",
    en: "Tie! Nobody is eliminated.",
  },
  "narration.hunter_shoots": {
    fr: "Le Chasseur tire ! Choisissez votre cible.",
    no: "Jegeren skyter! Velg malet ditt.",
    en: "The Hunter shoots! Choose your target.",
  },
  "narration.lovers_die": {
    fr: "{pseudo} meurt de chagrin, emporte(e) par l'amour.",
    no: "{pseudo} dor av sorg, tatt av kjarligheten.",
    en: "{pseudo} dies of grief, taken by love.",
  },

  // ---- Victory ----
  "victory.village": {
    fr: "Le village est sauve !",
    no: "Landsbyen er reddet!",
    en: "The village is saved!",
  },
  "victory.loups": {
    fr: "Les loups regnent sur Kristiansand !",
    no: "Ulvene hersker over Kristiansand!",
    en: "The wolves rule over Kristiansand!",
  },
  "victory.lovers": {
    fr: "L'amour triomphe !",
    no: "Kjarligheten seirer!",
    en: "Love triumphs!",
  },

  // ---- Actions ----
  "action.heal": {
    fr: "Sauver",
    no: "Redde",
    en: "Save",
  },
  "action.kill": {
    fr: "Empoisonner",
    no: "Forgifte",
    en: "Poison",
  },
  "action.skip": {
    fr: "Ne rien faire",
    no: "Gjor ingenting",
    en: "Do nothing",
  },
  "action.confirm": {
    fr: "Confirmer",
    no: "Bekreft",
    en: "Confirm",
  },
  "action.vote": {
    fr: "Voter",
    no: "Stem",
    en: "Vote",
  },
  "action.ready": {
    fr: "Pret a voter",
    no: "Klar til a stemme",
    en: "Ready to vote",
  },

  // ---- Chat ----
  "chat.placeholder": {
    fr: "Ecrire un message...",
    no: "Skriv en melding...",
    en: "Write a message...",
  },
  "chat.send": {
    fr: "Envoyer",
    no: "Send",
    en: "Send",
  },

  // ---- Game over ----
  "gameover.play_again": {
    fr: "Rejouer",
    no: "Spill igjen",
    en: "Play again",
  },
  "gameover.new_game": {
    fr: "Nouvelle partie",
    no: "Nytt spill",
    en: "New game",
  },
  "gameover.final_roles": {
    fr: "Roles finaux",
    no: "Endelige roller",
    en: "Final roles",
  },

  // ---- Distribution ----
  "distribution.you_are": {
    fr: "Vous etes...",
    no: "Du er...",
    en: "You are...",
  },
  "distribution.understood": {
    fr: "J'ai compris",
    no: "Forstaatt",
    en: "Got it",
  },

  // ---- Misc ----
  "misc.alive": {
    fr: "En vie",
    no: "I live",
    en: "Alive",
  },
  "misc.dead": {
    fr: "Mort(e)",
    no: "Dod",
    en: "Dead",
  },
  "misc.players_alive": {
    fr: "Joueurs en vie",
    no: "Spillere i live",
    en: "Players alive",
  },
} as const;

export type TranslationKey = keyof typeof translations;
