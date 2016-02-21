import path from 'path';

const REQUIRE_PATTERN = /^~\//;

function testPattern(value, pattern) {
  let type = typeof pattern;

  if (type !== 'undefined' && type !== 'string') {
    throw Error('Invalid require prefix pattern.');
  }

  let regexp = type === 'string' ? new RegExp(pattern) : REQUIRE_PATTERN;

  if (!regexp.test(value)) {
    return false;
  }

  return value.replace(regexp, '');
}

function resolveAbsolute(filename) {
  filename = path.normalize(filename);
  if (path.isAbsolute(filename)) {
    return filename;
  }

  if (process.env.PWD) {
    return path.resolve(process.env.PWD, filename);
  }

  return path.resolve(filename);
}

function makeRelative(basePath, modulePath) {
  let relativePath = path.relative(basePath, modulePath);

  if (!relativePath.startsWith('.')) {
    relativePath = path.join('./', relativePath);
  }

  return relativePath;
}

function getOverrides(currentPath, projectPath, overrides) {
  const matches = [];

  for (let override of overrides) {
    const pathPrefix = path.join(projectPath, override);

    if (typeof override === 'string' && currentPath.startsWith(pathPrefix)) {
      matches.push(override);
    }
  }

  return matches;
}

function getBasePath(currentPath, projectPath, options) {
  const { overrides = [], basePath = '' } = options;
  const matches = [...getOverrides(currentPath, projectPath, overrides)];

  return resolveAbsolute(matches.pop() || basePath);
}

function makeModulePathRelative(currentFile, node, options) {
  const requirePath = testPattern(node.value, options.pattern);

  if (requirePath) {
    const currentPath = resolveAbsolute(path.dirname(currentFile));
    const rootPath = resolveAbsolute('.');
    const basePath = getBasePath(currentPath, rootPath, options);

    node.value = makeRelative(currentPath, resolveAbsolute(path.join(basePath, requirePath)));
  }
}

export default ({ types: t }) => {
  return {
    visitor: {
      CallExpression: {
          exit({ node }, state) {
            if(!t.isIdentifier(node.callee, { name: 'require' }) &&
              !(
                t.isMemberExpression(node.callee) &&
                t.isIdentifier(node.callee.object, { name: 'require' })
              )
            ) {
              return;
            }

            const currentFile = state.file.opts.filename;
            const moduleNode = node.arguments[0];

            if (t.isStringLiteral(moduleNode)) {
              makeModulePathRelative(currentFile, moduleNode, state.opts);
            }
          }
      },
      ImportDeclaration: {
        exit({ node }, state) {
          const currentFile = state.file.opts.filename;
          const moduleNode = node.source;

          if (t.isStringLiteral(moduleNode)) {
            makeModulePathRelative(currentFile, moduleNode, state.opts);
          }
        }
      }
    }
  };
};
