import { grantsGovSearch, semanticMatch } from "./tools.js";
import { EmitFn, GrantCandidate, OrgProfile } from "./types.js";

/** Titles vary slightly across sources; normalise before de-duplicating. */
function titleKey(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Discovery Agent — runs the planner's queries across every available source in
 * parallel, then de-duplicates into a single candidate pool.
 */
export async function runDiscovery(
  org: OrgProfile,
  queries: string[],
  excludeIds: Set<string>,
  seenTitles: Set<string>,
  emit: EmitFn
): Promise<GrantCandidate[]> {
  emit({
    agent: "discovery",
    phase: "start",
    detail: `Searching ${queries.length} quer${queries.length === 1 ? "y" : "ies"} across Grants.gov and the semantic index in parallel…`,
  });

  const tasks: Promise<GrantCandidate[]>[] = queries.map((q) =>
    grantsGovSearch(q).then(
      (r) => {
        emit({ agent: "discovery", phase: "tool", detail: `Grants.gov "${q}" → ${r.length} result(s)` });
        return r;
      },
      (e) => {
        emit({ agent: "discovery", phase: "error", detail: `Grants.gov "${q}" failed: ${e.message}` });
        return [];
      }
    )
  );

  tasks.push(
    semanticMatch(org).then(
      (r) => {
        emit({ agent: "discovery", phase: "tool", detail: `Semantic index → ${r.length} historically-similar grant(s)` });
        return r;
      },
      (e) => {
        emit({ agent: "discovery", phase: "error", detail: `Semantic index unavailable: ${e.message}` });
        return [];
      }
    )
  );

  const results = (await Promise.all(tasks)).flat();

  const fresh: GrantCandidate[] = [];
  let dupes = 0;
  let excluded = 0;
  for (const c of results) {
    if (excludeIds.has(c.id) || (c.oppId && excludeIds.has(`gov-${c.oppId}`))) {
      excluded++;
      continue;
    }
    const key = titleKey(c.title);
    if (seenTitles.has(key)) {
      dupes++;
      continue;
    }
    seenTitles.add(key);
    fresh.push(c);
  }

  emit({
    agent: "discovery",
    phase: "result",
    detail: `${fresh.length} unique new candidate(s) after removing ${dupes} duplicate(s)${excluded > 0 ? ` and ${excluded} already acted on` : ""}.`,
  });
  return fresh;
}
