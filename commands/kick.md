---
description: Show where the project stands in the kickoff workflow and continue with the next step
argument-hint: "[phase]"
---

Invoke the `kickoff:using-kickoff` skill and follow it. Start by running `kickoff status` in the project root.

If a phase was named ($ARGUMENTS), check it with `kickoff can <phase>` before invoking that phase's skill, as the
skill's route section says.
