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
  if (path.isAbsolute(filename)) {
    return filename;
  }

  if (process.env.PWD) {
    return path.resolve(process.env.PWD, filename);
  }

  return path.resolve(filename);
}

function makeRelative(currentFile, module) {
  let currentPath = resolveAbsolute(path.dirname(currentFile));
  let modulePath = resolveAbsolute(path.normalize(module));

  let relativePath = path.relative(currentPath, modulePath);

  if (!relativePath.startsWith('.')) {
    relativePath = path.join('./', relativePath);
  }

  return relativePath;
}

function makeModulePathRelative(currentFile, node, options) {
  const { pattern } = options;
  const requirePath = testPattern(node.value, pattern);

  if (requirePath) {
    const modulePath = makeRelative(currentFile, requirePath);

    if (modulePath) {
      node.value = modulePath;
    }
  }
}

export default ({ types: t }) => {
  return {
    visitor: {
      CallExpression: {
          exit({ node, opts }, state) {
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
              makeModulePathRelative(currentFile, moduleNode, opts);
            }
          }
      },
      ImportDeclaration: {
        exit({ node, opts }, state) {
          const currentFile = state.file.opts.filename;
          const moduleNode = node.source;

          if (t.isStringLiteral(moduleNode)) {
            makeModulePathRelative(currentFile, moduleNode, opts);
          }
        }
      }
    }
  };
};
