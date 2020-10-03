var py = require('../lib/py.js');


function assert(condition, positiveMsg, negativeMsg) {
    if (condition) {
        return { pass: true }
    } else {
        return { pass: false, message: this.isNot ? negativeMsg : positiveMsg }
    }
}

expect.extend({
    toHaveTokens(received, n) {
        var length = received.length;
        const r = assert(length === n + 1,
            'expected ' + received + ' to have ' + n + ' tokens',
            'expected ' + received + ' to not have ' + n + ' tokens');
        if (!r.pass) {
            return r;
        }

        return assert(received[length-1].id === '(end)',
            'expected ' + received + ' to have and end token',
            'expected ' + received + ' to not have an end token');
    },
    toBeNamedToken(received, value) {
        const r = assert(received.id === '(name)',
            'expected ' + received + ' to be a name token',
            'expected ' + received + ' not to be a name token');
        if (!r.pass) {
            return r;
        }

        return assert(received.value === value,
            'expected ' + received + ' to have tokenized ' + value,
            'expected ' + received + ' not to have tokenized ' + value);
    },
    toBeConstantToken(received, value) {
        const r = assert(received.id === '(constant)',
            'expected ' + received + ' to be a constant token',
            'expected ' + received + ' not to be a constant token');
        if (!r.pass) {
            return r;
        }

        return assert(received.value === value,
            'expected ' + received + ' to have tokenized ' + value,
            'expected ' + received + ' not to have tokenized ' + value);
    },
    toBeNumberToken(received, value) {
        const r = assert(received.id === '(number)',
            'expected ' + received + ' to be a number token',
            'expected ' + received + ' not to be a number token');
        if (!r.pass) {
            return r;
        }

        return assert(received.value === value,
            'expected ' + received + ' to have tokenized ' + value,
            'expected ' + received + ' not to have tokenized ' + value);
    },
    toBeStringToken(received, value) {
        const r = assert(received.id === '(string)',
            'expected ' + received + ' to be a string token',
            'expected ' + received + ' not to be a string token');
        if (!r.pass) {
            return r;
        }

        return assert(received.value === value,
            'expected ' + received + ' to have tokenized ' + value,
            'expected ' + received + ' not to have tokenized ' + value);
    },
});


describe('Tokenizer', function () {
    describe('simple literals', function () {
        it('tokenizes numbers', function () {
            var toks = py.tokenize('1');
            expect(toks).toHaveTokens(1);
            expect(toks[0]).toBeNumberToken(1);

            toks = py.tokenize('-1');
            expect(toks).toHaveTokens(2);
            expect(toks[0].id).toBe('-');
            expect(toks[1]).toBeNumberToken(1);

            toks = py.tokenize('1.2');
            expect(toks).toHaveTokens(1);
            expect(toks[0]).toBeNumberToken(1.2);

            toks = py.tokenize('.42');
            expect(toks).toHaveTokens(1);
            expect(toks[0]).toBeNumberToken(0.42);
        });
        it('tokenizes strings', function () {
            var toks = py.tokenize('"foo"');
            expect(toks).toHaveTokens(1);
            expect(toks[0]).toBeStringToken('foo');

            toks = py.tokenize("'foo'");
            expect(toks).toHaveTokens(1);
            expect(toks[0]).toBeStringToken('foo');
        });
        it('tokenizes bare names', function () {
            var toks = py.tokenize('foo');
            expect(toks).toHaveTokens(1);
            expect(toks[0].id).toBe('(name)');
            expect(toks[0].value).toBe('foo');
        });
        it('tokenizes constants', function () {
            var toks = py.tokenize('None');
            expect(toks).toHaveTokens(1);
            expect(toks[0]).toBeConstantToken('None');

            toks = py.tokenize('True');
            expect(toks).toHaveTokens(1);
            expect(toks[0]).toBeConstantToken('True');

            toks = py.tokenize('False');
            expect(toks).toHaveTokens(1);
            expect(toks[0]).toBeConstantToken('False');
        });
        it('does not fuck up on trailing spaces', function () {
            var toks = py.tokenize('None ');
            expect(toks).toHaveTokens(1);
            expect(toks[0]).toBeConstantToken('None');
        });
    });
    describe('collections', function () {
        it('tokenizes opening and closing symbols', function () {
            var toks = py.tokenize('()');
            expect(toks).toHaveTokens(2);
            expect(toks[0].id).toBe('(');
            expect(toks[1].id).toBe(')');
        });
    });
    describe('functions', function () {
        it('tokenizes kwargs', function () {
            var toks = py.tokenize('foo(bar=3, qux=4)');
            expect(toks).toHaveTokens(10);
        });
    });
});

describe('Parser', function () {
    describe('functions', function () {
        var ast = py.parse(py.tokenize('foo(bar=3, qux=4)'));
        expect(ast.id).toBe('(');
        expect(ast.first).toBeNamedToken('foo');

        args = ast.second;
        expect(args[0].id).toBe('=');
        expect(args[0].first).toBeNamedToken('bar');
        expect(args[0].second).toBeNumberToken(3);

        expect(args[1].id).toBe('=');
        expect(args[1].first).toBeNamedToken('qux');
        expect(args[1].second).toBeNumberToken(4);
    });
});
