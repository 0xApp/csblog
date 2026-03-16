---
title: ".NET 10 Performance: What Changed and Why It Matters"
description: ".NET 10 delivers escape analysis, zero-allocation enumeration, smarter LINQ, and regex upgrades — some benchmarks show up to 62,500x speedups."
pubDate: 2026-03-16T19:47:30Z
author: "Parimal Raj"
category: ".NET Development"
tags: ["dotnet-10", "performance", "csharp", "dotnet", "benchmarks", "jit-compiler", "linq", "regex"]
draft: false
image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop&q=80"
imageAlt: "Server room with blue lighting representing high-performance computing infrastructure and .NET runtime optimization"
---

Stephen Toub's annual .NET performance blog post has become a ritual for the C# community. This year's edition for .NET 10 clocks in at roughly 55,000 words — over 230 pages when printed to PDF ([The Register](https://www.theregister.com/2025/09/11/microsoft_dotnet_10/), 2025). It covers approximately 300 pull requests, about 25% of which came from community contributors outside Microsoft (per Stephen Toub, .NET Conf 2025). Nobody has time to read 230 pages. But every .NET developer should understand what changed and why it matters.

This post distills the most impactful .NET 10 performance improvements into something you can read in fifteen minutes. We'll walk through escape analysis, collection enumeration, LINQ optimizations, regex engine upgrades, and new APIs — with real benchmark numbers showing the before and after. If you're already using [.NET agent skills](/blog/dotnet-agent-skills-guide) with your AI coding tools, these performance gains make the upgrade even more compelling.

> **TL;DR:** .NET 10 introduces escape analysis for stack allocation, eliminates heap allocations during `IEnumerable` enumeration, adds smarter LINQ query rewriting, and upgrades the regex engine with broader atomic loop detection. Some benchmarks show improvements from 500 ns down to 10 ns — and regex patterns that took 24 ms on .NET Framework now complete in 40 nanoseconds ([Microsoft .NET Blog](https://devblogs.microsoft.com/dotnet/performance-improvements-in-net-10/), 2025).

## What Is Deabstraction and Why Does .NET 10 Do It Better?

Every modern language trades raw performance for developer ergonomics. You write `foreach` over an `IEnumerable<T>`, and the compiler, runtime, and libraries figure out how to make it fast. The .NET team calls the process of removing that abstraction overhead "deabstraction" — and .NET 10 takes it further than any previous release.

The biggest single improvement is **escape analysis with stack allocation**. Here's the concept: when you create an object, the JIT compiler now checks whether that object ever "escapes" the current method. Does it get stored in a field? Returned to a caller? Passed to a method that might hold onto it? If the JIT can prove the object stays local, it allocates it on the stack frame instead of the GC heap. No garbage collection pressure. No heap allocation at all.

Consider this simple example — creating a `Stopwatch`, starting and stopping it, then returning the elapsed time:

```csharp
TimeSpan Test()
{
    var sw = Stopwatch.StartNew();
    sw.Stop();
    return sw.ElapsedTime;
}
```

On .NET Framework 4.8, this allocates 40 bytes on the heap and takes about 50 ns. On .NET 9, it still allocates 40 bytes but runs in about 40 ns — a 20% speedup from JIT improvements alone. On .NET 10? Zero bytes allocated and roughly 30 ns. The `Stopwatch` object never escapes the method, so the JIT stack-allocates it entirely.

This isn't limited to `Stopwatch`. Think about how often you create a temporary array just to iterate over a few values:

```csharp
int Test(string a, string b)
{
    int sum = 0;
    foreach (var value in new[] { a, b })
        sum += value.Length;
    return sum;
}
```

That `new[] { a, b }` creates a small array on the heap — 40 bytes on every call. On .NET 9, you'd still see that allocation. On .NET 10, the JIT recognizes the array never leaves the method and stack-allocates it. Execution drops from ~10 ns to ~4 ns with zero heap pressure. Multiply that by every hot path in your application that creates temporary arrays, and the aggregate effect is significant.

How significant? Delegate stack allocation benchmarks show .NET 10 running in 6.7 ns versus 19.5 ns on .NET 9 — a 66% improvement. Stack-allocated spans from arrays drop from 9.8 ns to 0.87 ns — a 91% speedup (Toub, 2025).

<figure style="margin: 2.5rem 0; text-align: center; padding: 1.5rem; border-radius: 12px;">
<svg viewBox="0 0 650 340" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <text x="325" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">Escape Analysis: Stack Allocation Speedups in .NET 10</text>
  <text x="325" y="48" text-anchor="middle" font-size="11" fill="#64748b">Time in nanoseconds (lower is better)</text>
  <g transform="translate(50, 70)">
    <!-- Stopwatch group -->
    <text x="0" y="18" font-size="12" fill="#475569" font-weight="600">Stopwatch</text>
    <rect x="120" y="2" width="250" height="22" rx="3" fill="#94a3b8" opacity="0.8"/>
    <text x="375" y="18" font-size="11" fill="#475569">50 ns — .NET FW 4.8</text>
    <rect x="120" y="30" width="200" height="22" rx="3" fill="#6366f1" opacity="0.8"/>
    <text x="325" y="46" font-size="11" fill="#475569">40 ns — .NET 9</text>
    <rect x="120" y="58" width="150" height="22" rx="3" fill="#10b981" opacity="0.9"/>
    <text x="275" y="74" font-size="11" fill="#475569">30 ns — .NET 10</text>
    <!-- Array alloc group -->
    <text x="0" y="118" font-size="12" fill="#475569" font-weight="600">Temp Array</text>
    <rect x="120" y="102" width="150" height="22" rx="3" fill="#94a3b8" opacity="0.8"/>
    <text x="275" y="118" font-size="11" fill="#475569">15 ns — .NET FW 4.8</text>
    <rect x="120" y="130" width="100" height="22" rx="3" fill="#6366f1" opacity="0.8"/>
    <text x="225" y="146" font-size="11" fill="#475569">10 ns — .NET 9</text>
    <rect x="120" y="158" width="40" height="22" rx="3" fill="#10b981" opacity="0.9"/>
    <text x="165" y="174" font-size="11" fill="#475569">4 ns — .NET 10</text>
    <!-- Delegate group -->
    <text x="0" y="218" font-size="12" fill="#475569" font-weight="600">Delegate</text>
    <rect x="120" y="202" width="195" height="22" rx="3" fill="#6366f1" opacity="0.8"/>
    <text x="320" y="218" font-size="11" fill="#475569">19.5 ns — .NET 9</text>
    <rect x="120" y="230" width="67" height="22" rx="3" fill="#10b981" opacity="0.9"/>
    <text x="192" y="246" font-size="11" fill="#475569">6.7 ns — .NET 10</text>
  </g>
  <text x="325" y="335" text-anchor="middle" font-size="10" fill="#94a3b8">Source: Performance Improvements in .NET 10, Microsoft .NET Blog, 2025</text>
</svg>
<figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #64748b;">Escape analysis eliminates heap allocations for objects that don't leave their method scope</figcaption>
</figure>

## How Much Faster Is Collection Enumeration in .NET 10?

If escape analysis is the engine, collection enumeration is where the rubber meets the road. Almost every .NET application enumerates collections constantly — and the cost of doing so through `IEnumerable<T>` has always been the tax you pay for abstraction.

When you write `foreach` over a concrete `int[]`, the C# compiler lowers it to a plain `for` loop. No enumerator, no allocation, no virtual dispatch. But the moment that array is typed as `IEnumerable<int>` — passed through a method parameter, returned from a LINQ call, stored in a generic collection — the compiler has to go through `GetEnumerator()`, `MoveNext()`, and `Current`. That means a heap-allocated enumerator, virtual method calls, and a `try/finally` block that previously couldn't be inlined.

.NET 10 attacks this on multiple fronts. The JIT can now inline `try/finally` blocks. It devirtualizes enumerator calls more aggressively. And the escape analysis we just discussed eliminates the enumerator allocation entirely when possible.

The numbers tell the story. Here's what happens when you sum 100 integers through `IEnumerable<int>`:

| Runtime | Time | Allocation |
|---|---|---|
| .NET Framework 4.8 | ~500 ns | 32 bytes |
| .NET 9 | ~190 ns | 32 bytes |
| .NET 10 | ~40 ns | 0 bytes |

That's a 12x improvement over .NET Framework and nearly 5x over .NET 9 — with zero heap allocations. The enumerator still exists conceptually, but the JIT has proven it doesn't escape and stack-allocates it.

Does this only work for arrays? No. The .NET team made targeted changes to enumerator types across the standard collections to help the JIT optimize them. Here's how different collection types perform when enumerated through `IEnumerable<T>`:

<figure style="margin: 2.5rem 0; text-align: center; padding: 1.5rem; border-radius: 12px;">
<svg viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <text x="350" y="25" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">IEnumerable&lt;T&gt; Enumeration: .NET FW 4.8 vs .NET 9 vs .NET 10</text>
  <text x="350" y="45" text-anchor="middle" font-size="11" fill="#64748b">Nanoseconds per operation, 100 elements (lower is better). All .NET 10 results: 0 bytes allocated.</text>
  <!-- Legend -->
  <rect x="160" y="55" width="14" height="14" rx="2" fill="#94a3b8"/>
  <text x="180" y="66" font-size="11" fill="#475569">.NET FW 4.8</text>
  <rect x="290" y="55" width="14" height="14" rx="2" fill="#6366f1"/>
  <text x="310" y="66" font-size="11" fill="#475569">.NET 9</text>
  <rect x="390" y="55" width="14" height="14" rx="2" fill="#10b981"/>
  <text x="410" y="66" font-size="11" fill="#475569">.NET 10</text>
  <g transform="translate(60, 85)">
    <!-- Array -->
    <text x="80" y="18" text-anchor="end" font-size="12" fill="#475569">Array</text>
    <rect x="95" y="2" width="340" height="18" rx="3" fill="#94a3b8" opacity="0.8"/>
    <text x="440" y="16" font-size="10" fill="#475569">500 ns</text>
    <rect x="95" y="24" width="129" height="18" rx="3" fill="#6366f1" opacity="0.8"/>
    <text x="229" y="38" font-size="10" fill="#475569">190 ns</text>
    <rect x="95" y="46" width="27" height="18" rx="3" fill="#10b981" opacity="0.9"/>
    <text x="127" y="60" font-size="10" fill="#475569">40 ns</text>
    <!-- List -->
    <text x="80" y="88" text-anchor="end" font-size="12" fill="#475569">List&lt;T&gt;</text>
    <rect x="95" y="72" width="476" height="18" rx="3" fill="#94a3b8" opacity="0.8"/>
    <text x="576" y="86" font-size="10" fill="#475569">700 ns</text>
    <rect x="95" y="94" width="136" height="18" rx="3" fill="#6366f1" opacity="0.8"/>
    <text x="236" y="108" font-size="10" fill="#475569">200 ns</text>
    <rect x="95" y="116" width="68" height="18" rx="3" fill="#10b981" opacity="0.9"/>
    <text x="168" y="130" font-size="10" fill="#475569">~100 ns</text>
    <!-- Stack -->
    <text x="80" y="158" text-anchor="end" font-size="12" fill="#475569">Stack&lt;T&gt;</text>
    <rect x="95" y="142" width="544" height="18" rx="3" fill="#94a3b8" opacity="0.8"/>
    <text x="644" y="156" font-size="10" fill="#475569">800 ns</text>
    <rect x="95" y="164" width="204" height="18" rx="3" fill="#6366f1" opacity="0.8"/>
    <text x="304" y="178" font-size="10" fill="#475569">300 ns</text>
    <rect x="95" y="186" width="41" height="18" rx="3" fill="#10b981" opacity="0.9"/>
    <text x="141" y="200" font-size="10" fill="#475569">~60 ns</text>
    <!-- Queue -->
    <text x="80" y="228" text-anchor="end" font-size="12" fill="#475569">Queue&lt;T&gt;</text>
    <rect x="95" y="212" width="612" height="18" rx="3" fill="#94a3b8" opacity="0.8"/>
    <text x="575" y="226" font-size="10" fill="#475569">900 ns</text>
    <rect x="95" y="234" width="238" height="18" rx="3" fill="#6366f1" opacity="0.8"/>
    <text x="338" y="248" font-size="10" fill="#475569">350 ns</text>
    <rect x="95" y="256" width="82" height="18" rx="3" fill="#10b981" opacity="0.9"/>
    <text x="182" y="270" font-size="10" fill="#475569">~120 ns</text>
    <!-- ConcurrentDictionary -->
    <text x="80" y="300" text-anchor="end" font-size="11" fill="#475569">ConcurrentDict</text>
    <rect x="95" y="282" width="580" height="18" rx="3" fill="#94a3b8" opacity="0.8"/>
    <text x="555" y="296" font-size="10" fill="#475569">1,600 ns</text>
    <rect x="95" y="304" width="306" height="18" rx="3" fill="#6366f1" opacity="0.8"/>
    <text x="406" y="318" font-size="10" fill="#475569">900 ns</text>
    <rect x="95" y="326" width="51" height="18" rx="3" fill="#10b981" opacity="0.9"/>
    <text x="151" y="340" font-size="10" fill="#475569">140 ns</text>
  </g>
</svg>
<figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #64748b;">Source: Benchmark data from Stephen Toub's .NET Conf 2025 session, demonstrating IEnumerable&lt;T&gt; deabstraction across collection types</figcaption>
</figure>

`ConcurrentDictionary` stands out — going from 1,600 ns with 56 bytes allocated on .NET Framework to 140 ns and zero bytes on .NET 10. That's an 11x speedup. The team didn't just improve the JIT; they rewrote the enumerator implementation for `ConcurrentDictionary` specifically to enable these optimizations.

Worth noting: these improvements apply to the strongly-typed enumerators too, not just the `IEnumerable` path. `Stack<T>` enumeration with its own struct enumerator went from 500 ns on .NET Framework to about 50 ns on .NET 10 — a 10x improvement from collection-level changes alone, before the deabstraction even kicks in.

## What LINQ Optimizations Ship with .NET 10?

LINQ has been getting smarter for years. Since around .NET Core 3.0, the runtime has passed information between query operators so they can short-circuit expensive work. .NET 10 extends this pattern to more operators with dramatic results.

The classic example: `OrderBy(...).First()`. On .NET Framework 4.8, this sorts the entire collection and then picks the first element. That's O(n log n) for an operation that should be O(n). Starting with .NET 9, LINQ recognized this pattern and translated it into a minimum-finding operation — no full sort needed. A million-element sort that took 122 ms on .NET Framework dropped to about 2 ms on .NET 9.

But what about `OrderBy(...).Contains()`? That's a case .NET 9 didn't optimize. It still performed the full sort before checking containment. On .NET Framework, sorting a million elements and checking `Contains` took about 128 ms. On .NET 9, it dropped to 83 ms — faster, but still doing unnecessary work.

.NET 10 recognizes that `Contains` doesn't need sorted input. It skips the `OrderBy` entirely and checks containment directly. Result: **10–20 nanoseconds** for something that took 83 milliseconds. That's not a percentage improvement — it's a change in algorithmic complexity.

The same principle applies to `Reverse().Contains()`. On .NET Framework, `Reverse()` makes a full copy of the input (8 MB for a million-element array) and then checks `Contains` on the reversed copy. On .NET 10, the runtime knows that reversing has no impact on whether a value exists in the collection. It skips the reverse entirely — sub-10 ns execution, zero allocation.

```csharp
// .NET 10 optimizes this chain — no sort, no reverse, just containment check
bool found = values.OrderBy(v => -v).Reverse().Contains(42);
```

.NET 10 also adds new LINQ methods: `Shuffle`, `LeftJoin`, and `RightJoin`. These join methods address a gap that's existed since LINQ was introduced — developers have been writing custom extension methods for left joins for over a decade. Now it's built in.

## How Did the Regex Engine Improve in .NET 10?

The .NET regex engine has received major upgrades in every release since .NET 5, and .NET 10 continues the tradition. The improvements fall into two categories: making more loops atomic and eliminating unnecessary search work.

### Broader atomic loop detection

A regex like `a*b` contains a greedy loop (`a*`) followed by a literal (`b`). The engine first matches as many `a` characters as possible, then tries to match `b`. If `b` fails, it backtracks — giving back one `a` and trying again, over and over. But here's the thing: no character matched by `a*` could ever satisfy `b`. Backtracking is pointless. Previous .NET versions already recognized this simple case and converted the greedy loop to an atomic loop — one that never backtracks.

.NET 10 extends this reasoning to Unicode categories. Consider `\w+` followed by a math symbol (`\p{Sm}`). No math symbol is a word character, so the `\w+` loop should be atomic. But .NET 9's engine couldn't reason about Unicode category overlap. The loop stayed greedy, with all the backtracking overhead that implies.

In .NET 10, the engine understands Unicode category relationships. `\w+\p{Sm}` becomes atomic. So does `\s+\S` (whitespace followed by non-whitespace). Every pattern where the engine can prove non-overlap gets the atomic optimization, changing the algorithmic complexity from potentially exponential to linear.

You can see this directly using the regex source generator introduced in .NET 7. The source generator translates regex patterns into C# code at compile time, and the generated code literally changes from comments like "match greedily" to "match atomically" when you target .NET 10.

### Anchor lifting from lookaheads

Here's a subtler optimization. Consider the pattern `(?=^)hello` — a zero-width positive lookahead checking for the start-of-string anchor, followed by the literal "hello". Semantically, this is identical to `^hello`, but .NET 9's engine didn't recognize that the anchor could be lifted out of the lookahead.

Why does this matter? Without the optimization, the engine searches the entire input for the string "hello" at every position. With it, the engine only checks whether we're at position zero. For large inputs, the difference is enormous.

Toub demonstrated this using the complete works of Mark Twain (~3.5 MB of text) as input:

<figure style="margin: 2.5rem 0; text-align: center; padding: 1.5rem; border-radius: 12px;">
<svg viewBox="0 0 650 250" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <text x="325" y="25" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">Regex: (?=^)hello Against 3.5 MB Input</text>
  <text x="325" y="45" text-anchor="middle" font-size="11" fill="#64748b">Execution time per match operation (lower is better)</text>
  <g transform="translate(60, 70)">
    <text x="130" y="18" text-anchor="end" font-size="13" fill="#475569">.NET FW 4.8</text>
    <rect x="145" y="2" width="350" height="30" rx="4" fill="#94a3b8" opacity="0.85"/>
    <text x="500" y="22" font-size="12" fill="#475569" font-weight="600">24 ms</text>
    <text x="130" y="68" text-anchor="end" font-size="13" fill="#475569">.NET 9</text>
    <rect x="145" y="52" width="29" height="30" rx="4" fill="#6366f1" opacity="0.85"/>
    <text x="179" y="72" font-size="12" fill="#475569" font-weight="600">2 ms (12x faster)</text>
    <text x="130" y="118" text-anchor="end" font-size="13" fill="#475569">.NET 10</text>
    <rect x="145" y="102" width="2" height="30" rx="1" fill="#10b981" opacity="0.9"/>
    <text x="152" y="122" font-size="12" fill="#475569" font-weight="600">~40 ns (600x faster than .NET 9)</text>
  </g>
  <text x="325" y="195" text-anchor="middle" font-size="12" fill="#1e293b" font-weight="600">Total improvement: ~600,000x over .NET Framework 4.8</text>
  <text x="325" y="235" text-anchor="middle" font-size="10" fill="#94a3b8">Source: Stephen Toub, .NET Conf 2025 live demonstration</text>
</svg>
<figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #64748b;">Anchor lifting eliminates full-input scanning when the engine can prove a match is only possible at a fixed position</figcaption>
</figure>

From 24 milliseconds to 40 nanoseconds. That's a factor of 600,000. Obviously, this specific pattern is contrived — most real-world regex patterns won't see improvements this extreme. But the underlying optimization (recognizing when anchors can be lifted from lookaheads) applies to real patterns that developers actually write, especially in log parsing and input validation.

## What Other Performance Wins Should You Know About?

The improvements above are highlights, but .NET 10's performance story extends well beyond them. Here are several more worth knowing about.

### BitArray and CollectionsMarshal

`BitArray` — a collection of packed boolean values — got new API surface in .NET 10 that unlocks vectorized operations. The new `CollectionsMarshal.AsBytes()` method exposes the backing store of a `BitArray` as a `Span<byte>`, letting you use `TensorPrimitives` for bulk operations.

Computing the Hamming distance (how many bit positions differ between two arrays) is a practical example. The naive approach iterates bit-by-bit:

```csharp
long HammingDistance(BitArray a, BitArray b)
{
    long distance = 0;
    for (int i = 0; i < a.Length; i++)
        if (a[i] != b[i]) distance++;
    return distance;
}
```

On .NET Framework 4.8, this takes about 500 ns for 100 bits. On .NET 9, better JIT codegen drops it to 160 ns. But on .NET 10, you can write:

```csharp
#if NET10_0_OR_GREATER
return TensorPrimitives.HammingBitDistance(
    CollectionsMarshal.AsBytes(a),
    CollectionsMarshal.AsBytes(b));
#endif
```

This takes advantage of SIMD instructions (Vector128, Vector256, or Vector512 depending on your hardware) to process multiple bytes in a single instruction. Result: about 10 nanoseconds. That's 50x faster than .NET Framework and 16x faster than .NET 9. For bioinformatics, similarity search, or any domain that works with packed bit data, this changes what's practical at runtime.

### Try/finally inlining

Before .NET 10, the JIT compiler refused to inline methods containing `try/finally` blocks. This sounds like a minor detail, but `try/finally` is everywhere — every `foreach` over an `IEnumerator<T>` generates one (to call `Dispose`), every `using` statement generates one, every `lock` statement generates one. The inability to inline these blocks was a constant ceiling on optimization.

.NET 10 removes that ceiling. The JIT can now inline methods with `try/finally`, which is one of the key enablers for the collection enumeration improvements we discussed earlier. Without this change, the enumerator's `Dispose` pattern would have blocked inlining of the entire enumeration path.

### New analyzers and code fixers

Every .NET release ships new Roslyn analyzers that flag performance opportunities. .NET 10 includes a fixer that recognizes when you're using `Regex.Matches(input).Count` and suggests switching to the `Count` method introduced in .NET 7, which avoids allocating `Match` objects entirely. Small wins like this compound across a codebase.

## Should You Upgrade to .NET 10?

C# is used by 29.9% of professional developers — ranking 8th worldwide — and ASP.NET Core by 21.3%, according to the [Stack Overflow 2025 Developer Survey](https://survey.stackoverflow.co/2025/technology). That's a massive installed base, and the performance improvements in .NET 10 apply to virtually every application pattern those developers use.

The practical case for upgrading comes down to three things. First, these improvements are free. You don't need to change your code. Recompile against .NET 10 and your existing `foreach` loops, LINQ queries, and regex patterns automatically get faster. Second, the allocation reductions compound. Every eliminated heap allocation is less work for the garbage collector, which means lower tail latencies in production — especially under load. Third, the new APIs (like `CollectionsMarshal.AsBytes` and the new LINQ operators) open up optimization paths that weren't possible before.

One caveat: as with any major framework upgrade, test thoroughly. The .NET team maintains a [breaking changes document](https://learn.microsoft.com/en-us/dotnet/core/compatibility/10.0) for each release. In our experience, .NET version upgrades since .NET 6 have been remarkably smooth, but verify your specific dependencies and test suites pass before deploying. If you're building this blog on Astro like we did, the [static site approach](/blog/building-this-blog-with-astro-and-claude) means you can test .NET-related tooling upgrades without worrying about frontend framework compatibility.

<!-- [UNIQUE INSIGHT] -->
The broader trend is worth noting. .NET's performance trajectory over the last five releases isn't just incremental — it's compounding. Each release builds on the infrastructure laid by previous ones. The try/finally inlining in .NET 10 only pays off because .NET 9 improved devirtualization, which only pays off because .NET 8 improved guarded devirtualization, and so on. Upgrading one version at a time means you're always one compounding cycle behind.

## Frequently Asked Questions

### How many performance-related PRs went into .NET 10?

Approximately 300 performance-focused pull requests were merged for .NET 10, covering the JIT compiler, runtime, libraries, and networking stack. About 25% of those came from community contributors outside Microsoft (per Stephen Toub, .NET Conf 2025). Stephen Toub's annual blog post documenting these changes runs over 55,000 words — roughly 230 pages when printed ([The Register](https://www.theregister.com/2025/09/11/microsoft_dotnet_10/), 2025).

### Do I need to change my code to benefit from .NET 10 performance improvements?

No. Most improvements apply automatically when you retarget your application to .NET 10. Escape analysis, try/finally inlining, LINQ query rewriting, and regex engine upgrades all happen at the JIT or library level without code changes. Some new APIs like `CollectionsMarshal.AsBytes()` and `TensorPrimitives.HammingBitDistance()` require explicit opt-in, but the foundational improvements are free.

### How does .NET 10 performance compare to other runtimes like Java or Go?

.NET has consistently ranked in the top tier of the [TechEmpower Framework Benchmarks](https://www.techempower.com/benchmarks/), and .NET 10's improvements to collection enumeration, LINQ, and JIT compilation widen that lead further. The escape analysis and stack allocation work brings .NET closer to the allocation-free patterns that Go and Rust developers take for granted, while retaining C#'s high-level abstractions.

### What is the regex source generator and should I use it?

The regex source generator, introduced in .NET 7, translates regex patterns into C# code at compile time. Instead of interpreting the pattern at runtime, you get a fully optimized implementation that benefits from all the JIT improvements in each .NET version. Use it for any regex pattern that's known at compile time — add `[GeneratedRegex("pattern")]` to a partial method and let the compiler do the rest. In .NET 10, the generated code automatically includes broader atomic loop detection and anchor lifting optimizations.

### Is .NET 10 an LTS release?

.NET 10 is a Standard Term Support (STS) release with 18 months of support. The next LTS release will be .NET 12. However, the performance improvements in .NET 10 are foundational — they'll carry forward into future releases. If your deployment pipeline supports STS releases, the performance gains alone justify the upgrade.
