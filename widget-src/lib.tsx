/**
 * Typescript type guard - https://www.figma.com/plugin-docs/api/nodes/
 */
export function isSceneNode(node: BaseNode): node is SceneNode {
  return node.type !== "DOCUMENT" && node.type !== "PAGE";
}

export type Counts = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  numSelected: number;
};

export function getCountsForNodes(nodes: SceneNode[]): Counts {
  const strings = findAllTextForNodes(nodes);

  return {
    characters: countCharacters(strings),
    charactersNoSpaces: countCharactersNoSpaces(strings),
    words: countWords(strings),
    numSelected: strings.length,
  };
}

function findAllTextForNodes(nodes: SceneNode[]): string[] {
  // Weird Typescript warning that seems like a bug
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return nodes.flatMap(findAllTextForNode);
}

function findAllTextForNode(node: SceneNode): string[] {
  if (node.type === "TEXT") return [node.characters];
  if (!("findAll" in node)) return [];

  // Types that support `.characters` are TextNodes, but also any that extends TextSublayer,
  // which are StickyNode, ConnectorNode, ShapeWithTextNode (I think all are FigJam only).
  // https://www.figma.com/plugin-docs/api/properties/TextNode-characters/
  // https://www.figma.com/plugin-docs/search/?q=textsublayer
  //
  // This is currently only looking for TextNodes
  const textNodes = node.findAllWithCriteria({ types: ["TEXT"] });
  return textNodes.map((node) => node.characters);
}

// counting characters/words makes most sense with an array of strings instead of 1 concatenated string
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
