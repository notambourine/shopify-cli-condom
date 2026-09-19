import { Kind, parse } from 'graphql';
import type { FieldNode, OperationDefinitionNode, ValueNode } from 'graphql';

export type GraphqlRequest = { query: string; variables?: Record<string, unknown> | null; operationName?: string | null };

export type Decision =
  | { allow: true; field: string; themeIds: string[] }
  | { allow: false; reason: string };

const readOnlyFields = new Set(['onlineStore', 'metafieldDefinitions']);
const themeScopedFields: Record<string, string> = {
  theme: 'id', themeDelete: 'id', themeUpdate: 'id', themeFilesUpsert: 'themeId', themeFilesDelete: 'themeId',
};

const deny = (reason: string): Decision => ({ allow: false, reason });
const allow = (field: string, themeIds: string[] = []): Decision => ({ allow: true, field, themeIds });

export function themeId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(?:gid:\/\/shopify\/OnlineStoreTheme\/)?(\d{1,20})$/.exec(value);
  return match?.[1] ?? null;
}

function resolve(node: ValueNode, variables: Record<string, unknown>): unknown {
  switch (node.kind) {
    case Kind.VARIABLE: return variables[node.name.value];
    case Kind.NULL: return null;
    case Kind.INT: case Kind.FLOAT: case Kind.STRING: case Kind.ENUM: return node.value;
    case Kind.BOOLEAN: return node.value;
    case Kind.LIST: return node.values.map((value) => resolve(value, variables));
    case Kind.OBJECT: return Object.fromEntries(node.fields.map((field) => [field.name.value, resolve(field.value, variables)]));
  }
}

function variableValues(operation: OperationDefinitionNode, provided: Record<string, unknown>): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const definition of operation.variableDefinitions ?? []) {
    const name = definition.variable.name.value;
    values[name] = provided[name] !== undefined ? provided[name]
      : definition.defaultValue ? resolve(definition.defaultValue, {}) : undefined;
  }
  return values;
}

function argumentValues(field: FieldNode, variables: Record<string, unknown>): Map<string, unknown> {
  return new Map((field.arguments ?? []).map((argument) => [argument.name.value, resolve(argument.value, variables)]));
}

export function evaluate(request: GraphqlRequest): Decision {
  let document;
  try {
    document = parse(request.query, { noLocation: true, maxTokens: 20_000 });
  } catch (error) {
    return deny(`GraphQL parse error: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (document.definitions.length !== 1) return deny('Exactly one operation is allowed.');
  const [operation] = document.definitions;
  if (operation?.kind !== Kind.OPERATION_DEFINITION) return deny('Only query and mutation operations are allowed.');
  if (operation.operation === 'subscription') return deny('Subscriptions are not allowed.');
  const selections = operation.selectionSet.selections;
  const [root] = selections;
  if (selections.length !== 1 || root?.kind !== Kind.FIELD) return deny('Exactly one root field is allowed.');

  const name = root.name.value;
  const provided = request.variables ?? {};
  if (typeof provided !== 'object' || Array.isArray(provided)) return deny('Variables must be an object.');
  const args = argumentValues(root, variableValues(operation, provided));

  if (readOnlyFields.has(name)) return allow(name);
  if (name === 'themeCreate') {
    return args.get('role') === 'DEVELOPMENT' ? allow(name) : deny('themeCreate requires role DEVELOPMENT.');
  }
  if (name === 'themes') {
    const roles = args.get('roles');
    return Array.isArray(roles) && roles.length > 0 && roles.every((role) => role === 'DEVELOPMENT')
      ? allow(name) : deny('themes requires roles: [DEVELOPMENT].');
  }
  const argument = themeScopedFields[name];
  if (argument !== undefined) {
    const id = themeId(args.get(argument));
    return id === null ? deny(`${name} requires a theme id.`) : allow(name, [id]);
  }
  return deny(`${name} is not allowed through the proxy.`);
}
