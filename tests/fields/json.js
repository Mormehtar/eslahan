var assert = require("chai").assert;
var fields = require("../..").fields;
var field = fields.json;

var REPEATS = 100;

describe("json field", function() {

    it("Should exist", function () {
        assert.isFunction(field);
    });

    it("Should return function", function () {
        assert.isFunction(field());
    });

    it("Should return JSON of empty object by default", function () {
        var f = field();
        assert.equal(f(), JSON.stringify({}));
    });

    it("Should return value if it exists", function () {
        assert.equal(field()(JSON.stringify({abra: 2})), JSON.stringify({abra: 2}));
    });

    it("Should return value if it exists and undefined", function () {
        assert.isUndefined(field()(undefined));
    });

    it("Should return firm JSON given in template", function () {
        var f = field({
            template: {
                fieldOne: {
                    value: "data of field one"
                }
            }
        });
        assert.equal(f(), JSON.stringify({fieldOne: "data of field one"}));
    });

    it("Should take probability into account", function () {
        var f = field({
            template: {
                fieldOne: {
                    probability: 0.5,
                    value: "someData"
                }
            }
        });

        var oneField = 0;
        var zeroField = 0;

        for(var i = REPEATS; i--;) {
            var result = JSON.parse(f());
            var nKeys = Object.keys(result).length;
            assert.isBelow(nKeys, 2);
            if (nKeys === 1) {
                assert.equal(result.fieldOne, "someData");
                ++oneField;
            } else {
                ++zeroField;
            }
        }
        assert.isAbove(oneField, 0);
        assert.isAbove(zeroField, 0);
    });

    it("Should use generators", function () {
        var f = field({
            template: {
                fieldOne: {
                    generator: fields.uuid()
                }
            }
        });
        assert.match(JSON.parse(f()).fieldOne, /^[\dabcdefABCDEF]{8}(:?-[\dabcdefABCDEF]{4}){3}-[\dabcdefABCDEF]{12}$/);
    });

    it("Should pass value through generator if both given", function() {
        var f = field({
            template: {
                fieldOne: {
                    generator: fields.uuid(),
                    value: "abra"
                }
            }
        });
        assert.equal(JSON.parse(f()).fieldOne, 'abra');
    });

    it("Should use generator objects as new templates", function () {
        var f = field({
            template: {
                fieldOne: {
                    generator: {
                        innerField1: {
                            value: 1
                        },
                        innerField2: {
                            value: 2
                        }
                    }
                },
                fieldTwo: {
                    value: 3
                },
                fieldThree: {
                    generator: {
                        innerFieldFour: {
                            value: 4
                        }
                    }
                }
            }
        });

        assert.deepEqual(JSON.parse(f()), {
            fieldOne: {
                innerField1: 1,
                innerField2: 2
            },
            fieldTwo: 3,
            fieldThree: {
                innerFieldFour: 4
            }
        });
    });

    it("Should allow shortcut for not objects and not Dates", function () {
        var date = new Date();
        var f = field({
            template: {
                fieldOne: {
                    generator: {
                        innerField1: 1,
                        innerField2: 2
                    }
                },
                fieldTwo: date,
                fieldThree: {
                    generator: {
                        innerFieldFour: 4
                    }
                }
            }
        });

        assert.deepEqual(JSON.parse(f()), {
            fieldOne: {
                innerField1: 1,
                innerField2: 2
            },
            fieldTwo: JSON.parse(JSON.stringify(date)),
            fieldThree: {
                innerFieldFour: 4
            }
        });
    });

});
