/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import _ from "underscore";
import arrow from "../arrow/test.arrow";

var data = [{x: 1, y: "a", z: true}, {x: 2, y: "b", z: false}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}];

var col_data = {
    x: [1, 2, 3, 4],
    y: ["a", "b", "c", "d"],
    z: [true, false, true, false]
};

var meta = {
    x: "integer",
    y: "string",
    z: "boolean"
};

var data_2 = [{x: 3, y: "c", z: false}, {x: 4, y: "d", z: true}, {x: 5, y: "g", z: false}, {x: 6, y: "h", z: true}];

var arrow_result = [
    {f32: 1.5, f64: 1.5, i64: 1, i32: 1, i16: 1, i8: 1, bool: true, char: "a", dict: "a", datetime: +new Date("2018-01-25")},
    {f32: 2.5, f64: 2.5, i64: 2, i32: 2, i16: 2, i8: 2, bool: false, char: "b", dict: "b", datetime: +new Date("2018-01-26")},
    {f32: 3.5, f64: 3.5, i64: 3, i32: 3, i16: 3, i8: 3, bool: true, char: "c", dict: "c", datetime: +new Date("2018-01-27")},
    {f32: 4.5, f64: 4.5, i64: 4, i32: 4, i16: 4, i8: 4, bool: false, char: "d", dict: "d", datetime: +new Date("2018-01-28")},
    {f32: 5.5, f64: 5.5, i64: 5, i32: 5, i16: 5, i8: 5, bool: true, char: "d", dict: "d", datetime: +new Date("2018-01-29")}
];

var arrow_indexed_result = [
    {f32: 1.5, f64: 1.5, i64: 1, i32: 1, i16: 1, i8: 1, bool: true, char: "a", dict: "a", datetime: +new Date("2018-01-25")},
    {f32: 2.5, f64: 2.5, i64: 2, i32: 2, i16: 2, i8: 2, bool: false, char: "b", dict: "b", datetime: +new Date("2018-01-26")},
    {f32: 3.5, f64: 3.5, i64: 3, i32: 3, i16: 3, i8: 3, bool: true, char: "c", dict: "c", datetime: +new Date("2018-01-27")},
    {f32: 5.5, f64: 5.5, i64: 5, i32: 5, i16: 5, i8: 5, bool: true, char: "d", dict: "d", datetime: +new Date("2018-01-29")}
];

module.exports = perspective => {
    describe("Removes", function() {
        it("after an `update()`", async function() {
            var table = perspective.table(meta, {index: "x"});
            table.update(data);
            var view = table.view();
            table.remove([1, 2]);
            let result = await view.to_json();
            expect(result.length).toEqual(2);
            expect(data.slice(2, 4)).toEqual(result);
        });

        it("after a regular data load`", async function() {
            var table = perspective.table(data, {index: "x"});
            var view = table.view();
            table.remove([1, 2]);
            let result = await view.to_json();
            expect(result.length).toEqual(2);
            expect(data.slice(2, 4)).toEqual(result);
        });

        it("multiple single element removes", async function() {
            let table = perspective.table(meta, {index: "x"});
            for (let i = 0; i < 200; i++) {
                table.update([{x: i, y: "test", z: false}]);
            }
            for (let i = 1; i < 200; i++) {
                table.remove([i]);
            }
            let view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([{x: 0, y: "test", z: false}]);
            expect(result.length).toEqual(1);
        });
    });

    describe("Schema", function() {
        it("updates with columns not in schema", async function() {
            var table = perspective.table({x: "integer", y: "string"});
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([{x: 1, y: "a"}, {x: 2, y: "b"}, {x: 3, y: "c"}, {x: 4, y: "d"}]);
        });

        it("coerces to string", async function() {
            var table = perspective.table({x: "string", y: "string", z: "string"});
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual([{x: "1", y: "a", z: "true"}, {x: "2", y: "b", z: "false"}, {x: "3", y: "c", z: "true"}, {x: "4", y: "d", z: "false"}]);
        });
    });

    describe("Updates", function() {
        it("Meta constructor then `update()`", async function() {
            var table = perspective.table(meta);
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

        it("Meta constructor then column oriented `update()`", async function() {
            var table = perspective.table(meta);
            table.update(col_data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data);
        });

        it("Column oriented `update()` with columns in different order to schema", async function() {
            var table = perspective.table(meta);

            var reordered_col_data = {
                y: ["a", "b", "c", "d"],
                z: [true, false, true, false],
                x: [1, 2, 3, 4]
            };

            table.update(reordered_col_data);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(data);
        });

        it("Column data constructor then column oriented `update()`", async function() {
            var colUpdate = {
                x: [3, 4, 5],
                y: ["h", "i", "j"],
                z: [false, true, false]
            };

            var expected = [{x: 1, y: "a", z: true}, {x: 2, y: "b", z: false}, {x: 3, y: "h", z: false}, {x: 4, y: "i", z: true}, {x: 5, y: "j", z: false}];

            var table = perspective.table(col_data, {index: "x"});
            table.update(colUpdate);
            var view = table.view();
            let result = await view.to_json();
            expect(result).toEqual(expected);
        });

        it("Multiple `update()`s", async function() {
            var table = perspective.table(meta);
            table.update(data);
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(data.concat(data)).toEqual(result);
        });

        it("`update()` called after `view()`", async function() {
            var table = perspective.table(meta);
            var view = table.view();
            table.update(data);
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

        it("Arrow `update()`s", async function() {
            var table = perspective.table(arrow.slice());
            table.update(arrow.slice());
            var view = table.view();
            let result = await view.to_json();
            expect(arrow_result.concat(arrow_result)).toEqual(result);
        });
    });

    describe("Notifications", function() {
        it("`on_update()`", function(done) {
            var table = perspective.table(meta);
            var view = table.view();
            view.on_update(function(new_data) {
                expect(data).toEqual(new_data);
                done();
            });
            table.update(data);
        });

        it("`on_update` before and after `update()`", function(done) {
            var table = perspective.table(meta);
            var view = table.view();
            table.update(data);
            var ran = false;
            view.on_update(function(new_data) {
                if (!ran) {
                    expect(new_data).toEqual(data);
                    ran = true;
                    done();
                }
            });
            table.update(data);
        });

        it("`on_update(table.update) !`", function(done) {
            var table1 = perspective.table(meta);
            var table2 = perspective.table(meta);
            var view1 = table1.view();
            var view2 = table2.view();
            view1.on_update(async function(x) {
                table2.update(x);
                let result = await view2.to_json();
                expect(data).toEqual(result);
                done();
            });
            table1.update(data);
        });

        it("`on_update(table.update)` before and after `update()`", function(done) {
            var table1 = perspective.table(meta);
            var table2 = perspective.table(meta);
            var view1 = table1.view();
            var view2 = table2.view();

            table1.update(data);
            table2.update(data);
            view1.on_update(async function(x) {
                table2.update(x);
                let result = await view2.to_json();
                expect(data.concat(data)).toEqual(result);
                done();
            });
            table1.update(data);
        });
    });

    describe("Limit", function() {
        it("{limit: 2} with table of size 4", async function() {
            var table = perspective.table(data, {limit: 2});
            var view = table.view();
            let result = await view.to_json();
            expect(data.slice(2)).toEqual(result);
        });

        it("{limit: 5} with 2 updates of size 4", async function() {
            var table = perspective.table(data, {limit: 5});
            table.update(data);
            var view = table.view();
            let result = await view.to_json();
            expect(
                data
                    .slice(1)
                    .concat(data.slice(3, 4))
                    .concat(data.slice(0, 1))
            ).toEqual(result);
        });
    });

    describe("Indexed", function() {
        it("{index: 'x'} (int)", async function() {
            var table = perspective.table(data, {index: "x"});
            var view = table.view();
            table.update(data);
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

        it("{index: 'y'} (string)", async function() {
            var table = perspective.table(data, {index: "y"});
            var view = table.view();
            table.update(data);
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

        it("Arrow with {index: 'i64'} (int)", async function() {
            var table = perspective.table(arrow.slice(), {index: "i64"});
            var view = table.view();
            let result = await view.to_json();
            expect(arrow_result).toEqual(result);
        });

        it("Arrow with {index: 'char'} (char)", async function() {
            var table = perspective.table(arrow.slice(), {index: "char"});
            var view = table.view();
            let result = await view.to_json();
            expect(arrow_indexed_result).toEqual(result);
        });

        it("Arrow with {index: 'dict'} (dict)", async function() {
            var table = perspective.table(arrow.slice(), {index: "dict"});
            var view = table.view();
            let result = await view.to_json();
            expect(arrow_indexed_result).toEqual(result);
        });

        it("multiple updates on {index: 'x'}", async function() {
            var table = perspective.table(data, {index: "x"});
            var view = table.view();
            table.update(data);
            table.update(data);
            table.update(data);
            let result = await view.to_json();
            expect(data).toEqual(result);
        });

        it("{index: 'x'} with overlap", async function() {
            var table = perspective.table(data, {index: "x"});
            var view = table.view();
            table.update(data);
            table.update(data_2);
            let result = await view.to_json();
            expect(data.slice(0, 2).concat(data_2)).toEqual(result);
        });

        it("update and index (int)", function(done) {
            var table = perspective.table(meta, {index: "x"});
            var view = table.view();
            table.update(data);
            view.on_update(async function(new_data) {
                expect(data_2).toEqual(new_data);
                let json = await view.to_json();
                expect(data.slice(0, 2).concat(data_2)).toEqual(json);
                done();
            });
            table.update(data_2);
        });

        it("update and index (string)", function(done) {
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(data);
            view.on_update(async function(new_data) {
                expect(data_2).toEqual(new_data);
                let json = await view.to_json();
                expect(data.slice(0, 2).concat(data_2)).toEqual(json);
                done();
            });
            table.update(data_2);
        });

        it("partial update", function(done) {
            var partial = [{x: 5, y: "a"}, {y: "b", z: true}];
            var expected = [{x: 5, y: "a", z: true}, {x: 2, y: "b", z: true}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(data);
            view.on_update(async function(new_data) {
                expect(new_data).toEqual(expected.slice(0, 2));
                let json = await view.to_json();
                expect(json).toEqual(expected);
                done();
            });
            table.update(partial);
        });

        it("partial column oriented update", function(done) {
            var partial = {
                x: [5, undefined],
                y: ["a", "b"],
                z: [undefined, true]
            };

            var expected = [{x: 5, y: "a", z: true}, {x: 2, y: "b", z: true}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(col_data);
            view.on_update(async function(new_data) {
                expect(new_data).toEqual(expected.slice(0, 2));
                let json = await view.to_json();
                expect(json).toEqual(expected);
                done();
            });
            table.update(partial);
        });

        it("partial column oriented update with entire columns missing", function(done) {
            var partial = {
                y: ["a", "b"],
                z: [false, true]
            };

            var expected = [{x: 1, y: "a", z: false}, {x: 2, y: "b", z: true}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(col_data);
            view.on_update(async function(new_data) {
                expect(new_data).toEqual(expected.slice(0, 2));
                let json = await view.to_json();
                expect(json).toEqual(expected);
                done();
            });
            table.update(partial);
        });
    });

    describe("null handling", function() {
        it("recalculates sum aggregates when a null unsets a value", async function() {
            var table = perspective.table([{x: 1, y: 1}, {x: 2, y: 1}], {index: "x"});
            table.update([{x: 2, y: null}]);
            var view = table.view({
                row_pivot: ["x"],
                aggregate: [{op: "sum", column: "y"}]
            });
            let json = await view.to_json();
            expect(json).toEqual([{__ROW_PATH__: [], y: 1}, {__ROW_PATH__: [1], y: 1}, {__ROW_PATH__: [2], y: 0}]);
        });

        it("can be removed entirely", async function() {
            var table = perspective.table([{x: 1, y: 1}], {index: "x"});
            table.update([{x: 1, y: null}]);
            table.update([{x: 1, y: 1}]);
            var view = table.view();
            let json = await view.to_json();
            expect(json).toEqual([{x: 1, y: 1}]);
        });

        it("partial update with null unsets value", function(done) {
            var partial = [{x: null, y: "a", z: false}];
            var expected = [{x: null, y: "a", z: false}, {x: 2, y: "b", z: false}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(data);
            table.update(partial);
            view.to_json().then(json => {
                expect(json).toEqual(expected);
                done();
            });
        });

        it("update by adding rows (new pkeys) with partials/nulls", function(done) {
            var update = [{x: null, y: "e", z: null}];
            var expected = [{x: 1, y: "a", z: true}, {x: 2, y: "b", z: false}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}, {x: null, y: "e", z: null}];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(data);
            table.update(update);
            view.to_json().then(json => {
                expect(json).toEqual(expected);
                done();
            });
        });

        it("partial column oriented update with null unsets value", function(done) {
            var partial = {
                x: [null],
                y: ["a"]
            };

            var expected = [{x: null, y: "a", z: true}, {x: 2, y: "b", z: false}, {x: 3, y: "c", z: true}, {x: 4, y: "d", z: false}];
            var table = perspective.table(meta, {index: "y"});
            var view = table.view();
            table.update(col_data);
            table.update(partial);
            view.to_json().then(json => {
                expect(json).toEqual(expected);
                done();
            });
        });
    });

    describe("Viewport", function() {
        it("`height`", async function() {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    height: 2
                }
            });
            let result = await view.to_json();
            expect(data.slice(0, 2)).toEqual(result);
        });

        it("`top`", async function() {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    top: 2
                }
            });
            let result = await view.to_json();
            expect(data.slice(2)).toEqual(result);
        });

        it("`width`", async function() {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    width: 2
                }
            });
            var result2 = _.map(data, x => _.pick(x, "x", "y"));
            let result = await view.to_json();
            expect(result2).toEqual(result);
        });

        it("`left`", async function() {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    left: 1
                }
            });
            var result = _.map(data, function(x) {
                return _.pick(x, "y", "z");
            });
            let result2 = await view.to_json();
            expect(result).toEqual(result2);
        });

        it("All", async function() {
            var table = perspective.table(data);
            var view = table.view({
                viewport: {
                    top: 1,
                    left: 1,
                    width: 1,
                    height: 2
                }
            });
            var result = _.map(data, function(x) {
                return _.pick(x, "y");
            });
            let result2 = await view.to_json();
            expect(result.slice(1, 3)).toEqual(result2);
        });
    });
};
