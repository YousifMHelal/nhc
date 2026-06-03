import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import nextPlugin from '@next/eslint-plugin-next'

const physicalDirPatterns = [
  { pattern: /\bpl-/, label: 'pl-' },
  { pattern: /\bpr-/, label: 'pr-' },
  { pattern: /\bml-/, label: 'ml-' },
  { pattern: /\bmr-/, label: 'mr-' },
  { pattern: /\bleft-/, label: 'left-' },
  { pattern: /\bright-/, label: 'right-' },
  { pattern: /\btext-left\b/, label: 'text-left' },
  { pattern: /\btext-right\b/, label: 'text-right' },
]

const nhcRtlPlugin = {
  rules: {
    'no-physical-dir': {
      create(context) {
        function checkClassString(node, value) {
          if (typeof value !== 'string') return
          for (const { pattern, label } of physicalDirPatterns) {
            if (pattern.test(value)) {
              context.report({
                node,
                message: `Physical direction class "${label}" is forbidden. Use Tailwind logical properties (ps-, pe-, ms-, me-, start-, end-) instead.`,
              })
            }
          }
        }

        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className' && node.name.name !== 'class') return
            const val = node.value
            if (!val) return
            if (val.type === 'Literal') {
              checkClassString(node, val.value)
            } else if (val.type === 'JSXExpressionContainer') {
              const expr = val.expression
              if (expr.type === 'Literal') {
                checkClassString(node, expr.value)
              } else if (expr.type === 'TemplateLiteral') {
                for (const quasi of expr.quasis) {
                  checkClassString(node, quasi.value.raw)
                }
              }
            }
          },
          CallExpression(node) {
            const calleeName =
              node.callee.type === 'Identifier' ? node.callee.name : null
            if (!['cn', 'clsx', 'cva', 'twMerge'].includes(calleeName)) return
            for (const arg of node.arguments) {
              if (arg.type === 'Literal') {
                checkClassString(node, arg.value)
              } else if (arg.type === 'TemplateLiteral') {
                for (const quasi of arg.quasis) {
                  checkClassString(node, quasi.value.raw)
                }
              }
            }
          },
        }
      },
    },
  },
}

export default [
  {
    ignores: ['node_modules/**', '.next/**', 'src/components/ui/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin,
      'nhc-rtl': nhcRtlPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      'nhc-rtl/no-physical-dir': 'error',
    },
  },
]
