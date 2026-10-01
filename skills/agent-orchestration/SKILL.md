---
name: agent-orchestration
description: Proactively orchestrate AI agents running as panes in a single tmux window — scan statuses, assess progress, send next instructions, and coordinate multi-agent workflows. Use when users ask to manage agents, orchestrate work across agents, or check on agent progress.
---

# Agent Orchestration (tmux)

You are the **team lead**. You own the orchestration loop. The agents you coordinate are each running interactively inside their own **pane of a single tmux window**. You do NOT ask the user to check on agents or relay information — you do it yourself, automatically, via tmux, until every agent is done or the user tells you to stop.

## First action on invocation (MANDATORY)

The moment this skill is invoked, **before anything else**, show every agent in the **current tmux window**. Run:

```sh
tmux list-panes -F '#{session_name}:#{window_index}.#{pane_index} id=#{pane_id} title=#{pane_title} cmd=#{pane_current_command} pid=#{pane_pid} active=#{pane_active} #{t/f:pane_dead,dead,live}'
```

Then present the full roster to the user — one line per agent (pane), including its target (`<session>:<window>.<pane>`), label/title, running command, and live/dead state. Do this every time the skill starts, even if you think you already know the layout. Only after the roster is shown do you proceed to build context and enter the orchestration loop below.

## Setup model

- One tmux **window** holds the whole team; each **pane** runs one agent (e.g. `claude`, `codex`, `gemini`).
- You address a pane by its target: `<session>:<window>.<pane>` — e.g. `team:0.1`. If only one session/window is in play, `<window>.<pane>` (e.g. `0.1`) or just the pane id (`%3`) works.
- You interact with panes through three tmux primitives only:
  - **list** panes → discover agents and their state
  - **capture** a pane → read what an agent has produced
  - **send-keys** to a pane → give an agent its next instruction
- There is no JSON status API. Status is **inferred** from the pane's recent output (see Status inference below). Never fabricate a status — always capture the pane first.

## Hard Rules

- **You drive the loop.** Never ask "should I check again?" or "let me know when ready." YOU decide when to check, and you keep looping until the work is done.
- Always run a fresh `tmux capture-pane` before judging an agent — never act on stale or assumed output.
- Every instruction sent to an agent must be **self-contained and specific** — the target agent has no awareness of this orchestration layer or of other agents.
- **Track what you sent.** Before sending an instruction, check whether you already sent the same or equivalent message in a previous pass. Never re-send duplicate instructions.
- **One line per send.** `send-keys` delivers a message as if typed; keep each instruction to a single line (use semicolons or periods to separate points), then submit with a separate `Enter`. Multi-line text can trigger premature submission in some agent REPLs.
- **Escalate to user ONLY when**: you can't resolve an agent's error after 2 attempts, a decision requires product/business judgment, agents have conflicting outputs you can't resolve, or an agent is stuck after corrective attempts. Include: which agent (pane), what happened, your recommendation, what you need. After the user responds, **resume the loop immediately**.

## Red Flags and Rationalizations

| Rationalization                   | Why It's Wrong                      | Do Instead                                       |
| --------------------------------- | ----------------------------------- | ------------------------------------------------ |
| "The agent said it's done"        | Agents claim done without evidence  | Check the diff and run tests                     |
| "I'll check on it later"          | You are the loop — no one else will | Capture now, act now                             |
| "Both agents can edit that file"  | Parallel edits cause conflicts      | Sequence or assign non-overlapping scopes        |
| "The pane looks quiet, it's done" | Quiet can mean waiting-for-input    | Capture and read the last prompt before deciding |

## Approval Guardrails

You may approve autonomously: code style changes, test results, routine clarifications, and non-destructive progress steps.

You MUST escalate to the user: PRs/merges to main, destructive operations (delete, drop, force-push), security-sensitive changes, architectural decisions, and anything that affects shared/production systems.

When unsure, escalate.

## tmux Reference

| Goal                                | Command                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| List sessions                       | `tmux list-sessions`                                                                                                                                                                                   |
| List windows                        | `tmux list-windows -a`                                                                                                                                                                                 |
| **Show agents — current window**    | `tmux list-panes -F '#{session_name}:#{window_index}.#{pane_index} id=#{pane_id} title=#{pane_title} cmd=#{pane_current_command} pid=#{pane_pid} active=#{pane_active} #{t/f:pane_dead,dead,live}'`     |
| Show agents — a specific window     | `tmux list-panes -t <session>:<window> -F '<same format string>'`                                                                                                                                      |
| **List agent panes (all windows)**  | `tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} id=#{pane_id} title=#{pane_title} cmd=#{pane_current_command} pid=#{pane_pid} active=#{pane_active} #{t/f:pane_dead,dead,live}'` |
| **Capture a pane** (last N lines)   | `tmux capture-pane -p -t <target> -S -<N>`                                                                                                                                                             |
| Capture full scrollback             | `tmux capture-pane -p -t <target> -S -`                                                                                                                                                                |
| **Send an instruction**             | `tmux send-keys -t <target> '<single-line message>' ; tmux send-keys -t <target> Enter`                                                                                                                |
| Send a control key (e.g. interrupt) | `tmux send-keys -t <target> C-c`                                                                                                                                                                       |
| Title a pane (label an agent)       | `tmux select-pane -t <target> -T '<agent-name>'`                                                                                                                                                       |

Notes:

- Because the whole team lives in **one window**, default to the current-window `list-panes` (no `-a`) to show every spawned agent — it returns exactly the team's panes and nothing else. Use the `-a` variant only when you're driving agents across more than one window, or `-t <session>:<window>` to target a window you're not attached to.
- `tmux list-panes` with no target lists the **current** window — the one your tmux client is attached to. If you're not attached to the team's window, pass `-t <session>:<window>` explicitly so you don't list the wrong window's panes.
- `<target>` is `<session>:<window>.<pane>` or a pane id like `%3`.
- Put the message in **single quotes** and escape any embedded single quote as `'\''`. Send the message and `Enter` as **two separate `send-keys` calls** so the text is fully entered before submission.
- `pane_current_command` tells you what's running in the pane (e.g. `node`, `python`, a shell like `zsh`). A pane that has dropped back to a bare shell usually means its agent process exited.
- Labeling panes once with `select-pane -T` makes every later `list-panes` self-documenting.

## Status inference

There is no status field — derive it from a fresh capture of the pane's tail:

- **waiting** — the agent has printed a question/approval prompt and is blocked on input → instruct or approve NOW.
- **idle** — output settled, no pending question, prompt returned → finished or stalled, investigate.
- **running** — output changed since last pass / a spinner or streaming text is present → skip unless unchanged for too long.
- **stuck** — same tail across multiple passes with no prompt, or repeating/looping output → send a corrective instruction.
- **dead/crashed** — `pane_dead` is true, or `pane_current_command` fell back to a plain shell → report as crashed; suggest restart.

To detect change between passes, compare the new capture tail against the previous one you recorded for that pane.

## Autonomous Orchestration Loop

**This is your main behavior.** Execute this loop continuously and automatically. Do not wait for the user between iterations unless you need to escalate.

### Before entering the loop

If you don't know the overall goal or what each agent is working on, run one list + capture pass to build context from each pane's recent output. Label panes with `select-pane -T <name>` so you can track them by name. If context is still insufficient, ask the user once for the goal, then enter the loop.

### Loop

```
REPEAT until (all agents idle with no pending work) OR (user says stop):
    1. SCAN    — tmux list-panes -F '...'   (current window; -a only for multi-window teams)
    2. ASSESS  — tmux capture-pane on non-running panes; infer status
    3. ACT     — send-keys instructions, approvals, or corrections
    4. REPORT  — one-line status to user (no questions)
    5. WAIT    — run `sleep` via Bash tool, then go to 1
```

### 1. Scan

Run the current-window `list-panes` command to show all spawned agents in the team's window (use the `-a` variant only when the team spans multiple windows). Prioritize: **waiting > idle > stuck/dead > running**.

- **Waiting** — needs your instruction NOW.
- **Idle** — finished or stalled, investigate.
- **Dead/crashed** — `pane_dead` or shell fallback; report it.
- **Running** — skip unless its tail hasn't changed for several passes (>5 min).
- **Missing** — if a pane from a previous pass disappears, note it as crashed/closed in your report.

### 2. Assess

For each non-running pane: `tmux capture-pane -p -t <target> -S -30`. Read only the tail you need (widen with a larger `-S` window only if the tail is insufficient). Determine what it completed, what it needs, whether it's stuck — using the Status inference rules above.

### 3. Act

| Situation                      | Action                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Finished task                  | Apply the `verify` skill — check the agent's diff and run tests before marking complete              |
| Waiting for approval           | Auto-approve within guardrails (`send-keys` the confirmation), else escalate                         |
| Waiting for clarification      | Answer from your context, escalate only if you truly lack the answer                                 |
| Stuck or looping               | Send a corrective instruction or a new approach                                                      |
| Idle, no pending work          | Done — leave idle                                                                                    |
| Output needed by another agent | Capture it from the source pane and include it **verbatim** in the `send-keys` to the dependent pane |
| Crashed/dead pane              | Report to user, suggest restart if applicable                                                        |

### 4. Report

One brief status line per pass. Statement, not a question. Then continue.

```
Pass 3 — team:0.1 agent-A: completed auth, sent next task. team:0.2 agent-B: running (2m). team:0.3 agent-C: approved style fix.
```

### 5. Wait & Repeat

Use the **Bash tool** to run `sleep <seconds>`:

- 10-15s when agents are near completion or waiting actions are expected soon.
- 30s as default.
- 45-60s when all agents are mid-task with recent activity.

Then go back to step 1.

## Multi-Agent Coordination

- **Dependencies** — track which agents block others. Don't unblock a dependent until upstream confirms completion.
- **Information relay** — downstream agents can't see upstream panes. Capture the relevant output and include it verbatim in your `send-keys` instruction.
- **Conflict prevention** — if agents may edit the same files, sequence their work or assign non-overlapping scopes. Panes share the filesystem, so parallel edits to the same path will clobber.
- **Parallel optimization** — when an agent finishes and becomes idle, check if any remaining independent task can be assigned to it instead of leaving it idle. Prefer keeping all panes utilized over finishing sequentially.

## Completion

When all agents are idle with no remaining work, give the user a final summary: what each agent (pane) accomplished, issues encountered, and overall outcome. If a coordination lesson is worth keeping, save it to your project memory. Then stop.