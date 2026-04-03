import logging
import json
import re
from typing import List, Optional
from app.config import settings
from app.schemas.cluster import GeneratedCluster

logger = logging.getLogger(__name__)


def _get_client():
    """Lazy-initialize Gemini client."""
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    import google.generativeai as genai
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel("gemini-1.5-flash")


def _extract_json(text: str) -> str:
    """Extract JSON block from markdown-wrapped response."""
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        return match.group(1).strip()
    return text.strip()


async def generate_clusters(topic: str, language: str = "it", n_clusters: int = 3, tone: str = "professionale") -> List[GeneratedCluster]:
    """
    Generate semantic clusters for a given topic using Gemini.
    Returns a list of GeneratedCluster objects.
    """
    try:
        model = _get_client()
        prompt = f"""Sei un esperto di social media marketing. Analizza il topic "{topic}" e genera {n_clusters} cluster semantici distinti per una campagna social.

Per ogni cluster fornisci:
- name: nome breve del cluster (max 50 caratteri)
- keywords: lista di 5-8 parole chiave rilevanti
- description: descrizione del cluster (max 200 caratteri)
- tone: tono di comunicazione ({tone})
- hashtags: lista di 5-8 hashtag senza il simbolo #
- language: "{language}"

Rispondi SOLO con un array JSON valido, senza markdown, nel formato:
[
  {{
    "name": "...",
    "keywords": ["...", "..."],
    "description": "...",
    "tone": "...",
    "hashtags": ["...", "..."],
    "language": "{language}"
  }}
]"""

        response = model.generate_content(prompt)
        raw = _extract_json(response.text)
        data = json.loads(raw)

        clusters = []
        for item in data:
            clusters.append(GeneratedCluster(
                name=item.get("name", "Cluster"),
                keywords=item.get("keywords", []),
                description=item.get("description", ""),
                tone=item.get("tone", tone),
                hashtags=item.get("hashtags", []),
                language=item.get("language", language),
            ))
        return clusters

    except Exception as e:
        logger.error(f"Error generating clusters with Gemini: {e}")
        # Fallback: return basic clusters
        return [
            GeneratedCluster(
                name=f"Cluster {i+1} - {topic[:30]}",
                keywords=[topic, f"keyword{i+1}"],
                description=f"Cluster semantico {i+1} per il topic: {topic}",
                tone=tone,
                hashtags=[topic.replace(" ", ""), f"social{i+1}"],
                language=language,
            )
            for i in range(n_clusters)
        ]


async def generate_post_content(
    cluster_name: str,
    cluster_description: str,
    cluster_keywords: List[str],
    cluster_hashtags: List[str],
    cluster_tone: str,
    cluster_language: str,
    platform: str = "both",
) -> dict:
    """
    Generate post text content and image prompt for a given cluster.
    Returns dict with 'text_content' and 'image_prompt'.
    """
    try:
        model = _get_client()

        platform_note = ""
        if platform == "facebook":
            platform_note = "Ottimizza per Facebook: testo più lungo, coinvolgente, con call-to-action."
        elif platform == "instagram":
            platform_note = "Ottimizza per Instagram: testo breve, emozionale, con hashtag integrati."
        else:
            platform_note = "Crea testo adatto sia per Facebook che Instagram: bilanciato, coinvolgente."

        hashtag_str = " ".join(f"#{h}" for h in cluster_hashtags[:8])
        keywords_str = ", ".join(cluster_keywords[:6])

        prompt = f"""Sei un copywriter esperto di social media. Crea un post in lingua "{cluster_language}" con tono "{cluster_tone}".

Cluster: {cluster_name}
Descrizione: {cluster_description}
Parole chiave: {keywords_str}
Hashtag: {hashtag_str}

{platform_note}

Rispondi SOLO con JSON nel formato:
{{
  "text_content": "testo del post completo con hashtag",
  "image_prompt": "descrizione in inglese dell'immagine ideale per questo post (max 200 caratteri, stile fotografico/illustrativo)"
}}"""

        response = model.generate_content(prompt)
        raw = _extract_json(response.text)
        data = json.loads(raw)

        return {
            "text_content": data.get("text_content", ""),
            "image_prompt": data.get("image_prompt", f"Professional photo related to {cluster_name}"),
        }

    except Exception as e:
        logger.error(f"Error generating post content with Gemini: {e}")
        hashtag_str = " ".join(f"#{h}" for h in cluster_hashtags[:5])
        return {
            "text_content": f"Scopri di più su {cluster_name}! {hashtag_str}",
            "image_prompt": f"Professional, high-quality photo representing {cluster_name}, vibrant colors, modern style",
        }
