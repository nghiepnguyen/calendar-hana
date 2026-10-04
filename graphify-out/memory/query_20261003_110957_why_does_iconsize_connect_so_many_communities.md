---
type: "query"
date: "2026-10-03T11:09:57.747558+00:00"
question: "Why does iconSize connect so many communities?"
contributor: "graphify"
source_nodes: ["iconSize", "MonthView", "TextSizeSection", "EventChip", "MiniMonth"]
---

# Q: Why does iconSize connect so many communities?

## Answer

iconSize() is defined in src/styles/textSize.ts at line 42 and acts as a shared typography/UI sizing utility. Its direct graph neighborhood reaches text-size consumers such as MonthView, TextSizeSection, DomainMove, EventChip, MiniMonth and other UI components, which explains why one node bridges many presentation communities. The graph also connects those UI areas to broader page, settings, repository, calendar, and Feng Shui views through shared imports and call relationships. This is a structural bridge caused by a cross-cutting design token, not evidence that iconSize owns those domains.

## Source Nodes

- iconSize
- MonthView
- TextSizeSection
- EventChip
- MiniMonth