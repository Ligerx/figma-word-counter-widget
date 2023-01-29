export type Counts = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  numSelected: number;
};

/**
 * Get Counts object form a list of nodes
 * @param nodes
 * @returns Counts
 */
export function getCountsForNodes(nodes: SceneNode[]): Counts {
  const strings = findAllTextForNodes(nodes);
  return getCounts(strings);
}

function findAllTextForNodes(nodes: SceneNode[]): string[] {
  // Weird Typescript warning that seems like a bug
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return nodes.flatMap(findAllTextForNode);
}

function findAllTextForNode(node: SceneNode): string[] {
  if (node.type === "TEXT") return [node.characters];
  if (!("findAll" in node)) return [];

  const textNodes = node.findAll(
    (child) => child.type === "TEXT"
  ) as TextNode[];
  return textNodes.map((node) => node.characters);
}

function getCounts(strings: string[]): Counts {
  return {
    characters: countCharacters(strings),
    charactersNoSpaces: countCharactersNoSpaces(strings),
    words: countWords(strings),
    numSelected: strings.length,
  };
}

// counting words makes most sense with an array of strings instead of 1 concatenated string
function countCharacters(strings: string[]): number {
  let count = 0;
  strings.forEach((string) => (count += string.length));
  return count;
}

function countCharactersNoSpaces(strings: string[]): number {
  let count = 0;
  strings.forEach((string) => {
    const stringNoSpaces = string.replace(/\s+/g, "");
    count += stringNoSpaces.length;
  });
  return count;
}

function countWords(strings: string[]): number {
  let count = 0;
  strings.forEach((string) => {
    count += string.split(/\s+/g).length;
  });
  return count;
}
