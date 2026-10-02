export function normalizeRef(value:unknown):string|null;
export function columnName(index:number):string;
export function columnIndex(name:string):number;
export function expandRange(a:string,b:string):string[];
export function evaluateCell(cells:Record<string,string>,ref:string,stack?:Set<string>):string|number;
export function evaluateFormula(source:string,cells?:Record<string,string>,stack?:Set<string>):string|number;
export function displayValue(cells:Record<string,string>,ref:string):string;
