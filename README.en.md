# dsh-message-collapse

A DSH web plugin that collapses long user messages. Messages over 10 lines are folded automatically; click "Expand all" to read the full content.

## Install

```bash
dsh plugin --profile web add github:masknull/dsh-message-collapse
```

**Restart DSH** after installing.

## Usage

No configuration needed. Send a long message to the assistant and an "Expand all" pill appears at the bottom-right of the bubble:

- Click **Expand all** → full content shows, the pill becomes **Collapse**
- Click **Collapse** → back to folded
- Short messages (≤10 lines) show no pill and behave like the default

## Uninstall

```bash
dsh plugin --profile web remove dsh-message-collapse
```

Restart DSH to restore the default behavior.

## License

[MIT](./LICENSE)