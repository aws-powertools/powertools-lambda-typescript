---
title: We Made This (Community)
description: Blog posts, tutorials, and videos about Powertools for AWS Lambda (TypeScript) created by the Powertools Community.
---

<!-- markdownlint-disable MD043 MD013 -->

This space is dedicated to highlight our awesome community content featuring Powertools for AWS 🙏!

!!! info "[Get your content featured here](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=community-content&template=share_your_work.yml&title=%5BI+Made+This%5D%3A+%3CTITLE%3E){target="_blank"}!"

## Connect

[![Join our Discord](https://dcbadge.vercel.app/api/server/B8zZKbbyET)](https://discord.gg/B8zZKbbyET){target="_blank"}

Join us on [Discord](https://discord.gg/B8zZKbbyET){target="_blank"} to connect with the Powertools community 👋. Ask questions, learn from each other, contribute, hang out with key contributors, and more!

## Tools

### Powertools for AWS Lambda - MCP Server

> **Author: [Michael Walmsley](https://www.linkedin.com/in/walmsles/){target="_blank"} :material-linkedin:**

This project implements an MCP server that enables Large Language Models (LLMs) to search through Powertools for AWS Lambda documentation.

The server accesses the live documentation `search_index.json` data and re-constructs a local search index using lunr.js. This provides an identical search experience for AI Agents and returns the exact same results as a person would get on the website.

With the index being local searches are super fast and the index is cached for the life of the server to save rebuilding used indexes. Since the MCP Server uses real search data it is capable of working for any Powertools for AWS document site so naturally supports all the runtimes.

* [https://github.com/serverless-dna/powertools-mcp](https://github.com/serverless-dna/powertools-mcp){target="_blank"}

## Blog posts

### Lambda Powertools - great defaults for batteries that aren't quite (but should be) included

> **Author: [Mike Roberts](mailto:mike@symphonia.io) [:material-twitter:](https://twitter.com/mikebroberts){target="_blank"}**

This article discusses why you should consider using Powertools in your Lambda functions.

* [https://blog.symphonia.io/posts/2022-10-24_lambda-powertools](https://blog.symphonia.io/posts/2022-10-24_lambda-powertools){target="_blank"}

### Test Drive AWS Lambda Powertools for Typescript

> **Author: [Matt Lewis](https://twitter.com/m_lewis){target="_blank"} :material-twitter:**

This article gives an overview Powertools' core utilities: Logger, Metrics, and Tracer.

* [https://dev.to/aws-heroes/test-drive-aws-lambda-powertools-for-typescript-h3p](https://dev.to/aws-heroes/test-drive-aws-lambda-powertools-for-typescript-h3p){target="_blank"}

### Power-up Lambda functions with AWS Lambda Powertools for TypeScript

> **Author: [Ryan Toler](https://www.linkedin.com/in/ryantoler/){target="_blank"} :material-linkedin:**

Discover how easy it is to quickly “power-up” your Node.js Lambda functions with utilities from AWS Lambda Powertools for TypeScript.

* [https://www.trek10.com/blog/power-up-lambda-functions-with-aws-lambda-powertools-for-typescript](https://www.trek10.com/blog/power-up-lambda-functions-with-aws-lambda-powertools-for-typescript){target="_blank"}

### Getting to Well Architected Faster with AWS Lambda Powertools

> **Author: [Eoin Shanaghy](https://twitter.com/eoins){target="_blank"} :material-twitter:**

This post shows how to use Powertools for AWS Lambda to quickly build Well-Architected Serverless applications.

* [https://fourtheorem.com/aws-lambda-powertools/](https://fourtheorem.com/aws-lambda-powertools/){target="_blank"}

### AWS Lambda Powertools TypeScript

> **Author: [Matt Morgan](https://twitter.com/NullishCoalesce){target="_blank"} :material-twitter:**

A two parts series that gives an overview of Powertools and its features starting from the beta phase to the General Availability release.

* [First Look at Lambda Powertools TypeScript](https://dev.to/aws-builders/first-look-at-lambda-powertools-typescript-2k3p){target="_blank"}

* [Lambda Powertools TypeScript is Generally Available](https://dev.to/aws-builders/lambda-powertools-typescript-is-generally-available-1dm8){target="_blank"}

### EventBridge: working around API Destination 5s maximum client timeout constraint, using Powertools for AWS Lambda Idempotency

> **Author: [Paul Santus](https://www.linkedin.com/in/paulsantus/){target="_blank"} :material-linkedin:**

This article discusses how to use the Idempotency feature to work around EventBridge API Destinations' built-in maximum client execution timeout (5s) and allow long-running queries, while still benefitting from automated retry and DLQ, and preventing concurrent calls.

* [https://dev.to/aws-builders/eventbridge-working-around-api-destination-5s-maximum-client-timeout-constraint-using-lambda-powertools-idempotency-1cb3](https://dev.to/aws-builders/eventbridge-working-around-api-destination-5s-maximum-client-timeout-constraint-using-lambda-powertools-idempotency-1cb3){target="_blank"}

## Videos

### Supercharge Lambda functions with Powertools for AWS Lambda

> **Author: [Raphael Manke](https://www.linkedin.com/in/raphael-manke/){target="_blank"} :material-linkedin:**

An overview of all the Powertools for AWS Lambda features put into a real world example.

<iframe width="620" height="378" src="https://youtu.be/DYf7kpR24dk?si=qm2wWg0asxLUY8xe" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### AWS re:Invent 2024 - Gain expert-level knowledge about Powertools for AWS Lambda (OPN402)

> **Author: [Andrea Amorosi](https://www.linkedin.com/in/dreamorosi/){target="_blank"} :material-linkedin:**

Did you learn serverless best practices but are unsure about implementation? Have you used Powertools for AWS Lambda but felt you barely scratched the surface? This session dives deep into observability practices, safe retries with idempotency, mono- and multi-function APIs, and more. Learn about each practice in depth, achieve expert-level knowledge, and hear from maintainers about what’s next.

<iframe width="620" height="378" src="https://youtu.be/kxJTq8FTkDA?si=tV75z2HVGlPxYtPA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
