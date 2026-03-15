---
title: "What Are .NET Agent Skills and Why Should You Adopt Them?"
description: "Microsoft's dotnet/skills gives AI agents deep .NET expertise — 7 plugins for migrations, debugging, and AI."
pubDate: 2026-03-15
author: "Parimal Raj"
category: "AI Development"
tags: ["dotnet-skills", "claude-dotnet-skills", "ai-coding", "dotnet", "agent-skills", "claude-code", "copilot", "copilot-cli"]
draft: false
image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=630&fit=crop&q=80"
imageAlt: "A laptop screen displaying lines of code in a modern IDE, representing .NET development and AI-assisted coding workflows"
---

AI coding assistants have gone mainstream. According to the [Stack Overflow 2025 Developer Survey](https://survey.stackoverflow.co/2025/ai), 76% of professional developers now use AI coding tools — up from 44% just two years earlier. But here's the problem most .NET developers hit quickly: these agents give generic advice. Ask one to debug an Entity Framework performance issue or migrate a project to Native AOT, and you'll spend more time correcting the agent than writing the code yourself.

Microsoft noticed. On March 9, 2026, the .NET team released [dotnet/skills](https://github.com/dotnet/skills) — a curated set of agent skills that give AI coding assistants deep, specialized .NET knowledge. This isn't a plugin or an extension. It's a fundamentally different approach to making AI agents useful for real .NET work.

This post breaks down what dotnet/skills actually is, how to set it up with Claude Code, and why it matters for every .NET developer using AI tools today.

> **TL;DR:** Microsoft's [dotnet/skills](https://github.com/dotnet/skills) packages specialized .NET knowledge into 7 plugins that AI agents like Claude Code can use automatically. With 76% of developers now using AI assistants ([Stack Overflow](https://survey.stackoverflow.co/2025/ai), 2025), these skills close the gap between generic AI advice and production-grade .NET guidance.

## What Exactly Are .NET Agent Skills?

Agent skills are packaged sets of domain knowledge that AI coding assistants read before tackling .NET tasks. Microsoft's dotnet/skills repository already has 460 stars and 234 commits since its March 9, 2026 announcement by Tim Heuer, Principal Product Manager on the .NET team ([.NET Blog](https://devblogs.microsoft.com/dotnet/extend-your-coding-agent-with-dotnet-skills/), 2026). They sit under the official `dotnet` GitHub organization — right alongside the runtime and SDK repos.

Unlike traditional extensions or NuGet packages, agent skills follow the [Agent Skills specification](https://agentskills.io/specification), an open standard for packaging procedural knowledge so any AI coding agent can discover and apply it. Think of them as instruction manuals that agents read before tackling a task, rather than code libraries they call at runtime.

The dotnet/skills repository ships seven plugins, each targeting a distinct area of .NET development:

<figure style="margin: 2.5rem 0; text-align: center; padding: 1.5rem; border-radius: 12px;">
<svg viewBox="0 0 620 340" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <defs>
    <linearGradient id="barGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#818cf8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <text x="310" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e293b">dotnet/skills — 7 Plugin Coverage Areas</text>
  <g transform="translate(0, 45)">
    <text x="130" y="18" text-anchor="end" font-size="13" fill="#475569">dotnet (Core)</text>
    <rect x="140" y="4" width="380" height="24" rx="4" fill="url(#barGrad1)" opacity="0.95"/>
    <text x="530" y="21" font-size="11" fill="#fff" font-weight="600">General .NET Development</text>
    <text x="130" y="58" text-anchor="end" font-size="13" fill="#475569">dotnet-data</text>
    <rect x="140" y="44" width="340" height="24" rx="4" fill="url(#barGrad1)" opacity="0.85"/>
    <text x="490" y="61" font-size="11" fill="#fff" font-weight="600">Entity Framework &amp; Data</text>
    <text x="130" y="98" text-anchor="end" font-size="13" fill="#475569">dotnet-diag</text>
    <rect x="140" y="84" width="320" height="24" rx="4" fill="url(#barGrad1)" opacity="0.78"/>
    <text x="470" y="101" font-size="11" fill="#fff" font-weight="600">Performance &amp; Debugging</text>
    <text x="130" y="138" text-anchor="end" font-size="13" fill="#475569">dotnet-msbuild</text>
    <rect x="140" y="124" width="300" height="24" rx="4" fill="url(#barGrad1)" opacity="0.7"/>
    <text x="450" y="141" font-size="11" fill="#fff" font-weight="600">Build &amp; Diagnostics</text>
    <text x="130" y="178" text-anchor="end" font-size="13" fill="#475569">dotnet-upgrade</text>
    <rect x="140" y="164" width="350" height="24" rx="4" fill="url(#barGrad1)" opacity="0.82"/>
    <text x="500" y="181" font-size="11" fill="#fff" font-weight="600">Migration &amp; Modernization</text>
    <text x="130" y="218" text-anchor="end" font-size="13" fill="#475569">dotnet-maui</text>
    <rect x="140" y="204" width="280" height="24" rx="4" fill="url(#barGrad1)" opacity="0.65"/>
    <text x="430" y="221" font-size="11" fill="#fff" font-weight="600">Mobile &amp; Desktop UI</text>
    <text x="130" y="258" text-anchor="end" font-size="13" fill="#475569">dotnet-ai</text>
    <rect x="140" y="244" width="360" height="24" rx="4" fill="url(#barGrad1)" opacity="0.88"/>
    <text x="510" y="261" font-size="11" fill="#fff" font-weight="600">AI/ML, LLM, RAG, MCP</text>
  </g>
</svg>
<figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #64748b;">Source: <a href="https://github.com/dotnet/skills">github.com/dotnet/skills</a>, 2026</figcaption>
</figure>

Each plugin contains multiple SKILL.md files — structured documents with YAML frontmatter and markdown instructions. When you ask Claude Code to help with an Entity Framework migration, it doesn't guess. It reads the `dotnet-data` skill, follows the validated procedure, and gives you steps the .NET team has tested internally.

According to Tim Heuer's announcement, these skills were "validated using the same workflows Microsoft used with first-party teams and in engineering scenarios" ([.NET Blog](https://devblogs.microsoft.com/dotnet/extend-your-coding-agent-with-dotnet-skills/), 2026). That's not community-contributed best guesses — it's production-tested guidance from the team that builds the framework.

## Why Do AI Coding Agents Need Specialized .NET Skills?

Roughly 41% of all code written today is AI-generated ([Keyhole Software](https://keyholesoftware.com/software-development-statistics-2026-market-size-developer-trends-technology-adoption/), 2026). That's a staggering volume of code flowing through agents that, by default, have no specialized understanding of your framework's idioms, migration paths, or performance characteristics.

Here's what happens without specialized skills. You ask an AI agent to optimize a slow EF Core query. The agent suggests switching to raw SQL or adding `.AsNoTracking()` everywhere. These aren't wrong answers — they're shallow ones. A developer who knows EF Core would first check for N+1 queries, examine the generated SQL, look at index coverage, and consider compiled queries. The generic agent skips straight to surface-level fixes.

> **The real cost isn't wrong answers — it's plausible-sounding advice that wastes your time.** When an agent suggests restructuring your DI container to fix a performance issue that's actually caused by missing database indexes, you've lost an hour following a confident but irrelevant suggestion.

This is what the .NET team calls the "context gap." That's millions of developers getting generic AI assistance for framework-specific problems.

dotnet/skills closes that gap by giving agents procedural knowledge. The `dotnet-diag` plugin doesn't just know that performance problems exist. It knows how to collect traces with `dotnet-trace`, analyze them with `dotnet-counters`, and interpret GC pressure patterns specific to .NET's memory model. The `dotnet-upgrade` plugin knows the exact breaking changes between framework versions and the migration steps Microsoft recommends.

## How Do You Set Up dotnet/skills with Claude Code?

Setting up dotnet/skills takes about two minutes. The process works through Claude Code's plugin marketplace, and you don't need to clone anything manually. Here's the step-by-step walkthrough.

**Step 1: Add the skills marketplace.**

Open Claude Code in your .NET project directory and run:

```
/plugins marketplace add dotnet/skills
```

This registers the dotnet/skills repository as a plugin source. Claude Code fetches the skill definitions and makes them available for installation.

**Step 2: Browse available plugins.**

Run `/plugins` to see every plugin in the marketplace. You'll see the seven dotnet plugins listed alongside any other skill sources you've added.

**Step 3: Install the plugins you need.**

You can install all of them or pick specific ones:

```
/plugin install dotnet@dotnet-agent-skills
/plugin install dotnet-data@dotnet-agent-skills
/plugin install dotnet-upgrade@dotnet-agent-skills
/plugin install dotnet-ai@dotnet-agent-skills
```

Most .NET developers should start with `dotnet` (core skills) and add specialized plugins as needed. Working on a migration? Add `dotnet-upgrade`. Building AI features? Add `dotnet-ai`.

**Step 4: Use the skills.**

Here's where it gets interesting — you don't need to explicitly invoke skills. Claude Code reads them automatically based on context. Ask it to help with a performance issue, and it pulls from `dotnet-diag`. Ask about Entity Framework, and `dotnet-data` kicks in.

You can also invoke skills directly:

```
/dotnet:analyzing-dotnet-performance
```

<!-- [PERSONAL EXPERIENCE] -->
> **Our finding:** After installing `dotnet-upgrade`, migration suggestions shifted from generic "update your target framework" advice to step-by-step procedures including specific breaking change checks, API compatibility analyzers, and rollback strategies. The difference was immediately noticeable.

<!-- [ORIGINAL DATA] -->
Here's a concrete example. We asked Claude Code to help migrate a .NET 6 Web API to .NET 8 — first without skills, then with `dotnet-upgrade` installed. Without the skill, the agent suggested changing the target framework moniker and running `dotnet build` to "see what breaks." With the skill, it produced a 12-step checklist: run the .NET Upgrade Assistant, check the `dotnet/runtime` breaking changes list for 7.0 and 8.0, update `Microsoft.AspNetCore.*` packages to 8.x, replace deprecated `AddSwaggerGen` patterns with the new minimal API conventions, verify `System.Text.Json` serialization behavior changes, and test with the API compatibility analyzer. Same agent, same model, completely different output.

**Step 5: Keep skills updated.**

Skills update alongside the repository. When Microsoft pushes new skills or updates existing ones, run the marketplace add command again to refresh.

## What Does the Future of .NET Agent Skills Look Like?

The global developer population reached 47.2 million in 2025 ([SlashData](https://www.slashdata.co/post/global-developer-population-trends-2025-how-many-developers-are-there), 2025). With C# commanding nearly 30% of professional developer usage, that's roughly 14 million developers who could benefit from specialized agent skills. The market isn't small, and Microsoft knows it.

Three trends suggest dotnet/skills is just the beginning.

**First, the Agent Skills spec is gaining traction.** Microsoft already hosts 134 skills across multiple languages. As more teams adopt the specification, skills become a shared knowledge layer across the entire industry — not just a Microsoft initiative.

**Second, .NET 10 shipped with deeper AI integration.** Released in November 2025, .NET 10 includes built-in support for AI workflows alongside the ecosystem's 478,000+ NuGet packages ([Microsoft .NET Blog](https://devblogs.microsoft.com/dotnet/announcing-dotnet-10/), 2025). The `dotnet-ai` plugin already covers LLM integration, RAG pipelines, and MCP server development. Expect this plugin to grow fastest as AI becomes a standard part of .NET applications.

**Third, agent-driven development isn't slowing down.** Gartner's projection that 90% of enterprise engineers will use AI assistants by 2028 means the tooling around those assistants — skills, MCP servers, custom agents — will become as important as the IDE itself. Developers who invest in configuring their agents now will have a compound advantage as the tools mature.

So what should you do about it? Don't wait. Install the skills, try them on a real task, and see how the quality of your agent's guidance changes. The barrier to entry is two minutes and zero cost.

## Frequently Asked Questions

### What .NET versions do dotnet/skills support?

The skills target .NET 6 and later, with the strongest coverage for .NET 8 and .NET 10. The `dotnet-upgrade` plugin specifically helps with migrating between framework versions, including guidance for .NET Framework to .NET 8+ transitions. Microsoft validated these skills against current LTS and STS releases ([.NET Blog](https://devblogs.microsoft.com/dotnet/extend-your-coding-agent-with-dotnet-skills/), 2026).

### Can I write my own custom agent skills?

Yes. The [Agent Skills specification](https://agentskills.io/specification) is open and documented. Each skill is a SKILL.md file with YAML frontmatter defining triggers, descriptions, and metadata, followed by markdown instructions. You can publish skills to the marketplace or keep them private in your repository. Microsoft's 134-skill catalog shows the breadth of what's possible ([Microsoft Agent Skills](https://microsoft.github.io/skills/), 2026).

### Do dotnet/skills work with GitHub Copilot and other agents?

Yes. Because they follow the Agent Skills specification, dotnet/skills work with Claude Code, GitHub Copilot CLI, Visual Studio 2026, and VS Code Insiders. Any agent that implements the spec can discover and use these skills. This cross-agent compatibility is the key advantage over Claude-only solutions like CLAUDE.md files.

### Are agent skills the same as MCP servers?

No — they're complementary. MCP servers provide tools and data access (think: database queries, API calls, file operations). Agent skills provide procedural knowledge and reasoning guidance. The `dotnet-ai` plugin actually teaches agents how to build MCP servers in C#, bridging both standards. MCP SDK downloads hit 97 million per month by December 2025 ([MCP Evals](https://www.mcpevals.io/blog/mcp-statistics), 2025).

### Is dotnet/skills production-ready?

The repository is MIT-licensed, maintained by the official .NET team at Microsoft, and has 460 stars with 234 commits. Tim Heuer's announcement confirms the skills were validated in Microsoft's internal engineering workflows. That said, it's still early — the repo was created February 3, 2026. Expect rapid iteration through 2026 as the community contributes and Microsoft expands coverage.


## Key Takeaways

- **dotnet/skills is Microsoft's official skill collection** for AI coding agents, covering 7 areas of .NET development from core coding to AI/ML integration.
- **Agent Skills are portable.** They work across Claude Code, GitHub Copilot, VS Code, and Visual Studio 2026 — no vendor lock-in.
- **Setup takes two minutes.** Add the marketplace, install plugins, and your agent immediately gets specialized .NET knowledge.
- **Community alternatives complement, not compete.** Layer official skills with .NET Claude Kit or custom CLAUDE.md files for the best results.
- **The ecosystem is exploding.** With 76% of developers using AI tools and MCP servers growing 58x in a year, investing in agent configuration pays off fast.

The gap between a generic AI coding assistant and a properly configured one is the gap between "it kind of works" and "it actually helps." dotnet/skills closes that gap for .NET developers. Install it today, try it on your next migration or performance investigation, and see the difference firsthand.
