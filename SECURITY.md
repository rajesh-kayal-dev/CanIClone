# Security Policy

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

Use GitHub's private vulnerability reporting form for this repository:

[Report a vulnerability privately](https://github.com/rajesh-kayal-dev/CanIClone/security/advisories/new)

If private reporting is unavailable, contact the maintainer through the [GitHub profile](https://github.com/rajesh-kayal-dev) and ask for a private reporting channel.

**Maintainer security contact:** `[SECURITY_CONTACT_PLACEHOLDER — replace before publishing]`

Do not include real credentials or sensitive user data in a report. Redact connection strings, API keys, tokens, and private content.

## What to include

A useful report includes:

- the affected route, feature, or file;
- the repository commit or version, if known;
- prerequisites needed to reproduce the issue;
- clear reproduction steps;
- expected and observed security impact;
- minimal proof-of-concept code or screenshots, if safe to share;
- relevant logs with secrets removed;
- any known workaround or evidence of exploitation.

## Maintainer response process

The maintainer will acknowledge a valid private report as soon as practical, assess the reported impact, and determine whether mitigation, a fix, or further clarification is needed. The reporter may be kept updated during triage and remediation. Credit will be offered if desired and safe.

Please avoid public disclosure until the maintainer has had a reasonable opportunity to investigate and coordinate a fix.

## Scope

This policy covers the CanIClone application code and configuration, including:

- the Next.js web application;
- the Express REST API;
- the Ideas and App Assistant WebSocket handlers;
- anonymous ownership and persistence boundaries;
- secrets and environment handling in the repository;
- vulnerabilities in project-specific dependencies or deployment configuration.

Third-party provider outages, rate limits, account configuration issues, and reports requiring access to someone else's account are not CanIClone vulnerabilities. Please report suspected CanIClone-specific weaknesses privately so they can be assessed.

## Security boundaries

CanIClone is an active development project. Do not assume that the current anonymous ownership model, provider integrations, or deployment configuration provides a complete security guarantee. Report observed weaknesses rather than attempting to test against accounts or data you do not own.
