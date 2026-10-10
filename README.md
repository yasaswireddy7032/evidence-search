# Evidence Search

A tenant-isolated BM25 retrieval engine with source citations, abstention, and retrieval evaluation.

**Status:** runnable portfolio reference implementation, built with AI assistance. Uses synthetic or hand-authored demonstration data. No employer code, customer data, or production performance claims.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
python -m unittest -v
```

The default command prints a reproducible JSON demonstration. See `app.py` for the reusable Python API. `example-output.json` records the locally executed demo; it is not an external benchmark.

## Architecture

Documents → tenant filter → tenant-local BM25 → ranked citations → extractive response. The evaluator reports MRR and recall@k against explicit relevance labels.

## Validation

Tests exercise failure cases and behavioral invariants, in addition to the executable demo. The included `github-actions-tests.yml` defines tests and the demo on pushes and pull requests. Install it as `.github/workflows/tests.yml` to activate CI. CI has not run on GitHub until this repository is published.

## Limitations and next steps

Lexical retrieval misses paraphrases. Tenant IDs are trusted inputs, not authenticated identities. Add an authenticated API, embedding retrieval, reranking, a larger held-out corpus, and citation-grounded generation before presenting this as a full RAG system.

## Container

```bash
docker build -t evidence-search .
docker run --rm evidence-search
```

The Docker recipe is provided; local validation uses Python, not Docker.

## Responsible use

Review the code and understand its assumptions before deploying. Keep credentials in environment variables and exclude private data from commits. This project is an educational engineering baseline, not a production-certified service.

## Persistent API

The service adds SQLite persistence, overlapping chunks, content-versioned citations, tenant identity derived from server-side credentials, reader/writer authorization, strict request schemas, deletion, and content-free request audits. The request body cannot choose a tenant.

Generate temporary local demo credentials (do not commit the output):

```bash
export EVIDENCE_IDENTITIES_JSON="$(python -c 'import secrets,json; print(json.dumps({secrets.token_urlsafe(32): {"tenant":"demo","role":"writer"}}))')"
uvicorn service:create_app --factory --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs`. Supply one of your locally generated bearer credentials in an API client. The OpenAPI document defines `PUT /documents/{document_id}`, `DELETE /documents/{document_id}`, and `POST /search`. Ingestion takes `title` and `text`; search takes `query` and optional `k`.

### Threat model and boundaries

- Authentication is deliberately small: server-configured bearer credentials map to tenants and roles. Use a real identity provider and secret manager for deployment.
- Document/query contents are not written to audit records. The database itself still contains document text and needs encryption and retention controls.
- Retrieved instructions remain plain evidence. This system does not execute document text or invoke a language model.
- Search rebuilds an in-memory index per request and is intended for small corpora. It is not a vector database or semantic retrieval system.
- Production work remains: edge request-size limits, rate limiting, encrypted transport, key rotation, per-document ACLs, bounded storage, audit atomicity for writes, and load testing.

### API verification

`python -m unittest -v` includes integration tests for unauthorized access, invalid credentials, cross-tenant reads/deletes, role boundaries, spoofed tenant fields, persistence after restart, citation version changes, request limits, and audit privacy.
