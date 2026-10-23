#!/usr/bin/env python3
"""Génère workflow/briefing-matinal.json à partir des prompts du dossier prompts/.

Les prompts sont stockés en fichiers texte lisibles (sans échappement JSON) ;
ce script les injecte dans le workflow n8n puis écrit le JSON importable.

Usage :
    python3 scripts/build_workflow.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTS = ROOT / "prompts"
OUT = ROOT / "workflow" / "briefing-matinal.json"


def prompt(name: str, expression: bool = False) -> str:
    text = (PROMPTS / name).read_text(encoding="utf-8").strip()
    # En n8n, un champ commençant par "=" est évalué comme une expression.
    return "=" + text if expression else text


def gemini(name, model, node_id, position, temperature=None, retry=False):
    options = {} if temperature is None else {"temperature": temperature}
    node = {
        "parameters": {"modelName": f"models/{model}", "options": options},
        "id": node_id,
        "name": name,
        "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
        "typeVersion": 1.2,
        "position": position,
    }
    if retry:
        node.update({"retryOnFail": True, "maxTries": 2, "waitBetweenTries": 3000})
    return node


nodes = [
    {
        "parameters": {"rule": {"interval": [{"triggerAtHour": 7}]}},
        "id": "a5e2bd8c-a51b-47c7-822f-97db33e166bc",
        "name": "Every Day at 07:00AM",
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.4,
        "position": [-416, -64],
    },
    {
        "parameters": {
            "conditions": {
                "combinator": "and",
                "conditions": [
                    {
                        "id": "f800d02e-ef5b-475d-935e-e5bbd962b3f7",
                        "leftValue": "={{ $now.weekday }}",
                        "operator": {"operation": "gte", "type": "number"},
                        "rightValue": 6,
                    }
                ],
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 4},
            },
            "options": {},
        },
        "id": "9ed51074-8719-4542-ad23-ae67b634b48e",
        "name": "If It Is Week End",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2.4,
        "position": [-192, -64],
    },
    {
        "parameters": {"amount": 2, "unit": "hours"},
        "id": "499c17ab-b453-45d3-a1b5-077297d6aee5",
        "name": "Delay 2h = Send At 09:00AM",
        "type": "n8n-nodes-base.wait",
        "typeVersion": 1.1,
        "position": [48, -192],
    },
    {
        "parameters": {
            "promptType": "define",
            "text": prompt("news-redactor.user.md", expression=True),
            "needsFallback": True,
            "options": {"systemMessage": prompt("news-redactor.system.md"), "maxIterations": 20},
        },
        "id": "2660b694-04d4-490a-a377-71c6cff5a52b",
        "name": "News Redactor",
        "type": "@n8n/n8n-nodes-langchain.agent",
        "typeVersion": 3.1,
        "position": [320, -64],
        "retryOnFail": True,
        "maxTries": 3,
        "waitBetweenTries": 10000,
    },
    gemini("Using Gemini", "gemini-flash-latest", "324353a9-f987-4d93-8458-0e3f4ffd2146", [264, 152], retry=True),
    gemini("Using Gemini (Fallback)", "gemini-flash-lite-latest", "8ae43075-ea02-4cd1-a9c2-ee137d171f26", [392, 152]),
    {
        "parameters": {
            "query": "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('Query', ``, 'string') }}",
            "count": 6,
            "additionalParameters": {
                "country": "FR",
                "search_lang": "fr",
                "ui_lang": "fr-FR",
                "text_decorations": False,
                "result_filter": ["web"],
                "extra_snippets": True,
            },
        },
        "id": "9b5be81a-2402-43ca-ae70-d119bae03b28",
        "name": "Searching On Internet",
        "type": "@brave/n8n-nodes-brave-search.braveSearchTool",
        "typeVersion": 1.1,
        "position": [520, 152],
    },
    {
        "parameters": {
            "promptType": "define",
            "text": prompt("podcast-writer.user.md", expression=True),
            "needsFallback": True,
            "options": {"systemMessage": prompt("podcast-writer.system.md")},
        },
        "id": "ec830ad8-a364-415e-9cec-7e007d4d2c62",
        "name": "Podcast Writer",
        "type": "@n8n/n8n-nodes-langchain.agent",
        "typeVersion": 3.1,
        "position": [720, -64],
        "retryOnFail": True,
        "maxTries": 2,
        "waitBetweenTries": 5000,
    },
    gemini("Using Gemini (Podcast)", "gemini-flash-latest", "3389916f-29cc-4c30-bed0-56fc5c02374e", [728, 152], temperature=0.9, retry=True),
    gemini("Using Gemini (Podcast Fallback)", "gemini-flash-lite-latest", "c3e8a1d0-03b9-4469-81c0-baee5dffecf2", [856, 152], temperature=0.9),
    {
        "parameters": {
            "resource": "audio",
            "model": "tts-1-hd",
            "input": "={{ $json.output.slice(0, 4090) }}",
            "voice": "nova",
            "options": {"response_format": "mp3", "binaryPropertyOutput": "data"},
        },
        "id": "cd813f8d-e7d7-48dd-a1b5-105a76cc8725",
        "name": "Podcast Voice (MP3)",
        "type": "@n8n/n8n-nodes-langchain.openAi",
        "typeVersion": 2.3,
        "position": [1072, -64],
        "retryOnFail": True,
        "maxTries": 3,
        "waitBetweenTries": 5000,
    },
    {
        "parameters": {
            "jsCode": (
                "const items = $input.all();\n"
                "for (const item of items) {\n"
                "  if (item.binary && item.binary.data) {\n"
                "    item.binary.data.fileName = `briefing-${$now.toFormat('yyyy-MM-dd')}.mp3`;\n"
                "    item.binary.data.mimeType = 'audio/mpeg';\n"
                "  }\n"
                "}\n"
                "return items;"
            )
        },
        "id": "d184ca03-03f8-4384-ada0-98bc739946f4",
        "name": "Nom du fichier MP3",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1296, -64],
    },
    {
        "parameters": {
            "sendTo": "votre.adresse@example.com",
            "subject": "=☀️ Mon Briefing du {{ $now.setLocale('fr').toFormat('cccc d LLLL yyyy') }}{{ $now.weekday === 7 ? ' + Résumé de la semaine' : '' }}",
            "message": "={{ $('News Redactor').first().json.output.replace(/^\\s*```(?:html)?\\s*/i, '').replace(/\\s*```\\s*$/, '') }}",
            "options": {
                "appendAttribution": False,
                "attachmentsUi": {"attachmentsBinary": [{}]},
                "senderName": "Mon Briefing",
            },
        },
        "id": "0b8c418f-b1b0-4337-b182-c3fc8c27fa7e",
        "name": "Send Final Mail",
        "type": "n8n-nodes-base.gmail",
        "typeVersion": 2.2,
        "position": [1520, -64],
    },
]


def main_link(node):
    return {"node": node, "type": "main", "index": 0}


def model_link(node, index=0):
    return {"node": node, "type": "ai_languageModel", "index": index}


connections = {
    "Every Day at 07:00AM": {"main": [[main_link("If It Is Week End")]]},
    "If It Is Week End": {"main": [[main_link("Delay 2h = Send At 09:00AM")], [main_link("News Redactor")]]},
    "Delay 2h = Send At 09:00AM": {"main": [[main_link("News Redactor")]]},
    "Using Gemini": {"ai_languageModel": [[{**model_link("News Redactor", 0)}]]},
    "Using Gemini (Fallback)": {"ai_languageModel": [[{**model_link("News Redactor", 1)}]]},
    "Searching On Internet": {"ai_tool": [[{"node": "News Redactor", "type": "ai_tool", "index": 0}]]},
    "News Redactor": {"main": [[main_link("Podcast Writer")]]},
    "Using Gemini (Podcast)": {"ai_languageModel": [[{**model_link("Podcast Writer", 0)}]]},
    "Using Gemini (Podcast Fallback)": {"ai_languageModel": [[{**model_link("Podcast Writer", 1)}]]},
    "Podcast Writer": {"main": [[main_link("Podcast Voice (MP3)")]]},
    "Podcast Voice (MP3)": {"main": [[main_link("Nom du fichier MP3")]]},
    "Nom du fichier MP3": {"main": [[main_link("Send Final Mail")]]},
}

workflow = {
    "name": "Briefing matinal quotidien par mail + podcast audio",
    "nodes": nodes,
    "connections": connections,
    "settings": {"executionOrder": "v1", "timezone": "Europe/Paris"},
    "active": False,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(workflow, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"OK -> {OUT.relative_to(ROOT)} ({len(nodes)} nœuds)")
