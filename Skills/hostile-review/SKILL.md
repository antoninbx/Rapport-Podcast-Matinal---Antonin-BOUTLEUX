---
name: "hostile-review"
description: "Conducts an aggressive adversarial audit, vulnerability scan, and stress-test on code, architectures, text, or plans to uncover hidden flaws, edge cases, and failure modes. Use as a final verification step before deployment, publication, or completion."
---

# Hostile Review

A ruthless adversarial auditing framework designed to stress-test outputs, identify critical flaws, expose edge cases, and challenge underlying assumptions before release.

## When to Use

* As a final mandatory verification step before shipping code, deploying systems, or publishing critical documents.
* When stress-testing an architecture, algorithm, or plan against malicious inputs, failures, or unexpected conditions.
* When proactively searching for hidden bugs, security vulnerabilities, or logical fallacies in your own work.

## Audit Vectors & Protocol

1. **Adversarial Mindset Shift**: Act as a hostile external attacker, strict QA engineer, or skeptical reviewer whose sole goal is to break, crash, or invalidate the artifact.
2. **Vulnerability & Security Scan**:
* Check for injection vectors, permission bypasses, input validation gaps, insecure defaults, and data exposure risks.


3. **Edge Case & Boundary Stress-Testing**:
* Probe for failure modes under extreme loads, empty/null states, malformed inputs, concurrency conflicts, and network timeouts.


4. **Logical & Structural Invariant Check**:
* Verify state transitions, error handling paths, race conditions, and unhandled exceptions.


5. **Constructive Critique & Remediation**:
* Categorize findings by severity (Critical, Major, Minor).
* Provide precise, actionable patches or design corrections for each discovered flaw.



## Guidelines

* Be unsparing and thorough; never gloss over minor implementation details or assume "it will probably work".
* Distinguish between theoretical edge cases and active high-probability vulnerabilities.
* Always provide concrete counter-examples or exploit scenarios to justify each criticism.