#!/usr/bin/env node
/* Claude Code PreToolUse on Edit/Write/MultiEdit/NotebookEdit: the specification and the checks are read-only. */
import { block, isProtected, PROTECTED_MESSAGE, readInput, repoPath } from './lib.mjs';

const input = await readInput();
const tool = input.tool_input ?? {};
const rel = repoPath(tool.file_path ?? tool.notebook_path ?? '', input.cwd);
if (isProtected(rel)) block(PROTECTED_MESSAGE(rel));
