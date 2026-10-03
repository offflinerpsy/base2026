import { realpathSync } from "node:fs";
import {
  resolve,
  isAbsolute,
  relative,
  sep,
  dirname,
  basename,
} from "node:path";
export function privateStateDirectory(raw, repository) {
  if (!raw || !isAbsolute(raw))
    throw Error(
      "Set SERVICE_STATE_DIR to an absolute private directory outside Git",
    );
  let ancestor = resolve(raw),
    suffix = [];
  while (true) {
    try {
      ancestor = realpathSync(ancestor);
      break;
    } catch (error) {
      if (error.code !== "ENOENT" || dirname(ancestor) === ancestor)
        throw error;
      suffix.unshift(basename(ancestor));
      ancestor = dirname(ancestor);
    }
  }
  const canonical = resolve(ancestor, ...suffix);
  const relation = relative(realpathSync(repository), canonical);
  if (
    !(
      relation === ".." ||
      relation.startsWith(".." + sep) ||
      isAbsolute(relation)
    )
  )
    throw Error(
      "SERVICE_STATE_DIR resolves inside Git; choose a private directory outside the repository",
    );
  return canonical;
}
