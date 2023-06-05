import { JSONValue } from './JSON';

/**
 * TODO: write docs for Node type
 */
type Node = {
  type: string;
  children: Node[];
  value?: JSONValue;
};

export { Node };
