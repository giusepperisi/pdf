# Regole Progetto: SocialManager-AI

## Pipeline OMC obbligatoria
Il trigger `ralph` attiva la pipeline Hardener ad ogni ripresa:
explore → analyst → architect → executor → verifier

## Regole permanenti
1. **Domande PRIMA di qualsiasi codice** — raccogliere tutti i parametri (gruppi 1-6)
2. **Autopilot attivo** — bypassPermissions: nessun consenso intermedio
3. **Piani gratuiti**: usare SOLO tier gratuiti delle API (Meta, Pollinations, ecc.)
4. **Secrets mai nel codice** — API keys solo in .env e volumi Docker
5. **Memoria progetto**: parametri social, cluster semantici e schedule salvati
