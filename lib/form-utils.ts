export function parseMetadataLines(value: string): Record<string, string> {
  return Object.fromEntries(
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return separatorIndex === -1
          ? ([line, ""] as const)
          : ([line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim()] as const);
      })
      .filter(([key, entryValue]) => key && entryValue)
  );
}

export function formatMetadataLines(metadata: Record<string, string>): string {
  return Object.entries(metadata)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}
