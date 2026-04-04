# AI Workspace Coordination Protocol

**Active Manager:** Antigravity (Primary Architect & Tech Lead)
**Managed Agents:** Claude, GPT-5.4

## Autonomous 4-Phase Consensus Protocol (Task ID Example: `0001`)

To prevent misaligned overwrites and ensure synchronized execution without requiring user intervention, Claude and GPT-5.4 MUST execute the following 4-Phase Consensus Protocol autonomously before modifying any project source code files.

**TRIGGER CONDITION:** This protocol should ONLY be initiated if the user's prompt begins with `//` (e.g., `// Execute task 0001`). If the prompt does not begin with `//`, operate as a standard conversational assistant.

For any given task ID (e.g., `0001`), proceed through the following steps consecutively without waiting for user prompts:

### Phase 1: Initial Drafting (`[TASK_ID]_1`)
1. Create or overwrite your specific plan file in the `plans/` directory (e.g., `plans/[TASK_ID]_[AGENT_NAME]_plan.md`).
2. Write your initial technical approach, file targets, and step-by-step implementation plan.
3. Save the file.

### Phase 2: Peer Review & Override (`[TASK_ID]_2`)
1. Read the other agent's Phase 1 plan file.
2. Compare their approach with yours.
3. Update your plan file with a `## Phase 2` section.
4. **Action:** Approve their plan, propose modifications, OR use the `--force` directive over specific files/logic. 
   - *Note on `--force`: Use `--force` ONLY if the other agent's plan will cause critical failure, corruption, or violates architectural constraints.*
5. Save the file.

### Phase 3: Resolution & Agreement (`[TASK_ID]_3`)
1. Read the other agent's Phase 2 updates to evaluate their feedback and any `--force` directives.
2. Check what was `--force`d, what was requested, and what was agreed upon.
3. Update your plan file with a `## Phase 3` section, synthesizing the final, agreed-upon architecture. All conflicts and overrides must be resolved here.
4. Save the file.

### Phase 4: Final Verification & Execution (`[TASK_ID]_4`)
1. Read the other agent's Phase 3 updates to verify strict alignment.
2. Evaluate: Is the final state of the plan 100% agreed upon by both agents?
3. If **YES**: Update your plan with `## Phase 4: Verified` and **START WORKING** on your assigned files immediately. No further prompts needed.
4. If **NO**: Halt execution and request Antigravity's intervention through the user.

## Universal Agent Rules
1. **Acknowledge the Manager:** Antigravity assigns the tasks and domains on the Task Board.
2. **Domain Integrity:** Never modify files outside your assigned domain as defined in the Task Board.
3. **Execution Independence:** Once Phase 4 is verified, assume you are cleared for autonomous execution.
