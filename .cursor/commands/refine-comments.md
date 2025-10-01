### 📝 Comment Refinement Directive

Perform the following three operations **only on comments**—**do not modify any code logic, identifiers, or structure**.

---

#### 1. **Delete**  
Remove comments that are:
- **Redundant**: The code is self-explanatory (e.g., `x++; // increment x`).
- **Outdated or incorrect**: No longer reflect the current behavior of the code.
- **Meaningless placeholders**: Such as bare `// TODO`, `// FIXME`, `// ...`, or empty comment blocks with no substantive content.
- **Literal restatements**: Repeating what is already clear from function/variable names.
- **Noise**: Comments consisting only of whitespace, punctuation, or vague remarks (e.g., `// do stuff`).

Do NOT delete the following without explicit approval:
- Tooling directives and suppressions (e.g., `// eslint-disable`, `// ts-ignore`, `// nolint`, `/* istanbul ignore */`).
- Build/compile flags (e.g., Go `//go:build`/`// +build`, Rust `#[cfg]` comments, Bazel markers).
- Generated-code markers and region tags used by docs/snippets (e.g., `// [START xyz]` / `// [END xyz]`).
- License/copyright headers and legal notices.
- API deprecation/compatibility notes required by consumers.

---

#### 2. **Add**  
Insert new comments where:
- **Non-obvious logic exists**: Explain algorithms, business rules, edge cases, or performance considerations not evident from code alone.
- **Workarounds or hacks are used**: Clarify why an unconventional approach was necessary (e.g., due to third-party bugs or compatibility constraints).
- **Public APIs are defined**: Add concise docstrings or header comments for all public functions, classes, or modules, describing purpose, parameters, return values, and side effects.
- **Significant side effects occur**: Such as global state mutation, I/O operations, or external system calls.

---

#### 3. **Modify**  
Rewrite existing comments to:
- **Explain the "why," not the "what"**: Focus on intent, rationale, or context behind the implementation.
- **Be clear, concise, and professional**: Use complete sentences, avoid slang or ambiguity (e.g., replace “this thing” with precise terms).
- **Follow consistent style**: Prefer imperative or declarative tone as per project conventions; ensure grammar and punctuation are correct.
- **Update stale but valuable notes**: Retain useful context while correcting inaccuracies or improving phrasing.

---

### ⚠️ General Constraints
- **Never alter non-comment code** (including variable names, or logic).
