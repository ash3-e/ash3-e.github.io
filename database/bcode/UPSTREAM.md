# BCODe Easter egg

Adapted from https://github.com/ash3-e/ash3-e.github.io/tree/main/site
at a332b2257766f853cd652fe883f536950c0ac7d9.

The parser modules, terminal icon, terminal CSS and syntax palette are copied from
that revision. The syntax runtime is the same highlight.js 11.9.0 referenced by
site/term/terminal.html (vendored from cdnjs with its BSD-3-Clause license).
The terminal keeps the real BCODe parser, guide, tabs, history,
parameter controls and live feed. Inventory replaces reader docking with a
movable iframe, bridges simulation events to its background, and changes glass
commands 1g/0g to background commands 1b/0b. Glass stays enabled in the terminal.
The lava renderer in src/components/easterEgg/lavalamp.js adds explicit cleanup, viewport resizing, namespaced storage
and the Balanced palette. It is loaded only after the Easter egg is discovered.
