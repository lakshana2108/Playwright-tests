# First Imaging Engine regression: design exercise

This is non-executable learning material and is not scanned by bddgen.
No live workflow, task state, API, ticket or dataset is assumed.

## Describe one test before coding

| Item | Define with the product/environment owner |
| --- | --- |
| Manual regression ID and business risk | |
| Required AE/Imaging Engine build/configuration | |
| Least-privilege QA account permissions | |
| Approved ticket/workflow available through My Workspace | |
| Owned input, license, hash, location | |
| Unique run ID/correlation approach | |
| Expected task state and time budget | |
| Expected output artifacts/properties | |
| Comparison tool and measurable tolerances | |
| Failure evidence policy | |
| Cleanup actions, ownership and verification | |

Keep populated environment-specific information private; do not replace these
blanks with customer data in a public repository.

## Conceptual Gherkin

```gherkin
@MyWorkspace @ImagingEngine @Regression @Mutating
Feature: Approved Imaging Engine output
  Scenario: An approved sample produces the agreed output
    Given a dedicated regression environment with the approved workflow
    And a uniquely identified approved sample input
    When I submit the sample exactly once
    Then the correlated workflow reaches its agreed successful state
    And its output satisfies the reviewed artifact contract
```

Before making this executable:

1. Verify the real UI capability and locator contracts.
2. Implement per-scenario typed correlation state.
3. Add a mutation-only config/explicit opt-in; keep this out of smoke.
4. Implement real assertions and failure handling, not placeholder passes.
5. Add safe cleanup and output verification.
6. Run in isolation; review evidence and repeatability before CI scheduling.

First easier exercise: automate an approved existing job's **read-only** details
without submitting anything. Keep the engine-output assertion separate from the
web page's completion badge.
