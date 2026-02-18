# App Reconstruction Playbook

## Purpose
Use this playbook to keep apps maintainable and reproducible from documentation, not only from historical source code context.

## 1) What "good" looks like
- A new engineer (or agent) can rebuild core functionality from docs.
- Build and deploy work without tribal knowledge.
- Known deviations are explicit and intentional.

## 2) Required inputs

### `manifest.md` (product contract)
Must clearly define:
- Problem and target users.
- Primary user tasks.
- In-scope features and non-goals.
- UX principles and default behaviors.
- Compatibility requirements (URLs, hash/query formats, API behavior).
- Delivery constraints (CI/lint, mobile/desktop, deploy targets).

### `architecture.md` (implementation contract)
Must clearly define:
- Runtime model and data flow (user action -> API -> transform -> UI).
- Main modules and ownership boundaries.
- API request/response contract and normalization rules.
- URL/state strategy (routing, sharing, backward compatibility).
- Build and deploy strategy per environment.
- Robustness assumptions (timeouts, retries, dedupe, error handling).

## 3) Layout/UI spec minimum (to avoid visual drift)
If visual fidelity matters, include:
- Spacing scale and breakpoints.
- Typography scale and font rules.
- Component states (empty/loading/error/disabled).
- Interaction micro-behavior (hover, focus, modal, zoom).
- Design tokens (colors, radii, border, shadows).

Without this, functional parity is possible, but UI parity is unlikely.

## 4) Reconstruction workflow

1. Freeze docs:
   - Mark manifest/architecture version and date.
2. Rebuild in strict mode:
   - No extra features unless explicitly marked "optional".
3. Verify in layers:
   - Compile/lint
   - Runtime behavior
   - URL compatibility
   - Deploy pipeline
4. Record deviations:
   - "Changed because X"
   - "Not implemented because Y"
5. Production sanity:
   - Validate live URL, static asset paths, and first-load experience.

## 5) Acceptance checklist

### Functional parity
- Search and filtering match documented behavior.
- Graph modes and settings behave as specified.
- Share/export features work end-to-end.
- Startup defaults and empty state are correct.

### Compatibility parity
- Legacy links parse correctly.
- Current URL format is generated consistently.
- API requests preserve documented parameter semantics.

### Operational parity
- CI passes with warnings policy.
- Build output matches target base path.
- Deploy pipeline is repeatable from `main`.

## 6) Evaluation matrix (score 0-2)
Use this to compare reconstruction quality.

- `Functionality`: 0 missing, 1 partial, 2 complete
- `UX fidelity`: 0 far off, 1 acceptable, 2 near-original
- `Compatibility`: 0 broken, 1 partial, 2 complete
- `Operability`: 0 fragile, 1 works manually, 2 reliable automation
- `Documentation quality`: 0 unclear, 1 usable, 2 reproducible

Total score guide:
- 0-4: not production ready
- 5-7: usable prototype
- 8-10: maintainable reconstruction baseline

## 7) Team operating model
- Treat manifest + architecture as living contracts.
- Update docs in the same PR as behavior changes.
- Require a short "contract impact" section in PRs:
  - What changed in behavior?
  - Which doc sections were updated?
  - Any backward-compatibility risk?

## 8) Suggested PR template snippet
Add this section to PRs:

```md
## Contract impact
- Manifest updated: [yes/no], sections: [...]
- Architecture updated: [yes/no], sections: [...]
- Backward compatibility: [none/low/medium/high]
- Migration/deviation notes: [...]
```

## 9) Why this matters
This approach reduces bus factor, shortens onboarding, and makes long-term maintenance less dependent on memory and individual ownership.
