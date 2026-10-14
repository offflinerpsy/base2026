import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, rm, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { privateStateDirectory } from "../scripts/state-directory.mjs";
test("local state cannot resolve into Git through a .. prefix or an outside symlink", async () => {
  const root = await mkdtemp(join(tmpdir(), "service-state-"));
  try {
    const repo = join(root, "repository"),
      outside = join(root, "private");
    await mkdir(repo);
    await mkdir(outside);
    assert.throws(() => privateStateDirectory(undefined, repo));
    assert.throws(() => privateStateDirectory("relative", repo));
    assert.throws(() => privateStateDirectory(repo, repo));
    assert.throws(() => privateStateDirectory(join(repo, "..cache"), repo));
    const link = join(outside, "repo-link");
    await symlink(repo, link);
    assert.throws(() => privateStateDirectory(join(link, "new-state"), repo));
    assert.equal(
      privateStateDirectory(join(outside, "new-state"), repo),
      join(await realpath(outside), "new-state"),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
