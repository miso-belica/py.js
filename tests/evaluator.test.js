var py = require('../lib/py.js');

var ev = function (str, context) {
    return py.evaluate(py.parse(py.tokenize(str)), context);
};

describe('Literals', function () {
    describe('Number', function () {
        it('should have the right type', function () {
            expect(ev('1')).toEqual(py.float.fromJSON(1));
        });
        it('should yield the corresponding JS value', function () {
            expect(py.eval('1')).toBe(1);
            expect(py.eval('42')).toBe(42);
            expect(py.eval('9999')).toBe(9999);
        });
        it('should correctly handle negative literals', function () {
            expect(py.eval('-1')).toBe(-1);
            expect(py.eval('-42')).toBe(-42);
            expect(py.eval('-9999')).toBe(-9999);
        });
        it('should correctly handle float literals', function () {
            expect(py.eval('.42')).toBe(0.42);
            expect(py.eval('1.2')).toBe(1.2);
        });
    });
    describe('Booleans', function () {
        it('should have the right type', function () {
            expect(ev('False')).toEqual(py.bool.fromJSON(false));
            expect(ev('True')).toEqual(py.bool.fromJSON(true));
        });
        it('should yield the corresponding JS value', function () {
            expect(py.eval('False')).toBe(false);
            expect(py.eval('True')).toBe(true);
        });
    });
    describe('None', function () {
        it('should have the right type', function () {
            expect(ev('None')).toEqual(py.None);
        });
        it('should yield a JS null', function () {
            expect(py.eval('None')).toBe(null);
        });
    });
    describe('String', function () {
        it('should have the right type', function () {
            expect(ev('"foo"')).toEqual(py.str.fromJSON('foo'));
            expect(ev("'foo'")).toEqual(py.str.fromJSON('foo'));
        });
        it('should yield the corresponding JS string', function () {
            expect(py.eval('"somestring"')).toBe('somestring');
            expect(py.eval("'somestring'")).toBe('somestring');
        });
    });
    describe('Tuple', function () {
        it('shoud have the right type', function () {
            expect(ev('()')).toEqual(py.tuple.fromJSON([]));
        });
        it('should map to a JS array', function () {
            expect(py.eval('()')).toEqual([]);
            expect(py.eval('(1, 2, 3)')).toEqual([1, 2, 3]);
        });
    });
    describe('List', function () {
        it('shoud have the right type', function () {
            expect(ev('[]')).toEqual(py.list.fromJSON([]));
        });
        it('should map to a JS array', function () {
            expect(py.eval('[]')).toEqual([]);
            expect(py.eval('[1, 2, 3]')).toEqual([1, 2, 3]);
        });
    });
    describe('Dict', function () {
        it('shoud have the right type', function () {
            expect(ev('{}')).toEqual(py.dict.fromJSON({}));
        });
        it('should map to a JS object', function () {
            expect(py.eval("{}")).toEqual({});
            expect(py.eval("{'foo': 1, 'bar': 2}")).toEqual({foo: 1, bar: 2});
        });
    });
});
describe('Free variables', function () {
    it('should return its identity', function () {
        expect(py.eval('foo', {foo: 1})).toBe(1);
        expect(py.eval('foo', {foo: true})).toBe(true);
        expect(py.eval('foo', {foo: false})).toBe(false);
        expect(py.eval('foo', {foo: null})).toBe(null);
        expect(py.eval('foo', {foo: 'bar'})).toBe('bar');
    });
});
describe('Comparisons', function () {
    describe('equality', function () {
        it('should work with literals', function () {
            expect(py.eval('1 == 1')).toBe(true);
            expect(py.eval('"foo" == "foo"')).toBe(true);
            expect(py.eval('"foo" == "bar"')).toBe(false);
        });
        it('should work with free variables', function () {
            expect(py.eval('1 == a', {a: 1})).toBe(true);
            expect(py.eval('foo == "bar"', {foo: 'bar'})).toBe(true);
            expect(py.eval('foo == "bar"', {foo: 'qux'})).toBe(false);
        });
    });
    describe('inequality', function () {
        it('should work with literals', function () {
            expect(py.eval('1 != 2')).toBe(true);
            expect(py.eval('"foo" != "foo"')).toBe(false);
            expect(py.eval('"foo" != "bar"')).toBe(true);
        });
        it('should work with free variables', function () {
            expect(py.eval('1 != a', {a: 42})).toBe(true);
            expect(py.eval('foo != "bar"', {foo: 'bar'})).toBe(false);
            expect(py.eval('foo != "bar"', {foo: 'qux'})).toBe(true);
            expect(py.eval('foo != bar', {foo: 'qux', bar: 'quux'})).toBe(true);
        });
        it('should accept deprecated form', function () {
            expect(py.eval('1 <> 2')).toBe(true);
            expect(py.eval('"foo" <> "foo"')).toBe(false);
            expect(py.eval('"foo" <> "bar"')).toBe(true);
        });
    });
    describe('rich comparisons', function () {
        it('should work with numbers', function () {
            expect(py.eval('3 < 5')).toBe(true);
            expect(py.eval('5 >= 3')).toBe(true);
            expect(py.eval('3 >= 3')).toBe(true);
            expect(py.eval('3 > 5')).toBe(false);
        });
        it('should support comparison chains', function () {
            expect(py.eval('1 < 3 < 5')).toBe(true);
            expect(py.eval('5 > 3 > 1')).toBe(true);
            expect(py.eval('1 < 3 > 2 == 2 > -2')).toBe(true);
        });
        it('should compare strings', function () {
            expect(py.eval('date >= current',
                           {date: '2010-06-08', current: '2010-06-05'})).toBe(true);
            expect(py.eval('state == "cancel"', {state: 'cancel'})).toBe(true);
            expect(py.eval('state == "cancel"', {state: 'open'})).toBe(false);
        });
    });
    describe('missing eq/neq', function () {
        it('should fall back on identity', function () {
            var typ = new py.type('MyType');
            expect(py.eval('MyType() == MyType()', {MyType: typ})).toBe(false);
        });
    });
    describe('un-comparable types', function () {
        it('should default to type-name ordering', function () {
            var t1 = new py.type('Type1');
            var t2 = new py.type('Type2');
            expect(py.eval('T1() < T2()', {T1: t1, T2: t2})).toBe(true);
            expect(py.eval('T1() > T2()', {T1: t1, T2: t2})).toBe(false);
        });
        it('should handle native stuff', function () {
            expect(py.eval('None < 42')).toBe(true);
            expect(py.eval('42 > None')).toBe(true);
            expect(py.eval('None > 42')).toBe(false);

            expect(py.eval('None < False')).toBe(true);
            expect(py.eval('None < True')).toBe(true);
            expect(py.eval('False > None')).toBe(true);
            expect(py.eval('True > None')).toBe(true);
            expect(py.eval('None > False')).toBe(false);
            expect(py.eval('None > True')).toBe(false);

            expect(py.eval('False < ""')).toBe(true);
            expect(py.eval('"" > False')).toBe(true);
            expect(py.eval('False > ""')).toBe(false);
        });
    });
});
describe('Boolean operators', function () {
    it('should work', function () {
        expect(py.eval("foo == 'foo' or foo == 'bar'",
                       {foo: 'bar'})).toBe(true);
        expect(py.eval("foo == 'foo' and bar == 'bar'",
                       {foo: 'foo', bar: 'bar'})).toBe(true);
    });
    it('should be lazy', function () {
        expect(py.eval("foo == 'foo' or bar == 'bar'",
                       {foo: 'foo'})).toBe(true);
        expect(py.eval("foo == 'foo' and bar == 'bar'",
                       {foo: 'bar'})).toBe(false);
    });
    it('should return the actual object', function () {
        expect(py.eval('"foo" or "bar"')).toBe('foo');
        expect(py.eval('None or "bar"')).toBe('bar');
        expect(py.eval('False or None')).toBe(null);
        expect(py.eval('0 or 1')).toBe(1);
    });
});
describe('Containment', function () {
    describe('in sequences', function () {
        it('should match collection items', function () {
            expect(py.eval("'bar' in ('foo', 'bar')")).toBe(true);
            expect(py.eval('1 in (1, 2, 3, 4)')).toBe(true);
            expect(py.eval('1 in (2, 3, 4)')).toBe(false);
            expect(py.eval('"url" in ("url",)')).toBe(true);
            expect(py.eval('"foo" in ["foo", "bar"]')).toBe(true);
        });
        it('should not be recursive', function () {
            expect(py.eval('"ur" in ("url",)')).toBe(false);
        });
        it('should be negatable', function () {
            expect(py.eval('1 not in (2, 3, 4)')).toBe(true);
            expect(py.eval('"ur" not in ("url",)')).toBe(true);
            expect(py.eval('-2 not in (1, 2, 3)')).toBe(true);
        });
    });
    describe('in dict', function () {
        // TODO
    });
    describe('in strings', function () {
        it('should match the whole string', function () {
            expect(py.eval('"view" in "view"')).toBe(true);
            expect(py.eval('"bob" in "view"')).toBe(false);
        });
        it('should match substrings', function () {
            expect(py.eval('"ur" in "url"')).toBe(true);
        });
    });
});
describe('Conversions', function () {
    describe('to bool', function () {
        describe('strings', function () {
            it('should be true if non-empty', function () {
                expect(py.eval('bool(date_deadline)',
                               {date_deadline: '2008'})).toBe(true);
            });
            it('should be false if empty', function () {
                expect(py.eval('bool(s)', {s: ''})).toBe(false);
            });
        });
    });
});
describe('Attribute access', function () {
    it("should return the attribute's value", function () {
        var o = py.PY_call(py.object);
        o.bar = py.True;
        expect(py.eval('foo.bar', {foo: o})).toBe(true);
        o.bar = py.False;
        expect(py.eval('foo.bar', {foo: o})).toBe(false);
    });
    it("should work with functions", function () {
        var o = py.PY_call(py.object);
        o.bar = py.PY_def.fromJSON(function () {
            return py.str.fromJSON('ok');
        });
        expect(py.eval('foo.bar()', {foo: o})).toBe('ok');
    });
    it('should not convert function attributes into methods', function () {
        var o = py.PY_call(py.object);
        o.bar = py.type('bar');
        o.bar.__getattribute__ = function () {
            return o.bar.baz;
        }
        o.bar.baz = py.True;
        expect(py.eval('foo.bar.baz', {foo: o})).toBe(true);
    });
    it('should work on instance attributes', function () {
        var typ = py.type('MyType', py.object, {
            attr: py.float.fromJSON(3)
        });
        expect(py.eval('MyType().attr', {MyType: typ})).toBe(3);
    });
    it('should work on class attributes', function () {
        var typ = py.type('MyType', py.object, {
            attr: py.float.fromJSON(3)
        });
        expect(py.eval('MyType().attr', {MyType: typ})).toBe(3);
    });
    it('should work with methods', function () {
        var typ = py.type('MyType', py.object, {
            attr: py.float.fromJSON(3),
            some_method() { return py.str.fromJSON('ok'); },
            get_attr() { return this.attr; }
        });
        expect(py.eval('MyType().some_method()', {MyType: typ})).toBe('ok');
        expect(py.eval('MyType().get_attr()', {MyType: typ})).toBe(3);
    });
});
describe('Callables', function () {
    it('should wrap JS functions', function () {
        expect(py.eval('foo()', {foo: function foo() { return py.float.fromJSON(3); }})).toBe(3);
    });
    it('should work on custom types', function () {
        var typ = py.type('MyType', py.object, {
            toJSON: function () { return true; }
        });
        expect(py.eval('MyType()', {MyType: typ})).toBe(true);
    });
    it('should accept kwargs', function () {
        expect(py.eval('foo(ok=True)', {
            foo: function foo() { return py.True; }
        })).toBe(true);
    });
    it('should be able to get its kwargs', function () {
        expect(py.eval('foo(ok=True)', {
            foo: function foo(args, kwargs) { return kwargs.ok; }
        })).toBe(true);
    });
    it('should be able to have both args and kwargs', function () {
        expect(py.eval('foo(1, 2, 3, ok=True, nok=False)', {
            foo: function (args, kwargs) {
                expect(args).toHaveLength(3);
                expect(args[0].toJSON()).toBe(1);
                expect(Object.keys(kwargs)).toEqual(['ok', 'nok'])
                expect(kwargs.nok.toJSON()).toBe(false);
                return kwargs.ok;
            }
        })).toBe(true);
    });
});
describe('issubclass', function () {
    it('should say a type is its own subclass', function () {
        expect(py.issubclass.__call__([py.dict, py.dict]).toJSON()).toBe(true);
        expect(py.eval('issubclass(dict, dict)')).toBe(true);
    });
    it('should work with subtypes', function () {
        expect(py.issubclass.__call__([py.bool, py.object]).toJSON()).toBe(true);
    });
});
describe('builtins', function () {
    it('should aways be available', function () {
        expect(py.eval('bool("foo")')).toBe(true);
    });
});

describe('numerical protocols', function () {
    describe('True numbers (float)', function () {
        describe('Basic arithmetic', function () {
            it('can be added', function () {
                expect(py.eval('1 + 1')).toBe(2);
                expect(py.eval('1.5 + 2')).toBe(3.5);
                expect(py.eval('1 + -1')).toBe(0);
            });
            it('can be subtracted', function () {
                expect(py.eval('1 - 1')).toBe(0);
                expect(py.eval('1.5 - 2')).toBe(-0.5);
                expect(py.eval('2 - 1.5')).toBe(0.5);
            });
            it('can be multiplied', function () {
                expect(py.eval('1 * 3')).toBe(3);
                expect(py.eval('0 * 5')).toBe(0);
                expect(py.eval('42 * -2')).toBe(-84);
            });
            it('can be divided', function () {
                expect(py.eval('1 / 2')).toBe(0.5);
                expect(py.eval('2 / 1')).toBe(2);
            });
        });
    });
    describe('Strings', function () {
        describe('Basic arithmetics operators', function () {
            it('can be added (concatenation)', function () {
                expect(py.eval('"foo" + "bar"')).toBe('foobar');
            });
        });
    });
});
describe('dicts', function () {
    it('should be possible to retrieve their value', function () {
        var d = py.dict.fromJSON({foo: 3, bar: 4, baz: 5});
        expect(py.eval('d["foo"]', {d: d})).toBe(3);
        expect(py.eval('d["baz"]', {d: d})).toBe(5);
    });
    it('should raise KeyError if a key is missing', function () {
        var d = py.dict.fromJSON();
        expect(function () {
            py.eval('d["foo"]', {d: d});
        }).toThrowError(/^KeyError/);
    });
    it('should have a method to provide a default value', function () {
        var d = py.dict.fromJSON({foo: 3});
        expect(py.eval('d.get("foo")', {d: d})).toBe(3);
        expect(py.eval('d.get("bar")', {d: d})).toBe(null);
        expect(py.eval('d.get("bar", 42)', {d: d})).toBe(42);

        var e = py.dict.fromJSON({foo: null});
        expect(py.eval('d.get("foo")', {d: e})).toBe(null);
        expect(py.eval('d.get("bar")', {d: e})).toBe(null);
    });
});
describe('Type converter', function () {
    it('should convert bare objects to objects', function () {
        expect(py.eval('foo.bar', {foo: {bar: 3}})).toBe(3);
    });
    it('should convert arrays to lists', function () {
        expect(py.eval('foo[3]', {foo: [9, 8, 7, 6, 5]})).toBe(6);
    });
});
