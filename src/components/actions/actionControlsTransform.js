import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';

// Run before JSX compilation, in both the live preview and published builds.
export default function actionControlsTransform() {
  return {
    name: 'alsight-action-controls', enforce: 'pre',
    transform(code, id) {
      const filename = id.split('?')[0].replace(/\\/g, '/');
      if (!filename.includes('/src/') || filename.includes('/components/actions/') || !/\.[jt]sx?$/.test(filename) || !/(<button\b|<form\b|onClick|onSubmit)/.test(code)) return null;
      const ast = parse(code, { sourceType: 'module', plugins: ['jsx', ...(/\.tsx?$/.test(filename) ? ['typescript'] : [])] });
      const traverse = traverseModule.default || traverseModule;
      traverse(ast, actionControlsVisitor({ types: t }).visitor, undefined, { filename });
      const generate = generateModule.default || generateModule;
      return generate(ast, { sourceMaps: true, sourceFileName: filename }, code);
    }
  };
}

// Apply the same action lifecycle without changing action arguments or styling.
function actionControlsVisitor({ types: t }) {
  return {
    name: 'alsight-action-controls',
    visitor: {
      Program: {
        enter(path, state) {
          const filename = (state.filename || '').replace(/\\/g, '/');
          state.actionControls = filename.includes('/src/') && !filename.includes('/components/actions/') ? new Map() : null;
        },
        exit(path, state) {
          state.actionControls?.forEach((identifier, tag) => {
            const component = tag === 'button' ? 'ActionButton' : tag === 'form' ? 'ActionForm' : 'actionResults';
            path.unshiftContainer('body', t.importDeclaration(
              [tag === 'capture' ? t.importSpecifier(identifier, t.identifier('captureActionResult')) : t.importDefaultSpecifier(identifier)],
              t.stringLiteral(`@/components/actions/${component}`)
            ));
          });
        }
      },
      JSXAttribute(path, state) {
        if (!state.actionControls || !['onClick', 'onSubmit'].includes(path.node.name.name)) return;
        if (!t.isJSXExpressionContainer(path.node.value)) return;
        const handler = path.get('value').get('expression');
        if (!handler?.isArrowFunctionExpression() && !handler?.isFunctionExpression()) return;
        handler.traverse({ CallExpression(call) {
          if (call.getFunctionParent() !== handler) return;
          if (!state.actionControls.has('capture')) state.actionControls.set('capture', path.scope.generateUidIdentifier('captureActionResult'));
          call.replaceWith(t.callExpression(t.cloneNode(state.actionControls.get('capture')), [call.node]));
          call.skip();
        } });
      },
      JSXElement(path, state) {
        if (!state.actionControls) return;
        const opening = path.node.openingElement;
        if (!t.isJSXIdentifier(opening.name) || !['button', 'form'].includes(opening.name.name)) return;
        const tag = opening.name.name;
        if (!state.actionControls.has(tag)) state.actionControls.set(tag, path.scope.generateUidIdentifier(tag === 'button' ? 'ActionButton' : 'ActionForm'));
        const identifier = state.actionControls.get(tag);
        opening.name = t.jsxIdentifier(identifier.name);
        if (path.node.closingElement) path.node.closingElement.name = t.jsxIdentifier(identifier.name);
      }
    }
  };
}