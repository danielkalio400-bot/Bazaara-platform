import test from 'node:test';import assert from 'node:assert/strict';import {expandRange,evaluateCell,evaluateFormula,displayValue} from './formulas.mjs';
test('ranges expand in row-major order',()=>assert.deepEqual(expandRange('A1','B2'),['A1','B1','A2','B2']));
test('safe arithmetic parser handles precedence',()=>assert.equal(evaluateFormula('2+3*4'),14));
test('cell references and SUM are evaluated',()=>{const c={A1:'10',A2:'20',A3:'=SUM(A1:A2)',B1:'=A3/2'};assert.equal(evaluateCell(c,'A3'),30);assert.equal(displayValue(c,'B1'),'15');});
test('aggregate functions work',()=>{const c={A1:'2',A2:'4',A3:'6'};assert.equal(evaluateFormula('AVERAGE(A1:A3)',c),4);assert.equal(evaluateFormula('MAX(A1:A3)-MIN(A1:A3)',c),4);assert.equal(evaluateFormula('COUNT(A1:A3)',c),3);});
test('cycles and divide-by-zero are contained',()=>{const c={A1:'=B1',B1:'=A1',C1:'=1/0'};assert.equal(evaluateCell(c,'A1'),'#CYCLE!');assert.equal(evaluateCell(c,'C1'),'#DIV/0!');});
test('arbitrary code is never evaluated',()=>assert.equal(evaluateFormula('globalThis.process.exit()'),'#ERROR!'));
test('COUNT and AVERAGE ignore text values in ranges',()=>{const c={A1:'2',A2:'hello',A3:'6'};assert.equal(evaluateFormula('COUNT(A1:A3)',c),2);assert.equal(evaluateFormula('AVERAGE(A1:A3)',c),4);assert.equal(evaluateCell({A1:'hello',B1:'=A1'},'B1'),'hello');});
test('arithmetic coerces numeric cell text and unary signs safely',()=>{const c={A1:'10',B1:'20',C1:'=A1+B1',D1:'=-A1'};assert.equal(evaluateCell(c,'C1'),30);assert.equal(evaluateCell(c,'D1'),-10);});
