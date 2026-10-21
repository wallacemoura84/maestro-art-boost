<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Public YouTube videos are read from the channel's official RSS feed through a public server function with a ten-minute in-memory cache; this avoids fabricated entries and keeps the list current without a credential.

The Gregorian chant page (/canto-gregoriano) loads exsurge from public/vendor and soundfont-player from unpkg only in the browser; it renders GABC to SVG and schedules notes on the AudioContext clock, so nothing chant-related runs during SSR.

The Kyriale scores in public/kyriale are GregoBase GABC files (CC0) kept as downloaded; lib/gabc.ts converts Gregorio-only markup (<i>, <sp>, <clear>...) to what exsurge understands at render time, so pasted GregoBase code works the same way.
