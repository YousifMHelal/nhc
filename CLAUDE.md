<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->


## ⛔ MANDATORY — READ BEFORE ANY EDIT

Before creating or editing ANY file, you MUST open and read `nhc-design-spec.md`
in full. It is the single source of truth for this project. Re-read it at the
start of every session and before every screen you build.

Non-negotiable rules from that file:
- Use ONLY the color tokens defined there. Never hardcode a hex that isn't a token.
- Use ONLY the defined typography, spacing (4px multiples), radius, and shadow values.
- Build each screen to match its interaction spec in Section 6 — treat that list
  as acceptance criteria, not suggestions.
- RTL Arabic UI; English/Inter only for technical fields.
- All navigation is client-side, mock data only, no backend.

If a detail isn't specified in DESIGN-SYSTEM.md, match the nearest defined pattern —
do not invent new colors, sizes, or behaviors. When in doubt, stop and re-read it.
