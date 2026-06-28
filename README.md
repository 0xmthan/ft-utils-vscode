# ft_utils

A lightweight VS Code extension providing essential 42 utilities for C and Python development.
- Insert and maintain the 42 header
- Auto-insert headers on new files
- Track function count in `.c` files from the status bar

```bash
# **************************************************************************** #
#                                                                              #
#                                                          :::      ::::::::   #
#   ft_utils                                             :+:      :+:    :+:   #
#                                                      +:+ +:+         +:+     #
#   By: mtaheri <mtaheri@student.42istanbul.com.tr>  +#+  +:+       +#+        #
#                                                  +#+#+#+#+#+   +#+           #
#   Created: 2025/11/15 20:39:25 by mtaheri             #+#    #+#             #
#   Updated: 2026/02/14 23:06:52 by mtaheri            ###   ########.fr       #
#                                                                              #
# **************************************************************************** #
```

## Install

1. Open Extensions in VS Code.
2. Search for `ft_utils` and install.
3. Or run `ext install 2mdtln.ft-header` from the Command Palette.

## What It Does

### 42 Header
- Command: `ft_utils: Insert 42 Header`
- Shortcut: `⌘⌥H` (macOS) / `Ctrl+Alt+H` (Windows/Linux)
- Inserts the standard 42 header at the top of the file.
- If the header already exists, it updates the `Updated` line.
- Saving a file with an existing header refreshes the `Updated` timestamp.
- Uses a 79-character total header width for Python files to respect flake8 linter standards (`E501`).

#### Auto Header
- Toggle from the status bar: **42 Auto Header**
- Toggle from command: `ft_utils: Toggle 42 Auto Header`
- When enabled, creating a new file auto-inserts a header.

#### Update On Save
- Toggle from command: `ft_utils: Toggle Header Update On Save`
- Enabled by default.
- When disabled, saving files no longer refreshes the header `Updated` line.

### Function Count (`.c`)
- Shows `Functions: N` in the status bar when a `.c` file is active.
- Warns when function count is `> 5`.
- Updates automatically as you edit.

### Function Line Count (`.c`)
- Shows the line count of each function inline, after the closing `}`.
- Turns red when a function exceeds the 25-line norminette limit.
- Can be disabled via `ft_utils.showFunctionLineCount`.

## Configuration

You can configure the extension in 2 ways.

### Settings UI
1. Open VS Code Settings.
2. Search for `ft_utils`.
3. Set:
- `ft_utils.email` (your 42 email)
- `ft_utils.login` (optional override; defaults to the part before `@` in the email)

### `settings.json`
Add these keys to your VS Code `settings.json`:

```json
{
  "ft_utils.email": "login@student.42.fr"
}
```

## Star

If this extension improves your workflow, consider ⭐ starring the [repository](https://github.com/0xmthan/ft-utils-vscode).

## License

This project is licensed under the [MIT License](https://github.com/0xmthan/ft-utils-vscode/blob/main/LICENSE).  
© 2025–2026 Muhammed T (2mdtln)
