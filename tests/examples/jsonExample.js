var eslahan = require("../..");
var assert = require("chai").assert;

var REPEATS = 100;

describe("JSON example", function () {
    var fields = eslahan.fields;
    var field = fields.json({
        template: {
            fieldOne: 1,
            fieldTwo: { generator: fields.uuid() },
            fieldThree: { value: 25, probability: 0.5 },
            fieldFour: { generator: fields.uuid(), value: 5 },
            complexField: {
                generator: {
                    fieldFive: 5,
                    fieldSix: { value: 6 }
                }
            }
        }
    });
    var result = field();
    result = JSON.parse(result);

    assert.equal(result.fieldOne, 1);
    assert.match(result.fieldTwo, /^[\dabcdefABCDEF]{8}(:?-[\dabcdefABCDEF]{4}){3}-[\dabcdefABCDEF]{12}$/);
    assert.equal(result.fieldFour, 5);
    assert.deepEqual(result.complexField, {fieldFive: 5, fieldSix: 6});

    var generatedField = 0;
    var didNotGeneratedField = 0;

    for(var i = REPEATS; i--;) {
        result = JSON.parse(field());
        var nKeys = Object.keys(result).length;
        assert.isBelow(nKeys, 6);
        assert.isAbove(nKeys, 3);
        if (nKeys === 5) {
            assert.equal(result.fieldThree, 25);
            ++generatedField;
        }
        if (nKeys === 4) {
            ++didNotGeneratedField;
        }
    }
    assert.isAbove(generatedField, 0);
    assert.isAbove(didNotGeneratedField, 0);
});
