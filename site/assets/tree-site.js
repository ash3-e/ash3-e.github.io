(() => {
  "use strict";

  const THEME_KEY = "bcode-docs-theme";
  const LAVA_ENABLED_KEY = "bcode-lavalamp-enabled";
  const GLASS_STORAGE_KEY = "bcode-glass-mode";
  const THEME_OPTIONS = [
    { id: "light", label: "Light", icon: "sun.svg" },
    { id: "balanced", label: "Balanced", icon: "half.svg" },
    { id: "dark", label: "Dark", icon: "moon.svg" }
  ];
  const DOC_PORTAL_META = {
    intro: {
      summary: "Narrative introduction to BCODe fundamentals, stream framing, and practical engineering tradeoffs.",
      subheaders: ["Architecture", "Atomic latching", "Example gallery"]
    },
    syntax: {
      summary: "Normative syntax reference for terminators, payload rules, parser states, and conformance vectors.",
      subheaders: ["Grammar", "State machine", "Conformance tests"]
    },
    cfg: {
      summary: "BCODe.cfg runner profile for environment binding, next-line substitution, response-coupled emission, and wait-token orchestration.",
      subheaders: ["Environment binding", "Line substitution", "Wait-token flow"]
    },
    interpretation: {
      summary: "Interpretation layer guidance for qualifiers, value classes, staleness, and typed access semantics.",
      subheaders: ["Qualifier model", "Reducer behavior", "Accessor semantics"]
    },
    "meta-v9": {
      summary: "Current BCODe.meta conventions for request/response behavior, packets, counters, and transport usage.",
      subheaders: ["Meta tags", "Packeting", "Sequence conventions"]
    },
    "meta-library-semantics": {
      summary: "Library-level semantics and API-oriented behavior for integrating BCODe.meta in tooling.",
      subheaders: ["Library flags", "Unit handling", "Consumer API"]
    },
    rest: {
      summary: "BCODe.rest conventions for resource-oriented request/response streams and operation sequencing.",
      subheaders: ["Resource model", "Verb mapping", "Stream operations"]
    },
    "best-practices": {
      summary: "Design and interoperability best practices for schema discipline, resilience, and deployment consistency.",
      subheaders: ["Schema discipline", "Interoperability", "Operational safety"]
    },
    "telemetry-guide": {
      summary: "Scalable telemetry/control patterns from simple feeds to complex multi-line packet workflows.",
      subheaders: ["Scaling patterns", "Control loops", "Production telemetry"]
    }
  };

  const DOC_PREVIEW_COPY = {
    intro: {
      overview: [
        "Intro frames BCODe as a stream-native documentation set rather than a collection of isolated format rules.",
        "It explains why the architecture begins with deterministic structure, why atomic line latching matters before semantic interpretation, and why the format is shaped around recovery on live byte streams instead of around bounded document parsing.",
        "The document also gives the reader a narrative bridge into the rest of the stack, connecting syntax, interpretation, meta conventions, and downstream operational guidance so the portal reads like one coherent system instead of separate reference pages.",
        "If a reader only opens one page first, this is the one that establishes the mental model used by every other node in the tree."
      ].join(" "),
      rows: {
        "Architecture": [
          "This section explains the core structural philosophy behind BCODe and why the format is intentionally organized around stream-safe primitives rather than nested document syntax.",
          "It walks through the role of ASCII columns, fixed parameter identity, deterministic separators, and the importance of being able to attach to a stream mid-flight without guessing where state begins or ends.",
          "The section also contrasts BCODe with document-centric encodings so the reader understands why framing, resynchronization, and bounded parser state are treated as first-order design goals.",
          "By the end of the architecture section, the reader should understand the system-level reason the rest of the specification looks the way it does."
        ].join(" "),
        "Atomic latching": [
          "This section covers the line-commit model that makes BCODe safe for live telemetry and control transport.",
          "It explains how fields accumulate incrementally, how parameter terminators assign staged values, and how the final command byte turns the entire line into a single committed update instead of a sequence of partial writes.",
          "The section is written from the parser's point of view so firmware, tooling, and protocol readers can see exactly why interrupted lines delay state rather than corrupt it.",
          "That framing is what connects syntax decisions to control safety, stream recovery, and predictable behavior under transport faults."
        ].join(" "),
        "Example gallery": [
          "The example gallery collects copy-pasteable BCODe lines and small working idioms.",
          "Instead of extending the narrative, it collects representative examples for telemetry, qualifiers, packets, payloads, and command flows so a reader can move quickly from theory into recognizable wire shapes.",
          "Each example is meant to stay small enough to scan while still preserving the structural cues that matter in real implementations.",
          "The gallery is ideal for finding a working pattern fast and then reading deeper only after the shape already makes sense."
        ].join(" ")
      }
    },
    syntax: {
      overview: [
        "Syntax is the normative wire-format reference for BCODe.",
        "It defines the streaming grammar itself: byte classes, latching rules, payload regions, comments, whitespace handling, numeric forms, exponent spelling, and the bounded parser states required to implement the format correctly.",
        "The document is intentionally narrow in scope so implementers can reason about what is legal on the wire without mixing in higher-layer meaning too early.",
        "Readers usually land here when they need exact parser behavior, token precedence, and conformance-level detail."
      ].join(" "),
      rows: {
        "Grammar": [
          "This section covers the structural rules that make a BCODe line recognizable to a parser before any semantic interpretation is applied.",
          "It defines how ASCII ranges divide responsibilities, how fields terminate, how payload modes take priority, and how numeric and qualifier forms coexist without requiring recursive parsing.",
          "This is the section that tells an implementer what counts as valid syntax, what bytes are structural, and where ambiguity is intentionally removed from the language.",
          "If the reader needs to build a lexer, parser, validator, or encoder, this row provides the formal shape of the protocol."
        ].join(" "),
        "State machine": [
          "This section translates the abstract grammar into a streaming parser model that can run on constrained systems and high-throughput tooling alike.",
          "It steps through normal token accumulation, payload entry and exit, comment handling, line latching, and reset or resynchronization behavior so parser state remains explicit at every byte.",
          "The emphasis is on deterministic transitions and bounded memory rather than on clever heuristics, because recoverability matters more than permissive guessing on live streams.",
          "The state machine is the practical companion to the grammar section for anyone implementing the protocol as real code."
        ].join(" "),
        "Conformance tests": [
          "This section turns the syntax rules into executable expectations.",
          "They define canonical valid and invalid cases, edge conditions around delimiters and payloads, and the parser outcomes that should hold across independent implementations.",
          "The section is especially useful when a team needs to harden a parser, compare language bindings, or verify that optimizations have not changed the accepted wire behavior.",
          "It effectively answers the question of whether an implementation merely parses common lines or actually behaves like the specification under pressure."
        ].join(" ")
      }
    },
    interpretation: {
      overview: [
        "Interpretation sits above syntax and defines what parsed values mean once a line has already been accepted structurally.",
        "It covers qualifier classes, null and infinity representations, staleness, bounds, reducer-oriented summaries, and typed access semantics so downstream code can reason about values without flattening away uncertainty.",
        "The document is where BCODe becomes operationally honest: freshness, exactness, and diagnostic state remain attached to values instead of being split into ad hoc side channels.",
        "Readers typically move here after they understand the wire format and need stable semantics for applications, libraries, and analytics."
      ].join(" "),
      rows: {
        "Qualifier model": [
          "This section explains how BCODe expresses more than just hard numeric values while keeping that meaning attached to the same field.",
          "It covers unknown, null, infinity, NaN-like diagnostics, bounds, epsilon-style control intents, and stale-state modifiers so the wire format can describe real telemetry conditions without inventing parallel status parameters.",
          "The section is important because it teaches readers not to collapse everything into a float too early; doing so would erase the operational meaning the format is designed to preserve.",
          "The qualifier model is the semantic heart of why BCODe fields stay self-contained and machine-truthful."
        ].join(" "),
        "Reducer behavior": [
          "This section describes how streams of parsed and interpreted values can be summarized, filtered, and aggregated without losing the distinction between missing, stale, bounded, exact, or diagnostic states.",
          "It frames reducers as structured stream consumers rather than casual averages, which matters when telemetry pipelines must preserve safety and data-quality meaning across long-running sessions.",
          "The section also clarifies how presence masks, quality summaries, and value-class combinations can be collapsed into stable downstream signals while still remaining auditable.",
          "Reducer behavior matters most when the goal is to turn raw line traffic into dependable state views or analytics outputs."
        ].join(" "),
        "Accessor semantics": [
          "This section defines how applications and libraries should expose interpreted BCODe values once parsing and qualification are complete.",
          "It covers typed access, exactness checks, range or bound inspection, stale-state handling, and the difference between a usable value and a merely present token so consumers do not silently misread the stream.",
          "The emphasis is on giving callers explicit, intention-revealing access patterns instead of forcing them to reverse-engineer meaning from flattened primitives.",
          "Accessor semantics matter most for SDKs, data models, and integration layers that need stable interfaces over the protocol."
        ].join(" ")
      }
    },
    "meta-v9": {
      overview: [
        "BCODe.meta defines the shared control-plane conventions layered on top of the base syntax and interpretation model.",
        "It standardizes request and response tags, packet grouping, sequencing, unsolicited traffic markers, and transport-oriented line patterns so independent implementations can exchange more than isolated values.",
        "The document is where the core protocol becomes a workable command-and-response ecosystem for live systems, tooling, and higher-level transports.",
        "Readers usually land here when they need interoperable behavior across sessions, not just valid single-line syntax."
      ].join(" "),
      rows: {
        "Meta tags": [
          "This section covers the standard parameter markers that identify affirmative responses, negative responses, unsolicited statements, and related control-plane intent on the wire.",
          "It explains how these tags stay inside normal BCODe structure instead of creating a separate framing channel, which keeps request and response traffic flat, deterministic, and easy to inspect in logs.",
          "The section also clarifies how tags interact with commands, payload fields, and downstream routing so tooling can classify lines without inventing custom heuristics.",
          "Meta tags are the entry point for anyone building real exchanges rather than one-way telemetry feeds."
        ].join(" "),
        "Packeting": [
          "This section defines how multiple BCODe lines are grouped into bounded or open-ended atomic sets when a single logical result cannot fit into one statement.",
          "It explains indexed packet conventions, closing rules, and delivery expectations so receivers know when a group is complete and when partial traffic must remain staged.",
          "The emphasis is on preserving stream-native behavior while still enabling multi-line transfer patterns for tables, dumps, and larger result sets.",
          "Packeting matters whenever a system needs batching without abandoning the atomic guarantees of the base format."
        ].join(" "),
        "Sequence conventions": [
          "This section describes how line and command ordering are represented so senders and receivers can detect continuity, resets, retries, and delayed responses.",
          "It explains sequence counters, discontinuity signaling, and ordinal-style progression in a way that makes dropout detection and multi-stage workflows explicit instead of inferred.",
          "The section is especially useful for lossy links, asynchronous command pipelines, and diagnostics tooling that needs to reason about what was missed versus what never happened.",
          "Sequence conventions matter when the stream must preserve conversation state across time, not just individual payload values."
        ].join(" ")
      }
    },
    "meta-library-semantics": {
      overview: [
        "Meta Library Semantics takes the shared BCODe.meta conventions and translates them into integration-facing behavior for software consumers.",
        "It explains how library APIs should expose flags, units, request tracking, and consumer-visible abstractions so application code can rely on stable semantics instead of raw line mechanics.",
        "The document is less about inventing new wire rules and more about ensuring that tools and SDKs present the existing conventions consistently.",
        "Readers use this node when they are shaping a usable API surface around the protocol rather than implementing the wire directly."
      ].join(" "),
      rows: {
        "Library flags": [
          "This section defines the derived state and control indicators that libraries surface once BCODe.meta traffic has been parsed and classified.",
          "It explains which conditions deserve explicit booleans or state flags, how acknowledgements and unsolicited traffic should be represented, and where libraries should preserve nuance rather than collapsing everything into success or failure.",
          "The section helps bridge protocol truth into application ergonomics without hiding the behavior that operators and integrators still need to see.",
          "Library flags are most relevant when turning raw transport events into stable, debuggable SDK state."
        ].join(" "),
        "Unit handling": [
          "This section describes how libraries should retain, normalize, or present measurement units and related metadata when values pass through interpreted BCODe pipelines.",
          "It focuses on avoiding silent conversion errors, preserving context for engineering data, and making sure units remain attached closely enough that higher layers do not misread otherwise valid numbers.",
          "The section is important because protocol correctness alone is not enough if consuming software strips away the unit assumptions that make the values meaningful.",
          "Unit handling is essential when designing APIs that need to remain safe across mixed telemetry domains."
        ].join(" "),
        "Consumer API": [
          "This section covers the library-level surface exposed to applications that read, write, or react to BCODe.meta traffic.",
          "It discusses object shapes, event boundaries, response tracking, packet delivery semantics, and typed access patterns so consumer code can stay clear and intention-revealing without reimplementing protocol logic itself.",
          "The section also frames what should remain explicit in the API, such as stale or diagnostic state, even when convenience wrappers exist.",
          "The consumer API section is the most direct guide for anyone turning the protocol into a developer-facing interface."
        ].join(" ")
      }
    },
    rest: {
      overview: [
        "BCODe.rest applies the stream-native BCODe model to resource-oriented request and response workflows.",
        "It shows how command numbers, resource indices, verbs, ordinals, and feed patterns can form a practical operational interface without flattening everything into document-style RPC payloads.",
        "The document keeps the wire compact and inspectable while still supporting multi-stage operations, allocation, reads, writes, and ongoing feeds.",
        "Readers come here when they need a resource model that still behaves like BCODe, not like a JSON API disguised as one."
      ].join(" "),
      rows: {
        "Resource model": [
          "This section defines how BCODe.rest identifies targets, instances, and conversational scope on the wire.",
          "It explains how resource identifiers combine with index-like parameters and command sequencing so a receiver can distinguish what object is being addressed, which instance is meant, and how follow-on lines relate to the same operation.",
          "The section keeps the model intentionally flat and stream-oriented, which makes it easier to debug and easier to transport over constrained links than document-heavy alternatives.",
          "The resource model forms the conceptual base for every other REST-oriented convention in the specification."
        ].join(" "),
        "Verb mapping": [
          "This section covers how read, write, control, feed, allocate, and related operational intents are encoded in BCODe.rest without abandoning the protocol's existing command structure.",
          "It shows how familiar resource actions can be represented using stable command classes and supporting parameters so the wire remains compact, typed, and grep-friendly.",
          "The section is useful because it keeps the action vocabulary consistent across implementations instead of letting each project invent its own quasi-REST dialect.",
          "Verb mapping is essential when defining the command semantics that give the resource model practical behavior."
        ].join(" "),
        "Stream operations": [
          "This section explains how resource-oriented commands behave over time once requests, acknowledgements, delayed results, packeted responses, and continuous feeds begin to interact.",
          "It focuses on session flow rather than isolated lines, covering how a command opens into a longer exchange and how that exchange still stays deterministic on a live transport.",
          "The section is especially helpful for readers designing systems that need both one-shot control and continuous telemetry under the same protocol envelope.",
          "Stream operations connect the resource model to real operational lifecycles."
        ].join(" ")
      }
    },
    "best-practices": {
      overview: [
        "Best Practices translates the core BCODe documents into engineering guidance for real deployments.",
        "It focuses on schema discipline, interoperability, resilience, observability, and operational safety so teams do not build nominally valid streams that are brittle in practice.",
        "The document is where implementation choices are evaluated against maintainability and system behavior instead of against syntax alone.",
        "Readers usually use this page when they are moving from proof-of-concept protocol use into something that other teams and tools must live with."
      ].join(" "),
      rows: {
        "Schema discipline": [
          "This section explains how to keep parameter maps stable, command meanings explicit, and field usage predictable across versions and products.",
          "It argues against ad hoc key sprawl, hidden inter-parameter dependencies, and convenience shortcuts that make streams harder to reason about over time.",
          "The section helps designers choose wire identities and document them in a way that preserves interoperability and keeps downstream tooling simple.",
          "Schema discipline matters most when a protocol is about to become shared infrastructure instead of a local experiment."
        ].join(" "),
        "Interoperability": [
          "This section covers the conventions that let independent BCODe implementations exchange data reliably without depending on undocumented assumptions.",
          "It highlights versioning discipline, reserved identity usage, shared higher-level profiles, explicit parameter maps, and consistent error or quality signaling so different tools read the same stream the same way.",
          "The section is practical rather than abstract: its goal is to prevent locally reasonable design decisions from becoming cross-team incompatibilities later.",
          "Interoperability guidance applies when a stream needs to survive beyond the codebase that first created it."
        ].join(" "),
        "Operational safety": [
          "This section focuses on the behaviors that matter when BCODe is carrying live telemetry or control traffic in real systems.",
          "It discusses cautious command design, atomicity assumptions, fallback behavior under stale or diagnostic states, and the importance of preserving uncertainty rather than coercing values into false certainty.",
          "The section also reinforces logging and observability patterns that help operators see what the system believed and why.",
          "Operational safety is the best-practices counterpart to the protocol's safety-oriented structural design."
        ].join(" ")
      }
    },
    "telemetry-guide": {
      overview: [
        "Telemetry Guide shows how BCODe scales from a single measurement line into richer control-and-observation systems.",
        "It uses progressively more complex patterns to demonstrate how simple feeds, bounded commands, packeted transfers, stale-state signaling, and production workflows can all live within the same structural model.",
        "The document is intentionally practical, giving readers a sense of system shape rather than just isolated rule fragments.",
        "It is the best entry point for understanding how the protocol behaves once real operational complexity starts to accumulate."
      ].join(" "),
      rows: {
        "Scaling patterns": [
          "This section walks through the progression from minimal line-based telemetry to richer multi-field, multi-line, and multi-conversation systems.",
          "It shows which BCODe features tend to appear as complexity grows, how to introduce them without losing clarity, and how to keep a stream legible as more state and control surfaces are added.",
          "The emphasis is on evolutionary use of the protocol rather than on premature abstraction, so readers can map the format cleanly onto systems at different maturity levels.",
          "Scaling patterns provide the practical roadmap from small examples to larger deployments."
        ].join(" "),
        "Control loops": [
          "This section focuses on patterns where measurement, intent, acknowledgement, and follow-up state updates all interact over time.",
          "It explains how bounds, stale-state modifiers, command acknowledgements, and ongoing feedback can be combined so a stream represents not just values but the behavior of a control process.",
          "The section is especially useful for instrumentation, automation, and embedded control readers who need to express intent honestly while still reading the system's evolving state.",
          "Control loops turn protocol mechanics into operational control narratives."
        ].join(" "),
        "Production telemetry": [
          "This section covers the habits that keep BCODe useful once streams become long-lived, high-volume, and operationally important.",
          "It discusses consistency of parameter maps, dropout visibility, data-quality signaling, packet sizing, logging friendliness, and the need to design streams for operators as much as for code.",
          "The section frames telemetry as an engineering product with lifecycle and observability requirements, not just as bytes moving across a socket.",
          "Production telemetry answers the question of how to make a BCODe stream dependable in the field rather than merely valid in a test harness."
        ].join(" ")
      }
    }
  };

  const DOC_PREVIEW_EXTENSIONS = {
    intro: {
      overview: [
        "It gives enough context that a new reader can understand why later pages separate structural legality from semantic meaning and why transport behavior is treated as part of the format's identity.",
        "The page also sets expectations about how BCODe should feel in practice: compact on the wire, explicit about uncertainty, and readable both by machines and by engineers inspecting live traffic.",
        "It gives enough context that a new reader can orient themselves within the entire architecture before committing to any specialized branch of the specification."
      ].join(" "),
      rows: {
        "Architecture": [
          "It also explains why the architecture privileges visibility and deterministic recovery over cosmetic familiarity with more common nested formats.",
          "A reader coming here should leave with a structural map of the whole protocol family, not just with a list of syntax rules.",
          "The section serves as the conceptual launch point for understanding how every later document fits into a single coherent design."
        ].join(" "),
        "Atomic latching": [
          "It makes clear that latching is not a minor implementation detail but the mechanism that turns an incoming byte stream into reliable state transitions.",
          "The narrative also ties that behavior to fault tolerance, because the format depends on incomplete lines remaining non-committal until the terminator makes the update whole.",
          "Understanding latching is essential to seeing why BCODe can stay compact without becoming unsafe."
        ].join(" "),
        "Example gallery": [
          "It is intentionally more pattern-driven than explanatory, so the reader can compare several wire forms quickly and decide which deeper section to open next.",
          "The examples are chosen to reveal structure at a glance, not just to pad out the page with samples that happen to compile.",
          "The gallery provides a practical shortcut from conceptual understanding to usable protocol shapes."
        ].join(" ")
      }
    },
    syntax: {
      overview: [
        "It is written as the place where ambiguity ends, so readers can distinguish parser obligations from interpretation-layer conventions without mixing the two.",
        "That makes it especially valuable when testing edge cases, debugging wire captures, or reviewing an implementation for strict compliance rather than approximate behavior.",
        "The document is precise, procedural, and implementation-facing from top to bottom, serving as the definitive structural contract for the protocol."
      ].join(" "),
      rows: {
        "Grammar": [
          "It gives the reader a concrete language for discussing what the parser is allowed to recognize and what should be rejected before semantics are ever considered.",
          "The discussion is careful about precedence so that bounded payloads and normal fields do not blur into each other under partial reads or malformed input.",
          "The grammar section offers the most direct explanation of the protocol's legal structural surface."
        ].join(" "),
        "State machine": [
          "It also serves as the bridge between specification prose and implementation strategy, because every transition has consequences for buffering, recovery, and commit timing.",
          "The narrative is useful in code reviews because it exposes where a parser might accidentally invent hidden states or permit unsafe shortcuts.",
          "For most implementers, this is the practical companion that turns the formal grammar into executable behavior."
        ].join(" "),
        "Conformance tests": [
          "It gives teams a shared reference for arguing about behavior with examples instead of with vague interpretation of prose.",
          "The section also helps maintain long-term stability, because once tests are treated as part of the contract, regressions become much easier to detect early.",
          "Conformance testing ensures that the page delivers evidence and verification, not just specification language."
        ].join(" ")
      }
    },
    interpretation: {
      overview: [
        "It is the page that keeps BCODe from degenerating into plain text numbers by defining how confidence, bounds, diagnostics, and freshness survive beyond parsing.",
        "That is why application code, libraries, and analysis tools all depend on it even when they never care about parser internals directly.",
        "The interpretation layer explains how the format preserves engineering meaning after the wire has already been recognized and parsed."
      ].join(" "),
      rows: {
        "Qualifier model": [
          "It shows that qualifiers are part of the value itself, not decorative metadata tacked on later for convenience.",
          "That perspective matters because downstream systems often fail when they flatten rich states into a single number and lose the reason the number was questionable.",
          "The qualifier model explains how BCODe keeps ambiguity explicit instead of implicit."
        ].join(" "),
        "Reducer behavior": [
          "It also answers how to summarize a stream responsibly when the stream contains more than clean exact readings.",
          "The narrative stays grounded in operational use, showing why a reducer that ignores stale or diagnostic state can become misleading even if it is computationally simple.",
          "Reducer behavior is where stream interpretation becomes a disciplined analytics problem instead of a formatting exercise."
        ].join(" "),
        "Accessor semantics": [
          "It makes clear that accessors are part of the protocol experience because they determine what truths survive into application logic.",
          "The section is especially helpful for SDK authors who need to decide whether to expose convenience or precision first, and how to do both without hiding important state.",
          "Accessor semantics represent the handoff from protocol-level meaning to developer-facing ergonomics."
        ].join(" ")
      }
    },
    "meta-v9": {
      overview: [
        "It is where individual lines start to behave like a conversation, with explicit markers for acknowledgement, sequencing, packet grouping, and unsolicited reporting.",
        "That makes it central to interoperability, because shared control conventions matter as much as shared field spelling once systems begin exchanging real commands.",
        "The page serves as the operational backbone of the core BCODe document stack, formalizing how isolated lines become coordinated exchanges."
      ].join(" "),
      rows: {
        "Meta tags": [
          "It clarifies how these tags let receivers recognize intent without leaving the normal field model that already makes the protocol easy to parse and inspect.",
          "That consistency is what allows acknowledgements and unsolicited messages to remain visible in logs instead of disappearing into transport-side assumptions.",
          "Meta tags provide the cleanest mechanism for expressing conversation-level meaning on the same flat wire."
        ].join(" "),
        "Packeting": [
          "It shows how the protocol grows to handle larger logical transfers while still keeping the boundaries of commitment explicit.",
          "The section matters because packet behavior affects buffering, delivery timing, and what a receiver is allowed to treat as complete state.",
          "Packeting marks the point where single-line atomicity expands into multi-line orchestration."
        ].join(" "),
        "Sequence conventions": [
          "It gives operators and tooling a disciplined way to reason about continuity, retries, and missing traffic without relying on guesswork.",
          "That is especially important when the same link may carry both immediate acknowledgements and delayed follow-on results.",
          "Sequence conventions cover time-order integrity, not just field naming."
        ].join(" ")
      }
    },
    "meta-library-semantics": {
      overview: [
        "It is aimed at software layers that need to expose the protocol clearly to developers without erasing the subtleties that matter on live systems.",
        "The page therefore focuses on how protocol truths should be represented in APIs, flags, and consumer-visible abstractions rather than on inventing new transport rules.",
        "The page bridges the gap between wire conventions and usable library design, showing how protocol truth survives into developer-facing software."
      ].join(" "),
      rows: {
        "Library flags": [
          "It helps a library designer decide which states deserve first-class visibility and which should remain derived details rather than hidden side effects.",
          "That discipline keeps debugging practical, because applications can inspect why a state exists instead of only seeing a simplified end result.",
          "Library flags determine how BCODe.meta becomes observable at the API boundary."
        ].join(" "),
        "Unit handling": [
          "It reminds the reader that semantic correctness can still fail after parsing if units are separated from the values that gave them meaning.",
          "The section is useful wherever libraries may normalize or transform values, because it forces those transformations to stay explicit and reviewable.",
          "Unit handling sits at the intersection of protocol semantics and domain safety."
        ].join(" "),
        "Consumer API": [
          "It frames API design as part of interoperability, because a poorly shaped client surface can hide the protocol's guarantees or reintroduce ambiguity above the wire.",
          "The section therefore emphasizes explicit state, predictable events, and interfaces that preserve diagnostic and freshness information instead of smoothing it away.",
          "A well-designed consumer API reflects what a high-quality BCODe integration layer should feel like to use."
        ].join(" ")
      }
    },
    rest: {
      overview: [
        "It demonstrates that resource-oriented operations can remain stream-native and inspectable instead of becoming bulky request documents wrapped around the same transport.",
        "The page is valuable when a system needs a stable operational vocabulary over long-lived links, especially where commands, reads, and feeds must coexist cleanly.",
        "The document positions itself as BCODe's resource workflow layer rather than as a generic web-style REST imitation."
      ].join(" "),
      rows: {
        "Resource model": [
          "It explains how resources remain addressable without sacrificing the terse, line-oriented character of the protocol.",
          "That matters because once multiple instances and command streams coexist, clarity of identity becomes as important as correctness of syntax.",
          "The resource model provides the conceptual foundation that makes the rest of the REST-oriented page readable."
        ].join(" "),
        "Verb mapping": [
          "It shows how operational intent can be kept recognizable and consistent while still honoring the compact command structure that BCODe depends on.",
          "The section is especially useful when designing interoperable command vocabularies that should remain obvious both in code and in raw logs.",
          "Verb mapping acts as the semantic translation layer between resource identity and action."
        ].join(" "),
        "Stream operations": [
          "It expands the view from single commands to evolving exchanges, where ordering, feedback, and ongoing feeds all become part of the interaction contract.",
          "That framing is important because resource systems rarely stop at one-shot reads once they reach production complexity.",
          "Stream operations show how BCODe.rest behaves as a living stream rather than as isolated request packets."
        ].join(" ")
      }
    },
    "best-practices": {
      overview: [
        "It exists to make sure teams build streams that remain stable under versioning, readable under pressure, and dependable across organizational boundaries.",
        "The document is intentionally opinionated where experience shows that locally convenient decisions often become long-term interoperability or safety problems.",
        "The page is about disciplined design choices that protect long-term deployment health, not just style preferences."
      ].join(" "),
      rows: {
        "Schema discipline": [
          "It emphasizes that a protocol grows healthier when identities and meanings are deliberate early, rather than retrofitted after multiple integrations already depend on them.",
          "The section is especially helpful when deciding how much freedom to leave to producers before that freedom turns into ambiguity for consumers.",
          "Schema discipline reflects BCODe's bias toward stable, documented structure over ad hoc convenience."
        ].join(" "),
        "Interoperability": [
          "It focuses on the shared habits that keep independent implementations aligned even when they are built by different teams, in different languages, on different schedules.",
          "The guidance is practical: document the map, respect shared conventions, and avoid clever shortcuts that only your own stack can decode reliably.",
          "Interoperability is concerned with cooperation across implementations, not just correctness in isolation."
        ].join(" "),
        "Operational safety": [
          "It keeps the reader focused on what happens when protocol choices meet live equipment, automation, or long-running telemetry systems.",
          "The section values explicit uncertainty, cautious control semantics, and visibility into degraded conditions over convenience that could hide risk.",
          "Operational safety provides guidance for trustworthy deployment behavior in real-world conditions."
        ].join(" ")
      }
    },
    "telemetry-guide": {
      overview: [
        "It is designed to feel like a progression through increasing system complexity, showing how the same protocol ideas scale without forcing a redesign at each stage.",
        "That makes it especially useful for readers who already understand the pieces of BCODe and now want to see how those pieces compose into realistic workflows.",
        "The guide reads like a practical map from simple line traffic to production-grade telemetry systems."
      ].join(" "),
      rows: {
        "Scaling patterns": [
          "It helps the reader recognize which protocol features naturally appear as a system grows and which additions usually indicate unnecessary complexity rather than healthy evolution.",
          "The section is valuable because it turns the protocol from a static format into a scalable design vocabulary for system builders.",
          "Scaling patterns illustrate how BCODe expands without losing structural clarity."
        ].join(" "),
        "Control loops": [
          "It explains how repeated measurement and intent traffic can coexist without blurring command state, observed state, and degraded or delayed feedback.",
          "The section is particularly useful for readers designing automation flows that need both honesty and responsiveness from the wire representation.",
          "Control loops turn the protocol's semantics into an operational story about closed-loop behavior."
        ].join(" "),
        "Production telemetry": [
          "It shows what changes once the stream becomes something operators depend on for continuity, diagnostics, and long-term trust.",
          "The guidance pushes toward stable conventions, visible quality signaling, and wire patterns that remain legible long after the original implementer is gone.",
          "Production telemetry covers the field-oriented perspective on making streams durable in real deployment conditions."
        ].join(" ")
      }
    }
  };

  const DOC_PREVIEW_POINTS = {
    intro: {
      overview: [
        "Deterministic structure anchors the introduction.",
        "Stream framing defines the design problem.",
        "Atomic lines protect committed state.",
        "Recovery behavior stays visible.",
        "Parser simplicity shapes the format.",
        "Human readability remains deliberate.",
        "Telemetry reality drives the examples.",
        "Later documents inherit these assumptions.",
        "Meaning follows stable structure.",
        "The page establishes the mental model."
      ],
      rows: {
        "Architecture": [
          "ASCII columns carry structural weight.",
          "Parameter identity stays fixed.",
          "Streams must rejoin cleanly.",
          "Nested documents are not assumed.",
          "Framing stays on the wire.",
          "Parser depth remains bounded.",
          "Transport faults shape the design.",
          "Structure is chosen before semantics.",
          "The stack grows from these rules.",
          "The architecture stays intentionally flat."
        ],
        "Atomic latching": [
          "Incomplete lines do not commit.",
          "The command byte closes the update.",
          "Fields stage before state changes.",
          "Partial transport failures remain safe.",
          "Commit timing stays deterministic.",
          "Parser state remains inspectable.",
          "Control safety depends on latching.",
          "Stream corruption becomes delay.",
          "Atomicity is a protocol guarantee.",
          "Line boundaries carry operational meaning."
        ],
        "Example gallery": [
          "Copyable wire patterns stay close at hand.",
          "Examples reveal structure at a glance.",
          "Small lines carry large ideas.",
          "Common idioms stay easy to compare.",
          "Working shapes appear before deep theory.",
          "Patterns remain practical and inspectable.",
          "The gallery accelerates first use.",
          "Examples point back into the docs.",
          "Visual recognition supports faster jumps.",
          "Protocol form becomes immediately concrete."
        ]
      }
    },
    syntax: {
      overview: [
        "Wire legality is defined precisely.",
        "Parser obligations stay separate from semantics.",
        "Token precedence remains explicit.",
        "Payload modes keep bounded scope.",
        "Resynchronization behavior is specified.",
        "Conformance matters more than convenience.",
        "Implementers get exact structural rules.",
        "Edge cases remain reviewable.",
        "The page resolves parser ambiguity.",
        "Formal grammar supports reliable code."
      ],
      rows: {
        "Grammar": [
          "Structural tokens stay unambiguous.",
          "Terminator roles remain fixed.",
          "Payload boundaries take priority.",
          "Numeric forms follow stable rules.",
          "Qualifiers coexist with field structure.",
          "Recognition order stays deterministic.",
          "Literal wire spelling remains important.",
          "Malformed structure is rejectable.",
          "Syntax stays independent of semantics.",
          "Grammar defines the legal surface."
        ],
        "State machine": [
          "Byte handling proceeds by explicit states.",
          "Transitions remain bounded and readable.",
          "Payload entry and exit stay controlled.",
          "Latch timing is state driven.",
          "Comments do not blur parser flow.",
          "Reset behavior remains predictable.",
          "Recovery paths are part of implementation.",
          "Streaming code maps directly to the model.",
          "Parser shortcuts become easier to spot.",
          "Executable behavior follows the state chart."
        ],
        "Conformance tests": [
          "Examples become executable expectations.",
          "Valid and invalid lines both matter.",
          "Regression checks guard parser behavior.",
          "Independent implementations stay comparable.",
          "Edge conditions remain testable.",
          "Specification prose gains concrete evidence.",
          "Behavior disputes move into fixtures.",
          "Compliance becomes reviewable.",
          "Optimizations cannot silently drift.",
          "The test suite hardens interoperability."
        ]
      }
    },
    interpretation: {
      overview: [
        "Parsed values keep their engineering meaning.",
        "Freshness remains attached to the value.",
        "Bounds are preserved as intent.",
        "Diagnostics survive past parsing.",
        "Typed access needs semantic discipline.",
        "Reducers cannot ignore uncertainty.",
        "Applications rely on these meanings.",
        "Wire truth survives into software.",
        "Interpretation prevents false precision.",
        "Operational honesty stays intact."
      ],
      rows: {
        "Qualifier model": [
          "Unknown states remain explicit.",
          "Null values keep clear meaning.",
          "Infinity is represented intentionally.",
          "Bounds describe constraint, not error.",
          "Staleness modifies otherwise valid values.",
          "Diagnostics stay co-located with fields.",
          "Quality does not become guesswork.",
          "Value classes remain machine-readable.",
          "Semantics stay attached to the wire.",
          "Numbers alone are not enough."
        ],
        "Reducer behavior": [
          "Summaries preserve data quality.",
          "Missing values stay distinguishable.",
          "Stale state affects aggregation.",
          "Diagnostic lines still influence outcomes.",
          "Reducers stay accountable to semantics.",
          "Presence masks support efficient summaries.",
          "Stream truth survives compression.",
          "Analytics remain operationally honest.",
          "Quality loss is not hidden.",
          "Aggregation respects interpretation."
        ],
        "Accessor semantics": [
          "Consumers need explicit access patterns.",
          "Typed reads should expose uncertainty.",
          "Fresh values differ from present values.",
          "Bounds deserve direct inspection.",
          "Diagnostics belong in the interface.",
          "Convenience must not erase semantics.",
          "SDKs inherit protocol obligations.",
          "Callers should see exactness clearly.",
          "Software truth follows wire truth.",
          "Interfaces remain intention-revealing."
        ]
      }
    },
    "meta-v9": {
      overview: [
        "Single lines become conversations here.",
        "Acknowledgement patterns stay standard.",
        "Packet grouping remains explicit.",
        "Sequence state becomes visible.",
        "Unsolicited traffic gains shared meaning.",
        "Interoperability depends on these conventions.",
        "Control flow stays inspectable.",
        "Operational exchange lives on the wire.",
        "Conversation state avoids hidden channels.",
        "The stack becomes truly interactive."
      ],
      rows: {
        "Meta tags": [
          "Responses stay visible inside the protocol.",
          "Acks do not need side channels.",
          "Negative replies remain standardized.",
          "Unsolicited traffic is marked clearly.",
          "Command flow stays grep-friendly.",
          "Transport logs retain intent.",
          "Classification remains easy for tooling.",
          "Control semantics stay flat.",
          "Tags work within normal field rules.",
          "Conversation markers stay deterministic."
        ],
        "Packeting": [
          "Multi-line groups stay bounded.",
          "Receivers know when a set closes.",
          "Open-ended transfers remain traceable.",
          "Packet state does not break latching.",
          "Buffered results stay intentional.",
          "Larger responses remain stream-native.",
          "Atomic groups still feel inspectable.",
          "Incomplete packet sets stay obvious.",
          "Delivery timing remains meaningful.",
          "Batch behavior keeps protocol discipline."
        ],
        "Sequence conventions": [
          "Ordering stays visible on the wire.",
          "Dropped traffic becomes diagnosable.",
          "Retries do not stay mysterious.",
          "Ordinal results remain trackable.",
          "Discontinuities are intentionally signaled.",
          "Asynchronous workflows stay understandable.",
          "Conversation history gains structure.",
          "Timing problems become detectable.",
          "Tooling can reason about continuity.",
          "Sequence state supports real operations."
        ]
      }
    },
    "meta-library-semantics": {
      overview: [
        "Wire conventions become API behavior.",
        "Libraries should preserve protocol truth.",
        "Flags deserve careful design.",
        "Units must not drift away.",
        "Consumers need explicit semantics.",
        "Convenience should remain honest.",
        "Abstractions stay debuggable.",
        "Integration code inherits protocol nuance.",
        "APIs should reveal state clearly.",
        "The page bridges wire and software."
      ],
      rows: {
        "Library flags": [
          "Derived state should stay legible.",
          "Acknowledgements need first-class visibility.",
          "Failure modes should not collapse early.",
          "Flags must support debugging.",
          "State should match protocol intent.",
          "Libraries need stable surfaced signals.",
          "Consumers should see why states changed.",
          "Operational truth beats cosmetic simplicity.",
          "Flag design affects trust.",
          "APIs carry control-plane meaning."
        ],
        "Unit handling": [
          "Measurements keep their physical context.",
          "Conversions should stay explicit.",
          "Silent normalization can mislead software.",
          "Domain meaning depends on units.",
          "APIs should not orphan scale information.",
          "Transport values remain interpretable.",
          "Engineering data needs disciplined handling.",
          "Mixed systems require visible unit policy.",
          "Correct numbers still need context.",
          "Unit truth belongs near the value."
        ],
        "Consumer API": [
          "Library surfaces shape protocol understanding.",
          "Events need predictable boundaries.",
          "Packet delivery should feel explicit.",
          "Responses deserve traceable lifecycles.",
          "Typed access should stay honest.",
          "Application code should not reparse semantics.",
          "SDK ergonomics must preserve nuance.",
          "Interfaces should reveal degraded states.",
          "Developers need stable integration patterns.",
          "Good APIs keep protocol meaning intact."
        ]
      }
    },
    rest: {
      overview: [
        "Resources stay stream-native here.",
        "Operations remain compact on the wire.",
        "Commands keep visible intent.",
        "Feeds and replies coexist cleanly.",
        "Instances remain addressable.",
        "Multi-stage workflows stay inspectable.",
        "Resource exchange avoids document bloat.",
        "Operational lifecycles remain explicit.",
        "The model supports long-lived links.",
        "Resource semantics still feel like BCODe."
      ],
      rows: {
        "Resource model": [
          "Targets stay addressable without hierarchy.",
          "Instance identity remains explicit.",
          "Commands and resources stay linked.",
          "Flat structure still carries scope.",
          "Receivers can track addressed objects.",
          "Wire identity stays compact.",
          "Resource state remains log-friendly.",
          "Operational context stays visible.",
          "Instances do not require document wrappers.",
          "The model remains deterministic."
        ],
        "Verb mapping": [
          "Actions keep recognizable intent.",
          "Read and write semantics stay distinct.",
          "Control verbs remain interoperable.",
          "Feed behavior gets consistent expression.",
          "Command letters keep operational meaning.",
          "Wire actions stay compact.",
          "Shared vocabularies reduce drift.",
          "Logs still show what happened.",
          "Resources and actions align cleanly.",
          "Intent becomes easy to audit."
        ],
        "Stream operations": [
          "Exchanges unfold over time.",
          "Replies can arrive in stages.",
          "Feeds remain part of one model.",
          "Operational sessions stay explicit.",
          "One-shot commands are not the limit.",
          "Timing becomes part of design.",
          "Request lifecycles stay inspectable.",
          "Long-running flows keep structure.",
          "Resource traffic remains deterministic.",
          "Stream behavior supports real workloads."
        ]
      }
    },
    "best-practices": {
      overview: [
        "Operational discipline matters here.",
        "Stable schemas outlive prototypes.",
        "Interoperability starts with deliberate choices.",
        "Safety depends on explicit meaning.",
        "Logs should stay understandable.",
        "Teams need shared conventions.",
        "Convenient shortcuts can age badly.",
        "Protocol quality includes maintainability.",
        "Deployments reward disciplined design.",
        "This page guards long-term reliability."
      ],
      rows: {
        "Schema discipline": [
          "Field meaning should stay stable.",
          "Parameter maps deserve documentation.",
          "Ad hoc growth creates ambiguity.",
          "Versioning needs deliberate structure.",
          "Command context should stay reviewable.",
          "Schemas shape every downstream tool.",
          "Meaning cannot depend on guesswork.",
          "Design discipline lowers integration risk.",
          "Shared maps preserve clarity.",
          "Stable structure supports longevity."
        ],
        "Interoperability": [
          "Independent stacks need shared habits.",
          "Reserved identities should stay respected.",
          "Profiles reduce implementation drift.",
          "Conventions must be written down.",
          "Different teams still need one protocol.",
          "Local shortcuts break shared meaning.",
          "Cross-language behavior should stay aligned.",
          "Logs should decode the same way.",
          "Readers benefit from consistent patterns.",
          "Interoperability is an active design choice."
        ],
        "Operational safety": [
          "Control traffic should stay cautious.",
          "Uncertainty must not be hidden.",
          "Fallback behavior needs clarity.",
          "Degraded states should remain visible.",
          "Atomic assumptions affect real equipment.",
          "Observability supports safer response.",
          "Convenience should not outrank trust.",
          "Operators need readable truth.",
          "Protocol choices have physical consequences.",
          "Safety lives in everyday wire design."
        ]
      }
    },
    "telemetry-guide": {
      overview: [
        "Complexity grows in stages here.",
        "Simple feeds lead into richer systems.",
        "Control and observation stay compatible.",
        "Packeted flows still feel coherent.",
        "Operators need visible quality signals.",
        "Scaling should not erase clarity.",
        "Patterns remain connected to practice.",
        "Production behavior stays grounded.",
        "The guide reads like a progression.",
        "System growth remains structurally disciplined."
      ],
      rows: {
        "Scaling patterns": [
          "Small lines can scale gracefully.",
          "Complexity should arrive intentionally.",
          "New features need structural payoff.",
          "Readable streams survive growth.",
          "Pattern changes stay observable.",
          "Scaling keeps the protocol coherent.",
          "Feature creep should stay controlled.",
          "Growth still needs clear framing.",
          "Systems evolve without losing shape.",
          "The roadmap favors disciplined expansion."
        ],
        "Control loops": [
          "Intent and feedback must stay distinct.",
          "Repeated exchanges form one narrative.",
          "Bounds support honest control requests.",
          "Stale readings still carry meaning.",
          "Acknowledgements guide operational trust.",
          "Loop state should stay visible.",
          "Control logic needs clear wire truth.",
          "Automation benefits from explicit semantics.",
          "Feedback timing affects interpretation.",
          "The loop remains readable on the stream."
        ],
        "Production telemetry": [
          "Field systems depend on continuity.",
          "Quality signals must stay visible.",
          "Long-lived streams need stable habits.",
          "Operators read logs under pressure.",
          "Dropouts should not stay silent.",
          "Payload choices affect maintainability.",
          "Real deployments reward consistency.",
          "Telemetry must stay debuggable.",
          "Reliability includes readable wire patterns.",
          "Production use sharpens protocol discipline."
        ]
      }
    }
  };

  const DOC_NODE_PREVIEWS = {};
  const DOC_ROW_CONFIGS = {};

  Object.assign(DOC_NODE_PREVIEWS, {
    intro: {
      paragraphs: [
        "At the front of the stack, the opening document explains why BCODe starts from stream conditions rather than from document structure, and it teaches the reader to think in terms of latching, bounded parser state, and durable transport behavior before worrying about higher-layer conventions. The narrative keeps returning to the same core question: what kind of wire language remains trustworthy when communication is continuous, interruption is normal, and recovery cannot depend on restarting the session.",
        "The introduction frames the protocol as a coherent stack, shows why later pages split syntax from interpretation and conventions, and gives enough narrative context that the rest of the documents read like deliberate extensions of one design rather than disconnected references."
      ],
      bullets: [
        "Stream-native framing comes first.",
        "Deterministic structure shapes meaning.",
        "Atomic commitment is foundational.",
        "Parser recovery stays central.",
        "Telemetry realism drives the format.",
        "Human readability stays intentional.",
        "Layering is explained narratively.",
        "Examples connect theory to wire form.",
        "The whole stack is introduced here.",
        "This page establishes the mental model."
      ]
    },
    syntax: {
      paragraphs: [
        "On the wire, BCODe lives or dies by the exact structural rules in this document. The page defines what the parser is allowed to recognize, how tokens terminate, where payload modes begin and end, and how a line becomes valid on a live byte stream without depending on speculative recovery or document-balanced punctuation. It is the place where the protocol stops being a conceptual architecture and becomes a bounded, reviewable parser contract.",
        "The syntax specification serves as an implementer窶冱 map of the protocol surface. It is the place where ambiguity is removed, where parser behavior becomes reviewable, and where later semantic pages inherit a stable structural substrate instead of quietly redefining the wire."
      ],
      bullets: [
        "Wire legality is defined here.",
        "Token classes stay explicit.",
        "Latching rules remain central.",
        "Payload boundaries are normative.",
        "Recognition precedence is specified.",
        "Numeric spelling stays structured.",
        "Parser limits are acknowledged.",
        "Conformance closes the loop.",
        "Resynchronization is not implicit.",
        "Implementers get exact obligations."
      ]
    },
    cfg: {
      paragraphs: [
        "BCODe.cfg layers a bounded runner profile over ordinary BCODe lines, turning the same flat wire syntax into an execution script without inventing a separate macro language beside the protocol. The page defines byte-string and wait-token variables, immediate substitution into the next emitted line, scoped control forms, and organizational helpers while still deferring real exchange to the existing BCODe.meta request-response lifecycle.",
        "Its place in the map is intentionally between structure and operations. The document inherits syntax rather than replacing it, relies on BCODe.meta for emission and matching direct responses, and shows how higher-level orchestration can remain inspectable as normal BCODe traffic instead of becoming an opaque sidecar runtime."
      ],
      bullets: [
        "Runner control stays on the flat wire.",
        "Environment values become explicit inputs.",
        "Immediate substitution remains disciplined.",
        "Emission still flows through BCODe.meta.",
        "Negative-response policy can be scoped.",
        "Wait tokens preserve response identity.",
        "Section tags stay organizational.",
        "Fatal errors carry structured context.",
        "Automation remains grep-friendly.",
        "The profile extends behavior without redefining syntax."
      ]
    },
    interpretation: {
      paragraphs: [
        "After a line has been accepted structurally, this page explains what the field is actually allowed to mean. It preserves uncertainty, bounds, stale state, and diagnostic classes as first-class parts of the value so downstream code can reason about real telemetry conditions without flattening everything into a single convenient number. The result is a semantic model that treats engineering honesty as part of the protocol rather than as an optional post-processing habit.",
        "Interpretation acts as the semantic hinge of the stack. It connects the raw parser output to application truth, clarifies why quality and intent stay attached to the field itself, and explains why reducers, accessors, and APIs depend on disciplined interpretation rather than on ad hoc downstream guesses."
      ],
      bullets: [
        "Meaning starts after parsing succeeds.",
        "Quality remains attached to values.",
        "Bounds carry operational intent.",
        "Staleness stays explicit.",
        "Diagnostics remain machine-readable.",
        "Typed access needs semantic discipline.",
        "Reducers depend on value classes.",
        "APIs inherit these meanings.",
        "False precision is intentionally avoided.",
        "Operational honesty is preserved."
      ]
    },
    "meta-v9": {
      paragraphs: [
        "Once isolated lines need to behave like a conversation, the control-plane conventions collected here become essential. The document standardizes how requests, direct responses, unsolicited traffic, batching, sequencing, and parser reset conventions appear on the same flat wire so systems can coordinate without inventing a parallel control protocol beside BCODe. What makes the page important is that it keeps those behaviors inspectable as ordinary protocol structure rather than hiding them behind transport-specific assumptions.",
        "BCODe.meta functions as the control-plane backbone of the stack. It shows how the base format becomes operational, why conversation state remains inspectable in logs, and how deployment-grade behavior grows out of ordinary BCODe fields instead of out of hidden transport assumptions."
      ],
      bullets: [
        "Conversations stay on the wire.",
        "Acks and unsolicited lines are standardized.",
        "Batching keeps atomic delivery visible.",
        "Sequence tracking supports continuity.",
        "Reset behavior is shared.",
        "Control flow remains grep-friendly.",
        "Logs retain protocol intent.",
        "Deployment reliability grows here.",
        "No side-channel framing is required.",
        "The stack becomes operational."
      ]
    }
  });

  DOC_ROW_CONFIGS.intro = [
    {
      label: "Structural philosophy",
      jumpLabel: "Structural Philosophy — Determinism by ASCII Columns",
      jumpId: "structural-philosophy-determinism-by-ascii-columns",
      paragraphs: [
        "The structural philosophy section explains why BCODe assigns structural meaning by ASCII column instead of by nested punctuation. It is where the reader first sees that parser simplicity, bounded recognition, and deterministic framing are not side effects but direct design goals of the format.",
        "The section introduces the logic that the rest of the documentation keeps building on. Once it clicks, later topics like latching, qualifiers, batching, and resource-oriented streams stop feeling like independent inventions and start reading as consequences of one structural philosophy."
      ],
      bullets: [
        "ASCII columns define structure.",
        "Parser depth stays bounded.",
        "Identity remains byte-level.",
        "Recovery informs the grammar.",
        "Nested syntax is intentionally avoided.",
        "Streaming assumptions shape design.",
        "Structure comes before semantics.",
        "The architecture starts here.",
        "The parser model becomes legible.",
        "The rest of the stack takes shape here."
      ]
    },
    {
      label: "Multiline packets",
      jumpId: "multiline-atomic-packets",
      paragraphs: [
        "Multiline packets expand BCODe's single-line atomicity into multi-line atomic delivery. The section explains why batching is treated as a transport convenience rather than as a change in semantic structure, and why grouping multiple lines still has to preserve explicit completion rules if the stream is going to remain trustworthy.",
        "The section shows how BCODe grows without abandoning its original commitments. It ties together delivery, buffering, and commit visibility, bridging the early parser narrative into the later control-plane and deployment sections."
      ],
      bullets: [
        "Batching preserves atomic delivery.",
        "Grouped lines still need closure.",
        "Transport convenience stays explicit.",
        "Semantics do not hide in packets.",
        "Receivers must know completion.",
        "Buffering remains intentional.",
        "Delivery logic stays inspectable.",
        "The line model still governs.",
        "Mid-stream trust is preserved.",
        "Scaling does not abandon structure."
      ]
    },
    {
      label: "Example gallery",
      jumpId: "example-gallery-optional-patterns-to-copy-paste",
      gallery: true,
      paragraphs: [
        "The example gallery is where the introduction's narrative collapses into reusable protocol patterns. It serves readers who already understand the framing ideas and want to see representative lines that can be borrowed, compared, or adapted without rereading the whole conceptual arc first.",
        "The gallery turns the long introduction back into concrete wire shapes. The surrounding examples reveal how the earlier architectural ideas look once written as practical statements, which is exactly why the section closes the introductory journey."
      ],
      bullets: [
        "The narrative resolves into examples.",
        "Reusable wire patterns gather here.",
        "Practical forms stay easy to scan.",
        "Earlier concepts become concrete lines.",
        "Copy-paste use is intentional.",
        "Comparison between idioms becomes faster.",
        "Examples shorten time to first use.",
        "Practical wire patterns gather at the end.",
        "Theory turns into recognizable syntax.",
        "Immediate application is the point."
      ]
    }
  ];

  DOC_ROW_CONFIGS.syntax = [
    {
      label: "ASCII grammar",
      jumpId: "ascii-column-grammar-normative",
      paragraphs: [
        "The ASCII grammar section defines the byte-class foundation of the language. It shows exactly how ASCII ranges are partitioned into field content, parameter terminators, and command terminators, which makes it the clearest entry for understanding why the parser can stay deterministic on an unbounded stream.",
        "The grammar窶冱 placement as the opening normative section is deliberate. Once the reader understands this structural partition, later rules about fields, payloads, and latching become easier to navigate because they all assume this foundation is already in place."
      ],
      bullets: [
        "ASCII range assignment is explicit.",
        "Field content stays distinct.",
        "Parameter bytes label intermediate fields.",
        "Command bytes close the line.",
        "The parser model begins here.",
        "Determinism starts at classification.",
        "The grammar stays byte-oriented.",
        "Later sections inherit this split.",
        "Recognition remains bounded.",
        "This is the structural entry point."
      ]
    },
    {
      label: "Number forms",
      jumpId: "numbers-fractional-width-normative",
      paragraphs: [
        "Number forms define the numeric core of the syntax specification, where fixed-point pairs, fractional width, and raw numeric shapes are made explicit at the wire level. BCODe窶冱 numeric model is not just about value spelling; it is about preserving transmitted form long enough that later interpretation and tooling can remain honest about precision.",
        "The section serves as a good pivot between basic grammar and later conformance rules. It gives the reader a precise account of how numbers are structured before exponent handling, recognition precedence, and test-oriented behavior refine the surrounding parser contract."
      ],
      bullets: [
        "Numeric shape becomes normative here.",
        "Fractional width stays explicit.",
        "Fixed-point pairs retain wire intent.",
        "Raw form survives initial parsing.",
        "Precision is not guessed away.",
        "Later semantics depend on this structure.",
        "The number model stays compact.",
        "Engineering spelling remains stable.",
        "Parser output preserves numeric form.",
        "This section defines legal number layouts."
      ]
    },
    {
      label: "Conformance",
      jumpId: "conformance-normative",
      paragraphs: [
        "Conformance is where the syntax rules stop being only descriptive and become a shared behavioral contract. It is the reference for when an implementation needs to prove that it behaves like the specification rather than merely behaving plausibly on common examples.",
        "The section builds on the grammar and number form sections that precede it. Once those foundations are understood, the purpose shifts from learning the syntax in the abstract to locking it into repeatable expectations, edge-case discipline, and reviewable interoperability across independent implementations."
      ],
      bullets: [
        "Syntax becomes testable here.",
        "Behavior is compared against contract.",
        "Independent parsers stay alignable.",
        "Edge cases become reviewable.",
        "Implementation claims gain evidence.",
        "Regression resistance improves.",
        "Shared fixtures reduce ambiguity.",
        "Compliance stops being informal.",
        "Interoperability becomes measurable.",
        "The spec closes through verification."
      ]
    }
  ];

  DOC_ROW_CONFIGS.cfg = [
    {
      label: "Environment binding",
      jumpId: "environment-binding",
      paragraphs: [
        "Environment binding is where BCODe.cfg first turns outside process state into protocol-ready data. The section defines the immediate pair that reads a host environment variable, validates the destination name, and stores the resulting bytes as a typed cfg variable without pretending the value is already a semantic BCODe field on its own.",
        "That placement matters because later substitution and emission rules assume this disciplined variable model already exists. Once the reader understands how cfg names are created and constrained here, the rest of the runner profile reads like controlled composition rather than ad hoc text splicing."
      ],
      bullets: [
        "Host state enters the runner here.",
        "Bindings stay typed from the start.",
        "Variable names are validated explicitly.",
        "Immediate pairing remains mandatory.",
        "Undefined rebinding is rejected.",
        "Environment lookup failures stay fatal.",
        "Stored bytes remain uninterpreted.",
        "Later substitution depends on this setup.",
        "The profile starts with disciplined inputs.",
        "External data is imported without hidden magic."
      ]
    },
    {
      label: "Line substitution",
      jumpLabel: "Next-emitted-line substitution",
      jumpId: "next-emitted-line-substitution",
      paragraphs: [
        "Line substitution defines how one queued cfg variable is injected into the next emitted content line only, without blurring the distinction between control lines and ordinary BCODe traffic. The section covers parameter, command-field, and string-payload selectors so the reader can see exactly where substitution is legal and where existing content must remain untouched.",
        "This is the part of the document where cfg becomes operationally useful without becoming loose. Substitution is intentionally narrow, immediate-pair adjacency is enforced, and omitted lines inside non-emitting scopes do not consume the queued action, which keeps the profile predictable on live streams."
      ],
      bullets: [
        "Substitution is queued one line at a time.",
        "Parameter selectors stay explicit.",
        "Command-field insertion has its own rule.",
        "String payload injection remains bounded.",
        "Immediate adjacency is enforced.",
        "Non-emitting lines do not consume the queue.",
        "Existing targets cannot be silently overwritten.",
        "Field-body validity is still checked.",
        "Control lines do not become payload by accident.",
        "The runner stays predictable under composition."
      ]
    },
    {
      label: "Wait-token flow",
      jumpLabel: "Capture-wait-token scope",
      jumpId: "capture-wait-token-scope",
      paragraphs: [
        "Wait-token flow is where BCODe.cfg couples a single emitted line to the response lifecycle that follows it. The capture scope binds a positive direct response into an opaque wait token, the token identity tracks whether completion is already terminal or tied to a same-session unsolicited continuation, and later wait scopes consume that token without inventing a second correlation channel.",
        "What makes the sequence important is that it keeps orchestration visible on the same wire model the rest of the stack already uses. Response timing, negative replies, timeout failure, and wrong-type reuse all remain explicit protocol events rather than hidden scheduler state."
      ],
      bullets: [
        "Exactly one emitted line is captured.",
        "Positive direct responses create tokens.",
        "Negative direct responses fail immediately.",
        "Session identity stays attached to waiting.",
        "Terminal vs pending states remain explicit.",
        "Later waits consume typed token variables.",
        "Timeouts fail rather than becoming silent states.",
        "Correlation stays on the visible wire model.",
        "Capture and wait reuse BCODe.meta semantics.",
        "Orchestration remains inspectable."
      ]
    }
  ];

  DOC_ROW_CONFIGS.interpretation = [
    {
      label: "Quality model",
      jumpLabel: "Quality-first telemetry model",
      jumpId: "quality-first-telemetry-model",
      paragraphs: [
        "The quality model establishes that telemetry quality is not auxiliary metadata but part of the field窶冱 meaning. It explains why BCODe keeps uncertainty, validity, and context attached to the value instead of scattering them into external status channels.",
        "Everything else in the interpretation specification depends on this shift in perspective. Once the reader accepts that quality is primary, later topics like stale modifiers, accessor behavior, and reduction masks read as systematic consequences rather than as isolated interpretation tricks."
      ],
      bullets: [
        "Quality is not secondary metadata.",
        "Field meaning includes confidence.",
        "Telemetry truth stays attached.",
        "Status channels are not split away.",
        "Interpretation starts with honesty.",
        "Later rules depend on this model.",
        "Applications inherit explicit quality.",
        "Values stay context-rich.",
        "The page窶冱 logic begins here.",
        "This section reframes the field."
      ]
    },
    {
      label: "Numeric variants",
      jumpId: "field-numeric-variants-accessors",
      paragraphs: [
        "Numeric variants cover where raw parsed forms become usable semantic variants and access patterns. The reader sees how exact numeric content, derived convenience views, and accessor behavior can coexist without silently erasing the qualifier and precision information that made the field trustworthy in the first place.",
        "The section bridges value-class semantics into actual software use. It is not just about what a field means in theory; it is about how an API, library, or application should touch that field without collapsing meaningful distinctions too early."
      ],
      bullets: [
        "Parsed forms become usable variants.",
        "Accessors expose semantic truth.",
        "Convenience must stay disciplined.",
        "Precision survives software boundaries.",
        "Variants do not erase qualifiers.",
        "Consumers need explicit access paths.",
        "Interpretation informs API shape.",
        "Numeric views remain accountable.",
        "Exactness stays visible to callers.",
        "This section joins semantics to code."
      ]
    },
    {
      label: "Line reduction",
      jumpId: "line-reduction-bitmask-reducer",
      paragraphs: [
        "Line reduction addresses how interpretation is compressed into stream summaries without discarding the meaning that earlier sections defined. It explains how bitmask-style reduction can capture presence, stale state, diagnostics, and related line qualities in a compact form that still respects the protocol窶冱 semantic richness.",
        "The section shows what happens after interpretation has been done well. The reader can see how BCODe scales into analytics, policy, and telemetry pipelines without forcing reducers to pretend that all inputs were clean scalar measurements."
      ],
      bullets: [
        "Rich meaning can still be reduced.",
        "Bitmasks summarize line quality.",
        "Presence remains distinct from freshness.",
        "Diagnostics survive compression.",
        "Reducers stay semantically accountable.",
        "Pipelines can stay honest at scale.",
        "Summary state remains inspectable.",
        "Interpretation supports analytics.",
        "Operational nuance is not discarded.",
        "This section turns meaning into policy."
      ]
    }
  ];

  DOC_ROW_CONFIGS["meta-v9"] = [
    {
      label: "Command flow",
      jumpId: "commandresponse-and-unsolicited-rules",
      paragraphs: [
        "Command flow formalizes how commands, direct responses, and unsolicited statements coexist on the same wire. It is the clearest explanation of how a single-line protocol becomes a conversation without giving up the structural flatness that makes BCODe easy to inspect and parse.",
        "The foundation this section provides is deliberate. Once the command-flow model is clear, the later sections on batching, sequencing, and emitted analysis events read as extensions of a shared interaction grammar rather than as unrelated transport-side behaviors."
      ],
      bullets: [
        "Command flow becomes explicit here.",
        "Direct responses stay standardized.",
        "Unsolicited traffic is clearly marked.",
        "The wire keeps visible intent.",
        "Conversation state stays inspectable.",
        "Flat structure survives interaction.",
        "Later meta features build from this.",
        "Tooling can classify lines reliably.",
        "Control semantics remain readable.",
        "This is the interaction entry point."
      ]
    },
    {
      label: "Sequence counters",
      jumpId: "sequence-counters-with",
      jumpLabel: "Sequence counters with `]`",
      paragraphs: [
        "Sequence counters expose continuity directly on the wire. Long-lived streams do not only need valid syntax; they need a disciplined way to reveal loss, reset, and out-of-order conditions without asking tooling to infer those failures from silence.",
        "The section is where the specification shifts from structural concerns to deployment-oriented ones. It gives conversation state a durable timeline, and that makes it one of the strongest bridges between basic request-response rules and the operational concerns that follow."
      ],
      bullets: [
        "Continuity becomes visible here.",
        "Loss detection stays explicit.",
        "Resets do not stay mysterious.",
        "Long-lived streams gain timeline state.",
        "Receivers can reason about gaps.",
        "Deployment concerns reach the wire.",
        "Conversation history stays measurable.",
        "Tooling gets real continuity signals.",
        "Diagnostics become more trustworthy.",
        "This section hardens stream reliability."
      ]
    },
    {
      label: "Meta events",
      jumpId: "meta-events-emitted-during-analysis",
      paragraphs: [
        "Meta events reflect BCODe.meta analysis back out as structured events. The section shows how the earlier conventions are consumed by tooling and libraries once command flow, batching, reset behavior, and sequencing have already been interpreted correctly.",
        "The section is less about adding new wire semantics and more about demonstrating what becomes observable once the shared meta rules are applied consistently across a parser, an analyzer, and an application-facing integration layer."
      ],
      bullets: [
        "Analysis emits structured state here.",
        "Meta conventions become observable events.",
        "Tooling sees conversation outcomes clearly.",
        "Wire behavior gains software surfaces.",
        "Late-stage integration becomes explicit.",
        "Event boundaries stay interpretable.",
        "Parsers can report richer context.",
        "Consumers inherit normalized signals.",
        "Observability follows correct analysis.",
        "This section closes the meta workflow."
      ]
    }
  ];

  Object.assign(DOC_NODE_PREVIEWS, {
    "meta-library-semantics": {
      paragraphs: [
        "Across real software boundaries, the protocol only stays truthful if libraries carry its semantics forward instead of smoothing them away. This page focuses on what a software surface should expose, which states deserve first-class visibility, and how APIs can stay ergonomic without erasing the nuance that operators and client code still need to understand. It is where wire behavior is translated into dependable developer-facing behavior without losing the reasons that behavior mattered on the wire.",
        "Library semantics represent the handoff between protocol design and developer tooling. The page provides guidance for library authors, SDK designers, and systems integrators who need to preserve protocol truth while still offering a stable and understandable programming surface."
      ],
      bullets: [
        "API truth matters here.",
        "Flags need explicit semantics.",
        "Units stay attached to values.",
        "Consumer surfaces must stay honest.",
        "Resync behavior affects libraries.",
        "Event mapping should stay readable.",
        "Convenience cannot erase nuance.",
        "SDKs inherit protocol obligations.",
        "Integration ergonomics remain important.",
        "Software boundaries preserve wire meaning."
      ]
    },
    rest: {
      paragraphs: [
        "When the protocol grows into a resource-oriented interface, this page shows how that transition can happen without abandoning BCODe窶冱 stream-native character. It explains how resource identity, operation categories, sequencing, ordinals, feeds, and instance lifetime can all coexist on a compact wire format without turning the protocol into a document-heavy RPC system. The emphasis is on keeping operations operationally clear while preserving the same inspectable line-based discipline that defined the lower layers.",
        "BCODe.rest occupies the resource workflow layer of the architecture. It explains how BCODe grows into practical operational interfaces, why commands still remain inspectable in logs, and how a long-lived stream can support reads, writes, controls, and feeds under one consistent model."
      ],
      bullets: [
        "Resources stay stream-native.",
        "Operation categories remain compact.",
        "Identity is carried explicitly.",
        "Sequences support ongoing workflows.",
        "Ordinals clarify staged results.",
        "Feeds remain part of one model.",
        "Controls stay inspectable.",
        "Instantiation remains structured.",
        "The wire avoids document bloat.",
        "Operational interfaces stay deterministic."
      ]
    },
    "best-practices": {
      paragraphs: [
        "As the stack leaves prototype territory, disciplined design choices start to matter as much as formal correctness. This page focuses on the decisions that determine whether a valid stream also remains maintainable, interoperable, observable, and safe once multiple teams, tools, and devices have to live with it over time. Instead of treating deployment concerns as afterthoughts, the document explains how protocol quality is preserved through stable habits and deliberate restraint.",
        "Best practices form the deployment discipline layer of the specification. The page emphasizes stable parameter maps, explicit conventions, readable failure behavior, and transport habits that keep the protocol legible long after the initial prototype has been replaced by production systems."
      ],
      bullets: [
        "Validity is not the whole story.",
        "Schema discipline protects longevity.",
        "Interoperability requires restraint.",
        "Safety depends on visible meaning.",
        "Streaming habits affect deployment quality.",
        "Observability belongs in the design.",
        "Shortcuts can age badly.",
        "Shared conventions reduce drift.",
        "Operators need readable truth.",
        "Production discipline is the point."
      ]
    },
    "telemetry-guide": {
      paragraphs: [
        "Across the ecosystem, the same core ideas have to scale from a bench-top line capture to a production telemetry and control system. This page uses progressively richer scenarios to show how syntax, interpretation, meta, and rest conventions accumulate into practical operational patterns without forcing a redesign at each stage. It reads less like a reference chapter and more like a growth map for how the protocol behaves once real operational complexity starts to arrive.",
        "The telemetry guide reads as a systems-growth map. It gives readers a way to place each document in the larger deployment story, shows how protocol features emerge as complexity rises, and helps them connect abstract rules to realistic streams, feedback loops, and field behavior."
      ],
      bullets: [
        "Complexity grows in stages.",
        "Simple feeds lead to richer systems.",
        "Control and telemetry stay compatible.",
        "Quality signaling matters in the field.",
        "Scaling should not erase clarity.",
        "Patterns stay grounded in practice.",
        "The guide shows upgrade paths.",
        "Production behavior remains visible.",
        "The stack composes intentionally.",
        "This page connects rules to operations."
      ]
    }
  });

  DOC_ROW_CONFIGS["meta-library-semantics"] = [
    {
      label: "API contracts",
      jumpId: "public-api-contracts",
      paragraphs: [
        "API contracts define where library-facing obligations become explicit. The section explains what a consuming API must guarantee if it is going to represent BCODe.meta faithfully, and it gives the reader a concrete entry into how protocol semantics should survive the trip from parsed traffic into callable software surfaces.",
        "The rest of the specification assumes the library boundary matters. Once these contracts are understood, later sections on resynchronization, transmit semantics, and surface mapping can be read as specializations of a stable API promise rather than as disconnected implementation details."
      ],
      bullets: [
        "API guarantees are set here.",
        "Library boundaries stay explicit.",
        "Protocol meaning must survive export.",
        "Consumers need predictable contracts.",
        "Surface design affects trust.",
        "Later sections build on this promise.",
        "Integration starts with clear obligations.",
        "Semantics stay visible to callers.",
        "Library behavior becomes reviewable.",
        "The software boundary becomes explicit."
      ]
    },
    {
      label: "Resync signaling",
      jumpLabel: "Resynchronization and “dropped” signaling (library-specific)",
      jumpId: "resynchronization-and-dropped-signaling-library-specific",
      paragraphs: [
        "Resync signaling treats resynchronization and dropped-data signaling as first-class library concerns. Stream-native protocols do not become safer merely because a parser can recover; client code also needs a disciplined way to learn that recovery happened and that some continuity may have been lost.",
        "The section turns abstract protocol resilience into application-visible behavior. It demonstrates how a library should surface broken continuity without hiding it behind silent resets, which is exactly the kind of semantic honesty the rest of the BCODe stack argues for."
      ],
      bullets: [
        "Recovery must be signaled upward.",
        "Dropped state cannot stay silent.",
        "Libraries need continuity reporting.",
        "Resync affects caller trust.",
        "Parser recovery is not the whole story.",
        "Operational honesty reaches the API.",
        "Clients need visible loss signals.",
        "Resilience becomes consumable behavior.",
        "Mid-stream repair stays explicit.",
        "This section protects application context."
      ]
    },
    {
      label: "Surface mapping",
      jumpId: "mapping-v9-eventspolicies-bcode_meta-surface",
      paragraphs: [
        "Surface mapping is where v9 meta events and policy knobs are mapped onto the actual `bcode_meta` software surface. All of the earlier library semantics become concrete enough that an integrator can see how protocol behavior turns into events, flags, and actionable state in code.",
        "The section closes the conceptual gap between specification language and an exposed interface. It is less about inventing new semantics than about proving that the semantics can be represented coherently, which makes it the most integration-facing part of the specification."
      ],
      bullets: [
        "Events reach the public surface here.",
        "Policy becomes concrete API state.",
        "Specification intent meets code shape.",
        "Integrators see the final mapping.",
        "Library design becomes testable.",
        "Semantic coverage turns explicit.",
        "Event naming gains clear purpose.",
        "Flags and callbacks align.",
        "The interface reflects protocol reality.",
        "The implementation loop closes cleanly."
      ]
    }
  ];

  DOC_ROW_CONFIGS.rest = [
    {
      label: "Resource anchor",
      jumpLabel: "Resources are the semantic anchor",
      jumpId: "resources-are-the-semantic-anchor",
      paragraphs: [
        "The resource anchor establishes resources as the semantic center of BCODe.rest. The specification is not simply a list of verbs; it begins by showing how resource identity gives the wire a stable object of action without forcing the protocol into document-style request envelopes.",
        "The section prepares the reader for everything that follows. Once resource identity is understood, later sections on command categories, ordinals, responses, and instance lifetime all become recognizable as operations over a stable semantic foundation rather than as disconnected wire tricks."
      ],
      bullets: [
        "Resources become the semantic base.",
        "Action starts from identity.",
        "The wire avoids document wrappers.",
        "Operations need stable targets.",
        "Rest remains recognizably BCODe.",
        "Later sections inherit this anchor.",
        "Resource thinking frames the page.",
        "Identity stays compact and explicit.",
        "Operational context starts here.",
        "The rest model opens clearly."
      ]
    },
    {
      label: "Sequences & ordinals",
      jumpId: "sequences-and-ordinals-n-r-r",
      paragraphs: [
        "Sequences and ordinals make ordering, response ordinals, and multi-stage exchanges explicit within BCODe.rest. The section shows how resource operations continue across time without losing correlatability, which is essential once a request can produce more than one meaningful line of follow-on behavior.",
        "Building on the resource and field-model setup, the section turns the specification from a static command catalog into a living operational workflow. It explains how staged responses remain intelligible, how ordering supports correlation, and why long-running resource traffic can still stay easy to debug."
      ],
      bullets: [
        "Ordering gains semantic structure.",
        "Ordinals keep staged replies understandable.",
        "Requests stay correlatable over time.",
        "Resource exchanges gain durable timeline state.",
        "Multi-line workflows remain readable.",
        "Responses stay tied to origin.",
        "The stream handles progression cleanly.",
        "Debugging benefits from explicit order.",
        "Operational flow becomes concrete.",
        "This section structures ongoing exchanges."
      ]
    },
    {
      label: "Operation semantics",
      jumpLabel: "Operation semantics",
      jumpId: "operation-semantics",
      paragraphs: [
        "Operation semantics is where BCODe.rest stops describing pieces of the protocol and starts describing what operations mean as a coherent behavioral set. Reads, writes, controls, feeds, and related categories become semantically disciplined rather than merely syntactically representable.",
        "The section consolidates the earlier identity, ordering, and response machinery into operational rules. After understanding it, the reader grasps not just how a rest exchange is spelled, but what guarantees and expectations travel with each kind of resource action."
      ],
      bullets: [
        "Operations gain clear behavioral meaning.",
        "Categories become more than letters.",
        "Reads and controls stay distinguishable.",
        "Feeds align with the rest model.",
        "Operational guarantees become clearer.",
        "Earlier machinery turns into behavior.",
        "Request types stop feeling ad hoc.",
        "The protocol becomes action-oriented.",
        "Implementation policy gets firmer ground.",
        "The specification resolves into one operational model."
      ]
    }
  ];

  DOC_ROW_CONFIGS["best-practices"] = [
    {
      label: "Layering model",
      jumpId: "the-bcode-layering-model",
      paragraphs: [
        "The layering model section explains BCODe's layered adoption as a practical deployment discipline rather than as a diagrammatic abstraction. It tells the reader how syntax, interpretation, meta, and rest should be adopted intentionally instead of being blurred together into one fragile implementation layer.",
        "That framing shapes the rest of the specification. Once the layering model is clear, later guidance on qualifiers, interparameter dependency, and streaming transport design reads as advice about preserving boundaries that keep the protocol scalable, understandable, and interoperable under growth."
      ],
      bullets: [
        "Layering is treated as discipline.",
        "Boundaries protect long-term clarity.",
        "Each layer carries its own job.",
        "Adoption can stay incremental.",
        "Growth works better with separation.",
        "Best practices begin with architecture.",
        "Later guidance depends on this model.",
        "Conventions should not blur together.",
        "The stack scales through separation.",
        "The rest of the specification inherits its framing here."
      ]
    },
    {
      label: "Dependency discipline",
      jumpId: "avoid-interparameter-dependency",
      paragraphs: [
        "Dependency discipline warns against hidden interparameter dependency. Many protocol designs stay readable only until one field silently begins depending on another, and the section explains why BCODe works best when meaning is kept close to the field that carries it.",
        "The section translates high-level design guidance into a concrete modeling habit. It shows how dependency discipline improves interoperability, reduces fragile parser-side assumptions, and keeps streams debuggable even when a human has to read them under pressure."
      ],
      bullets: [
        "Meaning should stay local to the field.",
        "Hidden coupling damages readability.",
        "Dependencies make streams brittle.",
        "Interoperability improves with self-contained values.",
        "Humans debug flatter models faster.",
        "Qualifiers reduce the need for side fields.",
        "Protocol truth stays easier to inspect.",
        "Modeling discipline lowers ambiguity.",
        "This habit strengthens every layer.",
        "The section fights silent complexity."
      ]
    },
    {
      label: "Streaming-first",
      jumpId: "streaming-first-transport-design",
      paragraphs: [
        "Streaming-first transport design treats transport behavior as part of protocol design rather than as a separate infrastructure concern. The section explains why BCODe should be deployed with streaming-first assumptions in mind, and why transport choices that hide chunking, continuity, or partial-delivery realities can undermine the very properties the format was built to preserve.",
        "The section turns the guidance outward toward deployment. Best practice is not just about schema taste; it is also about carrying the protocol窶冱 stream-native assumptions all the way into the transport environment that will actually host the wire."
      ],
      bullets: [
        "Transport behavior shapes protocol outcomes.",
        "Streaming assumptions should stay explicit.",
        "Chunking reality cannot be ignored.",
        "Continuity belongs in deployment design.",
        "Partial delivery affects correctness.",
        "Protocol and transport remain coupled.",
        "Field behavior depends on the channel.",
        "Best practice reaches the wire path.",
        "Deployment choices can undo good design.",
        "Guidance turns directly into operations."
      ]
    }
  ];

  DOC_ROW_CONFIGS["telemetry-guide"] = [
    {
      label: "Telemetry syntax",
      jumpLabel: "Why the core syntax is telemetry-friendly",
      jumpId: "why-the-core-syntax-is-telemetry-friendly",
      paragraphs: [
        "Telemetry syntax explains why the core syntax is naturally compatible with telemetric data streams. The guide turns from motivation into design rationale, showing how streaming parsing, atomic latching, and byte-class structure solve practical telemetry problems instead of merely looking elegant on paper.",
        "The section establishes the baseline language of the guide. Once it is clear, later passages on qualifiers, complexity growth, and deployment strategy can be read as elaborations of the same stream-friendly assumptions rather than as separate design anecdotes."
      ],
      bullets: [
        "Telemetry needs stream-friendly structure.",
        "Atomic latching matters in practice.",
        "Core syntax supports live transport.",
        "Parser simplicity benefits operations.",
        "The wire stays readable under load.",
        "Design rationale becomes concrete here.",
        "Later guidance builds on this baseline.",
        "The guide enters technical ground here.",
        "Structure and telemetry stay aligned.",
        "The practical rationale begins here."
      ]
    },
    {
      label: "Quality on the wire",
      jumpLabel: "Qualifiers: communicating exceptions and data quality on the wire",
      jumpId: "qualifiers-communicating-exceptions-and-data-quality-on-the-wire",
      paragraphs: [
        "Quality on the wire explains why telemetry streams need to communicate more than nominal numeric values. Qualifiers serve as the mechanism that keeps exception state, quality state, and operational caution visible on the wire instead of deferring those realities to undocumented conventions or disconnected side channels.",
        "The section is where the guide窶冱 philosophy becomes directly useful to implementers. It clarifies why a telemetry protocol becomes more trustworthy when uncertainty is encoded explicitly, and why that trust matters just as much in deployment as compactness or parser speed."
      ],
      bullets: [
        "Quality belongs on the wire.",
        "Exceptions should stay explicit.",
        "Qualifiers protect telemetry honesty.",
        "Context should not move off-channel.",
        "Operational caution can be encoded cleanly.",
        "Trust improves when uncertainty is visible.",
        "Implementation simplicity still allows nuance.",
        "Telemetry meaning exceeds raw numbers.",
        "Field truth remains inspectable.",
        "This section explains wire-level honesty."
      ]
    },
    {
      label: "Scalable complexity",
      jumpId: "scalable-complexity-from-bench-hacks-to-deployment-conventions",
      paragraphs: [
        "Scalable complexity explains how BCODe grows from ad-hoc bench use into deployment-grade convention stacks. The section shows how syntax, interpretation, meta, and rest can be adopted in layers while preserving compatibility with the work that came before.",
        "The section captures the guide窶冱 central promise: complexity is optional, additive, and survivable when the stack is layered carefully. It gives readers a realistic migration path, connecting early experimentation to long-term operational design."
      ],
      bullets: [
        "Complexity should arrive in layers.",
        "Bench protocols can grow without reset.",
        "Interpretation comes before control-plane rigor.",
        "Meta hardens reliability next.",
        "Rest adds resource semantics later.",
        "Migration can stay deliberate.",
        "Deployment need not break prototypes.",
        "The stack scales through composition.",
        "Adoption paths become realistic here.",
        "The guide closes with scale and continuity in view."
      ]
    }
  ];

  const READER_FILE_MAP = {
    intro: "bcode-intro-v2.html",
    syntax: "bcode-syntax-v13.html",
    cfg: "bcode-cfg-v0.html",
    interpretation: "bcode-interpretation-v10.html",
    "meta-v9": "bcode-meta-v9.html",
    "meta-library-semantics": "bcode-meta-library-semantics-v9.html",
    rest: "bcode-rest-v6.1.3.html",
    "best-practices": "bcode-best-practices-v13.html",
    "telemetry-guide": "bcode-telemetry-guide.html"
  };

  const SUBTOPIC_ANCHORS = {
    intro: {
      Architecture: "structural-philosophy-determinism-by-ascii-columns",
      "Atomic latching": "the-atomic-line-model",
      "Example gallery": "example-gallery-optional-patterns-to-copy-paste"
    },
    syntax: {
      Grammar: "ascii-column-grammar-normative",
      "State machine": "numbers-fractional-width-normative",
      "Conformance tests": "conformance-normative"
    },
    cfg: {
      "Environment binding": "environment-binding",
      "Line substitution": "next-emitted-line-substitution",
      "Wait-token flow": "capture-wait-token-scope"
    },
    interpretation: {
      "Qualifier model": "quality-first-telemetry-model",
      "Reducer behavior": "line-reduction-bitmask-reducer",
      "Accessor semantics": "field-numeric-variants-accessors"
    },
    "meta-v9": {
      "Meta tags": "commandresponse-and-unsolicited-rules",
      Packeting: "sequence-counters-with",
      "Sequence conventions": "meta-events-emitted-during-analysis"
    },
    "meta-library-semantics": {
      "Library flags": "public-api-contracts",
      "Unit handling": "resynchronization-and-dropped-signaling-library-specific",
      "Consumer API": "mapping-v9-eventspolicies-bcode_meta-surface"
    },
    rest: {
      "Resource model": "resources-are-the-semantic-anchor",
      "Verb mapping": "sequences-and-ordinals-n-r-r",
      "Stream operations": "operation-semantics"
    },
    "best-practices": {
      "Schema discipline": "the-bcode-layering-model",
      Interoperability: "avoid-interparameter-dependency",
      "Operational safety": "streaming-first-transport-design"
    },
    "telemetry-guide": {
      "Scaling patterns": "why-the-core-syntax-is-telemetry-friendly",
      "Control loops": "qualifiers-communicating-exceptions-and-data-quality-on-the-wire",
      "Production telemetry": "scalable-complexity-from-bench-hacks-to-deployment-conventions"
    }
  };

  const INTRO_GALLERY_LABEL_OVERRIDES = {
    "19.1": "Atomic latching: why the final command byte matters",
    "19.2": "Minimal “single measurement” telemetry",
    "19.3": "Multi-sensor readout (flat, fast, and still human)",
    "19.4": "Qualifier quick sampler (value-class states without extra “status fields”)",
    "19.5": "Stale-but-useful: freshness is orthogonal (`!`)",
    "19.6": "Bounds as intent: delegating resolution to the device",
    "19.7": "“Smallest step” control with epsilon (`<?`)",
    "19.8": "Diagnostics without extra parameters (codes embedded inline)",
    "19.9": "Command/response tags (BCODe.meta “plumbing” stays flat)",
    "19.10": "Multiline packet: fixed-bound (`i.t[`)",
    "19.11": "Multiline packet: open-ended (`>n[` … closed by `n.t[`)",
    "19.12": "Sequence counter (`]`) for dropout detection",
    "19.13": "Payload realism: string payloads (`$…`)",
    "19.14": "Hex payloads (`%…%`): readable binary snapshots",
    "19.15": "Raw binary payloads (`&`): exact bytes, no base64",
    "19.16": "Scientific notation: large/small without changing the wire feel",
    "19.17": "Resource-oriented streams (BCODe.rest): ID + index + command",
    "19.18": "Ordinals (`*R`) as response “lanes” (direct vs delayed)",
    "19.19": "Engineering use case: temperature controller (constraint + stale readback)",
    "19.20": "Scientific instrumentation: saturation and diagnostics (spectrometer-style)",
    "19.21": "One last “debugger's trick”: grep patterns that stay meaningful"
  };

  const CONCEPTUAL_PREVIEWS = {
    "protocol-group": {
      title: "Protocol Representation",
      meta: "conceptual cluster",
      summary: "Protocol-facing representations live to the left of the separator in the final sitemap. They stay visible as architectural siblings of the core BCODe stack, not as top-level portal documents.",
      snippet: "The final SVG places protocol representations left of the dashed divider and routes them from the BCODe.meta convention node.",
      pills: ["Conceptual", "Left cluster"]
    },
    "protocol-modbus": {
      title: "BCODe.MODBUS",
      meta: "conceptual node",
      summary: "Conceptual protocol representation node shown in the final navigation diagram.",
      snippet: "This node is represented visually in the sitemap but is not wired to an active reader page.",
      pills: ["Conceptual", "Protocol representation"]
    },
    "protocol-dnp3": {
      title: "BCODe.DNP3",
      meta: "conceptual node",
      summary: "Conceptual protocol representation node shown in the final navigation diagram.",
      snippet: "This node is represented visually in the sitemap but is not wired to an active reader page.",
      pills: ["Conceptual", "Protocol representation"]
    },
    freestyle: {
      title: "FREESTYLE",
      meta: "conceptual branch",
      summary: "Freeform or application-specific protocol work sits on the right-side branch off Interpretation in the final architecture map.",
      snippet: "FREESTYLE is visually present in the SVG but is not backed by a current reader page.",
      pills: ["Conceptual", "Right branch"]
    },
    node: {
      title: "BCODe.node",
      meta: "conceptual runtime node",
      summary: "BCODe.node is part of the architecture diagram above BCODe.meta. It is represented as a live node card for navigation context, without forcing a broken document jump.",
      snippet: "Rows in the SVG emphasize runtime-oriented concerns like state relay, mode sync, and health flags.",
      pills: ["Conceptual", "State relay", "Mode sync", "Health flags"]
    }
  };

  const TREE_STACK_CENTER_X = 46.355;
  const TREE_STANDARD_NODE_W = 21.73;
  const TREE_INTRO_NODE_W = 23.46;

  const TREE_LAYOUT = [
    { id: "protocol-label", kind: "label", x: 6.3, y: 26.2 },
    { id: "protocol-modbus", kind: "concept", title: "BCODe.MODBUS", x: 1.1, y: 15.5, w: 18.3, h: 4.76, previewKey: "protocol-modbus", centerTitle: true },
    { id: "protocol-dnp3", kind: "concept", title: "BCODe.DNP3", x: 1.1, y: 21.45, w: 18.3, h: 4.76, previewKey: "protocol-dnp3", centerTitle: true },
    { id: "rest", kind: "doc", slug: "rest", x: 24.18, y: 2.76, w: TREE_STANDARD_NODE_W, h: 14.68, treeTitle: "BCODe.rest", badge: "a+f" },
    { id: "node", kind: "concept-doc", title: "BCODe.node", x: 46.78, y: 2.76, w: TREE_STANDARD_NODE_W, h: 14.68, badge: "|" },
    { id: "meta-v9", kind: "doc", slug: "meta-v9", x: TREE_STACK_CENTER_X - (TREE_STANDARD_NODE_W / 2), y: 22.26, w: TREE_STANDARD_NODE_W, h: 14.68, treeTitle: "BCODe.meta", badge: "][^\\" },
    { id: "meta-library-semantics", kind: "doc", slug: "meta-library-semantics", x: 73.81, y: 21.88, w: 21.73, h: 14.68, treeTitle: "Meta Library Semantics" },
    { id: "telemetry-guide", kind: "doc", slug: "telemetry-guide", x: 71.36, y: 3.49, w: 21.73, h: 14.68, treeTitle: "Telemetry Guide" },
    { id: "cfg", kind: "doc", slug: "cfg", x: 9.38, y: 41.96, w: TREE_STANDARD_NODE_W, h: 14.68, treeTitle: "BCODe.cfg" },
    { id: "interpretation", kind: "doc", slug: "interpretation", x: TREE_STACK_CENTER_X - (TREE_STANDARD_NODE_W / 2), y: 41.76, w: TREE_STANDARD_NODE_W, h: 14.68, treeTitle: "BCODe.interpretation" },
    { id: "freestyle", kind: "concept", title: "FREESTYLE", x: 61.93, y: 67.56, w: 16.18, h: 5.16, previewKey: "freestyle", centerTitle: true },
    { id: "syntax", kind: "doc", slug: "syntax", x: TREE_STACK_CENTER_X - (TREE_STANDARD_NODE_W / 2), y: 61.26, w: TREE_STANDARD_NODE_W, h: 14.68, treeTitle: "BCODe.syntax" },
    { id: "best-practices", kind: "doc", slug: "best-practices", x: 71.36, y: 81.83, w: 21.73, h: 14.68, treeTitle: "Best Practices" },
    { id: "intro", kind: "doc", slug: "intro", x: TREE_STACK_CENTER_X - (TREE_INTRO_NODE_W / 2), y: 80.76, w: TREE_INTRO_NODE_W, h: 14.68, treeTitle: "Intro", gallery: true }
  ];
  const SHIFT_EXEMPT_NODE_IDS = new Set(["intro", "best-practices", "telemetry-guide"]);

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const iconPath = (name) => `../assets/${name}`;

  const esc = (value) => String(value || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
  const ere = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const repairMojibakeText = (value) => {
    let text = String(value || "");
    // Keep structural labels intact and only repair the mojibake patterns known to
    // exist in the portal-authored preview copy.
    text = text
      .replace(/\uFFFD/g, "")
      .replace(/窶冱|遯ｶ蜀ｱ/g, "'s")
      .replace(/窶児|遯ｶ蜀ｳ/g, "\"")
      .replace(/窶冓|遯ｶ蜀ｯ/g, "\"")
      .replace(/窶兮/g, "'")
      .replace(/窶祢/g, "-")
      // Additional smart-quote mojibake: opening " followed by next letter
      .replace(/窶徭/g, "\"s")
      .replace(/窶彜/g, "\"S")
      .replace(/窶徘/g, "\"p")
      .replace(/窶徑/g, "\"l")
      .replace(/窶彭/g, "\"d")
      // Closing smart-quote mojibake (restore space after closing quote)
      .replace(/窶・/g, "\" ")
      // Ellipsis mojibake
      .replace(/窶ｦ/g, "\u2026")
      .replace(/[\u200B-\u200D\uFEFF]/g, "");
    return text;
  };
  const cleanLabel = (value) => repairMojibakeText(value).replace(/\s+/g, " ").trim();
  const normalizeText = (value) => cleanLabel(value).toLowerCase();
  const cssEscape = (value) => window.CSS?.escape
    ? window.CSS.escape(String(value || ""))
    : String(value || "").replace(/[^a-zA-Z0-9_-]/g, (match) => `\\${match}`);
  const previewSlug = (value) => {
    const text = String(value || "")
      .trim()
      .replace(/^\s*\d+(?:\.\d+)*\s*[.\-:)]\s*/, "")
      .toLowerCase()
      .replace(/[^\w\s-]+/g, "")
      .trim()
      .replace(/\s+/g, "-");
    return text || "section";
  };
  const cleanHeadingLabel = (value) => {
    let text = String(value || "").trim();
    const leadNum = /^[^\w]*\d+(?:\.\d+)*(?:\s*[.)\-:])?\s+/;
    while (leadNum.test(text)) text = text.replace(leadNum, "");
    return text.replace(/\s+/g, " ").trim();
  };
  const extractHeadingNumber = (value) => {
    const match = String(value || "").trim().match(/^(\d+(?:\.\d+)*)\b/);
    return match ? match[1] : "";
  };
  const getMajorHeadingNumber = (value) => {
    const number = extractHeadingNumber(value);
    return number ? number.split(".")[0] : "";
  };
  const previewMarkdownCache = new Map();
  const previewArticleCache = new Map();
  let previewRenderToken = 0;
  const INLINE_PREVIEW_BCODE_WORD_RE = /^(?:DEL|PARAM|CMD|SP|TAB|LF|CR|NUL|WSP|OWS)$/;
  const INLINE_PREVIEW_BCODE_IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
  const INLINE_PREVIEW_BCODE_PUNCT_RE = /[<>=?!@[\]^\\`$%&*\/.,#;(){}|:+~-]/;
  const INLINE_PREVIEW_BCODE_ALLOWED_RE = /^[A-Za-z0-9\s<>=?!@[\]^\\`$%&*\/.,#;(){}|:+~'"-]+$/;
  const INLINE_PREVIEW_BCODE_SKIP_RE = /^(?:try_get_[A-Za-z0-9_]+|quality_class|value1|value2|value2_neg|frac_width|exp10|exp_present|mantissa|numeric_value)$/;
  const PREVIEW_BCODE_VALIDITY_TEXT_RE = /\(?\b(?:still\s+)?(?:syntactically\s+)?valid(?:\s+ordinary)?\s+BCODe(?:\.[A-Za-z0-9._-]+)?\b\)?/gi;

  const assignPreviewHeadingIds = (root) => {
    const used = Object.create(null);
    [...root.querySelectorAll("h1,h2,h3,h4,h5,h6")].forEach((heading) => {
      if (heading.id) return;
      const base = previewSlug(heading.textContent);
      used[base] = (used[base] || 0) + 1;
      heading.id = used[base] === 1 ? base : `${base}-${used[base]}`;
    });
  };

  const looksLikeSyntaxReaderBcode = (text) => {
    const raw = cleanLabel(text || "").trim();
    if (!raw) return false;
    if (/^(?:FIELD|PSTR_BEGIN|PHEX_BEGIN|PRAW_BEGIN|RESET|LATCH)\b/m.test(raw)) return false;
    if (/^(?:NUL|HTAB|LF|CR|SP|WSP|OWS|PARAM|CMD|QUAL|PAIRSEP|EXPMARK|EXPDIGS|EXP|bcode-line|element|final-field|field|number|frac|decnum|decfrac|hexnum|hexfrac|hexdig-uc|payload|lenint|string-payload|string-char|hex-payload|hex-body|rawbin-payload|comment|semi-comment|paren-comment)\s*=+/m.test(raw)) {
      return false;
    }
    if (/^(?:#include|typedef|static inline|enum\b|struct\b|\/\*)/m.test(raw)) return false;
    if (/^ASCII:\s*/m.test(raw)) return looksLikeSyntaxReaderBcode(raw.replace(/^ASCII:\s*/gm, ""));
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.replace(/\s*;.*$/, "").trim())
      .filter(Boolean);
    if (!lines.length) return false;
    return lines.every((line) => /^[A-Za-z0-9\s#%$&<>=?!*\/.,()'`~^\\[\]{}|:+_-]+$/.test(line));
  };

  const looksLikePreviewInlineBcode = (text) => {
    const raw = repairMojibakeText(text || "").trim();
    if (!raw || raw.length > 96) return false;
    if (INLINE_PREVIEW_BCODE_WORD_RE.test(raw)) return true;
    if (/^[A-Za-z]$/.test(raw)) return true;
    if (/^[<>=?!@[\]^\\`$%&*\/.,#;(){}|:+~-]+$/.test(raw)) return true;
    if (!INLINE_PREVIEW_BCODE_ALLOWED_RE.test(raw)) return false;
    if (INLINE_PREVIEW_BCODE_SKIP_RE.test(raw)) return false;
    if (INLINE_PREVIEW_BCODE_IDENTIFIER_RE.test(raw)) return false;
    return INLINE_PREVIEW_BCODE_PUNCT_RE.test(raw);
  };

  const preparePreviewInlineBcode = (root) => {
    if (!root) return;
    root.querySelectorAll("code").forEach((el) => {
      if (el.closest("pre")) return;
      if (/\blanguage-/.test(el.className || "")) return;
      const text = repairMojibakeText(el.textContent || "");
      if (!looksLikePreviewInlineBcode(text)) return;
      el.classList.add("language-bcode", "inline-bcode");
    });
  };

  const buildPreviewBcodeValidityHighlight = (text) => {
    const raw = repairMojibakeText(text || "");
    const trimmed = raw.trim();
    const wrapper = document.createElement("span");
    wrapper.className = "inline-bcode-validity";
    wrapper.setAttribute("data-bcode-validity", "1");

    const hasOpenParen = trimmed.startsWith("(");
    const hasCloseParen = trimmed.endsWith(")");
    const core = trimmed.replace(/^\(/, "").replace(/\)$/, "");

    const appendToken = (value, className) => {
      const span = document.createElement("span");
      span.className = className;
      span.textContent = value;
      wrapper.appendChild(span);
    };

    if (hasOpenParen) appendToken("(", "inline-bcode-validity-paren");
    core.split(/\s+/).forEach((part, index, all) => {
      appendToken(
        part,
        /^BCODe(?:\.[A-Za-z0-9._-]+)?$/i.test(part)
          ? "inline-bcode-validity-name"
          : "inline-bcode-validity-keyword"
      );
      if (index < all.length - 1) wrapper.appendChild(document.createTextNode(" "));
    });
    if (hasCloseParen) appendToken(")", "inline-bcode-validity-paren");

    return wrapper;
  };

  const highlightPreviewBcodeValidityText = (root) => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        return parent.closest("pre,code,script,style,mark,.inline-bcode-validity")
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    let current;
    while ((current = walker.nextNode())) nodes.push(current);

    nodes.forEach((node) => {
      const text = node.nodeValue;
      PREVIEW_BCODE_VALIDITY_TEXT_RE.lastIndex = 0;
      if (!PREVIEW_BCODE_VALIDITY_TEXT_RE.test(text)) return;

      const frag = document.createDocumentFragment();
      let last = 0;
      let match;
      PREVIEW_BCODE_VALIDITY_TEXT_RE.lastIndex = 0;
      while ((match = PREVIEW_BCODE_VALIDITY_TEXT_RE.exec(text))) {
        if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
        frag.appendChild(buildPreviewBcodeValidityHighlight(match[0]));
        last = match.index + match[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      if (node.parentNode) node.parentNode.replaceChild(frag, node);
    });
  };

  const preparePreviewCodeBlocks = (root, slug) => {
    if (!root || slug !== "syntax") return;
    root.querySelectorAll("pre code").forEach((el) => {
      if (/\blanguage-/.test(el.className || "")) return;
      const text = cleanLabel(el.textContent || "").trim();
      if (!text) return;
      let lang = "plaintext";
      if (/^(?:#include|typedef|static inline|enum\b|struct\b|\/\*)/m.test(text) && /[{};]/.test(text)) {
        lang = "c";
      } else if (looksLikeSyntaxReaderBcode(text)) {
        lang = "bcode";
      }
      el.classList.add(`language-${lang}`);
    });
  };

  const highlightPreviewCode = (root) => {
    if (!root || !window.hljs) return;
    root.querySelectorAll("pre code, code.language-bcode").forEach((el) => {
      if (el.dataset.highlighted) return;
      try {
        window.hljs.highlightElement(el);
      } catch { }
    });
  };

  const markPreviewByteStreamSketchBlocks = (root) => {
    if (!root) return;
    root.querySelectorAll("pre > code").forEach((code) => {
      const text = String(code.textContent || "");
      const isParserLoopSketch =
        text.includes("for each byte b in stream:") &&
        text.includes("param_index(b)") &&
        text.includes("commit_line(cmd=b)") &&
        text.includes("reset_line_state()");
      const isAtomicLineSketch =
        text.includes("72A -> qualifiers=∅") &&
        text.includes("0.0a -> qualifiers=∅") &&
        text.includes("frac_width=1");
      const isFractionWidthParseSketch =
        text.includes("(1) 12.34A") &&
        text.includes("frac_width=2") &&
        text.includes("(3) 1.2A") &&
        text.includes("3.045B");
      const isArithmeticResultsSketch =
        text.includes("For (1) fixed-point at 2 fractional digits:") &&
        text.includes("A + B = 17.40") &&
        text.includes("A mod B = 2.22") &&
        text.includes("A - B = -1.845");
      const isQualityMarkerSketch =
        text.includes("unknown/pending") &&
        text.includes("noisy/unstable") &&
        text.includes("null (no-data)") &&
        text.includes("NaN (invalid result)") &&
        text.includes("sNaN (diagnostic payload code in value1)") &&
        text.includes("stale (orthogonal modifier)") &&
        text.includes("bounds (not hard values)");
      const isParsePipelineSketch =
        text.includes("stream bytes") &&
        text.includes("parse (latch on CMD)") &&
        text.includes("optional transforms") &&
        text.includes("reduce line") &&
        text.includes("typed accessors") &&
        text.includes("policy logic");
      if (
        !isParserLoopSketch &&
        !isAtomicLineSketch &&
        !isFractionWidthParseSketch &&
        !isArithmeticResultsSketch &&
        !isQualityMarkerSketch &&
        !isParsePipelineSketch
      ) return;
      code.classList.add("byte-stream-sketch-code");
      const pre = code.closest("pre");
      if (pre) pre.classList.add("byte-stream-sketch");
    });
  };

  const finalizePreviewArticle = (root, slug) => {
    if (!root) return null;
    assignPreviewHeadingIds(root);
    stripPreviewContentsHyperlinks(root);
    preparePreviewInlineBcode(root);
    highlightPreviewBcodeValidityText(root);
    preparePreviewCodeBlocks(root, slug);
    markPreviewByteStreamSketchBlocks(root);
    stabilizePreviewTableCellWrap(root);
    highlightPreviewCode(root);
    return root;
  };

  const stripPreviewContentsHyperlinks = (root) => {
    if (!root) return;
    const headings = [...root.querySelectorAll("h1,h2,h3,h4,h5,h6")];
    headings.forEach((heading) => {
      if (cleanHeadingLabel(heading.textContent).toLowerCase() !== "contents") return;
      const level = Number(heading.tagName.slice(1));
      let el = heading.nextElementSibling;
      while (el) {
        if (/^H[1-6]$/.test(el.tagName) && Number(el.tagName.slice(1)) <= level) break;
        el.querySelectorAll("a").forEach((anchor) => {
          const span = document.createElement("span");
          span.className = "contents-text-link";
          span.textContent = anchor.textContent || "";
          anchor.replaceWith(span);
        });
        el = el.nextElementSibling;
      }
    });
  };

  const stabilizePreviewTableCellWrap = (root) => {
    if (!root) return;
    root.querySelectorAll("table tr").forEach((row) => {
      [...row.children].forEach((cell, index) => {
        if (index < 1) return;
        const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            return !parent || parent.closest("pre")
              ? NodeFilter.FILTER_REJECT
              : NodeFilter.FILTER_ACCEPT;
          }
        });
        const nodes = [];
        let node;
        while ((node = walker.nextNode())) nodes.push(node);
        nodes.forEach((textNode) => {
          textNode.nodeValue = String(textNode.nodeValue || "")
            .replace(/\u00A0/g, " ")
            .replace(/\u202F/g, " ");
        });
      });
    });
  };

  const getPreviewMeasureHost = () => {
    let host = document.getElementById("treePreviewMeasureHost");
    if (host) return host;
    host = document.createElement("div");
    host.id = "treePreviewMeasureHost";
    host.className = "tree-preview-measure-host";
    document.body.appendChild(host);
    return host;
  };

  const fetchReaderMarkdownViaFrame = (slug) => new Promise((resolve) => {
    const file = READER_FILE_MAP[slug];
    if (!file) {
      resolve("");
      return;
    }
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.position = "fixed";
    frame.style.left = "-10000px";
    frame.style.top = "-10000px";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.opacity = "0";
    const cleanup = () => {
      frame.onload = null;
      frame.onerror = null;
      frame.remove();
    };
    frame.onload = () => {
      try {
        const doc = frame.contentDocument;
        const src = doc?.querySelector("#md-source");
        resolve(src?.textContent || "");
      } catch {
        resolve("");
      } finally {
        cleanup();
      }
    };
    frame.onerror = () => {
      cleanup();
      resolve("");
    };
    document.body.appendChild(frame);
    frame.src = file;
  });

  const loadRenderedPreviewArticleViaFrame = (slug) => new Promise((resolve) => {
    const file = READER_FILE_MAP[slug];
    if (!file) {
      resolve(null);
      return;
    }
    const token = `preview-${slug}-${Math.random().toString(36).slice(2)}`;
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.position = "fixed";
    frame.style.left = "-10000px";
    frame.style.top = "-10000px";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.opacity = "0";
    const onMessage = (event) => {
      const data = event.data || {};
      if (data.type !== "tree-preview-export" || data.token !== token || data.slug !== slug) return;
      window.removeEventListener("message", onMessage);
      try {
        const article = document.createElement("article");
        article.className = "markdown-body tree-preview-render-root";
        article.innerHTML = String(data.html || "");
        resolve(article);
      } catch {
        resolve(null);
      } finally {
        cleanup();
      }
    };
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      frame.onload = null;
      frame.onerror = null;
      frame.remove();
    };
    window.addEventListener("message", onMessage);
    frame.onload = () => {
      window.setTimeout(() => {
        resolve(null);
        cleanup();
      }, 4000);
    };
    frame.onerror = () => {
      cleanup();
      resolve(null);
    };
    document.body.appendChild(frame);
    frame.src = `${file}${file.includes("?") ? "&" : "?"}preview_export=1&preview_token=${encodeURIComponent(token)}`;
  });

  const fetchReaderMarkdown = async (slug) => {
    if (!slug || !READER_FILE_MAP[slug]) return "";
    if (!previewMarkdownCache.has(slug)) {
      previewMarkdownCache.set(slug, (async () => {
        try {
          const response = await fetch(READER_FILE_MAP[slug], { credentials: "same-origin" });
          if (response.ok) {
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, "text/html");
            const src = doc.querySelector("#md-source");
            return src?.textContent || "";
          }
        } catch { }
        return fetchReaderMarkdownViaFrame(slug);
      })().catch(() => ""));
    }
    return previewMarkdownCache.get(slug);
  };

  const loadRenderedPreviewArticle = async (slug) => {
    if (!slug) return null;
    if (!previewArticleCache.has(slug)) {
      previewArticleCache.set(slug, (async () => {
        const rendered = await loadRenderedPreviewArticleViaFrame(slug);
        if (rendered) {
          rendered.classList.add("tree-preview-render-root");
          return finalizePreviewArticle(rendered, slug);
        }
        if (!window.marked) return null;
        const md = await fetchReaderMarkdown(slug);
        if (!md) return null;
        const article = document.createElement("article");
        article.className = "markdown-body tree-preview-render-root";
        article.innerHTML = window.marked ? window.marked.parse(md) : md;
        return finalizePreviewArticle(article, slug);
      })().catch(() => null));
    }
    const article = await previewArticleCache.get(slug);
    return article ? article.cloneNode(true) : null;
  };

  const isHeadingElement = (element) => !!element && /^H[1-6]$/.test(element.tagName || "");
  const headingLevel = (element) => isHeadingElement(element) ? Number(element.tagName.slice(1)) : 7;

  const findPreviewSectionStart = (article, source = {}) => {
    if (!article) return null;
    if (source.sectionId) {
      const byId = article.querySelector(`#${cssEscape(source.sectionId)}`);
      if (byId) return byId;
    }
    const headings = [...article.querySelectorAll("h1,h2,h3,h4,h5,h6")];
    const wanted = normalizeText(source.sectionLabel || "");
    if (!wanted) return null;
    return headings.find((heading) => normalizeText(cleanHeadingLabel(heading.textContent || "")) === wanted)
      || headings.find((heading) => normalizeText(heading.textContent || "") === wanted)
      || headings.find((heading) => {
        const label = normalizeText(cleanHeadingLabel(heading.textContent || ""));
        const terms = wanted.split(/\s+/).filter(Boolean);
        return terms.length && terms.every((term) => label.includes(term));
      })
      || null;
  };

  const getPreviewBlockSlice = (article, source = {}) => {
    if (!article) return [];
    const children = [...article.children];
    if (!children.length) return [];
    if (source.fullMajorSection && (source.majorSectionId || source.majorNumber)) {
      const majorStart = (() => {
        if (source.majorSectionId) {
          const byId = article.querySelector(`#${cssEscape(source.majorSectionId)}`);
          if (byId) return byId;
        }
        const headings = [...article.querySelectorAll("h1,h2,h3,h4,h5,h6")];
        const wantedMajor = String(source.majorNumber || "").trim();
        if (!wantedMajor) return null;
        const sameMajor = headings.filter((heading) => getMajorHeadingNumber(heading.textContent || "") === wantedMajor);
        return sameMajor.find((heading) => extractHeadingNumber(heading.textContent || "") === wantedMajor)
          || sameMajor[0]
          || null;
      })();
      if (majorStart) {
        const startIndex = children.indexOf(majorStart);
        if (startIndex >= 0) {
          const targetMajor = String(source.majorNumber || getMajorHeadingNumber(majorStart.textContent || "")).trim();
          const targetLevel = headingLevel(majorStart);
          let endIndex = children.length;
          for (let index = startIndex + 1; index < children.length; index += 1) {
            const child = children[index];
            if (!isHeadingElement(child)) continue;
            const childNumber = extractHeadingNumber(child.textContent || "");
            const childMajor = childNumber ? childNumber.split(".")[0] : "";
            if (!childMajor || childMajor === targetMajor) continue;
            if (childNumber === childMajor || headingLevel(child) <= targetLevel) {
              endIndex = index;
              break;
            }
          }
          return children.slice(startIndex, endIndex);
        }
      }
    }
    const sectionStart = findPreviewSectionStart(article, source);
    if (!sectionStart) {
      if (!source.sectionId && !source.sectionLabel && children.length > 1 && isHeadingElement(children[0])) {
        return children.slice(1);
      }
      return children;
    }
    const startIndex = children.indexOf(sectionStart);
    if (startIndex < 0) return children;
    const level = headingLevel(sectionStart);
    let endIndex = children.length;
    for (let index = startIndex + 1; index < children.length; index += 1) {
      const child = children[index];
      if (isHeadingElement(child) && headingLevel(child) <= level) {
        endIndex = index;
        break;
      }
    }
    return children.slice(startIndex, endIndex);
  };

  const choosePreviewStartIndex = (blocks, query = "") => {
    if (!blocks.length) return 0;
    if (!query) return 0;
    const wanted = normalizeText(query);
    const hitIndex = blocks.findIndex((block) => normalizeText(block.textContent || "").includes(wanted));
    if (hitIndex <= 0) return Math.max(hitIndex, 0);
    for (let index = hitIndex; index >= 0; index -= 1) {
      if (isHeadingElement(blocks[index])) return index;
    }
    return hitIndex;
  };

  const getSearchPreviewAnchorCandidates = (source = {}) => {
    const query = source.query || "";
    const matchText = cleanLabel(source.matchText || "");
    if (!matchText) return [];
    const seen = new Set();
    const candidates = [];
    const pushCandidate = (value) => {
      const clean = cleanLabel(value);
      if (!clean) return;
      const normalized = normalizeText(clean);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      candidates.push(clean);
    };
    const sentences = splitIntoSentences(matchText)
      .map((sentence) => extractSentenceFromCapitalStart(sentence, query))
      .map((sentence) => cleanLabel(sentence))
      .filter(Boolean);
    const primarySentence = sentences.find((sentence) => normalizeText(sentence).includes(normalizeText(query)))
      || sentences[0]
      || matchText;
    pushCandidate(primarySentence);
    const words = primarySentence.split(/\s+/).filter(Boolean);
    [20, 16, 12, 8, 6].forEach((count) => {
      if (!words.length) return;
      pushCandidate(words.slice(0, Math.min(count, words.length)).join(" "));
    });
    pushCandidate(matchText);
    return candidates;
  };

  const findSearchPreviewStartIndex = (blocks, source = {}) => {
    const candidates = getSearchPreviewAnchorCandidates(source);
    for (const candidate of candidates) {
      const wanted = normalizeText(candidate);
      if (!wanted) continue;
      const blockIndex = blocks.findIndex((block) => normalizeText(block.textContent || "").includes(wanted));
      if (blockIndex >= 0) return blockIndex;
    }
    return choosePreviewStartIndex(blocks, source.query || "");
  };

  const clearPreviewMarks = (root) => {
    root.querySelectorAll("mark.bh").forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
      parent.normalize();
    });
  };

  const highlightPreviewQuery = (root, query) => {
    clearPreviewMarks(root);
    const wanted = cleanLabel(query);
    if (!wanted) return 0;
    const re = new RegExp(ere(wanted), "gi");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        return !parent || parent.closest("pre,code,script,style,mark")
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    let count = 0;
    nodes.forEach((textNode) => {
      const text = textNode.nodeValue || "";
      re.lastIndex = 0;
      if (!re.test(text)) return;
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      re.lastIndex = 0;
      while ((match = re.exec(text))) {
        if (match.index > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        const mark = document.createElement("mark");
        mark.className = "bh";
        mark.textContent = text.slice(match.index, match.index + match[0].length);
        frag.appendChild(mark);
        lastIndex = match.index + match[0].length;
        count += 1;
      }
      if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      textNode.parentNode?.replaceChild(frag, textNode);
    });
    return count;
  };

  const buildTextFallbackBlock = (block, query) => {
    const wrapper = document.createElement("div");
    wrapper.className = "tree-preview-fallback";
    if (!block) return wrapper;
    if (block.matches?.("pre")) {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      if (block.classList?.contains("byte-stream-sketch")) pre.classList.add("byte-stream-sketch");
      code.className = block.querySelector("code")?.className || "";
      const lines = cleanLabel(block.textContent || "").split(/\r?\n/).filter(Boolean);
      code.textContent = `${lines.slice(0, 8).join("\n")}${lines.length > 8 ? "\n..." : ""}`;
      pre.appendChild(code);
      wrapper.appendChild(pre);
      highlightPreviewCode(wrapper);
      return wrapper;
    }
    const paragraph = document.createElement("p");
    paragraph.className = "tree-preview-snippet-text";
    const words = cleanLabel(block.textContent || "").split(/\s+/).filter(Boolean);
    paragraph.textContent = words.slice(0, 72).join(" ") + (words.length > 72 ? "..." : "");
    wrapper.appendChild(paragraph);
    if (query) highlightPreviewQuery(wrapper, query);
    return wrapper;
  };

  const trimStructuredPreviewBlock = (block, host, maxHeight, query) => {
    if (!block) return null;
    const root = document.createElement("article");
    root.className = "markdown-body tree-preview-render-root";
    const clone = block.cloneNode(true);
    root.appendChild(clone);
    if (query) highlightPreviewQuery(root, query);
    host.replaceChildren(root);
    if (root.scrollHeight <= maxHeight) return root;

    if (clone.matches?.("pre")) {
      const code = clone.querySelector("code") || clone;
      let lines = String(code.textContent || "").split(/\r?\n/).filter(Boolean);
      while (lines.length > 2 && root.scrollHeight > maxHeight) {
        lines = lines.slice(0, -1);
        code.textContent = `${lines.join("\n")}\n...`;
        highlightPreviewCode(root);
        host.replaceChildren(root);
      }
      return root;
    }

    const textNodes = [];
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.nodeValue && node.nodeValue.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    });
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);
    while (textNodes.length && root.scrollHeight > maxHeight) {
      const current = textNodes[textNodes.length - 1];
      const words = String(current.nodeValue || "").split(/\s+/).filter(Boolean);
      if (words.length > 6) {
        words.pop();
        current.nodeValue = `${words.join(" ")}...`;
      } else {
        current.nodeValue = "";
        textNodes.pop();
      }
      if (query) highlightPreviewQuery(root, query);
      host.replaceChildren(root);
    }
    return root;
  };

  const buildRenderedPreviewFragment = async (source = {}, options = {}) => {
    if (!source.slug) return null;
    const article = await loadRenderedPreviewArticle(source.slug);
    if (!article) return null;
    const snippetHost = $("#treePreviewSnippet");
    if (!snippetHost) return null;
    const width = Math.max(240, Math.floor(snippetHost.clientWidth || snippetHost.getBoundingClientRect().width || 320));
    const height = Math.max(140, Math.floor(snippetHost.clientHeight || snippetHost.getBoundingClientRect().height || 220));
    const host = getPreviewMeasureHost();
    host.style.width = `${width}px`;
    const candidateRoot = document.createElement("article");
    candidateRoot.className = "markdown-body tree-preview-render-root";
    const sourceBlocks = getPreviewBlockSlice(article, source);
    if (!sourceBlocks.length) return null;
    const startIndex = source.fullMajorSection
      ? 0
      : (source.query
        ? findSearchPreviewStartIndex(sourceBlocks, source)
        : choosePreviewStartIndex(sourceBlocks, source.query || ""));
    const blocks = sourceBlocks.slice(startIndex).filter((block, index, list) => {
      if (block.tagName !== "HR") return true;
      return list.slice(0, index).some((entry) => entry.tagName !== "HR");
    });
    if (!blocks.length) return null;
    const maxHeight = options.maxHeightMultiplier
      ? Math.max(height, Math.round(height * options.maxHeightMultiplier))
      : height;
    if (options.fit === false) {
      for (let index = 0; index < blocks.length; index += 1) {
        const clone = blocks[index].cloneNode(true);
        candidateRoot.appendChild(clone);
        if (source.query) highlightPreviewQuery(candidateRoot, source.query);
        if (!options.maxHeightMultiplier) continue;
        host.replaceChildren(candidateRoot);
        if (candidateRoot.scrollHeight > maxHeight) {
          candidateRoot.removeChild(clone);
          host.replaceChildren(candidateRoot);
          break;
        }
      }
      if (!candidateRoot.children.length) {
        const structuredFallback = trimStructuredPreviewBlock(blocks[0], host, maxHeight, source.query || "");
        if (structuredFallback?.children.length) return structuredFallback.cloneNode(true);
      }
      return candidateRoot;
    }
    for (let index = 0; index < blocks.length; index += 1) {
      const clone = blocks[index].cloneNode(true);
      candidateRoot.appendChild(clone);
      if (source.query) highlightPreviewQuery(candidateRoot, source.query);
      host.replaceChildren(candidateRoot);
      if (candidateRoot.scrollHeight > height) {
        candidateRoot.removeChild(clone);
        host.replaceChildren(candidateRoot);
        break;
      }
    }
    if (!candidateRoot.children.length) {
      const structuredFallback = trimStructuredPreviewBlock(blocks[0], host, height, source.query || "");
      if (structuredFallback?.children.length) return structuredFallback.cloneNode(true);
      const fallback = buildTextFallbackBlock(blocks[0], source.query || "");
      host.replaceChildren(fallback);
      if (fallback.scrollHeight > height && fallback.firstElementChild?.matches?.("p")) {
        const paragraph = fallback.firstElementChild;
        const words = cleanLabel(paragraph.textContent || "").split(/\s+/).filter(Boolean);
        while (words.length > 12 && fallback.scrollHeight > height) {
          words.pop();
          paragraph.textContent = `${words.join(" ")}...`;
          if (source.query) highlightPreviewQuery(fallback, source.query);
        }
      }
      return fallback.cloneNode(true);
    }
    return candidateRoot.cloneNode(true);
  };

  const findPreviewScrollTarget = (root, source = {}) => {
    if (!root) return null;
    const wantedMatch = normalizeText(source.matchText || "");
    if (wantedMatch) {
      const elements = [...root.querySelectorAll("p,li,blockquote,pre,td,th,h1,h2,h3,h4,h5,h6,div")];
      const block = elements.find((element) => normalizeText(element.textContent || "").includes(wantedMatch));
      if (block) {
        const marked = block.querySelector("mark.bh");
        if (marked) return marked;
        return block;
      }
    }
    return root.querySelector("mark.bh");
  };

  const scrollPreviewSnippetToMatch = (snippet, preview) => {
    if (!snippet || !preview?.snippetQuery) return;
    const scrollToMatch = () => {
      const target = findPreviewScrollTarget(snippet, preview.renderSource || {});
      if (!target) return;
      const offset = Math.max(0, target.offsetTop - 8);
      snippet.scrollTop = offset;
    };
    snippet.scrollTop = 0;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToMatch);
    });
  };

  const getTopLevelPreviewBlock = (article, node) => {
    if (!article || !node) return null;
    let current = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (current && current.parentElement !== article) current = current.parentElement;
    return current && current.parentElement === article ? current : null;
  };

  const uniqueSectionsFromHits = (hits) => {
    const seen = new Set();
    return hits.filter((hit) => {
      const key = `${hit.section?.id || ""}::${normalizeText(hit.section?.label || "")}`;
      if (!key.trim() || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((hit) => hit.section);
  };

  const findDocSearchMatchesFromRendered = async (slug, query) => {
    const q = normalizeText(query);
    if (!q) return null;
    const article = await loadRenderedPreviewArticle(slug);
    if (!article) return null;

    const marksFound = highlightPreviewQuery(article, query);
    const blocks = [...article.children];
    if (!marksFound || !blocks.length) {
      return {
        matched: false,
        docMatched: false,
        sections: [],
        sectionHits: [],
        rowMatches: [],
        rowHitMap: new Map(),
        exampleMatches: [],
        primaryHit: null
      };
    }

    let currentSection = {
      id: "",
      label: getDocTitle(slug),
      text: getDocTitle(slug),
      blockIndex: 0,
      sectionIndex: 0,
      number: "",
      majorNumber: "",
      majorSection: null
    };
    let currentMajorSection = {
      id: "",
      label: getDocTitle(slug),
      text: getDocTitle(slug),
      blockIndex: 0,
      sectionIndex: 0,
      number: "",
      majorNumber: ""
    };
    const blockMeta = new Map();
    blocks.forEach((block, index) => {
      if (isHeadingElement(block)) {
        const number = extractHeadingNumber(block.textContent || "");
        const majorNumber = number ? number.split(".")[0] : (currentMajorSection?.majorNumber || "");
        currentSection = {
          id: block.id || previewSlug(block.textContent || ""),
          label: cleanHeadingLabel(block.textContent || ""),
          text: cleanLabel(block.textContent || ""),
          blockIndex: index,
          sectionIndex: index,
          number,
          majorNumber,
          majorSection: null
        };
        if (majorNumber && (!currentMajorSection?.majorNumber || currentMajorSection.majorNumber !== majorNumber || number === majorNumber)) {
          currentMajorSection = {
            id: currentSection.id,
            label: currentSection.label,
            text: currentSection.text,
            blockIndex: index,
            sectionIndex: index,
            number: number || majorNumber,
            majorNumber
          };
        }
        currentSection.majorSection = currentMajorSection;
      }
      blockMeta.set(block, {
        blockIndex: index,
        section: currentSection,
        majorSection: currentSection.majorSection || currentMajorSection || currentSection
      });
    });

    const rowAnchors = getDocRows(slug)
      .filter((row) => !(slug === "intro" && row.gallery))
      .map((row, index, rows) => {
        const heading = findPreviewSectionStart(article, {
          sectionId: row.jumpId || "",
          sectionLabel: row.jumpLabel || row.label
        });
        const block = getTopLevelPreviewBlock(article, heading);
        const blockIndex = block ? blocks.indexOf(block) : Math.round((index / Math.max(1, rows.length - 1)) * Math.max(0, blocks.length - 1));
        return {
          label: row.label,
          row,
          section: heading ? {
            id: heading.id || row.jumpId || previewSlug(heading.textContent || row.label),
            label: cleanHeadingLabel(heading.textContent || row.jumpLabel || row.label),
            text: cleanLabel(heading.textContent || row.jumpLabel || row.label),
            blockIndex,
            sectionIndex: blockIndex
          } : (findSectionForRow(slug, row) || {
            id: row.jumpId || "",
            label: row.jumpLabel || row.label,
            text: row.jumpLabel || row.label,
            blockIndex,
            sectionIndex: blockIndex
          }),
          sectionIndex: blockIndex,
          sectionOffset: blockIndex
        };
      });

    const markHits = [...article.querySelectorAll("mark.bh")]
      .map((mark, index) => {
        const block = getTopLevelPreviewBlock(article, mark);
        if (!block) return null;
        const meta = blockMeta.get(block) || {
          blockIndex: index,
          section: {
            id: "",
            label: getDocTitle(slug),
            text: getDocTitle(slug),
            blockIndex: index,
            sectionIndex: index,
            number: "",
            majorNumber: ""
          },
          majorSection: {
            id: "",
            label: getDocTitle(slug),
            text: getDocTitle(slug),
            blockIndex: index,
            sectionIndex: index,
            number: "",
            majorNumber: ""
          }
        };
        const sourceText = cleanLabel(block.textContent || "");
        if (!normalizeText(sourceText).includes(q)) return null;
        const sentenceMatchCount = splitIntoSentences(sourceText)
          .filter((sentence) => normalizeText(sentence).includes(q)).length;
        return {
          section: meta.section,
          majorSection: meta.majorSection || meta.section,
          majorNumber: meta.majorSection?.majorNumber || meta.section?.majorNumber || "",
          sectionIndex: meta.section?.sectionIndex ?? meta.blockIndex,
          sectionOffset: meta.blockIndex,
          sourceText,
          exactCount: countExactMatches(sourceText, query),
          sentenceMatchCount: sentenceMatchCount || 1,
          tokenCount: countTokenMatches(sourceText, query),
          matchType: countExactMatches(sourceText, query) > 0 ? "exact" : "loose",
          hasValidSentence: true
        };
      })
      .filter(Boolean);

    const compareHits = (a, b) =>
      (b.exactCount || 0) - (a.exactCount || 0) ||
      (b.sentenceMatchCount || 0) - (a.sentenceMatchCount || 0) ||
      (b.tokenCount || 0) - (a.tokenCount || 0) ||
      (a.sectionOffset || Number.MAX_SAFE_INTEGER) - (b.sectionOffset || Number.MAX_SAFE_INTEGER);
    const majorGroups = new Map();
    markHits.forEach((hit) => {
      const key = `${hit.majorSection?.id || ""}::${hit.majorNumber || ""}` || `${hit.section?.id || ""}::${hit.sectionOffset || ""}`;
      const existing = majorGroups.get(key) || {
        key,
        majorSection: hit.majorSection || hit.section,
        majorNumber: hit.majorNumber || hit.majorSection?.majorNumber || "",
        hits: [],
        sectionOffset: hit.majorSection?.blockIndex ?? hit.sectionOffset ?? 0,
        exactCount: 0,
        sentenceMatchCount: 0,
        tokenCount: 0,
        hitCount: 0,
        primaryHit: null
      };
      existing.hits.push(hit);
      existing.exactCount += hit.exactCount || 0;
      existing.sentenceMatchCount += hit.sentenceMatchCount || 0;
      existing.tokenCount += hit.tokenCount || 0;
      existing.hitCount += 1;
      existing.sectionOffset = Math.min(existing.sectionOffset, hit.sectionOffset ?? existing.sectionOffset);
      if (!existing.primaryHit || compareHits(hit, existing.primaryHit) < 0) {
        existing.primaryHit = hit;
      }
      majorGroups.set(key, existing);
    });

    const rowHitMap = new Map();
    const compareGroupsForRow = (a, b, anchorOffset) =>
      (b.exactCount || 0) - (a.exactCount || 0) ||
      (b.tokenCount || 0) - (a.tokenCount || 0) ||
      (b.hitCount || 0) - (a.hitCount || 0) ||
      (b.sentenceMatchCount || 0) - (a.sentenceMatchCount || 0) ||
      Math.abs((a.sectionOffset ?? Number.MAX_SAFE_INTEGER) - anchorOffset) - Math.abs((b.sectionOffset ?? Number.MAX_SAFE_INTEGER) - anchorOffset) ||
      (a.sectionOffset || Number.MAX_SAFE_INTEGER) - (b.sectionOffset || Number.MAX_SAFE_INTEGER);
    const assignRowHit = (label, group, jumpSection) => {
      const existing = rowHitMap.get(label) || { label, hits: [], groups: [], primaryHit: null, primaryGroup: null, jumpSection: jumpSection || group.majorSection || group.primaryHit?.section };
      if (jumpSection) existing.jumpSection = jumpSection;
      existing.groups.push(group);
      existing.hits.push(...group.hits);
      const anchorOffset = existing.jumpSection?.blockIndex ?? existing.jumpSection?.sectionIndex ?? group.sectionOffset;
      if (!existing.primaryGroup || compareGroupsForRow(group, existing.primaryGroup, anchorOffset) < 0) {
        existing.primaryGroup = group;
        existing.primaryHit = group.primaryHit;
      }
      rowHitMap.set(label, existing);
    };

    [...majorGroups.values()].forEach((group) => {
      if (!rowAnchors.length) return;
      const nearest = [...rowAnchors]
        .sort((a, b) =>
          Math.abs((a.sectionOffset ?? a.sectionIndex) - (group.sectionOffset ?? 0)) -
          Math.abs((b.sectionOffset ?? b.sectionIndex) - (group.sectionOffset ?? 0)) ||
          a.sectionIndex - b.sectionIndex
        )[0];
      if (!nearest) return;
      assignRowHit(nearest.label, group, nearest.section || group.majorSection || group.primaryHit?.section);
    });

    getDocRows(slug).forEach((row) => {
      const label = row.label;
      if (slug === "intro" && row.gallery) return;
      if (!normalizeText(label).includes(q) || rowHitMap.has(label)) return;
      const anchor = rowAnchors.find((entry) => entry.label === label);
      if (!anchor) return;
      const sourceText = cleanLabel((blocks[anchor.sectionIndex]?.textContent) || anchor.section?.text || "");
      if (!normalizeText(sourceText).includes(q)) return;
      assignRowHit(label, {
        majorSection: anchor.section,
        majorNumber: getMajorHeadingNumber(anchor.section?.text || anchor.section?.label || ""),
        hits: [],
        section: anchor.section,
        sectionIndex: anchor.sectionIndex,
        sectionOffset: anchor.sectionOffset,
        sourceText,
        exactCount: countExactMatches(sourceText, query),
        sentenceMatchCount: splitIntoSentences(sourceText).filter((sentence) => normalizeText(sentence).includes(q)).length || 1,
        tokenCount: countTokenMatches(sourceText, query),
        hitCount: 1,
        matchType: "loose",
        primaryHit: {
          section: anchor.section,
          majorSection: anchor.section,
          majorNumber: getMajorHeadingNumber(anchor.section?.text || anchor.section?.label || ""),
          sectionIndex: anchor.sectionIndex,
          sectionOffset: anchor.sectionOffset,
          sourceText,
          exactCount: countExactMatches(sourceText, query),
          sentenceMatchCount: splitIntoSentences(sourceText).filter((sentence) => normalizeText(sentence).includes(q)).length || 1,
          tokenCount: countTokenMatches(sourceText, query),
          matchType: "loose"
        }
      }, anchor.section);
    });

    const exampleMatches = slug === "intro"
      ? getIntroGalleryItems().filter((section) => normalizeText(buildExamplePreviewText(section)).includes(q))
      : [];
    const introGalleryRowLabel = getDocRows("intro").find((row) => row.gallery)?.label || "";
    if (slug === "intro" && exampleMatches.length && introGalleryRowLabel) {
      const exampleText = buildExamplePreviewText(exampleMatches[0]);
      assignRowHit(introGalleryRowLabel, {
        majorSection: exampleMatches[0],
        majorNumber: "",
        hits: [],
        section: exampleMatches[0],
        sectionIndex: Number.MAX_SAFE_INTEGER,
        sectionOffset: Number.MAX_SAFE_INTEGER,
        sourceText: exampleText,
        exactCount: countExactMatches(exampleText, query),
        sentenceMatchCount: splitIntoSentences(exampleText).filter((sentence) => normalizeText(sentence).includes(q)).length,
        tokenCount: countTokenMatches(exampleText, query),
        hitCount: 1,
        matchType: "exact",
        primaryHit: {
          section: exampleMatches[0],
          majorSection: exampleMatches[0],
          majorNumber: "",
          sectionIndex: Number.MAX_SAFE_INTEGER,
          sectionOffset: Number.MAX_SAFE_INTEGER,
          sourceText: exampleText,
          exactCount: countExactMatches(exampleText, query),
          sentenceMatchCount: splitIntoSentences(exampleText).filter((sentence) => normalizeText(sentence).includes(q)).length,
          tokenCount: countTokenMatches(exampleText, query),
          matchType: "exact"
        }
      }, exampleMatches[0]);
    }

    if (rowHitMap.size > 3) {
      const ranked = [...rowHitMap.entries()]
        .map(([label, entry]) => {
          const ph = entry.primaryHit || {};
          const pg = entry.primaryGroup || {};
          const hitOffset = ph.sectionOffset ?? ((ph.sectionIndex || 0) * 1000);
          const anchorDist = rowAnchors.length
            ? Math.min(...rowAnchors
              .filter((a) => a.label === label)
              .map((a) => Math.abs((a.sectionOffset ?? a.sectionIndex) - hitOffset)))
            : 0;
          return {
            label,
            entry,
            exactCount: pg.exactCount || ph.exactCount || 0,
            sentenceMatchCount: pg.sentenceMatchCount || ph.sentenceMatchCount || 0,
            tokenCount: pg.tokenCount || ph.tokenCount || 0,
            hitCount: pg.hitCount || 0,
            anchorDist: isFinite(anchorDist) ? anchorDist : 9999,
            sectionOffset: hitOffset
          };
        })
        .sort((a, b) =>
          b.exactCount - a.exactCount ||
          b.hitCount - a.hitCount ||
          b.sentenceMatchCount - a.sentenceMatchCount ||
          b.tokenCount - a.tokenCount ||
          a.anchorDist - b.anchorDist ||
          a.sectionOffset - b.sectionOffset
        );
      const keep = new Set(ranked.slice(0, 3).map((r) => r.label));
      [...rowHitMap.keys()].forEach((label) => {
        if (!keep.has(label)) rowHitMap.delete(label);
      });
    }

    const primaryEntry = [...rowHitMap.values()]
      .filter((entry) => entry.primaryHit)
      .sort((a, b) =>
        (b.primaryGroup?.exactCount || b.primaryHit?.exactCount || 0) - (a.primaryGroup?.exactCount || a.primaryHit?.exactCount || 0) ||
        (b.primaryGroup?.hitCount || 0) - (a.primaryGroup?.hitCount || 0) ||
        (b.primaryGroup?.tokenCount || b.primaryHit?.tokenCount || 0) - (a.primaryGroup?.tokenCount || a.primaryHit?.tokenCount || 0) ||
        (a.primaryHit?.sectionOffset || Number.MAX_SAFE_INTEGER) - (b.primaryHit?.sectionOffset || Number.MAX_SAFE_INTEGER)
      )[0];
    const primaryHit = primaryEntry?.primaryHit || markHits[0] || null;

    return {
      matched: markHits.length > 0 || rowHitMap.size > 0,
      docMatched: markHits.length > 0,
      sections: uniqueSectionsFromHits(markHits),
      sectionHits: markHits,
      rowMatches: [...rowHitMap.keys()],
      rowHitMap,
      exampleMatches,
      primaryHit
    };
  };

  const writeTheme = (value) => {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch { }
  };

  const readTheme = () => {
    try {
      const value = localStorage.getItem(THEME_KEY);
      if (value === "balanced" || value === "dark" || value === "light") return value;
      if (value === "half" || value === "auto") return "balanced";
    } catch { }
    return "light";
  };

  const readLavaEnabled = () => {
    try {
      const raw = localStorage.getItem(LAVA_ENABLED_KEY);
      if (raw == null) return true;
      return raw !== "0" && raw !== "false";
    } catch { }
    return true;
  };

  const writeLavaEnabled = (enabled) => {
    try {
      localStorage.setItem(LAVA_ENABLED_KEY, enabled ? "1" : "0");
    } catch { }
  };

  const applyTheme = (mode) => {
    const body = document.body;
    if (!body) return;
    ["light", "balanced", "dark"].forEach((theme) => body.classList.remove(`theme-${theme}`));
    body.classList.add(`theme-${mode}`);
    body.classList.toggle("dark", mode !== "light");
    body.dataset.themeMode = mode;
  };

  const applyLavaEnabled = (enabled) => {
    const body = document.body;
    if (!body) return;
    const on = !!enabled;
    body.classList.toggle("lava-enabled", on);
    body.classList.toggle("lava-disabled", !on);
    body.dataset.lavaEnabled = on ? "1" : "0";
    window.dispatchEvent(new CustomEvent("bcode:lavalamp-toggle", { detail: { enabled: on } }));
  };

  const setGlassMode = (enabled) => {
    const body = document.body;
    if (!body) return;
    if (enabled) {
      body.dataset.glassMode = "on";
      try { sessionStorage.setItem(GLASS_STORAGE_KEY, "1"); } catch { }
    } else {
      delete body.dataset.glassMode;
      try { sessionStorage.removeItem(GLASS_STORAGE_KEY); } catch { }
    }
  };

  const restoreGlassMode = () => {
    try {
      setGlassMode(sessionStorage.getItem(GLASS_STORAGE_KEY) === "1");
    } catch {
      setGlassMode(false);
    }
  };

  window.addEventListener("bcode:glass-mode", (event) => {
    setGlassMode(!!event.detail?.enabled);
  });

  const docsData = (window.__TREE_DOCS_DATA__ || []).filter((doc) => READER_FILE_MAP[doc.slug]);
  const readerSections = window.__TREE_READER_SECTIONS__ || {};
  const docsBySlug = new Map(docsData.map((doc) => [doc.slug, doc]));
  const TREE_SLUGS = [...new Set(TREE_LAYOUT.filter((node) => node.slug).map((node) => node.slug))];

  const state = {
    query: "",
    activeNodeId: "",
    activeRowKey: "",
    hoveredNodeId: "",
    hoveredRowKey: "",
    selection: null,
    galleryExpanded: false,
    preview: null,
    mobilePreviewOpen: false,
    searchResults: new Map()
  };
  let searchUpdateToken = 0;

  const TREE_SITEMAP_VIEWBOX = {
    width: 1150.5081,
    height: 1008.1333
  };
  const TREE_UPPER_CLUSTER_SHIFT_PX = 11;
  const TREE_LAYOUT_BASE = {
    stackWidth: 1200,
    mapInnerWidth: 1150.5081,
    mapInnerHeight: 1008.1333,
    previewWidth: 520,
    galleryWidth: 520,
    panelGap: 24,
    viewportRightPad: 18
  };
  const TREE_1080_GEOMETRY_SCALE = 1.2;
  const TREE_PHONE_VIEW_MAX = 599;
  const TREE_CARD_PADDING = {
    x: 0,
    y: 0
  };
  const treeInitialDpr = window.devicePixelRatio || 1; // kept for reference, not used for layout decisions

  const shouldUse1080GeometryScale = () => {
    const viewportHeight = Math.max(0, window.innerHeight || document.documentElement?.clientHeight || 0);
    const viewportWidth = Math.max(0, window.innerWidth || document.documentElement?.clientWidth || 0);
    return viewportHeight <= 1100 && viewportWidth >= 1500;
  };

  const readerHref = (slug, options = {}) => {
    const file = READER_FILE_MAP[slug];
    if (!file) return "";
    const params = new URLSearchParams();
    if (options.searchQuery) params.set("q", options.searchQuery);
    if (options.jump) params.set("jump", options.jump);
    if (options.searchOpen) params.set("search", "1");
    const query = params.toString();
    const hash = options.hash ? `#${options.hash}` : "";
    return `${file}${query ? `?${query}` : ""}${hash}`;
  };

  const getDocSummary = (slug) => DOC_PORTAL_META[slug]?.summary || docsBySlug.get(slug)?.description || "";
  const getDocMetaLabel = (slug) => docsBySlug.get(slug)?.preview_title || "";
  const getDocTitle = (slug) => docsBySlug.get(slug)?.display_title || slug;
  const getDocRows = (slug) => (DOC_ROW_CONFIGS[slug] || []).map((row) => ({ ...row, type: "row" }));
  const getDocRowConfig = (slug, label) => getDocRows(slug).find((row) => row.label === label) || null;
  const countWords = (text) => cleanLabel(text).split(/\s+/).filter(Boolean).length;
  const ensureSentence = (text) => {
    const clean = cleanLabel(text);
    if (!clean) return "";
    return /[.!?]$/.test(clean) ? clean : `${clean}.`;
  };
  const appendPreviewSentence = (text, addition) => {
    const base = ensureSentence(text);
    const next = ensureSentence(typeof addition === "function" ? addition() : addition);
    if (!next) return base;
    if (normalizeText(base).includes(normalizeText(next))) return base;
    return `${base} ${next}`;
  };
  const expandPreviewParagraph = (text, minWords, additions = []) => {
    let result = ensureSentence(text);
    additions.forEach((addition) => {
      if (countWords(result) >= minWords) return;
      result = appendPreviewSentence(result, addition);
    });
    return result;
  };
  const TITLE_PARAGRAPH_REWRITES = {
    intro: [
      null,
      "Taken as a complete narrative, the introduction links parser determinism, atomic latching, batching, and worked examples into one explanation of how the stack should be read. By the time it closes, the reader understands why later pages split into syntax, interpretation, control conventions, and deployment guidance while still belonging to the same stream-first engineering argument."
    ],
    syntax: [
      null,
      "Read in full, the syntax document turns byte classes, terminators, payload modes, and numeric forms into a parser contract that other layers can trust without renegotiating structure. It is the page that prevents later semantic or operational conventions from quietly inventing their own grammar, because every downstream rule still has to inherit the same legal line shape and recovery behavior."
    ],
    interpretation: [
      null,
      "Taken as a semantic layer, the document shows how accepted lines become trustworthy values without severing quality, bounds, freshness, or diagnostic meaning from the field. It gives the rest of the stack a disciplined account of what software may expose, reduce, or automate, which is why later APIs and operational policies can stay honest instead of improvising their own value logic."
    ],
    "meta-v9": [
      null,
      "Read end to end, the control-plane conventions explain how ordinary BCODe lines grow into request-response workflows, batching rules, continuity signaling, and emitted analysis events without leaving the flat wire behind. The page matters because it turns inspectable syntax into inspectable interaction, letting logs, tools, and operators see conversation state directly rather than reconstructing it from transport folklore."
    ],
    "meta-library-semantics": [
      null,
      "Taken together, the page explains how protocol truth survives contact with software boundaries. It connects parser results, recovery events, units, and event mapping to public API obligations, so libraries can stay ergonomic while still telling the truth about continuity, quality, and control behavior in code that other teams will actually consume."
    ],
    rest: [
      null,
      "Read as an operational model, the document shows how resource identity, staged responses, ordinals, feeds, and action categories coexist without turning the wire into a document envelope. The result is a resource layer that remains inspectable under live traffic, giving applications a richer behavioral vocabulary while keeping the same line-oriented discipline that made the lower layers reliable."
    ],
    "best-practices": [
      null,
      "Taken seriously, the guidance in this page explains how stable schemas, restrained field design, explicit failure behavior, and transport-aware deployment keep the rest of the stack readable over time. It is less about style than about survival, because long-lived protocol ecosystems degrade fastest when local shortcuts are allowed to masquerade as harmless convenience."
    ],
    "telemetry-guide": [
      null,
      "Read as a progression rather than a reference, the guide shows how the same core rules support bench telemetry, closed-loop control, richer semantics, and layered deployment conventions without requiring a reset at each stage. That progression makes the page useful as an engineering roadmap, because it explains how complexity can accumulate while the stream remains inspectable, truthful, and operationally manageable."
    ]
  };
  const TITLE_NARRATIVE_APPENDICES = {
    intro: [
      "By starting with interruption, recovery, and commit visibility, the page teaches why the protocol is optimized for live systems before it teaches any higher-level naming scheme.",
      "That larger framing keeps the rest of the stack from reading like separate manuals, because each later document can extend the same stream-first logic instead of reintroducing its own worldview."
    ],
    syntax: [
      "Every later page inherits that discipline, which is why the syntax chapter spends so much time on byte classes, termination rules, and recoverable structure.",
      "The broader effect is that semantic and operational layers can build upward without reopening questions about what the wire is allowed to mean structurally."
    ],
    interpretation: [
      "That choice prevents convenience APIs from laundering away uncertainty, and it gives downstream tooling a basis for treating measured reality as something richer than a scalar payload.",
      "Seen beside the rest of the architecture, the page defines what later reducers, accessors, and libraries must preserve if they want to stay faithful to the field."
    ],
    "meta-v9": [
      "Requests, responses, unsolicited events, and resets are therefore treated as readable line conventions rather than as invisible session machinery.",
      "Because the document keeps interaction on the same visible wire, later tooling can expose conversation state without inventing a second control grammar around the protocol."
    ],
    "meta-library-semantics": [
      "The result is guidance for software surfaces that need to be comfortable for developers without becoming dishonest about what the stream actually said.",
      "It also clarifies where convenience is acceptable and where convenience would cross into distortion once continuity, loss, or control semantics need to reach application code."
    ],
    rest: [
      "Instead of layering a document protocol on top, the page shows how long-lived operations can emerge from the same compact, log-friendly line grammar.",
      "That perspective keeps the resource layer grounded in observable wire behavior, so richer workflows still remain debuggable when traffic becomes asynchronous and long-lived."
    ],
    "best-practices": [
      "Each recommendation exists to stop real systems from drifting away from the properties that made the base format legible and dependable in the first place.",
      "What emerges is a deployment discipline built around readable truth, explicit boundaries, and habits that keep interoperability from eroding under scale."
    ],
    "telemetry-guide": [
      "Each scenario preserves continuity with the earlier ones, so the reader can see how the stack expands without pretending that prototype and production concerns live in different worlds.",
      "That continuity is what makes the guide useful as a planning document, not just a motivational one, because it shows how each added layer changes operations without invalidating the earlier stream."
    ]
  };
  const ROW_NARRATIVE_APPENDICES = {
    intro: [
      "The surrounding discussion keeps tying the topic back to parser recovery, visible commit points, and readable wire form, so the idea never floats free as a matter of stylistic preference alone.",
      "Read in the full arc of the introduction, the section shows why later examples and higher-layer conventions still inherit the same stream-first discipline introduced at the beginning."
    ],
    syntax: [
      "The surrounding rules keep circling back to what an encoder, decoder, or validator can guarantee at the byte level, which makes the topic practical instead of merely formal.",
      "Read with the adjacent sections, the discussion makes clear why legal form, preserved spelling, and conformance evidence belong to the same parser contract."
    ],
    interpretation: [
      "What follows in the document depends on that honesty, because reducers, accessors, and APIs only stay trustworthy when the field carries its uncertainty and operational status forward.",
      "In sequence with the rest of the page, the topic explains how software can expose convenience without pretending that ambiguous or degraded measurements were ever simple."
    ],
    "meta-v9": [
      "The surrounding sections use that same logic to keep batching, ordering, resets, and emitted events visible as protocol behavior rather than transport folklore.",
      "Seen in the full document, the topic shows how long-lived conversation state can remain inspectable by tooling, operators, and application code at the same time."
    ],
    "meta-library-semantics": [
      "The page keeps tying every library choice back to what an application must still be able to learn about continuity, units, events, and loss once the raw traffic has been parsed.",
      "That wider context is what keeps the section from reading like API style advice, because every surface decision is measured against whether protocol truth survives export."
    ],
    rest: [
      "Later sections keep reusing that foundation to explain how reads, writes, controls, feeds, and staged results can stay correlated on a single continuous stream.",
      "Taken with the rest of the document, the topic explains how operational behavior becomes richer without sacrificing the clarity that made the underlying wire practical to debug."
    ],
    "best-practices": [
      "The surrounding guidance keeps linking modeling choices to long-term interoperability, so the advice reads as operational risk control rather than stylistic preference.",
      "Across the full page, the topic shows how readable streams, stable schemas, and transport honesty reinforce one another once a protocol has to survive multiple products and teams."
    ],
    "telemetry-guide": [
      "The scenarios around it keep translating those rules into field realities like degraded measurements, asynchronous control, and growth from ad hoc streams to maintained conventions.",
      "Read with the rest of the guide, the topic becomes part of a larger story about scaling behavior without losing wire-level visibility or engineering caution."
    ]
  };
  const PREVIEW_BULLET_REWRITES = new Map([
    ["This page establishes the mental model.", "The mental model is established here."],
    ["This section anchors the stack.", "The rest of the stack takes shape here."],
    ["The late-document anchor stays practical.", "Practical wire patterns gather at the end."],
    ["This jump favors immediate application.", "Immediate application is the point."],
    ["This is the structural entry point.", "The structural entry point stays explicit."],
    ["This section defines legal number layouts.", "Legal number layouts become explicit."],
    ["This section reframes the field.", "The field is reframed here."],
    ["This section joins semantics to code.", "Semantics and code meet directly."],
    ["This section turns meaning into policy.", "Meaning turns into policy here."],
    ["This is the interaction entry point.", "Interaction begins from a shared wire grammar."],
    ["This section hardens stream reliability.", "Stream reliability becomes explicit."],
    ["This section closes the meta workflow.", "The meta workflow closes with observable state."],
    ["The software boundary becomes explicit.", "The software boundary becomes explicit."],
    ["This section protects application context.", "Application context stays protected."],
    ["The implementation loop closes cleanly.", "The implementation loop closes cleanly."],
    ["The rest model opens clearly.", "The rest model opens clearly."],
    ["This section structures ongoing exchanges.", "Ongoing exchanges gain clear structure."],
    ["The page resolves into one operational model.", "The page resolves into one operational model."],
    ["The rest of the specification inherits its framing here.", "The rest of the specification inherits its framing here."],
    ["Guidance turns directly into operations.", "Guidance turns directly into operations."],
    ["The practical rationale begins here.", "The practical rationale begins here."],
    ["This section explains wire-level honesty.", "Wire-level honesty becomes explicit."],
    ["The guide closes with scale and continuity in view.", "The guide closes with scale and continuity in view."],
    ["The guide closes with scale and continuity in view.", "The guide closes with scale and continuity in view."],
    ["This page connects rules to operations.", "Rules connect directly to operations here."]
  ]);
  const polishTitleParagraph = (slug, paragraph, index) => {
    let text = cleanLabel(TITLE_PARAGRAPH_REWRITES[slug]?.[index] || paragraph);
    if (!text) return "";
    const additions = [];
    if (TITLE_NARRATIVE_APPENDICES[slug]?.[index]) additions.push(TITLE_NARRATIVE_APPENDICES[slug][index]);
    if (index === 0) {
      additions.push(
        "The discussion keeps tying formal rules to failure cases, operator visibility, and long-lived maintenance pressure, so the subject reads like engineering method rather than isolated specification text.",
        "That approach gives the reader a durable mental model for later sections, because the document explains not only what to do but why the stack depends on doing it that way."
      );
    } else {
      additions.push(
        "Seen alongside the rest of the architecture, the page defines a clear layer boundary that later documents can extend without reinterpreting its core assumptions.",
        "That is why the document feels larger than a reference chapter: it explains what neighboring pages may assume, refine, or deliberately leave untouched."
      );
    }
    return expandPreviewParagraph(text, index === 0 ? 132 : 118, additions);
  };
  const polishRowParagraph = (slug, label, paragraph, index) => {
    let text = cleanLabel(paragraph);
    if (!text) return "";
    const replacements = [
      [/^This row now lands on/i, "The section covers"],
      [/^This row maps to/i, "The section covers"],
      [/^This row moves to/i, "The section covers"],
      [/^This row goes to/i, "The section covers"],
      [/^This row jumps into/i, "The section covers"],
      [/^This row jumps to/i, "The section covers"],
      [/^This row lands on/i, "The section covers"],
      [/^This row lands in/i, "The section covers"],
      [/^As a quick jump, it works because/i, "The section matters because"],
      [/^It is a useful mid-document anchor because/i, "The section matters because"],
      [/^It also works as a late-document anchor because/i, "The section matters because"],
      [/^It is also an intentionally early anchor\./i, "The foundation it provides is deliberate."],
      [/^Placed near the middle of the document, this anchor is/i, "The section is"],
      [/^As a late anchor, it is intentionally downstream of/i, "It builds on"],
      [/^It is the right early anchor because/i, "The foundation matters because"],
      [/^It works as a mid-document quick jump because/i, "The section matters because"],
      [/^As a late anchor, it is valuable because/i, "The section matters because"],
      [/^It is an early anchor on purpose\./i, "The foundation it provides is deliberate."],
      [/^As a middle anchor, it is where/i, "It is where"],
      [/^That makes it a valuable final anchor in the document\./i, "That positioning within the specification matters."],
      [/^As an early anchor, it is the right place to start because/i, "It is the right place to start because"],
      [/^As a final anchor, it works because/i, "The section matters because"],
      [/^As an early anchor, it prepares the reader for everything that follows\./i, "The section prepares the reader for everything that follows."],
      [/^It is a strong final anchor for the document because/i, "The section matters because"],
      [/^That framing matters for the rest of the page\./i, "That framing shapes the rest of the specification."],
      [/^As a mid-document anchor, it/i, "The section"],
      [/^It is an effective late anchor because/i, "The section matters because"],
      [/^It is a strong first anchor because/i, "The section matters because"],
      [/^As a middle anchor, it is the point where/i, "It is the point where"],
      [/^As a final anchor, it captures/i, "The section captures"]
    ];
    replacements.some(([pattern, replacement]) => {
      if (!pattern.test(text)) return false;
      text = text.replace(pattern, replacement);
      return true;
    });
    text = text
      .replace(/\bquick jump\b/gi, "section")
      .replace(/\banchor\b/gi, "foundation")
      .replace(/\bBy landing here,\b/gi, "Once understood,")
      .replace(/\bBy the time the reader arrives here,\b/gi, "Once the preceding material is understood,")
      .replace(/\bIt is the place a reader visits when\b/gi, "It is the reference for when");
    const additions = [];
    if (ROW_NARRATIVE_APPENDICES[slug]?.[index]) additions.push(ROW_NARRATIVE_APPENDICES[slug][index]);
    if (index === 0) {
      additions.push(
        "The surrounding document keeps tying local rules to parser behavior, software consequences, and operational readability, so the explanation remains grounded in use instead of floating as abstract terminology.",
        "Because the section is read against nearby topics rather than in isolation, it gives the reader a sturdier way to understand why the document was organized in this particular order."
      );
    } else {
      additions.push(
        "Seen in sequence, the discussion explains what nearby sections already assume, what later sections refine, and what would become harder to trust if this part of the argument were skipped.",
        "That keeps the paragraph reading like continuation rather than commentary, so the explanation stays narrative instead of collapsing into a copied heading note."
      );
    }
    return expandPreviewParagraph(text, index === 0 ? 124 : 112, additions);
  };
  const polishPreviewBullet = (bullet) => {
    const clean = cleanLabel(bullet);
    if (!clean) return "";
    return ensureSentence(PREVIEW_BULLET_REWRITES.get(clean) || clean);
  };
  const getDocPreviewContent = (slug) =>
    DOC_NODE_PREVIEWS[slug]
      ? {
        paragraphs: (DOC_NODE_PREVIEWS[slug].paragraphs || []).map((paragraph, index) => polishTitleParagraph(slug, paragraph, index)),
        bullets: (DOC_NODE_PREVIEWS[slug].bullets || []).map((bullet) => polishPreviewBullet(bullet)).filter(Boolean)
      }
      : {
        paragraphs: [cleanLabel(`${getDocTitle(slug)}. ${getDocSummary(slug)} ${docsBySlug.get(slug)?.description || ""}`)],
        bullets: []
      };
  const getRowPreviewContent = (slug, label, section = null) => {
    const row = getDocRowConfig(slug, label);
    if (row) {
      return {
        paragraphs: (row.paragraphs || []).map((paragraph, index) => polishRowParagraph(slug, label, paragraph, index)),
        bullets: (row.bullets || []).map((bullet) => polishPreviewBullet(bullet)).filter(Boolean)
      };
    }
    return {
      paragraphs: [section ? buildSectionPreviewText(slug, section) : cleanLabel(`${getDocTitle(slug)}. ${getDocSummary(slug)}`)],
      bullets: []
    };
  };

  const getSectionsForSlug = (slug) => Array.isArray(readerSections[slug]) ? readerSections[slug] : [];
  const docContains = (slug, query) => {
    const q = normalizeText(query);
    if (!q) return false;
    const doc = docsBySlug.get(slug);
    if (!doc) return false;
    const blob = [
      doc.display_title,
      doc.preview_title,
      getDocSummary(slug),
      ...getDocRows(slug).map((row) => row.label),
      ...getSectionsForSlug(slug).map((section) => section.label),
      doc.corpus_text
    ].join(" ");
    return normalizeText(blob).includes(q);
  };
  const normalizeId = (id) => String(id || "").replace(/[\u0080-\uFFFF]+/g, "").toLowerCase();
  const coerceRowSection = (slug, row, section = null) => {
    if (!row) return section;
    const label = cleanLabel(row.jumpLabel || section?.label || row.label || "");
    const id = String(row.jumpId || section?.id || previewSlug(label || row.label || ""));
    if (!section && !id && !label) return null;
    return {
      ...(section || {}),
      id,
      label,
      excerpt: section?.excerpt || getDocSummary(slug),
      text: section?.text || ""
    };
  };
  const findSectionById = (slug, id) => {
    const sections = getSectionsForSlug(slug);
    const exact = sections.find((section) => section.id === id);
    if (exact) return exact;
    const nid = normalizeId(id);
    if (!nid) return null;
    return sections.find((section) => normalizeId(section.id) === nid) || null;
  };
  const findSectionForRow = (slug, rowOrLabel) => {
    const row = typeof rowOrLabel === "string" ? getDocRowConfig(slug, rowOrLabel) : rowOrLabel;
    if (!row) return null;
    if (row.jumpId) {
      const exactById = findSectionById(slug, row.jumpId);
      if (exactById) return coerceRowSection(slug, row, exactById);
    }
    if (row.jumpLabel) {
      const exactByLabel = getSectionsForSlug(slug).find((section) => {
        const sectionLabel = normalizeText(cleanLabel(section.label));
        const wanted = normalizeText(cleanLabel(row.jumpLabel));
        return sectionLabel === wanted;
      });
      if (exactByLabel) return coerceRowSection(slug, row, exactByLabel);
    }
    return coerceRowSection(slug, row, null);
  };
  const findSectionByLabel = (slug, label) => {
    const wanted = normalizeText(label);
    if (!wanted) return null;
    const sections = getSectionsForSlug(slug);
    const rowSection = findSectionForRow(slug, label);
    if (rowSection) return rowSection;
    const directAnchor = SUBTOPIC_ANCHORS[slug] && SUBTOPIC_ANCHORS[slug][label];
    if (directAnchor) {
      return findSectionById(slug, directAnchor) || {
        label,
        id: directAnchor,
        excerpt: getDocSummary(slug)
      };
    }
    const exact = sections.find((section) => normalizeText(section.label) === wanted);
    if (exact) return exact;
    const terms = wanted.split(/\s+/).filter(Boolean);
    return sections.find((section) => terms.every((term) => normalizeText(section.label).includes(term))) || null;
  };

  const getIntroGalleryItems = () =>
    getSectionsForSlug("intro").filter((section) => String(section.number || "").startsWith("19."));

  const getSectionDisplayLabel = (section) => {
    if (!section) return "";
    if (String(section.number || "").startsWith("19.")) {
      return INTRO_GALLERY_LABEL_OVERRIDES[String(section.number || "")] || cleanLabel(section.label || "");
    }
    return cleanLabel(section.label || "");
  };
  const getCanonicalSectionId = (section) => {
    if (!section) return "";
    const displayLabel = getSectionDisplayLabel(section);
    const derivedId = previewSlug(`${section.number || ""} ${displayLabel}`);
    return derivedId || String(section.id || "");
  };

  const sectionSearchModelCache = new Map();
  const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const buildSectionFallbackText = (slug, section) => cleanLabel(
    `${section?.label || getDocTitle(slug)}. ${section?.text || section?.excerpt || getDocSummary(slug)}`
  );
  const buildSectionSearchModel = (slug) => {
    if (sectionSearchModelCache.has(slug)) return sectionSearchModelCache.get(slug);
    const doc = docsBySlug.get(slug);
    const sections = getSectionsForSlug(slug);
    const corpus = cleanLabel(doc?.corpus_text || "");
    if (!sections.length || !corpus) {
      const empty = { corpus, entries: [], byId: new Map() };
      sectionSearchModelCache.set(slug, empty);
      return empty;
    }
    const corpusLower = corpus.toLowerCase();
    let cursor = 0;
    const entries = sections.map((section, index) => {
      const candidates = [
        cleanLabel(section?.text || ""),
        cleanLabel(section?.number ? `${section.number}. ${section.label || ""}` : ""),
        cleanLabel(section?.label || "")
      ].filter(Boolean).sort((a, b) => b.length - a.length);
      let sectionOffset = -1;
      for (const candidate of candidates) {
        const candidateLower = candidate.toLowerCase();
        const localStart = Math.max(0, cursor - 120);
        const nearPos = corpusLower.indexOf(candidateLower, localStart);
        if (nearPos !== -1) {
          sectionOffset = nearPos;
          break;
        }
        const globalPos = corpusLower.indexOf(candidateLower);
        if (globalPos !== -1) {
          sectionOffset = globalPos;
          break;
        }
      }
      if (sectionOffset < 0) {
        sectionOffset = Math.floor((index / Math.max(1, sections.length - 1)) * Math.max(1, corpus.length - 1));
      }
      if (sectionOffset < cursor) sectionOffset = cursor;
      cursor = Math.max(cursor, sectionOffset + 1);
      return {
        section,
        sectionIndex: index,
        sectionOffset,
        passage: ""
      };
    });
    let runningOffset = 0;
    entries.forEach((entry) => {
      entry.sectionOffset = Math.max(entry.sectionOffset, runningOffset);
      runningOffset = entry.sectionOffset;
    });
    entries.forEach((entry, index) => {
      const nextOffset = index < entries.length - 1 ? entries[index + 1].sectionOffset : corpus.length;
      const endOffset = Math.min(
        corpus.length,
        Math.max(entry.sectionOffset + 1, nextOffset)
      );
      const sliceText = cleanLabel(corpus.slice(entry.sectionOffset, endOffset));
      entry.passage = sliceText.length >= 48 ? sliceText : buildSectionFallbackText(slug, entry.section);
    });
    const model = {
      corpus,
      entries,
      byId: new Map(entries.map((entry) => [entry.section?.id, entry]))
    };
    sectionSearchModelCache.set(slug, model);
    return model;
  };
  const getSectionSearchEntry = (slug, section) => {
    if (!section) return null;
    const model = buildSectionSearchModel(slug);
    if (section.id && model.byId.has(section.id)) return model.byId.get(section.id);
    return model.entries.find((entry) => normalizeText(entry.section?.label) === normalizeText(section.label)) || null;
  };
  const getSectionAnchorOffset = (slug, section) => {
    const entry = getSectionSearchEntry(slug, section);
    if (entry) return entry.sectionOffset;
    const sections = getSectionsForSlug(slug);
    const sectionIndex = sections.findIndex((row) => row.id === section?.id || normalizeText(row.label) === normalizeText(section?.label));
    return sectionIndex >= 0 ? sectionIndex * 1000 : 0;
  };
  const buildSectionPreviewText = (slug, section) => {
    const entry = getSectionSearchEntry(slug, section);
    return cleanLabel(entry?.passage || buildSectionFallbackText(slug, section));
  };
  const buildExamplePreviewText = (section) => cleanLabel(
    `${getSectionDisplayLabel(section) || "Example"}. ${section?.text || section?.excerpt || ""}`
  );
  const splitIntoSentences = (text) => {
    const clean = cleanLabel(text);
    if (!clean) return [];
    const sentences = [];
    let start = 0;
    for (let i = 0; i < clean.length; i += 1) {
      const ch = clean[i];
      if (ch !== "." && ch !== "!" && ch !== "?") continue;
      const segment = cleanLabel(clean.slice(start, i + 1));
      const nextChunk = clean.slice(i + 1);
      const nextCharMatch = nextChunk.match(/\S/);
      const nextChar = nextCharMatch ? nextCharMatch[0] : "";
      if (ch === "." && /\d/.test(clean[i - 1] || "") && /\d/.test(nextChar)) continue;
      if (/^\d+(\.\d+)*\.$/.test(segment)) continue;
      if (nextChar && !/[A-Z"(]/.test(nextChar)) continue;
      if (segment) sentences.push(segment);
      start = i + 1;
    }
    const tail = cleanLabel(clean.slice(start));
    if (tail) sentences.push(tail);
    return sentences.length ? sentences : [clean];
  };
  const buildPreviewBulletPoints = (preview) => {
    if (!preview || preview.snippetQuery) return [];
    return Array.isArray(preview.snippetBullets) ? preview.snippetBullets.slice(0, 10) : [];
  };
  const renderPreviewContentHtml = (paragraphs, query, bullets = []) => {
    const bodyHtml = paragraphs.map((paragraph) =>
      `<p class="tree-preview-snippet-text">${highlightQueryHtml(paragraph, query)}</p>`
    ).join("");
    if (!bullets.length) return bodyHtml;
    const bulletsHtml = bullets.map((bullet) => `<li>${esc(bullet)}</li>`).join("");
    return `${bodyHtml}<ul class="tree-preview-snippet-bullets">${bulletsHtml}</ul>`;
  };
  const highlightQueryHtml = (text, query) => {
    const clean = cleanLabel(text);
    if (!clean) return "";
    if (!query) return esc(clean);
    const pattern = new RegExp(escapeRegex(query), "ig");
    let lastIndex = 0;
    let html = "";
    let match;
    while ((match = pattern.exec(clean))) {
      html += esc(clean.slice(lastIndex, match.index));
      html += `<mark>${esc(match[0])}</mark>`;
      lastIndex = match.index + match[0].length;
      if (!pattern.global) break;
    }
    html += esc(clean.slice(lastIndex));
    return html;
  };
  const ensurePreviewMeasurer = () => {
    let measurer = document.getElementById("treePreviewSnippetMeasure");
    if (measurer) return measurer;
    measurer = document.createElement("div");
    measurer.id = "treePreviewSnippetMeasure";
    measurer.className = "tree-preview-snippet tree-preview-snippet-measure";
    document.body.appendChild(measurer);
    return measurer;
  };
  const fitPreviewSentences = (paragraphs, query, bullets = []) => {
    const sourceParagraphs = (Array.isArray(paragraphs) ? paragraphs : [paragraphs])
      .map((paragraph) => cleanLabel(paragraph))
      .filter(Boolean);
    if (!sourceParagraphs.length) return "";
    const snippetEl = $("#treePreviewSnippet");
    const bodyEl = snippetEl?.closest(".tree-preview-body");
    const summaryEl = $("#treePreviewSummary");
    const pillsEl = $("#treePreviewSubrows");
    if (!snippetEl || !bodyEl || !summaryEl || !pillsEl) {
      const sentences = splitIntoSentences(sourceParagraphs[0]);
      let startIndex = 0;
      if (query) {
        const nq = normalizeText(query);
        const validIdx = sentences.findIndex((s) => normalizeText(s).includes(nq) && isValidPreviewSentence(s));
        const anyIdx = sentences.findIndex((s) => normalizeText(s).includes(nq));
        startIndex = validIdx >= 0 ? validIdx : (anyIdx >= 0 ? anyIdx : 0);
      }
      return renderPreviewContentHtml([sentences.slice(startIndex, startIndex + 2).join(" ")], query, []);
    }

    const bodyGap = parseFloat(getComputedStyle(bodyEl).gap) || 0;
    const availableHeight = Math.max(
      40,
      bodyEl.clientHeight - summaryEl.offsetHeight - pillsEl.offsetHeight - (bodyGap * 2) - 4
    );
    const availableWidth = Math.max(140, snippetEl.clientWidth || (bodyEl.clientWidth - 24));
    const measurer = ensurePreviewMeasurer();
    measurer.style.width = `${availableWidth}px`;
    measurer.style.maxHeight = `${availableHeight}px`;
    const fittedParagraphs = [];
    const supportsExpandedPreview = !query && availableHeight >= 320;
    const supportsPreviewBullets = !query && availableHeight >= 400;
    const paragraphLimit = supportsExpandedPreview ? Math.min(2, sourceParagraphs.length) : 1;

    const isSearchPreview = !!query;

    for (let paragraphIndex = 0; paragraphIndex < paragraphLimit; paragraphIndex += 1) {
      const paragraph = sourceParagraphs[paragraphIndex];
      const sentences = splitIntoSentences(paragraph);
      const normalizedQuery = paragraphIndex === 0 ? normalizeText(query) : "";

      let startIndex = 0;
      if (normalizedQuery) {
        const validStart = sentences.findIndex((sentence) =>
          normalizeText(sentence).includes(normalizedQuery) && isValidPreviewSentence(sentence)
        );
        const anyStart = sentences.findIndex((sentence) => normalizeText(sentence).includes(normalizedQuery));
        startIndex = validStart >= 0 ? validStart : (anyStart >= 0 ? anyStart : 0);
      }

      let bestParagraph = sentences[startIndex] || sentences[0] || paragraph;
      for (let index = startIndex; index < sentences.length; index += 1) {
        const candidate = sentences.slice(startIndex, index + 1).join(" ").trim();
        measurer.innerHTML = renderPreviewContentHtml([...fittedParagraphs, candidate], query, []);
        if (measurer.scrollHeight <= availableHeight + 1) {
          bestParagraph = candidate;
          continue;
        }
        break;
      }
      measurer.innerHTML = renderPreviewContentHtml([...fittedParagraphs, bestParagraph], query, []);
      if (measurer.scrollHeight <= availableHeight + 1) {
        fittedParagraphs.push(bestParagraph);
        continue;
      }
      if (isSearchPreview) {
        const singleSentence = sentences[startIndex] || sentences[0] || paragraph;
        measurer.innerHTML = renderPreviewContentHtml([...fittedParagraphs, singleSentence], query, []);
        if (measurer.scrollHeight <= availableHeight + 1) {
          fittedParagraphs.push(singleSentence);
        }
        break;
      }
      const words = bestParagraph.split(/\s+/);
      while (words.length > 4) {
        words.pop();
        const fallback = `${words.join(" ")}...`;
        measurer.innerHTML = renderPreviewContentHtml([...fittedParagraphs, fallback], query, []);
        if (measurer.scrollHeight <= availableHeight + 1) {
          fittedParagraphs.push(fallback);
          break;
        }
      }
      break;
    }

    const bulletPool = (supportsPreviewBullets && fittedParagraphs.length > 1) ? bullets : [];
    let bestBullets = [];
    bulletPool.forEach((bullet) => {
      if (bestBullets.length >= 10) return;
      const candidateBullets = [...bestBullets, bullet];
      measurer.innerHTML = renderPreviewContentHtml(fittedParagraphs, query, candidateBullets);
      if (measurer.scrollHeight <= availableHeight + 1) {
        bestBullets = candidateBullets;
      }
    });

    return renderPreviewContentHtml(fittedParagraphs, query, bestBullets);
  };
  const getRowAnchorConfigs = (slug) => {
    const rows = getDocRows(slug)
      .filter((row) => !(slug === "intro" && row.gallery));
    const sections = getSectionsForSlug(slug);
    return rows.map((row, index) => {
      const section = findSectionForRow(slug, row);
      const sectionIndex = section
        ? sections.findIndex((entry) => entry.id === section.id || normalizeText(entry.label) === normalizeText(section.label))
        : -1;
      const fallbackIndex = rows.length <= 1
        ? 0
        : Math.round((index / (rows.length - 1)) * Math.max(0, sections.length - 1));
      const resolvedIndex = sectionIndex >= 0 ? sectionIndex : fallbackIndex;
      const sectionOffset = section
        ? getSectionAnchorOffset(slug, section)
        : resolvedIndex * 1000;
      return {
        label: row.label,
        row,
        section,
        sectionIndex: resolvedIndex,
        sectionOffset
      };
    });
  };
  const extractSentenceFromCapitalStart = (sentence, query = "") => {
    const clean = cleanLabel(sentence);
    if (!clean) return "";
    const normalizedQuery = normalizeText(query);
    const lower = clean.toLowerCase();
    const matchPos = normalizedQuery ? lower.indexOf(normalizedQuery) : -1;
    const scanLimit = matchPos >= 0 ? matchPos : clean.length - 1;
    let startIndex = 0;
    for (let i = scanLimit; i >= 0; i -= 1) {
      if (/[A-Z]/.test(clean[i])) {
        startIndex = i;
        break;
      }
    }
    let out = clean.slice(startIndex).trim();
    const firstCap = out.search(/[A-Z]/);
    if (firstCap > 0) out = out.slice(firstCap).trim();
    return out;
  };
  const isValidPreviewSentence = (sentence) => {
    const s = cleanLabel(sentence);
    if (!s || s.length < 18) return false;
    if (!/^[A-Z]/.test(s)) return false;
    if (!/[.!?]$/.test(s)) return false;
    if (/^\d+(\.\d+)*\s*$/.test(s)) return false;
    if (/^[^A-Za-z]*$/.test(s)) return false;
    if (/^[A-Z][A-Za-z0-9 .\-]*$/.test(s) && s.length < 60 && !/\s{2,}/.test(s) && (s.match(/\s/g) || []).length < 5) return false;
    return true;
  };

  const countExactMatches = (text, query) => {
    const t = normalizeText(text);
    const q = normalizeText(query);
    if (!q) return 0;
    let count = 0;
    let pos = 0;
    while ((pos = t.indexOf(q, pos)) !== -1) {
      count += 1;
      pos += q.length;
    }
    return count;
  };
  const countTokenMatches = (text, query) => {
    const t = normalizeText(text);
    const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return 0;
    return tokens.reduce((sum, token) => {
      let count = 0;
      let pos = 0;
      while ((pos = t.indexOf(token, pos)) !== -1) {
        count += 1;
        pos += token.length;
      }
      return sum + count;
    }, 0);
  };
  const capitalizedTieScore = (sentence, query) => {
    const s = cleanLabel(sentence);
    const q = normalizeText(query);
    if (!s || !q) return -1;
    const lower = s.toLowerCase();
    const matchPos = lower.lastIndexOf(q);
    if (matchPos < 0) return -1;
    const region = s.slice(0, matchPos + q.length);
    const capitals = [...region.matchAll(/\b[A-Z][A-Za-z0-9]+\b/g)];
    if (!capitals.length) return -1;
    const last = capitals[capitals.length - 1];
    return last.index ?? -1;
  };

  const buildSentenceAwarePreview = (sourceText, query) => {
    const sentences = splitIntoSentences(sourceText);
    const q = normalizeText(query);
    if (!q || !sentences.length) {
      return { text: sourceText, startIndex: 0, exactCount: 0, sentenceCount: 0, tokenCount: 0, matchType: "none" };
    }

    const sentenceRecords = sentences.map((text, index) => {
      const normalizedSentence = extractSentenceFromCapitalStart(text, query);
      return {
        text: normalizedSentence,
        index,
        valid: isValidPreviewSentence(normalizedSentence),
        normalized: normalizeText(normalizedSentence)
      };
    });
    const queryTokens = q.split(/\s+/).filter(Boolean);
    const exactCandidates = sentenceRecords.filter((entry) => entry.valid && entry.normalized.includes(q));
    const looseCandidates = sentenceRecords.filter((entry) =>
      entry.valid && !entry.normalized.includes(q) && queryTokens.some((token) => entry.normalized.includes(token))
    );
    const candidatePool = exactCandidates.length ? exactCandidates : looseCandidates;
    if (!candidatePool.length) {
      return { text: "", startIndex: -1, exactCount: 0, sentenceCount: 0, tokenCount: 0, matchType: "invalid" };
    }

    let best = null;
    candidatePool.forEach((candidate) => {
      const span = [];
      for (let i = candidate.index; i < sentenceRecords.length; i += 1) {
        const record = sentenceRecords[i];
        if (!record.valid) continue;
        span.push(record);
      }
      if (!span.length) return;
      const spanText = span.map((entry) => entry.text).join(" ");
      const exactCount = countExactMatches(spanText, query);
      const sentenceMatchCount = span.filter((entry) => entry.normalized.includes(q)).length;
      const tokenCount = countTokenMatches(spanText, query);
      const tieScore = capitalizedTieScore(candidate.text, query);
      const current = {
        startIndex: candidate.index,
        text: spanText,
        exactCount,
        sentenceCount: sentenceMatchCount,
        tokenCount,
        tieScore
      };
      if (!best) {
        best = current;
        return;
      }
      if (
        current.exactCount > best.exactCount ||
        (current.exactCount === best.exactCount && current.sentenceCount > best.sentenceCount) ||
        (current.exactCount === best.exactCount && current.sentenceCount === best.sentenceCount && current.tokenCount > best.tokenCount) ||
        (current.exactCount === best.exactCount && current.sentenceCount === best.sentenceCount && current.tokenCount === best.tokenCount && current.tieScore > best.tieScore) ||
        (current.exactCount === best.exactCount && current.sentenceCount === best.sentenceCount && current.tokenCount === best.tokenCount && current.tieScore === best.tieScore && current.startIndex < best.startIndex)
      ) {
        best = current;
      }
    });
    if (!best) {
      return { text: "", startIndex: -1, exactCount: 0, sentenceCount: 0, tokenCount: 0, matchType: "invalid" };
    }
    return {
      text: best.text,
      startIndex: best.startIndex,
      exactCount: best.exactCount,
      sentenceCount: best.sentenceCount,
      tokenCount: best.tokenCount,
      matchType: exactCandidates.length ? "exact" : "loose"
    };
  };

  const findDocSearchMatches = (slug, query) => {
    const q = normalizeText(query);
    const empty = {
      matched: false,
      docMatched: false,
      sections: [],
      sectionHits: [],
      rowMatches: [],
      rowHitMap: new Map(),
      exampleMatches: [],
      primaryHit: null
    };
    if (!q) return empty;
    const doc = docsBySlug.get(slug);
    if (!doc) return empty;

    const corpus = cleanLabel(`${doc.display_title || ""}. ${doc.preview_title || ""}. ${doc.corpus_text || ""}`);
    const docMatched = normalizeText(corpus).includes(q);
    const allSectionHits = getSectionsForSlug(slug)
      .map((section, sectionIndex) => {
        const sourceText = buildSectionPreviewText(slug, section);
        const preview = buildSentenceAwarePreview(sourceText, query);
        return {
          section,
          sectionIndex,
          sectionOffset: getSectionAnchorOffset(slug, section),
          sourceText: preview.text || "",
          exactCount: preview.exactCount || 0,
          sentenceMatchCount: preview.sentenceCount || 0,
          tokenCount: preview.tokenCount || 0,
          matchType: preview.matchType || "none",
          hasValidSentence: preview.startIndex >= 0
        };
      })
      .filter((hit) => hit.hasValidSentence && !!hit.sourceText && (normalizeText(hit.sourceText).includes(q) || hit.tokenCount > 0));

    const rowHitMap = new Map();
    const assignRowHit = (label, hit, jumpSection) => {
      const existing = rowHitMap.get(label) || { label, hits: [], primaryHit: null, jumpSection: jumpSection || hit.section };
      if (jumpSection) existing.jumpSection = jumpSection;
      existing.hits.push(hit);
      const anchorOffset = getSectionAnchorOffset(slug, existing.jumpSection || hit.section);
      const hitDistance = Math.abs((hit.sectionOffset ?? Number.MAX_SAFE_INTEGER) - anchorOffset);
      const primaryDistance = existing.primaryHit
        ? Math.abs(((existing.primaryHit.sectionOffset ?? Number.MAX_SAFE_INTEGER)) - anchorOffset)
        : Number.MAX_SAFE_INTEGER;
      if (!existing.primaryHit ||
          hitDistance < primaryDistance ||
          (hitDistance === primaryDistance && hit.exactCount > (existing.primaryHit.exactCount || 0)) ||
          (hitDistance === primaryDistance && hit.exactCount === (existing.primaryHit.exactCount || 0) && hit.sentenceMatchCount > (existing.primaryHit.sentenceMatchCount || 0)) ||
          (hitDistance === primaryDistance && hit.exactCount === (existing.primaryHit.exactCount || 0) && hit.sentenceMatchCount === (existing.primaryHit.sentenceMatchCount || 0) && hit.tokenCount > (existing.primaryHit.tokenCount || 0)) ||
          (hitDistance === primaryDistance && hit.exactCount === (existing.primaryHit.exactCount || 0) && hit.sentenceMatchCount === (existing.primaryHit.sentenceMatchCount || 0) && hit.tokenCount === (existing.primaryHit.tokenCount || 0) && (hit.sectionOffset || Number.MAX_SAFE_INTEGER) < (existing.primaryHit.sectionOffset || Number.MAX_SAFE_INTEGER))) {
        existing.primaryHit = hit;
      }
      rowHitMap.set(label, existing);
    };

    const anchorConfigs = getRowAnchorConfigs(slug);

    const eligibleAnchors = slug === "intro"
      ? anchorConfigs.filter((ac) => !getDocRowConfig(slug, ac.label)?.gallery)
      : anchorConfigs;

    const normalSectionHits = slug === "intro"
      ? allSectionHits.filter((hit) => !String(hit.section.number || "").startsWith("19."))
      : allSectionHits;

    normalSectionHits.forEach((hit) => {
      if (!eligibleAnchors.length) return;
      const nearest = [...eligibleAnchors]
        .sort((a, b) =>
          Math.abs((a.sectionOffset ?? (a.sectionIndex * 1000)) - (hit.sectionOffset ?? (hit.sectionIndex * 1000))) -
          Math.abs((b.sectionOffset ?? (b.sectionIndex * 1000)) - (hit.sectionOffset ?? (hit.sectionIndex * 1000))) ||
          a.sectionIndex - b.sectionIndex
        )[0];
      if (!nearest) return;
      assignRowHit(nearest.label, hit, nearest.section || hit.section);
    });

    getDocRows(slug).forEach((row) => {
      const label = row.label;
      if (slug === "intro" && row.gallery) return;
      if (!normalizeText(label).includes(q) || rowHitMap.has(label)) return;
      const anchor = eligibleAnchors.find((entry) => entry.label === label);
      const sourceText = buildSectionPreviewText(slug, anchor?.section || { label, excerpt: getDocSummary(slug) });
      const preview = buildSentenceAwarePreview(sourceText, query);
      if (preview.startIndex < 0 || !preview.text) return;
      assignRowHit(label, {
        section: anchor?.section || findSectionForRow(slug, row) || { label, excerpt: getDocSummary(slug) },
        sectionIndex: anchor?.sectionIndex ?? 0,
        sectionOffset: anchor?.sectionOffset ?? ((anchor?.sectionIndex ?? 0) * 1000),
        sourceText: preview.text,
        exactCount: preview.exactCount || 0,
        sentenceMatchCount: preview.sentenceCount || 0,
        tokenCount: preview.tokenCount || 0,
        matchType: preview.matchType || "loose"
      }, anchor?.section || findSectionForRow(slug, row));
    });

    const introGalleryRowLabel = getDocRows("intro").find((row) => row.gallery)?.label || "";
    const exampleMatches = slug === "intro"
      ? getIntroGalleryItems().filter((section) =>
        normalizeText(buildExamplePreviewText(section)).includes(q))
      : [];
    if (slug === "intro" && exampleMatches.length && introGalleryRowLabel) {
      const exampleText = buildExamplePreviewText(exampleMatches[0]);
      assignRowHit(introGalleryRowLabel, {
        section: exampleMatches[0],
        sectionIndex: Number.MAX_SAFE_INTEGER,
        sectionOffset: Number.MAX_SAFE_INTEGER,
        sourceText: exampleText,
        exactCount: countExactMatches(exampleText, query),
        sentenceMatchCount: splitIntoSentences(exampleText).filter((sentence) => normalizeText(sentence).includes(q)).length,
        tokenCount: countTokenMatches(exampleText, query),
        matchType: "exact"
      }, exampleMatches[0]);
    }

    if (rowHitMap.size > 3) {
      const ranked = [...rowHitMap.entries()]
        .map(([label, entry]) => {
          const ph = entry.primaryHit || {};
          const hitOffset = ph.sectionOffset ?? ((ph.sectionIndex || 0) * 1000);
          const anchorDist = eligibleAnchors.length
            ? Math.min(...eligibleAnchors
              .filter((a) => a.label === label)
              .map((a) => Math.abs((a.sectionOffset ?? (a.sectionIndex * 1000)) - hitOffset)))
            : 0;
          return {
            label,
            entry,
            exactCount: ph.exactCount || 0,
            sentenceMatchCount: ph.sentenceMatchCount || 0,
            tokenCount: ph.tokenCount || 0,
            anchorDist: isFinite(anchorDist) ? anchorDist : 9999,
            sectionOffset: hitOffset
          };
        })
        .sort((a, b) =>
          b.exactCount - a.exactCount ||
          b.sentenceMatchCount - a.sentenceMatchCount ||
          b.tokenCount - a.tokenCount ||
          a.anchorDist - b.anchorDist ||
          a.sectionOffset - b.sectionOffset
        );
      const keep = new Set(ranked.slice(0, 3).map((r) => r.label));
      [...rowHitMap.keys()].forEach((label) => {
        if (!keep.has(label)) rowHitMap.delete(label);
      });
    }

    const primaryHit = [...rowHitMap.values()]
      .map((entry) => entry.primaryHit)
      .filter(Boolean)
      .sort((a, b) =>
        (b.exactCount || 0) - (a.exactCount || 0) ||
        (b.sentenceMatchCount || 0) - (a.sentenceMatchCount || 0) ||
        (b.tokenCount || 0) - (a.tokenCount || 0) ||
        (a.sectionOffset || Number.MAX_SAFE_INTEGER) - (b.sectionOffset || Number.MAX_SAFE_INTEGER)
      )[0] || allSectionHits[0] || null;

    return {
      matched: docMatched || allSectionHits.length > 0 || rowHitMap.size > 0,
      docMatched,
      sections: allSectionHits.map((hit) => hit.section),
      sectionHits: allSectionHits,
      rowMatches: [...rowHitMap.keys()],
      rowHitMap,
      exampleMatches,
      primaryHit
    };
  };

  const getPreviewForDoc = (slug, options = {}) => {
    const doc = docsBySlug.get(slug);
    if (!doc) return null;
    const searchResult = options.searchResult || null;
    const searchContext = !!(options.query && searchResult?.matched);
    const jumpSection = searchResult?.primaryHit?.majorSection || searchResult?.primaryHit?.section || searchResult?.sections?.[0] || null;
    const matchedSection = searchResult?.primaryHit?.section || jumpSection || null;
    return {
      slug,
      title: getDocTitle(slug),
      meta: getDocMetaLabel(slug),
      summary: getDocSummary(slug),
      renderSource: {
        slug,
        sectionId: searchContext ? (jumpSection?.id || "") : "",
        sectionLabel: searchContext ? (jumpSection?.label || jumpSection?.text || "") : "",
        majorSectionId: searchContext ? (jumpSection?.id || "") : "",
        majorNumber: searchContext ? (searchResult?.primaryHit?.majorNumber || getMajorHeadingNumber(jumpSection?.text || jumpSection?.label || "")) : "",
        fullMajorSection: searchContext,
        query: searchContext ? options.query : "",
        matchText: searchContext ? (searchResult?.primaryHit?.sourceText || "") : ""
      },
      snippetParagraphs: searchContext
        ? [searchResult?.primaryHit?.sourceText || `${getDocTitle(slug)}. ${getDocSummary(slug)} ${doc.description || ""}`]
        : (getDocPreviewContent(slug).paragraphs || []),
      snippetBullets: searchContext ? [] : (getDocPreviewContent(slug).bullets || []),
      snippetQuery: searchContext ? options.query : "",
      pills: getDocRows(slug).map((row) => row.label).slice(0, 4),
      href: matchedSection
        ? readerHref(slug, searchContext ? { searchQuery: options.query, jump: matchedSection.label, searchOpen: true } : {})
        : readerHref(slug, searchContext ? { searchQuery: options.query, searchOpen: true } : {})
    };
  };

  const getPreviewForRow = (slug, label, options = {}) => {
    const rowConfig = getDocRowConfig(slug, label);
    const section = rowConfig ? findSectionForRow(slug, rowConfig) : findSectionByLabel(slug, label);
    const searchResult = options.searchResult || null;
    const rowMatch = searchResult?.rowHitMap instanceof Map ? searchResult.rowHitMap.get(label) : null;
    const jumpSection = rowConfig
      ? coerceRowSection(slug, rowConfig, rowMatch?.jumpSection || section)
      : (rowMatch?.jumpSection || section);
    const searchContext = !!(options.query && rowMatch);
    const matchedSection = searchContext
      ? (rowMatch?.primaryGroup?.majorSection || rowMatch?.majorSection || rowMatch?.primaryHit?.majorSection || rowMatch?.primaryHit?.section || jumpSection || section)
      : null;
    const previewSection = searchContext ? matchedSection : jumpSection;
    const preview = getPreviewForDoc(slug, {
      query: searchContext ? options.query : "",
      searchResult: searchContext ? searchResult : null
    }) || {
      title: getDocTitle(slug),
      meta: getDocMetaLabel(slug),
      summary: getDocSummary(slug),
      snippetParagraphs: [getDocSummary(slug)],
      snippetBullets: [],
      snippetQuery: "",
      pills: [],
      href: readerHref(slug)
    };
    const rowPreview = getRowPreviewContent(slug, label, section);

    let searchSnippetParagraphs = rowPreview.paragraphs || [];
    if (searchContext && rowMatch?.primaryHit?.sourceText) {
      const hitSource = rowMatch.primaryHit.sourceText;
      const hitSentences = splitIntoSentences(hitSource);
      const hasValidSentence = hitSentences.some((s) =>
        normalizeText(s).includes(normalizeText(options.query)) && isValidPreviewSentence(s)
      );
      searchSnippetParagraphs = hasValidSentence ? [hitSource] : (rowPreview.paragraphs || []);
    }

    return {
      slug,
      title: preview.title,
      meta: preview.meta,
      summary: cleanLabel(jumpSection?.label || section?.label || label),
      renderSource: {
        slug,
        sectionId: String(previewSection?.id || jumpSection?.id || section?.id || rowConfig?.jumpId || ""),
        sectionLabel: cleanLabel(previewSection?.label || previewSection?.text || jumpSection?.label || section?.label || rowConfig?.jumpLabel || label),
        majorSectionId: searchContext ? String(previewSection?.id || "") : "",
        majorNumber: searchContext ? String(rowMatch?.primaryGroup?.majorNumber || rowMatch?.primaryHit?.majorNumber || getMajorHeadingNumber(previewSection?.text || previewSection?.label || "")) : "",
        fullMajorSection: searchContext,
        query: searchContext ? options.query : "",
        matchText: searchContext ? (rowMatch?.primaryHit?.sourceText || "") : ""
      },
      snippetParagraphs: searchContext ? searchSnippetParagraphs : (rowPreview.paragraphs || []),
      snippetBullets: searchContext ? [] : (rowPreview.bullets || []),
      snippetQuery: searchContext ? options.query : "",
      pills: getDocRows(slug).map((row) => row.label).slice(0, 4),
      activePill: label,
      href: (searchContext ? previewSection : jumpSection)
        ? readerHref(
          slug,
          searchContext
            ? { searchQuery: options.query, jump: cleanLabel(rowMatch?.primaryHit?.section?.label || rowMatch?.primaryHit?.section?.text || previewSection?.label || previewSection?.text || jumpSection?.label || ""), searchOpen: true }
            : { jump: jumpSection.label }
        )
        : readerHref(slug)
    };
  };

  const getPreviewForExample = (section, options = {}) => {
    const displayLabel = getSectionDisplayLabel(section);
    const canonicalSectionId = getCanonicalSectionId(section);
    return {
      slug: "intro",
      title: "Intro",
      meta: "Example Gallery",
      summary: displayLabel,
      renderSource: {
        slug: "intro",
        sectionId: canonicalSectionId,
        sectionLabel: displayLabel,
        query: options.searchContext ? options.query : ""
      },
      snippetParagraphs: [buildExamplePreviewText(section)],
      snippetBullets: [],
      snippetQuery: options.searchContext ? options.query : "",
      pills: [section.number || "Example", "Example Gallery"],
      href: readerHref("intro", options.searchContext ? { searchQuery: options.query, jump: displayLabel } : { hash: canonicalSectionId || section.id })
    };
  };

  const getPreviewForConcept = (key) => {
    const preview = CONCEPTUAL_PREVIEWS[key];
    if (!preview) return null;
    return {
      slug: "",
      title: preview.title,
      meta: preview.meta,
      summary: preview.summary,
      renderSource: null,
      snippetParagraphs: [preview.snippet],
      snippetBullets: [],
      snippetQuery: "",
      pills: preview.pills || [],
      href: ""
    };
  };

  const renderPreviewSnippet = async (preview) => {
    const snippet = $("#treePreviewSnippet");
    if (!snippet) return;
    snippet.innerHTML = "";
    snippet.classList.remove("is-loading");
    snippet.classList.remove("is-scrollable");
    const token = ++previewRenderToken;
    const useScrollableDefault = !preview.snippetQuery
      && !!preview.renderSource?.slug
      && preview.meta !== "Example Gallery";
    const useScrollableSearch = !!preview.snippetQuery
      && !!preview.renderSource?.slug;
    const useScrollablePreview = useScrollableDefault || useScrollableSearch;
    const snippetParagraphs = preview.snippetParagraphs || [preview.snippetSource || preview.summary || ""];
    const fallbackHtml = fitPreviewSentences(
        snippetParagraphs.length ? snippetParagraphs : [preview.snippetSource || ""],
        preview.snippetQuery || "",
        preview.snippetBullets || buildPreviewBulletPoints(preview)
      );
    if (useScrollableSearch) {
      snippet.classList.add("is-loading");
      snippet.innerHTML = '<div class="tree-preview-loading">Loading formatted preview...</div>';
    } else {
      snippet.innerHTML = fallbackHtml;
    }
    snippet.classList.toggle("is-scrollable", useScrollablePreview);
    if (!preview.renderSource?.slug) return;
    try {
      const rendered = await buildRenderedPreviewFragment(
        preview.renderSource,
        useScrollableDefault
          ? { fit: false }
          : (useScrollableSearch ? { fit: false } : {})
      );
      if (token !== previewRenderToken || state.preview !== preview || !rendered) return;
      snippet.classList.remove("is-loading");
      snippet.innerHTML = "";
      snippet.appendChild(rendered);
      snippet.classList.toggle("is-scrollable", useScrollablePreview);
      if (useScrollableSearch) scrollPreviewSnippetToMatch(snippet, preview);
    } catch {
      if (token !== previewRenderToken || state.preview !== preview) return;
      snippet.classList.remove("is-loading");
      snippet.innerHTML = fallbackHtml;
      snippet.classList.toggle("is-scrollable", useScrollablePreview);
    }
  };

  const setPreview = (preview) => {
    if (!preview) return;
    state.preview = preview;
    $("#treePreviewTitle").textContent = preview.title || "";
    $("#treePreviewMeta").textContent = preview.meta || "";
    const hideDefaultDocSummary = !preview.snippetQuery
      && !!preview.slug
      && cleanLabel(preview.summary) === cleanLabel(getDocSummary(preview.slug));
    $("#treePreviewSummary").textContent = hideDefaultDocSummary ? "" : (preview.summary || "");
    $("#treePreviewSummary").classList.remove("is-structural-summary");
    $("#treePreviewBody")?.classList.toggle("is-search-preview", !!preview.snippetQuery);
    $("#treePreviewCard").dataset.href = preview.href || "";
    renderPreviewSnippet(preview);
    const pillsHost = $("#treePreviewSubrows");
    pillsHost.innerHTML = "";
    (preview.pills || []).forEach((pill) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tree-preview-pill";
      btn.textContent = pill;
      if ((preview.activePill && preview.activePill === pill) || (state.selection?.rowKey && state.selection.label === pill)) {
        btn.classList.add("is-active");
      }
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        const slug = preview.slug || state.selection?.slug;
        if (!slug) return;
        const nodeConfig = TREE_LAYOUT.find((n) => n.slug === slug);
        if (!nodeConfig) return;
        const rowConfig = getDocRowConfig(slug, pill);
        if (!rowConfig) return;
        const target = buildRowSelectionTarget(nodeConfig, rowConfig);
        if (isSameSelection(target)) {
          navigateToTarget(target);
        } else {
          applySelection(target);
        }
      });
      pillsHost.appendChild(btn);
    });
    fitPreviewPills(pillsHost);
    syncSplitPreviewGallery();
    syncMobilePreviewState();
  };

  const fitPreviewPills = (host) => {
    if (!host) return;
    const pills = [...host.querySelectorAll(".tree-preview-pill")];
    if (!pills.length) { host.style.removeProperty("--pill-scale"); return; }
    host.style.removeProperty("--pill-scale");
    // Allow 1 line fullscreen, 2 lines split view.
    const maxLines = isTreeSplitView() ? 2 : 1;
    // Binary-search the largest scale (0.55 – 1.0) where pills fit.
    let lo = 0.55, hi = 1.0;
    const fitsInLines = (s) => {
      host.style.setProperty("--pill-scale", `${s}`);
      void host.offsetWidth;
      const hostRect = host.getBoundingClientRect();
      if (!hostRect.width) return true;
      const firstTop = pills[0].getBoundingClientRect().top;
      const lastBottom = pills[pills.length - 1].getBoundingClientRect().bottom;
      const lineH = pills[0].getBoundingClientRect().height;
      if (lineH <= 0) return true;
      const rows = Math.round((lastBottom - firstTop) / lineH);
      return rows <= maxLines;
    };
    if (fitsInLines(1)) { host.style.setProperty("--pill-scale", "1"); return; }
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      if (fitsInLines(mid)) lo = mid; else hi = mid;
    }
    host.style.setProperty("--pill-scale", `${Math.round(lo * 1000) / 1000}`);
  };

  const isTreePhoneView = () =>
    !!document.body && document.body.classList.contains("tree-phone-view");

  const syncTreeViewportClasses = () => {
    if (!document.body) return;
    const isPhone = (window.innerWidth || 0) <= TREE_PHONE_VIEW_MAX;
    document.body.classList.toggle("tree-phone-view", isPhone);
    if (!isPhone) {
      state.mobilePreviewOpen = false;
      document.body.classList.remove("tree-mobile-preview-open");
    }
  };

  const syncMobilePreviewState = () => {
    if (!document.body) return;
    const inPhoneView = isTreePhoneView();
    const open = inPhoneView && state.mobilePreviewOpen && !!state.preview;
    document.body.classList.toggle("tree-mobile-preview-open", open);
    const card = $("#treePreviewCard");
    if (card) {
      card.setAttribute("aria-hidden", inPhoneView ? (open ? "false" : "true") : "false");
    }
  };

  const openMobilePreview = () => {
    if (!isTreePhoneView() || !state.preview) return;
    state.mobilePreviewOpen = true;
    syncMobilePreviewState();
  };

  const closeMobilePreview = () => {
    if (!state.mobilePreviewOpen) return;
    state.mobilePreviewOpen = false;
    syncMobilePreviewState();
  };

  const closeThemeMenu = () => {
    const menu = $("#treeThemeMenu");
    const trigger = $("#treeThemeToggle");
    if (!menu || !trigger) return;
    menu.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  const updateThemeControls = (mode) => {
    const current = THEME_OPTIONS.find((option) => option.id === mode) || THEME_OPTIONS[0];
    const icon = $("#treeThemeIcon");
    if (icon) icon.src = iconPath(current.icon);
    $$("#treeThemeMenu .mode-switcher-item").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.mode === mode);
    });
  };

  const updateLavaControl = (enabled) => {
    const btn = $("#treeLavaToggle");
    if (!btn) return;
    const on = !!enabled;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("title", on ? "Disable lava lamp background" : "Enable lava lamp background");
  };

  const updateSearchMeta = () => {
    const matchCount = [...state.searchResults.values()].filter((result) => result.matched).length;
    const sectionCount = [...state.searchResults.values()].reduce((sum, result) => sum + result.sections.length, 0);
    const meta = $("#treeSearchMeta");
    if (!meta) return;
    if (!state.query) {
      meta.textContent = "Search within Documentation";
      return;
    }
    meta.textContent = `${matchCount} matching node${matchCount === 1 ? "" : "s"} - ${sectionCount} section hit${sectionCount === 1 ? "" : "s"}`;
  };

  const renderConnectors = () => {
    const svg = $("#treeSitemapConnectors");
    const overlaySvg = $("#treeSitemapConnectorsOverlay");
    if (!svg || !overlaySvg) return;
    svg.setAttribute("viewBox", "0 0 1150.5081 1008.1333");
    svg.setAttribute("preserveAspectRatio", "none");
    overlaySvg.setAttribute("viewBox", "0 0 1150.5081 1008.1333");
    overlaySvg.setAttribute("preserveAspectRatio", "none");
    const stageRect = svg.getBoundingClientRect();
    const hasStageBox = !!(stageRect && stageRect.width && stageRect.height);
    const scaleX = hasStageBox ? TREE_SITEMAP_VIEWBOX.width / stageRect.width : 1;
    const scaleY = hasStageBox ? TREE_SITEMAP_VIEWBOX.height / stageRect.height : 1;
    const getNodeBox = (nodeId) => {
      if (!hasStageBox) return null;
      const node = document.querySelector(`[data-node-id="node-${nodeId}"]`);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        left: (rect.left - stageRect.left) * scaleX,
        right: (rect.right - stageRect.left) * scaleX,
        top: (rect.top - stageRect.top) * scaleY,
        bottom: (rect.bottom - stageRect.top) * scaleY,
        width: rect.width * scaleX,
        height: rect.height * scaleY
      };
    };
    const getRowLineY = (nodeId, label) => {
      if (!hasStageBox) return null;
      const row = document.querySelector(`[data-node-id="node-${nodeId}"] .tree-node-row[data-label="${label}"]`);
      if (!row) return null;
      const rect = row.getBoundingClientRect();
      return (rect.bottom - stageRect.top) * scaleY;
    };
    const pointOnEdge = (box, edge, ratio = 0.5) => {
      if (!box) return null;
      const clampedRatio = Math.min(1, Math.max(0, ratio));
      if (edge === "top") {
        return { x: box.left + (box.width * clampedRatio), y: box.top };
      }
      if (edge === "bottom") {
        return { x: box.left + (box.width * clampedRatio), y: box.bottom };
      }
      if (edge === "left") {
        return { x: box.left, y: box.top + (box.height * clampedRatio) };
      }
      return { x: box.right, y: box.top + (box.height * clampedRatio) };
    };
    const connectorBreakGap = (nodeId) => {
      if (nodeId === "syntax" || nodeId === "cfg" || nodeId === "meta-v9") return 4;
      return 0;
    };
    const pointOnEdgeWithGap = (box, edge, ratio = 0.5, gap = 0) => {
      const point = pointOnEdge(box, edge, ratio);
      if (!point || !gap) return point;
      if (edge === "top") return { x: point.x, y: point.y - gap };
      if (edge === "bottom") return { x: point.x, y: point.y + gap };
      if (edge === "left") return { x: point.x - gap, y: point.y };
      return { x: point.x + gap, y: point.y };
    };
    const upArrowLine = (fromId, toId, markerId = "treeArrowUp", extraClass = "") => {
      const from = getNodeBox(fromId);
      const to = getNodeBox(toId);
      if (!from || !to) return "";
      // Default: center on the bottom of the destination (upper) rectangle.
      let x = (to.left + to.right) / 2;
      let startYOffset = 0;
      let endYOffset = 0;
      // BCODe.rest / BCODe.node use authored routing from meta-v9.
      if (fromId === "meta-v9" && (toId === "rest" || toId === "node")) {
        const metaCenterX = (from.left + from.right) / 2;
        const baseRestX = 391.300;
        const baseNodeX = 535.600;
        const pairCenterX = (baseRestX + baseNodeX) / 2;
        const connectorShift = metaCenterX - pairCenterX;
        const nodeConnectorX = baseNodeX + connectorShift;
        const nodeBox = getNodeBox("node");
        const targetInset = nodeBox
          ? Math.max(0, nodeConnectorX - nodeBox.left)
          : 4;
        if (toId === "node") {
          x = nodeBox ? (nodeBox.left + targetInset) : nodeConnectorX;
        } else {
          const metaRightInset = Math.max(0, from.right - nodeConnectorX);
          x = from.left + metaRightInset;
        }
      }
      const className = ["tree-connector-main", extraClass].filter(Boolean).join(" ");
      return `<line class="${className}" x1="${x.toFixed(3)}" y1="${(from.top + startYOffset).toFixed(3)}" x2="${x.toFixed(3)}" y2="${(to.bottom + endYOffset).toFixed(3)}" marker-end="url(#${markerId})"></line>`;
    };
    const cfgGuidePath = (toId, startRatio, endRatio, direction) => {
      const cfg = getNodeBox("cfg");
      const target = getNodeBox(toId);
      if (!cfg || !target) return "";
      const cfgGap = connectorBreakGap("cfg");
      const targetGap = connectorBreakGap(toId);
      const startX = cfg.left + (cfg.width * 0.540992);
      const startY = direction === "up"
        ? cfg.top - cfgGap
        : cfg.bottom + cfgGap;
      const endY = target.top + (target.height * endRatio);
      const endX = target.left - targetGap;
      const horizontalRun = Math.max(0, endX - startX);
      const verticalRun = Math.abs(endY - startY);
      const radius = Math.min(12, horizontalRun, verticalRun);
      const verticalY = direction === "up" ? endY + radius : endY - radius;
      const curve = direction === "up"
        ? `c 0,-${radius.toFixed(3)} ${radius.toFixed(3)},-${radius.toFixed(3)} ${radius.toFixed(3)},-${radius.toFixed(3)}`
        : `c 0,${radius.toFixed(3)} ${radius.toFixed(3)},${radius.toFixed(3)} ${radius.toFixed(3)},${radius.toFixed(3)}`;
      return `<path class="tree-connector-dashed" d="M ${startX.toFixed(3)} ${startY.toFixed(3)} V ${verticalY.toFixed(3)} ${curve} H ${endX.toFixed(3)}"></path>`;
    };
    const interpretationToFreestylePath = () => {
      const from = getNodeBox("interpretation");
      const to = getNodeBox("freestyle");
      if (!from || !to) return null;
      const start = pointOnEdge(from, "right", 0.5);
      const end = pointOnEdge(to, "top", 0.5);
      return {
        path: `<path class="tree-connector-side" d="M ${start.x.toFixed(3)} ${start.y.toFixed(3)} H ${end.x.toFixed(3)} V ${end.y.toFixed(3)}" marker-end="url(#treeArrowAuto)"></path>`,
        junctionX: end.x,
        junctionY: start.y
      };
    };
    const protocolBranchPaths = () => {
      const meta = getNodeBox("meta-v9");
      const modbus = getNodeBox("protocol-modbus");
      const dnp3 = getNodeBox("protocol-dnp3");
      if (!meta || !modbus || !dnp3) return { trunk: "", modbusArrow: "", dnp3Arrow: "" };
      const start = pointOnEdgeWithGap(meta, "left", 0.305324, connectorBreakGap("meta-v9"));
      const upperTarget = pointOnEdge(modbus, "right", 0.5);
      const lowerTarget = pointOnEdge(dnp3, "right", 0.5);
      const trunkHorizontalSpan = 154.536;
      const trunkCurveDx = 10.489;
      const trunkCurveCtrlDx = 10.456;
      const trunkCurveDy = 11.855;
      const upperArrowInset = 164.993;
      const lowerArrowInset = 165.806;
      const upperStemY = upperTarget.y + (192.262 - 192.107);
      const upperArrowStartX = start.x - upperArrowInset;
      const lowerArrowStartX = start.x - lowerArrowInset;
      const trunkLineEndX = start.x - trunkHorizontalSpan;
      return {
        trunk: `<path class="tree-connector-side" d="M ${start.x.toFixed(3)} ${start.y.toFixed(3)} H ${trunkLineEndX.toFixed(3)} c -${trunkCurveCtrlDx.toFixed(3)},0 -${trunkCurveDx.toFixed(3)},-${trunkCurveDy.toFixed(3)} -${trunkCurveDx.toFixed(3)},-${trunkCurveDy.toFixed(3)} V ${upperStemY.toFixed(3)}"></path>`,
        modbusArrow: `<line class="tree-connector-side tree-connector-left-arrow" x1="${upperArrowStartX.toFixed(3)}" y1="${upperTarget.y.toFixed(3)}" x2="${upperTarget.x.toFixed(3)}" y2="${upperTarget.y.toFixed(3)}" marker-end="url(#treeArrowAuto)"></line>`,
        dnp3Arrow: `<line class="tree-connector-side tree-connector-left-arrow" x1="${lowerArrowStartX.toFixed(3)}" y1="${lowerTarget.y.toFixed(3)}" x2="${lowerTarget.x.toFixed(3)}" y2="${lowerTarget.y.toFixed(3)}" marker-end="url(#treeArrowAuto)"></line>`
      };
    };
    const metaLibraryGuidePaths = (junctionX, junctionY) => {
      const meta = getNodeBox("meta-v9");
      const metaLibrary = getNodeBox("meta-library-semantics");
      if (!meta || !metaLibrary) return { left: "", right: "" };
      const startY = getRowLineY("meta-v9", "Meta tags") ?? pointOnEdge(meta, "right", 0.291777).y;
      const leftStart = pointOnEdgeWithGap(meta, "right", (startY - meta.top) / meta.height, connectorBreakGap("meta-v9"));
      const rightStart = pointOnEdge(metaLibrary, "left", (startY - metaLibrary.top) / metaLibrary.height);
      const clampedJunctionX = Math.min(rightStart.x - 8, Math.max(leftStart.x + 8, junctionX));
      const radius = Math.min(
        12,
        Math.max(0, clampedJunctionX - leftStart.x),
        Math.max(0, rightStart.x - clampedJunctionX),
        Math.max(0, junctionY - startY)
      );
      const stemStartY = startY + radius;
      return {
        left: `<path class="tree-connector-dashed" d="M ${leftStart.x.toFixed(3)} ${startY.toFixed(3)} H ${(clampedJunctionX - radius).toFixed(3)} Q ${clampedJunctionX.toFixed(3)} ${startY.toFixed(3)} ${clampedJunctionX.toFixed(3)} ${stemStartY.toFixed(3)} V ${junctionY.toFixed(3)}"></path>`,
        right: `<path class="tree-connector-dashed" d="M ${rightStart.x.toFixed(3)} ${startY.toFixed(3)} H ${(clampedJunctionX + radius).toFixed(3)} Q ${clampedJunctionX.toFixed(3)} ${startY.toFixed(3)} ${clampedJunctionX.toFixed(3)} ${stemStartY.toFixed(3)}"></path>`
      };
    };
    const cfgToMetaGuide = cfgGuidePath("meta-v9", 0.364949, 0.697682, "up");
    const cfgToSyntaxGuide = cfgGuidePath("syntax", 0.823846, 0.519265, "down");
    const freestyleConnector = interpretationToFreestylePath();
    const protocolBranch = protocolBranchPaths();
    const metaLibraryGuides = metaLibraryGuidePaths(
      freestyleConnector?.junctionX ?? 804.559,
      Math.max(
        (getRowLineY("meta-v9", "Meta tags") ?? 307.613) + 12,
        freestyleConnector?.junctionY ?? 523.037
      )
    );
    const restBoxForSeparator = getNodeBox("rest");
    const separatorX = restBoxForSeparator
      ? ((getNodeBox("protocol-modbus")?.right ?? 243.311) + restBoxForSeparator.left) / 2
      : 260.745;
    const baseMarkerGlowFilter = (glowId) => `
        <filter id="${glowId}" x="-180%" y="-180%" width="460%" height="460%" color-interpolation-filters="sRGB">
          <feMorphology in="SourceGraphic" operator="dilate" radius="0.18" result="treeArrowGlowShape"></feMorphology>
          <feGaussianBlur in="treeArrowGlowShape" stdDeviation="0.7" result="treeArrowGlowSoft"></feGaussianBlur>
          <feGaussianBlur in="treeArrowGlowShape" stdDeviation="1.25" result="treeArrowGlowWide"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="treeArrowGlowWide"></feMergeNode>
            <feMergeNode in="treeArrowGlowSoft"></feMergeNode>
          </feMerge>
        </filter>
    `;
    const overlayDefs = `
      <defs>
        ${baseMarkerGlowFilter("treeOverlayArrowMarkerGlow")}
        <marker id="treeOverlayArrowUp" viewBox="0 0 10 8" refX="5" refY="0" markerWidth="12" markerHeight="10" markerUnits="userSpaceOnUse" orient="0" overflow="visible">
          <polygon points="5,0 10,8 0,8" style="fill:var(--tree-arrow-main);opacity:var(--tree-arrow-glow-opacity)" filter="url(#treeOverlayArrowMarkerGlow)"></polygon>
          <polygon points="5,0 10,8 0,8" style="fill:var(--tree-arrow-main)"></polygon>
        </marker>
      </defs>
    `;
    const underlayDefs = `
      <defs>
        ${baseMarkerGlowFilter("treeArrowMarkerGlow")}
        <marker id="treeArrowUp" viewBox="0 0 10 8" refX="5" refY="0" markerWidth="12" markerHeight="10" markerUnits="userSpaceOnUse" orient="0" overflow="visible">
          <polygon points="5,0 10,8 0,8" style="fill:var(--tree-arrow-main);opacity:var(--tree-arrow-glow-opacity)" filter="url(#treeArrowMarkerGlow)"></polygon>
          <polygon points="5,0 10,8 0,8" style="fill:var(--tree-arrow-main)"></polygon>
        </marker>
        <marker id="treeArrowAuto" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto" overflow="visible">
          <path d="M 0 0 L 10 5 L 0 10 z" style="fill:var(--tree-arrow-side);opacity:var(--tree-arrow-glow-opacity)" filter="url(#treeArrowMarkerGlow)"></path>
          <path d="M 0 0 L 10 5 L 0 10 z" style="fill:var(--tree-arrow-side)"></path>
        </marker>
      </defs>
    `;
    let markup = `
      ${underlayDefs}
      <line class="tree-separator" x1="${separatorX.toFixed(3)}" y1="26.515" x2="${separatorX.toFixed(3)}" y2="979.160"></line>
      ${upArrowLine("intro", "syntax", "treeArrowUp", "tree-connector-main-underlay")}
      ${upArrowLine("syntax", "interpretation", "treeArrowUp", "tree-connector-main-underlay")}
      ${upArrowLine("interpretation", "meta-v9", "treeArrowUp", "tree-connector-main-underlay")}
      ${upArrowLine("meta-v9", "rest", "treeArrowUp", "tree-connector-main-underlay")}
      ${upArrowLine("meta-v9", "node", "treeArrowUp", "tree-connector-main-underlay")}
      ${cfgToMetaGuide}
      ${cfgToSyntaxGuide}
      ${freestyleConnector?.path || ""}
      ${protocolBranch.trunk}
      ${protocolBranch.modbusArrow}
      ${protocolBranch.dnp3Arrow}
      ${metaLibraryGuides.left}
      ${metaLibraryGuides.right}
    `;

    svg.innerHTML = markup;
    overlaySvg.innerHTML = `
      ${overlayDefs}
      ${upArrowLine("intro", "syntax", "treeOverlayArrowUp", "tree-connector-main-overlay")}
      ${upArrowLine("syntax", "interpretation", "treeOverlayArrowUp", "tree-connector-main-overlay")}
      ${upArrowLine("interpretation", "meta-v9", "treeOverlayArrowUp", "tree-connector-main-overlay")}
      ${upArrowLine("meta-v9", "rest", "treeOverlayArrowUp", "tree-connector-main-overlay")}
      ${upArrowLine("meta-v9", "node", "treeOverlayArrowUp", "tree-connector-main-overlay")}
    `;
  };

  const syncInteractionState = () => {
    document.querySelectorAll(".tree-sitemap-node").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.nodeId === state.activeNodeId);
      node.classList.toggle("is-hovered", node.dataset.nodeId === state.hoveredNodeId);
    });
    document.querySelectorAll(".tree-node-row, .tree-example-row").forEach((row) => {
      row.classList.toggle("is-active", row.dataset.rowKey === state.activeRowKey);
      row.classList.toggle("is-hovered", row.dataset.rowKey === state.hoveredRowKey);
    });
  };

  const activateNode = (nodeId) => {
    state.activeNodeId = nodeId;
    syncInteractionState();
  };

  const activateRow = (rowKey) => {
    state.activeRowKey = rowKey;
    syncInteractionState();
  };

  const setHoveredTarget = (nodeId = "", rowKey = "") => {
    state.hoveredNodeId = nodeId;
    state.hoveredRowKey = rowKey;
    syncInteractionState();
  };

  const clearHoveredTarget = (rowKey = "") => {
    if (!rowKey || state.hoveredRowKey === rowKey) state.hoveredRowKey = "";
    if (!state.hoveredRowKey) state.hoveredNodeId = "";
    syncInteractionState();
  };

  const isSameSelection = (target) => !!(target && state.selection && state.selection.key === target.key);

  const applySelection = (target) => {
    if (!target) return;
    state.selection = target;
    activateNode(target.nodeId || "");
    activateRow(target.rowKey || "");
    setPreview(target.preview);
  };

  const clearActiveSelection = () => {
    state.selection = null;
    state.activeNodeId = "";
    state.activeRowKey = "";
    syncInteractionState();
  };

  const showDefaultPreview = () => {
    clearActiveSelection();
    const introPreview = getPreviewForDoc("intro") || getPreviewForConcept("protocol-group");
    if (introPreview) setPreview(introPreview);
  };

  const navigateToTarget = (target) => {
    if (!target?.href) return;
    window.location.href = target.href;
  };

  const selectOrNavigateTarget = (target, onFirstSelect) => {
    if (!target) return;
    if (isSameSelection(target)) {
      if (isTreePhoneView()) openMobilePreview();
      return;
    }
    applySelection(target);
    if (isTreePhoneView()) openMobilePreview();
    if (typeof onFirstSelect === "function") onFirstSelect();
  };

  const buildNodeSelectionTarget = (nodeConfig) => {
    const nodeId = `node-${nodeConfig.id}`;
    if (nodeConfig.slug) {
      const searchResult = state.searchResults.get(nodeConfig.slug);
      const searchContext = !!(state.query && searchResult?.matched);
      const preview = getPreviewForDoc(nodeConfig.slug, {
        query: searchContext ? state.query : "",
        searchResult: searchContext ? searchResult : null
      });
      return {
        key: `node:${nodeConfig.id}`,
        kind: "node",
        slug: nodeConfig.slug,
        nodeId,
        rowKey: "",
        href: preview?.href || "",
        preview,
        searchContext
      };
    }
    return {
      key: `node:${nodeConfig.id}`,
      kind: "concept",
      slug: "",
      nodeId,
      rowKey: "",
      href: "",
      preview: getPreviewForConcept(nodeConfig.previewKey || nodeConfig.id),
      searchContext: false
    };
  };

  const buildRowSelectionTarget = (nodeConfig, rowConfig) => {
    const nodeId = `node-${nodeConfig.id}`;
    const rowKey = `${nodeId}:${rowConfig.label}`;
    const searchResult = nodeConfig.slug ? state.searchResults.get(nodeConfig.slug) : null;
    const rowMatch = searchResult?.rowHitMap instanceof Map ? searchResult.rowHitMap.get(rowConfig.label) : null;
    const searchContext = !!(state.query && rowMatch);
    const preview = rowConfig.conceptual
      ? getPreviewForConcept("node")
      : getPreviewForRow(nodeConfig.slug, rowConfig.label, {
        query: searchContext ? state.query : "",
        searchResult: searchContext ? searchResult : null
      });
    return {
      key: `row:${nodeConfig.id}:${rowConfig.label}`,
      kind: "row",
      slug: nodeConfig.slug || "",
      nodeId,
      rowKey,
      label: rowConfig.label,
      href: preview?.href || "",
      preview,
      searchContext
    };
  };

  const buildExampleSelectionTarget = (section) => {
    const searchResult = state.searchResults.get("intro");
    const searchContext = !!(state.query && searchResult?.exampleMatches.some((entry) => entry.id === section.id));
    const preview = getPreviewForExample(section, {
      query: searchContext ? state.query : "",
      searchContext
    });
    return {
      key: `example:${section.id}`,
      kind: "example",
      slug: "intro",
      nodeId: "node-intro",
      rowKey: `example:${section.id}`,
      sectionId: section.id,
      href: preview.href || "",
      preview,
      searchContext
    };
  };

  const buildSelectionTargetFromState = (selection) => {
    if (!selection) return null;
    if (selection.kind === "node" || selection.kind === "concept") {
      const nodeConfig = TREE_LAYOUT.find((node) => `node-${node.id}` === selection.nodeId);
      return nodeConfig ? buildNodeSelectionTarget(nodeConfig) : null;
    }
    if (selection.kind === "row") {
      const nodeConfig = TREE_LAYOUT.find((node) => `node-${node.id}` === selection.nodeId);
      if (!nodeConfig) return null;
      const label = selection.label || selection.rowKey?.split(":").slice(1).join(":") || "";
      const rowConfig = buildNodeRows(nodeConfig).find((row) => row.label === label);
      return rowConfig ? buildRowSelectionTarget(nodeConfig, rowConfig) : null;
    }
    if (selection.kind === "example") {
      const section = getIntroGalleryItems().find((item) => item.id === selection.sectionId);
      return section ? buildExampleSelectionTarget(section) : null;
    }
    return null;
  };

  const renderSearchStateUI = () => {
    document.querySelectorAll(".tree-sitemap-node").forEach((node) => {
      const slug = node.dataset.slug;
      const result = slug ? state.searchResults.get(slug) : null;
      const matched = !!result && result.matched;
      node.classList.toggle("is-search-match", matched);
      const hitEl = node.querySelector(".tree-node-hit-count");
      if (hitEl) {
        const count = matched ? result.sectionHits.length : 0;
        hitEl.textContent = count > 0 ? `${count}` : "";
        hitEl.classList.toggle("is-visible", count > 0);
      }
    });

    document.querySelectorAll(".tree-node-row, .tree-example-row").forEach((row) => {
      const slug = row.dataset.slug;
      const label = row.dataset.label;
      const result = slug ? state.searchResults.get(slug) : null;
      const matchesSection = !!result && result.rowMatches.includes(label);
      row.classList.toggle("is-search-match", matchesSection);
    });

    document.querySelectorAll(".tree-example-row").forEach((row) => {
      const slug = row.dataset.slug;
      const label = row.dataset.label || "";
      const result = slug ? state.searchResults.get(slug) : null;
      const matches = !!result && result.exampleMatches.some((section) => section.label === label);
      row.classList.toggle("is-search-match", matches);
    });

    updateSearchMeta();
    if (state.selection) {
      const refreshed = buildSelectionTargetFromState(state.selection);
      if (refreshed) applySelection(refreshed);
    }
  };

  const updateSearchState = async () => {
    const token = ++searchUpdateToken;
    const query = state.query;
    if (!query) {
      state.searchResults = new Map();
      if (token !== searchUpdateToken) return;
      renderSearchStateUI();
      return;
    }

    const entries = await Promise.all(TREE_SLUGS.map(async (slug) => {
      const rendered = await findDocSearchMatchesFromRendered(slug, query).catch(() => null);
      const result = rendered || findDocSearchMatches(slug, query);
      return [slug, {
        ...result,
        matched: !!query && (docContains(slug, query) || result.matched)
      }];
    }));

    if (token !== searchUpdateToken || query !== state.query) return;
    state.searchResults = new Map(entries);
    renderSearchStateUI();
  };

  const buildNodeRows = (nodeConfig) => {
    if (nodeConfig.kind === "concept") return [];
    if (nodeConfig.id === "node") {
      return ["State relay", "Mode sync", "Health flags"].map((label) => ({ label, conceptual: true }));
    }
    return getDocRows(nodeConfig.slug).map((row) => ({ ...row }));
  };

  const buildNode = (nodeConfig) => {
    const tree = $("#treeSitemapTree");
    const node = document.createElement("article");
    node.className = "tree-sitemap-node";
    node.dataset.nodeId = `node-${nodeConfig.id}`;
    if (nodeConfig.slug) node.dataset.slug = nodeConfig.slug;
    if (nodeConfig.kind !== "doc") node.classList.add("tree-node-conceptual");
    if (!SHIFT_EXEMPT_NODE_IDS.has(nodeConfig.id)) node.classList.add("tree-upper-shift");
    node.style.setProperty("--x", nodeConfig.x);
    node.style.setProperty("--y", nodeConfig.y);
    node.style.setProperty("--w", nodeConfig.w);
    node.style.setProperty("--h", nodeConfig.h);

    const title = nodeConfig.treeTitle || (nodeConfig.slug ? getDocTitle(nodeConfig.slug) : nodeConfig.title);
    const badge = nodeConfig.badge || "";

    node.innerHTML = `
      <div class="tree-node-header">
        <button type="button" class="tree-node-title${nodeConfig.slug || nodeConfig.kind === "concept-doc" ? "" : " is-disabled"}">
          <span class="tree-node-title-label">${esc(title)}</span>
        </button>
        <span class="tree-node-hit-count" aria-hidden="true"></span>
        ${badge ? `<span class="tree-node-badge">${esc(badge)}</span>` : ""}
      </div>
      <div class="tree-node-body"></div>
    `;

    const titleBtn = node.querySelector(".tree-node-title");
    if (nodeConfig.centerTitle) {
      node.classList.add("tree-node-centered");
    }

    node.addEventListener("mouseenter", () => setHoveredTarget(node.dataset.nodeId, ""));
    node.addEventListener("mouseleave", () => clearHoveredTarget());
    node.addEventListener("focusin", () => setHoveredTarget(node.dataset.nodeId, ""));
    node.addEventListener("focusout", () => {
      if (!node.contains(document.activeElement)) clearHoveredTarget();
    });

    titleBtn.addEventListener("click", (event) => {
      event.preventDefault();
      closeSplitGallery();
      selectOrNavigateTarget(buildNodeSelectionTarget(nodeConfig));
    });
    titleBtn.addEventListener("dblclick", (event) => {
      event.preventDefault();
      navigateToTarget(buildNodeSelectionTarget(nodeConfig));
    });

    node.addEventListener("click", (event) => {
      if (event.target.closest(".tree-node-title, .tree-node-row, .tree-example-row")) return;
      closeSplitGallery();
      selectOrNavigateTarget(buildNodeSelectionTarget(nodeConfig));
    });

    const body = node.querySelector(".tree-node-body");
    buildNodeRows(nodeConfig).forEach((rowConfig) => {
      const isGalleryRow = !!(nodeConfig.slug === "intro" && rowConfig.gallery);
      const row = document.createElement("button");
      row.type = "button";
      row.className = `tree-node-row${isGalleryRow ? " tree-node-row-gallery is-glowing" : ""}`;
      row.dataset.slug = nodeConfig.slug || "";
      row.dataset.label = rowConfig.label;
      row.dataset.rowKey = `${node.dataset.nodeId}:${rowConfig.label}`;
      row.innerHTML = `
        <span class="tree-node-row-label">
          <span class="tree-node-row-label-text">${esc(rowConfig.label)}</span>
        </span>
        <img class="tree-node-row-search-icon" src="${iconPath("magnify.svg")}" alt="" aria-hidden="true">
      `;
      if (isGalleryRow) {
        row.insertAdjacentHTML("afterbegin",
          `<span class="tree-node-toggle" aria-hidden="true"><span class="tree-node-toggle-icon">&#9664;</span></span>`);
      }
      row.addEventListener("mouseenter", () => setHoveredTarget(node.dataset.nodeId, row.dataset.rowKey));
      row.addEventListener("mouseleave", () => setHoveredTarget(node.dataset.nodeId, ""));
      row.addEventListener("focus", () => setHoveredTarget(node.dataset.nodeId, row.dataset.rowKey));
      row.addEventListener("blur", () => setHoveredTarget(node.dataset.nodeId, ""));
      row.addEventListener("click", (event) => {
        const toggleBtn = event.target.closest(".tree-node-toggle");
        if (toggleBtn) {
          state.galleryExpanded = !state.galleryExpanded;
          renderGalleryPanel();
          row.classList.toggle("is-expanded", state.galleryExpanded);
          return;
        }
        // Non-gallery row click in split view: close gallery, show preview
        if (!isGalleryRow) closeSplitGallery();
        const target = buildRowSelectionTarget(nodeConfig, rowConfig);
        selectOrNavigateTarget(target, () => {
          if (isGalleryRow && !state.galleryExpanded) {
            state.galleryExpanded = true;
            renderGalleryPanel();
          }
        });
      });
      row.addEventListener("dblclick", (event) => {
        event.preventDefault();
        navigateToTarget(buildRowSelectionTarget(nodeConfig, rowConfig));
      });
      if (isGalleryRow) {
        row.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          event.preventDefault();
          state.galleryExpanded = event.key === "ArrowRight";
          renderGalleryPanel();
          row.classList.toggle("is-expanded", state.galleryExpanded);
        });
      }
      body.appendChild(row);
    });

    tree.appendChild(node);
  };

  const isTreeSplitView = () =>
    !!document.body && document.body.classList.contains("tree-split-view");

  const syncTreeSideCardState = () => {
    if (!document.body) return;
    const inSplit = isTreeSplitView();
    const previewOpen = inSplit && !state.galleryExpanded && !!state.preview;
    const galleryOpen = inSplit && !!state.galleryExpanded;
    document.body.classList.toggle("tree-side-right-open", previewOpen);
    document.body.classList.toggle("tree-side-left-open", galleryOpen);
    document.body.classList.toggle("tree-side-none", inSplit && !previewOpen && !galleryOpen);
  };

  const syncSplitPreviewGallery = () => {
    const preview = $("#treePreviewCard");
    if (!preview) return;
    preview.classList.toggle("tree-preview-hidden", isTreeSplitView() && state.galleryExpanded);
    syncTreeSideCardState();
    syncMobilePreviewState();
  };

  const closeSplitGallery = () => {
    if (!isTreeSplitView() || !state.galleryExpanded) return;
    state.galleryExpanded = false;
    const galleryCard = $("#treeGalleryCard");
    if (galleryCard) galleryCard.classList.remove("is-open");
    const introGalleryRow = document.querySelector(".tree-node-row-gallery");
    if (introGalleryRow) introGalleryRow.classList.remove("is-expanded");
    syncSplitPreviewGallery();
    requestAnimationFrame(() => {
      layoutPortalPanels();
      renderConnectors();
    });
  };

  const renderGalleryPanel = () => {
    const galleryCard = $("#treeGalleryCard");
    if (!galleryCard) return;
    galleryCard.classList.toggle("is-open", state.galleryExpanded);

    // In split view, gallery and preview are mutually exclusive
    syncSplitPreviewGallery();

    const introGalleryRow = document.querySelector('.tree-node-row-gallery');
    if (introGalleryRow) introGalleryRow.classList.toggle("is-expanded", state.galleryExpanded);

    const list = $("#treeExampleGalleryList");
    const items = getIntroGalleryItems();
    list.innerHTML = items.map((section) => `
      <button type="button" class="tree-example-row" data-row-key="example:${esc(section.id)}" data-slug="intro" data-label="${esc(section.label)}">
        <span>${esc(section.number || "Example")}</span>
        <span style="margin-left:8px">${esc(getSectionDisplayLabel(section))}</span>
      </button>
    `).join("");

    list.querySelectorAll(".tree-example-row").forEach((row) => {
      const section = items.find((item) => item.id === row.dataset.rowKey.replace("example:", ""));
      if (!section) return;
      row.addEventListener("mouseenter", () => setHoveredTarget("node-intro", row.dataset.rowKey));
      row.addEventListener("mouseleave", () => setHoveredTarget("node-intro", ""));
      row.addEventListener("focus", () => setHoveredTarget("node-intro", row.dataset.rowKey));
      row.addEventListener("blur", () => setHoveredTarget("node-intro", ""));
      row.addEventListener("click", () => {
        // In split view, clicking a gallery item closes gallery and shows preview
        closeSplitGallery();
        selectOrNavigateTarget(buildExampleSelectionTarget(section));
      });
      row.addEventListener("dblclick", () => {
        navigateToTarget(buildExampleSelectionTarget(section));
      });
    });

    updateSearchState();
    syncInteractionState();
    layoutPortalPanels();
    renderConnectors();
  };

  const renderTree = () => {
    const tree = $("#treeSitemapTree");
    tree.innerHTML = `<div class="tree-protocol-label tree-upper-shift">PROTOCOL<br>REPRESENTATION</div>`;
    TREE_LAYOUT.forEach((nodeConfig) => {
      if (nodeConfig.kind === "label") return;
      buildNode(nodeConfig);
    });
    renderGalleryPanel();
    renderConnectors();
  };

  const bindTreeBackgroundReset = () => {
    const shell = $("#treeSitemapShell");
    const tree = $("#treeSitemapTree");
    const resetOnBackground = (event) => {
      if (!state.selection) return;
      if (event.target.closest(".tree-sitemap-node")) return;
      showDefaultPreview();
    };
    if (shell) shell.addEventListener("click", resetOnBackground);
    if (tree) tree.addEventListener("click", resetOnBackground);
  };

  const bindSearch = () => {
    const input = $("#docSearch");
    if (!input) return;
    const clearBtn = $("#treeSearchClear");
    let searchTimer = null;
    const syncSearchFromField = (immediate = false) => {
      const raw = cleanLabel(input.value);
      if (clearBtn) clearBtn.classList.toggle("is-visible", !!raw);
      if (searchTimer) { clearTimeout(searchTimer); searchTimer = null; }
      if (normalizeText(raw).length < 4) {
        if (state.query) {
          state.query = "";
          updateSearchState();
        }
        return;
      }
      if (!immediate) {
        searchTimer = setTimeout(() => {
          searchTimer = null;
          state.query = raw;
          showDefaultPreview();
          updateSearchState();
        }, 500);
        return;
      }
      if (state.query === raw && state.searchResults.size) return;
      state.query = raw;
      showDefaultPreview();
      updateSearchState();
    };

    input.addEventListener("input", () => {
      syncSearchFromField(false);
    });
    input.addEventListener("focus", () => {
      syncSearchFromField(true);
    });
    input.addEventListener("click", () => {
      syncSearchFromField(true);
    });
    window.addEventListener("pageshow", () => {
      syncSearchFromField(true);
    });
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchTimer) { clearTimeout(searchTimer); searchTimer = null; }
        input.value = "";
        state.query = "";
        clearBtn.classList.remove("is-visible");
        updateSearchState();
      });
    }
    syncSearchFromField(true);
  };

  const bindThemeControls = () => {
    const trigger = $("#treeThemeToggle");
    const menu = $("#treeThemeMenu");
    const lavaToggle = $("#treeLavaToggle");
    if (!trigger || !menu || !lavaToggle) return;

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = !menu.classList.contains("is-open");
      closeThemeMenu();
      if (open) {
        menu.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    menu.querySelectorAll(".mode-switcher-item").forEach((item) => {
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        const mode = item.dataset.mode;
        if (!mode) return;
        applyTheme(mode);
        writeTheme(mode);
        updateThemeControls(mode);
        closeThemeMenu();
      });
    });

    lavaToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const next = !readLavaEnabled();
      writeLavaEnabled(next);
      applyLavaEnabled(next);
      updateLavaControl(next);
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".tree-mode-switcher-wrap")) closeThemeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeThemeMenu();
    });
  };

  const bindPreviewCard = () => {
    const card = $("#treePreviewCard");
    const closeBtn = $("#treePreviewMobileClose");
    const titleEl = $("#treePreviewTitle");
    if (titleEl) {
      titleEl.addEventListener("click", (event) => {
        event.stopPropagation();
        const slug = state.selection?.slug || state.preview?.slug;
        if (!slug) return;
        window.location.href = readerHref(slug);
      });
    }
    const actionEl = card.querySelector(".tree-preview-action");
    if (actionEl) {
      actionEl.addEventListener("click", (event) => {
        event.stopPropagation();
        if (state.selection?.href) {
          navigateToTarget(state.selection);
          return;
        }
        if (state.preview?.href) window.location.href = state.preview.href;
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        closeMobilePreview();
      });
    }
  };

  const layoutPortalPanels = () => {
    const stack = document.querySelector(".stack");
    const hero = document.querySelector(".tree-hero-card");
    const mapCard = document.querySelector(".tree-sitemap-card");
    const shell = $("#treeSitemapShell");
    const preview = $("#treePreviewCard");
    const footer = document.querySelector("footer");
    const header = document.querySelector("header");
    if (!stack || !hero || !mapCard || !shell || !preview || !footer || !header) return;

    const is1080Boost = shouldUse1080GeometryScale();
    const geometryScale = is1080Boost ? TREE_1080_GEOMETRY_SCALE : 1;
    const fontCompensation = is1080Boost ? 1.1 : 1;

    // Tree-map text target: 1.25× base at ≤1080 vh, 1.0× base at ≥1440 vh, linear between.
    // Since CSS applies font-size = base × font-comp × tree-font-scale, we divide the
    // desired absolute multiplier by font-comp so the product lands on the target.
    const vh = window.innerHeight || 0;
    const treeAbsTarget = vh >= 1440 ? 1 : vh <= 1080 ? 1.25 : 1.25 - 0.25 * ((vh - 1080) / (1440 - 1080));
    const treeFontScale = treeAbsTarget / fontCompensation;

    document.body.classList.toggle("tree-1080-boost", is1080Boost);
    document.body.classList.remove("tree-zoom75-geometry");
    document.body.style.setProperty("--tree-ui-scale", `${geometryScale}`);
    document.body.style.setProperty("--tree-font-comp", `${fontCompensation}`);
    document.body.style.setProperty("--tree-tree-font-scale", `${Math.round(treeFontScale * 1000) / 1000}`);
    // Subtitle-only extra boost: 1.15 at ≤1080 vh, 1.0 at ≥1440 vh, linear between.
    const subtitleScale = vh >= 1440 ? 1 : vh <= 1080 ? 1.15 : 1.15 - 0.15 * ((vh - 1080) / (1440 - 1080));
    document.body.style.setProperty("--tree-tree-subtitle-scale", `${Math.round(subtitleScale * 1000) / 1000}`);
    // Split-view-only extra subtitle factor: up to +10% at ≤1080, 1.0 at ≥1440, interpolated.
    if (isTreeSplitView()) {
      const splitSubScale = vh >= 1440 ? 1 : vh <= 1080 ? 1.10 : 1.10 - 0.10 * ((vh - 1080) / (1440 - 1080));
      document.body.style.setProperty("--tree-tree-subtitle-split-scale", `${Math.round(splitSubScale * 1000) / 1000}`);
    } else {
      document.body.style.setProperty("--tree-tree-subtitle-split-scale", "1");
    }

    // Always use compact hero -- the portal's dominant feature is the sitemap, not the hero.
    document.body.classList.add("tree-compact-hero");

    // Reset any prior JS-applied hero height so we can measure its natural compact height.
    hero.style.height = "";
    hero.style.overflow = "";
    void document.body.offsetWidth;

    // Proportional vertical scaling from 2560x1440 canonical reference.
    // Canonical gaps (compact-hero, geometryScale=1): main-pad-top 6, stack-gap 10, main-pad-bottom 8.
    const CANONICAL_VH = 1440;
    const vhScale = window.innerHeight / CANONICAL_VH;
    const scaledMainPadTop = Math.max(2, Math.round(6 * vhScale));
    const scaledMainPadBottom = Math.max(2, Math.round(8 * vhScale));
    const scaledStackGap = Math.max(2, Math.round(10 * vhScale));

    const mainEl = document.querySelector("main");
    mainEl.style.paddingTop = `${scaledMainPadTop}px`;
    mainEl.style.paddingBottom = `${scaledMainPadBottom}px`;
    stack.style.gap = `${scaledStackGap}px`;
    void document.body.offsetWidth;

    const container = document.querySelector(".container");
    const containerRect = container ? container.getBoundingClientRect() : stack.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const containerWidth = containerRect.width;

    // The sitemap shell now occupies the card footprint directly, so the outer card
    // stays invisible and does not reserve any interior inset.
    const cardPadX = TREE_CARD_PADDING.x * geometryScale;
    const cardPadY = TREE_CARD_PADDING.y * geometryScale;

    // Vertical span between header and footer, minus proportional padding.
    const totalSpan = Math.max(0, footerRect.top - headerRect.bottom);
    const usableSpan = Math.max(200, totalSpan - scaledMainPadTop - scaledMainPadBottom);

    // Ultra-compact for very short viewports: hide description paragraph.
    const useUltraCompactHero = usableSpan < 700;
    document.body.classList.toggle("tree-ultra-compact-hero", useUltraCompactHero);
    void document.body.offsetWidth;

    // Hero takes its natural content height.
    const heroNatural = hero.getBoundingClientRect().height;
    const HERO_MIN = 72;

    const searchRow = hero.querySelector(".search-row.hub-top-search");
    const searchHelp = hero.querySelector(".tree-search-help");
    if (searchRow && searchHelp) {
      const inSplitHero = document.body.classList.contains("tree-split-view");
      searchHelp.style.marginTop = "0px";
      searchHelp.style.height = "";
      searchRow.style.marginTop = "0px";
      searchRow.style.gridTemplateColumns = "";
      searchRow.style.justifyContent = "";
      const heroRect = hero.getBoundingClientRect();
      const searchRowRect = searchRow.getBoundingClientRect();
      const heroStyles = getComputedStyle(hero);
      const heroPadBottom = parseFloat(heroStyles.paddingBottom) || 0;
      const heroInnerBottom = heroRect.bottom - heroPadBottom;
      if (inSplitHero) {
        const heroDescription = hero.querySelector("p");
        const descriptionRect = heroDescription?.getBoundingClientRect() || null;
        const bandTop = descriptionRect ? descriptionRect.bottom : searchRowRect.top;
        const totalBand = Math.max(0, heroInnerBottom - bandTop);
        const rowHeight = Math.round(searchRowRect.height);
        const freeBand = Math.max(0, totalBand - rowHeight);
        const rowOffset = Math.round(freeBand / 2);
        const helpHeight = Math.max(0, totalBand - rowOffset - rowHeight);
        searchRow.style.marginTop = `${rowOffset}px`;
        searchHelp.style.height = `${Math.round(helpHeight)}px`;

        // Latch search field right edge to meta text left edge, with gap = hero right padding.
        // Must set grid-template-columns directly — maxWidth on a 1fr child doesn't shrink the track.
        const meta = searchRow.querySelector(".tree-search-meta");
        if (meta) {
          const heroPadRight = parseFloat(heroStyles.paddingRight) || 0;
          const heroInnerWidth = heroRect.width - (parseFloat(heroStyles.paddingLeft) || 0) - heroPadRight;
          const metaWidth = Math.ceil(meta.getBoundingClientRect().width);
          const fieldWidth = Math.max(80, Math.round(heroInnerWidth - metaWidth - heroPadRight));
          searchRow.style.gridTemplateColumns = `${fieldWidth}px ${metaWidth}px`;
          searchRow.style.justifyContent = "space-between";
        }
      } else {
        const remainingSpace = Math.max(0, heroInnerBottom - searchRowRect.bottom);
        searchHelp.style.height = `${Math.round(remainingSpace)}px`;
      }
    }

    // Adjust node heights to accommodate scaled tree-map text at lower resolutions.
    // Only grow affected rectangular doc nodes; skip FREESTYLE, MODBUS, DNP3.
    // Intro keeps full treeAbsTarget growth; all others get half the extra.
    const HEIGHT_EXEMPT_IDS = new Set(["freestyle", "protocol-modbus", "protocol-dnp3"]);
    TREE_LAYOUT.forEach((cfg) => {
      if (cfg.kind === "label" || HEIGHT_EXEMPT_IDS.has(cfg.id)) return;
      const el = shell.querySelector(`[data-node-id="node-${cfg.id}"]`);
      if (!el) return;
      const extra = treeAbsTarget - 1;
      const fraction = cfg.id === "intro" ? 1 : 0.5;
      const adjustedH = Math.round(cfg.h * (1 + extra * fraction) * 100) / 100;
      el.style.setProperty("--h", adjustedH);
    });

    // Scale the authored sitemap stage as a single rectangle so the stage border,
    // fill, connectors, and nodes remain locked together.
    const stageBounds = {
      width: TREE_SITEMAP_VIEWBOX.width,
      height: TREE_SITEMAP_VIEWBOX.height
    };
    const paddedW = stageBounds.width;
    const paddedH = stageBounds.height;

    // Available space for the map card.
    const maxMapH = Math.max(240, usableSpan - scaledStackGap - heroNatural);

    // Stage scale: fit padded content within available card interior (height-first).
    const scaleByH = Math.max(0, maxMapH - cardPadY) / paddedH;

    const anchorGap = Number.parseFloat(getComputedStyle(document.body).getPropertyValue("--toc-anchor-gap")) || 92;
    const availablePanelHeight = Math.max(160, Math.floor(window.innerHeight - anchorGap * 2));
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const screenWidthPx = Math.max(window.innerWidth || 0, Math.round((window.screen?.width || window.innerWidth || 0) * dpr));
    const screenHeightPx = Math.max(window.innerHeight || 0, Math.round((window.screen?.height || window.innerHeight || 0) * dpr));
    const monitorScale = Math.min(1, screenWidthPx / 2560, screenHeightPx / 1440);
    let readerPanelScale = Math.min(1, (Number.isFinite(monitorScale) && monitorScale > 0 ? monitorScale : 1) * 1.3);
    let readerPanelWidth = Math.max(160, Math.round(330 * readerPanelScale));
    let readerPanelHeight = Math.max(160, Math.round(1088 * readerPanelScale));
    let readerPanelGap = Math.max(12, Math.round(24 * readerPanelScale));
    if (readerPanelHeight > availablePanelHeight) {
      const fitScale = availablePanelHeight / readerPanelHeight;
      readerPanelScale *= fitScale;
      readerPanelWidth = Math.max(160, Math.round(readerPanelWidth * fitScale));
      readerPanelHeight = Math.max(160, Math.round(readerPanelHeight * fitScale));
      readerPanelGap = Math.max(12, Math.round(readerPanelGap * fitScale));
    }
    const readerPanelAspect = readerPanelWidth / Math.max(1, readerPanelHeight);
    const splitLaneHeightEstimate = Math.max(160, Math.round(usableSpan));
    const splitSideCardWidthEstimate = Math.max(
      160,
      Math.min(readerPanelWidth, Math.round(splitLaneHeightEstimate * readerPanelAspect))
    );

    // Preview width at height-estimated scale, then available width for map card.
    const inSplitView = document.body.classList.contains("tree-split-view");
    const inPhoneView = isTreePhoneView();
    const splitPreviewScale = inSplitView ? 0.7 : 1;
    const previewBase = TREE_LAYOUT_BASE.previewWidth * (is1080Boost ? 0.9 : 1) * splitPreviewScale;
    const gap = inPhoneView ? 0 : (inSplitView ? readerPanelGap : TREE_LAYOUT_BASE.panelGap);
    const previewWEst = inPhoneView ? 0 : (inSplitView ? splitSideCardWidthEstimate : Math.round(previewBase * scaleByH));
    const maxMapW = Math.max(400, containerWidth - previewWEst - gap);
    const scaleByW = Math.max(0, maxMapW - cardPadX) / paddedW;

    // Final scale: constrained by both axes.
    const stageScale = Math.max(0.15, Math.min(scaleByH, scaleByW));

    // Snug card dimensions: tightly wraps the scaled sitemap stage.
    const mapCardWidth = Math.round(paddedW * stageScale + cardPadX);
    // In split view, fill the full usable height so cards reach the footer
    const naturalMapH = Math.round(paddedH * stageScale + cardPadY);
    const mapCardH = inSplitView ? Math.max(naturalMapH, maxMapH) : naturalMapH;

    // Clamp hero if usableSpan is too small for both cards.
    const heroH = Math.max(HERO_MIN, usableSpan - scaledStackGap - mapCardH);
    if (heroH < heroNatural - 1) {
      hero.style.height = `${Math.round(heroH)}px`;
      hero.style.overflow = "hidden";
    }

    // Stage offset: center the scaled stage inside any extra shell height.
    const scaledW = stageBounds.width * stageScale;
    const scaledH = stageBounds.height * stageScale;
    const innerMapWidth = Math.max(0, mapCardWidth - cardPadX);
    const innerMapHeight = Math.max(0, mapCardH - cardPadY);
    const centeredInsetX = Math.max(0, (innerMapWidth - scaledW) / 2);
    const centeredInsetY = Math.max(0, (innerMapHeight - scaledH) / 2);
    const stageOffsetX = Math.round(centeredInsetX * 1000) / 1000;
    const stageOffsetY = Math.round(centeredInsetY * 1000) / 1000;

    stack.style.setProperty("--tree-stack-width", `${mapCardWidth}px`);
    mapCard.style.setProperty("--tree-map-card-height", `${Math.round(mapCardH)}px`);
    mapCard.style.setProperty("--tree-map-card-offset-y", "0px");
    shell.style.setProperty("--tree-stage-scale", `${stageScale}`);
    shell.style.setProperty("--tree-stage-offset-x", `${stageOffsetX}px`);
    shell.style.setProperty("--tree-stage-offset-y", `${stageOffsetY}px`);

    void mapCard.offsetWidth;
    const mapCardRect = mapCard.getBoundingClientRect();
    const stackRect = stack.getBoundingClientRect();
    const sideLaneRect = stackRect.height > 0 ? stackRect : mapCardRect;
    const previewHeight = Math.max(0, Math.round(sideLaneRect.height));
    const splitSideCardWidth = Math.max(
      160,
      Math.min(readerPanelWidth, Math.round(previewHeight * readerPanelAspect))
    );
    // Preview card: use the full stack lane height so side cards latch vertically
    // like the documentation reader, not just to the lower sitemap card.
    const previewWidth = inSplitView ? splitSideCardWidth : Math.round(previewBase * stageScale);
    const previewTop = Math.round(sideLaneRect.top);
    const previewLeft = Math.round(sideLaneRect.right + gap);

    preview.style.setProperty("--tree-preview-width", `${previewWidth}px`);
    preview.style.setProperty("--tree-preview-height", `${previewHeight}px`);
    preview.style.setProperty("--tree-preview-top", `${previewTop}px`);
    preview.style.setProperty("--tree-preview-left", `${previewLeft}px`);

    const galleryCard = $("#treeGalleryCard");
    if (galleryCard) {
      const galleryBase = TREE_LAYOUT_BASE.galleryWidth * (is1080Boost ? 0.9 : 1) * splitPreviewScale;
      const galleryWidth = inSplitView ? splitSideCardWidth : Math.round(galleryBase * stageScale);
      const galleryHeight = previewHeight;
      const galleryTop = previewTop;
      const galleryLeft = Math.round(sideLaneRect.left - gap - galleryWidth);
      galleryCard.style.setProperty("--tree-gallery-width", `${galleryWidth}px`);
      galleryCard.style.setProperty("--tree-gallery-height", `${galleryHeight}px`);
      galleryCard.style.setProperty("--tree-gallery-top", `${galleryTop}px`);
      galleryCard.style.setProperty("--tree-gallery-left", `${galleryLeft}px`);
      galleryCard.classList.toggle("is-open", state.galleryExpanded);
    }

    // Sync preview/gallery mutual exclusion in split view
    syncSplitPreviewGallery();

    // Re-fit preview pills after layout changes (resize, split-view toggle).
    fitPreviewPills($("#treePreviewSubrows"));
  };

  const positionPreviewCard = () => {
    const card = $("#treePreviewCard");
    if (!card) return;
    layoutPortalPanels();
  };

  const measureTreeContentBounds = (shell) => {
    const fallback = {
      left: 0,
      top: 0,
      right: TREE_LAYOUT_BASE.mapInnerWidth,
      bottom: TREE_LAYOUT_BASE.mapInnerHeight,
      width: TREE_LAYOUT_BASE.mapInnerWidth,
      height: TREE_LAYOUT_BASE.mapInnerHeight
    };
    if (!shell) return fallback;

    const shellRect = shell.getBoundingClientRect();
    const currentScale = parseFloat(getComputedStyle(shell).getPropertyValue("--tree-stage-scale")) || 1;
    const currentOffsetX = parseFloat(getComputedStyle(shell).getPropertyValue("--tree-stage-offset-x")) || 0;
    const currentOffsetY = parseFloat(getComputedStyle(shell).getPropertyValue("--tree-stage-offset-y")) || 0;
    const elements = Array.from(document.querySelectorAll(
      [
        "#treeSitemapTree .tree-sitemap-node",
        "#treeSitemapTree .tree-protocol-label",
        "#treeSitemapConnectors .tree-connector-main",
        "#treeSitemapConnectors .tree-connector-side",
        "#treeSitemapConnectors .tree-connector-dashed",
        "#treeSitemapConnectors .tree-separator",
        "#treeSitemapConnectorsOverlay .tree-connector-main"
      ].join(", ")
    ));

    if (!elements.length) return fallback;

    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;

    elements.forEach((el) => {
      if (el instanceof SVGGraphicsElement) {
        const bbox = el.getBBox();
        left = Math.min(left, bbox.x);
        top = Math.min(top, bbox.y);
        right = Math.max(right, bbox.x + bbox.width);
        bottom = Math.max(bottom, bbox.y + bbox.height);
        return;
      }
      const rect = el.getBoundingClientRect();
      const x = (rect.left - shellRect.left - currentOffsetX) / currentScale;
      const y = (rect.top - shellRect.top - currentOffsetY) / currentScale;
      const width = rect.width / currentScale;
      const height = rect.height / currentScale;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x + width);
      bottom = Math.max(bottom, y + height);
    });

    const BOUNDS_PAD = 6;
    const paddedLeft = left - BOUNDS_PAD;
    const paddedTop = top - BOUNDS_PAD;
    const paddedRight = right + BOUNDS_PAD;
    const paddedBottom = bottom + BOUNDS_PAD;

    return {
      left: paddedLeft,
      top: paddedTop,
      right: paddedRight,
      bottom: paddedBottom,
      width: Math.max(1, paddedRight - paddedLeft),
      height: Math.max(1, paddedBottom - paddedTop)
    };
  };

  const setDefaultPreview = () => {
    const introNode = TREE_LAYOUT.find((node) => node.id === "intro");
    if (!introNode) return;
    applySelection(buildNodeSelectionTarget(introNode));
  };

  const TREE_SPLIT_VIEW_MAX = 1120;
  const TREE_SPLIT_VIEW_MIN = 600;
  const syncTreeSplitViewClass = () => {
    if (!document.body) return;
    const w = window.innerWidth || 0;
    let isSplit = false;
    if (w >= TREE_SPLIT_VIEW_MIN && w <= TREE_SPLIT_VIEW_MAX) {
      isSplit = true;
    } else if (w > TREE_SPLIT_VIEW_MAX) {
      const sw = screen.width || 3840;
      isSplit = w <= Math.round(sw * 0.55);
    }
    document.body.classList.toggle("tree-split-view", isSplit);
    syncTreeSideCardState();
  };

  const init = () => {
    const theme = readTheme();
    const lavaEnabled = readLavaEnabled();
    restoreGlassMode();
    applyTheme(theme);
    applyLavaEnabled(lavaEnabled);
    syncTreeViewportClasses();
    syncTreeSplitViewClass();
    renderTree();
    bindTreeBackgroundReset();
    bindThemeControls();
    bindSearch();
    bindPreviewCard();
    window.addEventListener("resize", () => {
      syncTreeViewportClasses();
      syncTreeSplitViewClass();
      layoutPortalPanels();
      renderConnectors();
      positionPreviewCard();
      if (state.preview) setPreview(state.preview);
    });
    updateThemeControls(theme);
    updateLavaControl(lavaEnabled);
    updateSearchState();
    setDefaultPreview();
    requestAnimationFrame(() => {
      layoutPortalPanels();
      renderConnectors();
      positionPreviewCard();
      if (state.preview) setPreview(state.preview);
      syncMobilePreviewState();
      requestAnimationFrame(() => {
        layoutPortalPanels();
        renderConnectors();
        positionPreviewCard();
        if (state.preview) setPreview(state.preview);
        syncMobilePreviewState();
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
