const py = require('../lib/py.js');


expect.extend({
    toHaveTokens(received, ...tokens) {
        expect(received.map((t) => [t.id, t.value])).toEqual(tokens.concat([['(end)', undefined]]));
        return { pass: true };
    },
    toHaveAst(received, ast) {
        function toTuple(token) {
            if (Array.isArray(token)) {
                return token.map(toTuple);
            }

            const {id, first, second} = token
            if (first && second) {
                return [id, toTuple(first), toTuple(second)];
            } else {
                return [id, token.value];
            }
        }

        expect(toTuple(received)).toEqual(ast);
        return { pass: true };
    },
});


describe('Tokenizer', function () {
    describe('simple literals', function () {
        it('tokenizes numbers', function () {
            var toks = py.tokenize('1');
            expect(toks).toHaveTokens(['(number)', 1]);

            toks = py.tokenize('-1');
            expect(toks).toHaveTokens(['-', undefined], ['(number)', 1]);

            toks = py.tokenize('1.2');
            expect(toks).toHaveTokens(['(number)', 1.2]);

            toks = py.tokenize('.42');
            expect(toks).toHaveTokens(['(number)', .42]);
        });
        it('tokenizes strings', function () {
            var toks = py.tokenize('"foo"');
            expect(toks).toHaveTokens(['(string)', 'foo']);

            toks = py.tokenize("'foo'");
            expect(toks).toHaveTokens(['(string)', 'foo']);
        });
        it('tokenizes bare names', function () {
            var toks = py.tokenize('foo');
            expect(toks).toHaveTokens(['(name)', 'foo']);
        });
        it('tokenizes constants', function () {
            var toks = py.tokenize('None');
            expect(toks).toHaveTokens(['(constant)', 'None']);

            toks = py.tokenize('True');
            expect(toks).toHaveTokens(['(constant)', 'True']);

            toks = py.tokenize('False');
            expect(toks).toHaveTokens(['(constant)', 'False']);
        });
        it('does not fuck up on trailing spaces', function () {
            var toks = py.tokenize('None ');
            expect(toks).toHaveTokens(['(constant)', 'None']);
        });
    });
    describe('collections', function () {
        it('tokenizes opening and closing symbols', function () {
            var toks = py.tokenize('()');
            expect(toks).toHaveTokens(['(', undefined], [')', undefined]);
        });
    });
    describe('functions', function () {
        it('tokenizes kwargs', function () {
            var toks = py.tokenize('foo(bar=3, qux=4)');
            expect(toks).toHaveTokens(
                ['(name)', 'foo'],
                ['(', undefined],
                ['(name)', 'bar'],
                ['=', undefined],
                ['(number)', 3],
                [',', undefined],
                ['(name)', 'qux'],
                ['=', undefined],
                ['(number)', 4],
                [')', undefined],
            );
        });
    });
});

describe('Parser', function () {
    describe('functions', function () {
        var ast = py.parse(py.tokenize('foo(bar=3, qux=4)'));
        expect(ast).toHaveAst([
            '(',
            ['(name)', 'foo'],
            [
                ['=', ['(name)', 'bar'], ['(number)', 3]],
                ['=', ['(name)', 'qux'], ['(number)', 4]],
            ],
        ]);
    });
});
