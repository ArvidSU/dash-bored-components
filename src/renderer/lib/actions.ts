function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Prefix a verb unless the label already starts with it ("Run QA", not "Run Run QA"). */
export function verbLabel(verb: string, label: string): string {
  return normalize(label).split(" ")[0] === normalize(verb) ? label : `${verb} ${label}`;
}
