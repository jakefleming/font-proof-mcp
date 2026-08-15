# font-proof-mcp

Create and modify Hellbox documents programmatically. Hellbox (formerly Font Proof) is a macOS app for type designers that generates PDF font proofs and live-reloads them from Glyphs and RoboFont.

This package launches the MCP server that ships inside the [Hellbox](https://hellbox.com) app bundle. The server lets AI tools create and edit `.fontproof` documents directly; the app does not need to be running.

## Requirements

- macOS 12 or later
- [Hellbox](https://hellbox.com) installed (the server binary ships inside the app)
- Node.js 18+ (for `npx`)

## Setup

The easiest path is Hellbox's built-in one-click setup: open Hellbox, go to Preferences, then AI Integration, and click the installer for your client. To set it up manually instead:

### Claude Code

```bash
claude mcp add font-proof -- npx -y font-proof-mcp
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "font-proof": {
      "command": "npx",
      "args": ["-y", "font-proof-mcp"]
    }
  }
}
```

### Cursor

Add the same `command` / `args` pair to `~/.cursor/mcp.json`.

If Hellbox is installed somewhere other than `/Applications` or `~/Applications`, set `FONT_PROOF_MCP_PATH` to the full path of `Hellbox.app/Contents/Helpers/font-proof-mcp`.

## Tools

- **Documents:** `create_proof`, `create_complete_proof`, `open_proof`, `get_proof_info`, `open_in_app`
- **Sections:** `add_section`, `update_section`, `delete_section`, `reorder_sections`, `duplicate_section`, `set_section_content_bulk`, `update_section_settings`
- **Fonts:** `add_fonts`, `remove_fonts`, `list_system_fonts` (variable font axes supported)
- **Glyphs 3:** `list_glyphs_fonts`, `add_glyphs_fonts`

Full documentation: [hellbox.com/docs](https://hellbox.com/docs) under "MCP Server".

## How it works

The MCP server is a Swift binary embedded in the Hellbox app at `Contents/Helpers/font-proof-mcp`, codesigned with the app and always in sync with the app's document format. This package is a thin launcher: it finds that binary and hands over stdio. No server logic is duplicated here, so the tools you get always match the app version you have installed.

The package keeps the `font-proof-mcp` name from the app's Font Proof era; the npm name, the server name MCP clients see, and the `.fontproof` file extension are all stable across the rename.

---

Hellbox is made by [Minim Industries](https://hellbox.com).
