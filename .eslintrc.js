module.exports = {
	'env': {
		'browser': true,
		'es2021': true
	},
	'extends': 'eslint:recommended',
	'parserOptions': {
		'ecmaVersion': 12,
		'sourceType': 'module'
	},
	'rules': {
		'indent': ['error', 2, {
			SwitchCase: 1,
			// continuation indent
			VariableDeclarator: 1, // indent is multiplier * indent = 1 * 2
			MemberExpression: 'off', // https://github.com/htmlacademy/eslint-config-htmlacademy/issues/35
			FunctionDeclaration: { parameters: 2 },
			FunctionExpression: { parameters: 2 },
			CallExpression: { arguments: 2 }
		}],
		'linebreak-style': [
			'error',
			'windows'
		],
		'quotes': [
			'error',
			'single'
		],
		'semi': [
			'error',
			'always'
		],
		'camelcase': [
			'error',
			'always'
		],
		'key-spacing': 'error',
		'no-cond-assign': 'error', // eslint:recommended
		'no-irregular-whitespace': 'error', // eslint:recommended
		'no-unexpected-multiline': 'error', // eslint:recommended
		'no-console': 'error',
		'no-constant-condition': 'error',
		'no-control-regex': 'error',
		'no-debugger': 'error',
		'no-dupe-keys': 'error',
		'no-dupe-args': 'error',
		'no-duplicate-case': 'error',
		'no-empty': 'error',
		'no-empty-character-class': 'error',
		'no-ex-assign': 'error',
		'no-extra-boolean-cast': 'error',
		'no-extra-semi': 'error',
		'no-func-assign': 'error',
		'no-inner-declarations': ['error', 'functions'],
		'no-invalid-regexp': 'error',
		'no-unsafe-negation': 'error',
		'no-obj-calls': 'error',
		'no-regex-spaces': 'error',
		'no-sparse-arrays': 'error',
		'no-unreachable': 'error',
		'use-isnan': 'error',
		'valid-typeof': 'error',
		'guard-for-in': 'error',
		'max-nested-callbacks': ['error', { max: 3 }],
		'no-caller': 'error',
		'no-extend-native': 'error',
		'no-extra-bind': 'error',
		'no-invalid-this': 'error',
		'no-multi-spaces': 'error',
		'no-multi-str': 'error',
		'no-new-wrappers': 'error',
		'no-throw-literal': 'error', // eslint:recommended
		'no-with': 'error',
		'consistent-return': 'error',
		'curly': ['error', 'all'],
		'eqeqeq': 'error',
		'no-alert': 'error',
		'no-eval': 'error',
		'no-fallthrough': 'error',
		'no-floating-decimal': 'error',
		'no-implied-eval': 'error',
		'no-iterator': 'error',
		'no-labels': 'error',
		'no-lone-blocks': 'error',
		'no-global-assign': 'error',
		'no-new': 'error',
		'no-new-func': 'error',
		'no-octal': 'error', // default
		'no-octal-escape': 'error',
		'no-proto': 'error',
		'no-redeclare': 'error', // default
		'no-return-assign': 'error',
		'no-script-url': 'error',
		'no-sequences': 'error',
		'no-unused-expressions': 'error',
		'radix': 'error',
		'strict': ['error', 'global'],
		'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_' }], // check that all args are used¬
		'no-delete-var': 'error', // eslint:recommended
		'no-label-var': 'error',
		'no-shadow': 'error',
		'no-shadow-restricted-names': 'error',
		'no-undef': 'error', // default
		'no-undef-init': 'error',
		'no-undefined': 'off', // https://github.com/htmlacademy/eslint-config-htmlacademy/issues/36
		'camelcase': 'error',
	}
};
