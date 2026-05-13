# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--presentations--bolond2.aem.page/
- Live: https://main--presentations--bolond2.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Slide deck (`slide` block)

Presentation pages use the **slide** block (one table row per full-screen slide). Content is **left-aligned** in a reading column (`max-width` ~52rem). Optional **progress-nav** lists slide titles in a fixed rail; it works even when authored in the same section as `slide` (it waits for `.slide-section` nodes).

### Large / OBS mode (bigger type for capture or Zoom + OBS)

- **Block options (recommended):** In Document Authoring, name the block **`Slide (obs)`** or **`Slide (large)`** so the block gets classes `slide` + `obs` or `slide` + `large`. That sets **`--deck-ui-scale: 1.5`** on the page: slide typography and **progress-nav** are each **50% larger than the default `slide` deck** (same multiplier, not one sized relative to the other). See [Block Options](https://www.aem.live/developer/markup-sections-blocks).
- **URL override (optional):** Append **`?obs=1`** or **`?obs=true`**, or **`?deck=large`**, to apply the same **`--deck-ui-scale: 1.5`** without changing the document (e.g. OBS bookmark).

### Per-slide layout hint

As a **paragraph anywhere in the slide row** whose **entire** trimmed text is (case-insensitive):

`layout: quote` | `layout: scripture` | `layout: list` | `layout: hero-list` | `layout: title`

That paragraph is **removed** when the deck loads; it only selects the layout. **`layout: scripture`** splits verses on `<br>` like list layouts. For attributions on quote/scripture slides, use a child with class **`author`** or **`slide-author`** (e.g. `<span class="author">…</span>`).

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
