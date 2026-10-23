#!/usr/bin/env python3
"""Génère briefing-matinal.workflow.ts (SDK TypeScript n8n) à partir des prompts.

Les prompts de Projet en JSON/prompts/ sont insérés comme chaînes concaténées
(une ligne de prompt = une ligne de code), ce qui reste lisible et valide dans
le sous-ensemble TypeScript du SDK n8n.

Usage :
    python3 "Projet Workflow/generate_workflow_ts.py"            # écrit le fichier .ts
    python3 "Projet Workflow/generate_workflow_ts.py" --skeleton # affiche une version courte (validation)
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROMPTS = HERE / "Projet en JSON" / "prompts"
OUT = HERE / "briefing-matinal.workflow.ts"


def literal(text: str, indent: str = "      ") -> str:
    """Texte multiligne -> concaténation de littéraux JSON, une ligne par ligne."""
    lines = text.strip("\n").split("\n")
    parts = [json.dumps(l + ("\n" if i < len(lines) - 1 else ""), ensure_ascii=False) for i, l in enumerate(lines)]
    return ("\n" + indent + "+ ").join(parts) if len(parts) > 1 else parts[0]


def load(name: str, skeleton: bool) -> str:
    if skeleton:
        return {
            "news-redactor.system.md": "<role>\nRôle court d'exemple, avec l'apostrophe : l'agent.\n</role>",
            "news-redactor.user.md": "<instructions>\nDate : {{ $now.setLocale('fr').toFormat('cccc d LLLL yyyy') }}\n{{ $now.weekday === 7 ? `Bloc dimanche ${$now.minus({ days: 6 }).toFormat('d MMMM')}` : '' }}\n</instructions>",
            "podcast-writer.system.md": "<role>\nAnimateur court.\n</role>",
            "podcast-writer.user.md": "<instructions>\nLongueur {{ $now.weekday === 7 ? 3800 : 3200 }}\n{{ $('News Redactor').first().json.output.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim() }}\n</instructions>",
        }[name]
    return (PROMPTS / name).read_text(encoding="utf-8").strip()


def build(skeleton: bool) -> str:
    news_sys = literal(load("news-redactor.system.md", skeleton))
    news_user = literal(load("news-redactor.user.md", skeleton))
    pod_sys = literal(load("podcast-writer.system.md", skeleton))
    pod_user = literal(load("podcast-writer.user.md", skeleton))
    tpl = TEMPLATE
    for key, val in (("@@NEWS_SYSTEM@@", news_sys), ("@@NEWS_USER@@", news_user), ("@@POD_SYSTEM@@", pod_sys), ("@@POD_USER@@", pod_user)):
        tpl = tpl.replace(key, val)
    return tpl


TEMPLATE = r"""import { workflow, node, trigger, ifElse, languageModel, tool, newCredential, fromAi, expr } from '@n8n/workflow-sdk';

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
        @@NEWS_USER@@
      ),
      needsFallback: true,
      options: {
        systemMessage:
          @@NEWS_SYSTEM@@,
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
        @@POD_USER@@
      ),
      needsFallback: true,
      options: {
        systemMessage:
          @@POD_SYSTEM@@
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
"""

if __name__ == "__main__":
    code = build("--skeleton" in sys.argv)
    if "--skeleton" in sys.argv:
        print(code)
    else:
        OUT.write_text(code, encoding="utf-8")
        print(f"OK -> {OUT.name} ({len(code)} caractères)")
