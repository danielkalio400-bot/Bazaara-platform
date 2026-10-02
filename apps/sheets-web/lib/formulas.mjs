// Bounded spreadsheet interpreter. Never evaluates JavaScript or fetches URLs.
const CELL=/^[A-Z]{1,2}(?:[1-9][0-9]{0,2}|1000)$/;
const ERRORS=new Set(['#REF!','#CYCLE!','#ERROR!','#NAME?','#DIV/0!','#NUM!','#VALUE!','#N/A','#LIMIT!']);
const error=v=>typeof v==='string'&&ERRORS.has(v);
export function normalizeRef(value){const ref=String(value??'').trim().toUpperCase();return CELL.test(ref)?ref:null;}
export function columnName(index){if(!Number.isInteger(index)||index<0||index>701)return '';let n=index+1,s='';while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26);}return s;}
export function columnIndex(name){let n=0;for(const c of name){if(c<'A'||c>'Z')return -1;n=n*26+c.charCodeAt(0)-64;}return n-1;}
export function expandRange(a,b){if(!normalizeRef(a)||!normalizeRef(b))return [];const ma=a.match(/^([A-Z]+)(\d+)$/),mb=b.match(/^([A-Z]+)(\d+)$/),c1=columnIndex(ma[1]),c2=columnIndex(mb[1]),r1=+ma[2],r2=+mb[2];if((Math.abs(c2-c1)+1)*(Math.abs(r2-r1)+1)>10000)throw Error('range limit');const out=[];for(let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++)for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++)out.push(columnName(c)+r);return out;}
function tokenize(source){if(source.length>10000)throw Error('limit');const out=[];let i=0;while(i<source.length){if(out.length>=10000)throw Error('limit');const c=source[i];if(/\s/.test(c)){i++;continue;}if(c==='"'){let text='',closed=false;i++;while(i<source.length){if(source[i]==='"'){if(source[i+1]==='"'){text+='"';i+=2;}else{i++;closed=true;break;}}else text+=source[i++];}if(!closed)throw Error('string');out.push({t:'string',v:text});continue;}const number=source.slice(i).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);if(number){out.push({t:'number',v:Number(number[0])});i+=number[0].length;continue;}const name=source.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);if(name){out.push({t:'name',v:name[0].toUpperCase()});i+=name[0].length;continue;}const two=source.slice(i,i+2);if(['<=','>=','<>'].includes(two)){out.push({t:two});i+=2;continue;}if('+-*/^(),:&=<>'.includes(c)){out.push({t:c});i++;continue;}throw Error('token');}return out;}
function parse(source){const tokens=tokenize(source);let position=0,depth=0;const peek=()=>tokens[position],take=t=>peek()?.t===t?tokens[position++]:null;
 function atom(){if(++depth>128)throw Error('limit');try{const n=take('number')||take('string');if(n)return {kind:'literal',value:n.v};const id=take('name');if(id){if(take('(')){const args=[];if(peek()?.t!==')'){do{args.push(compare());}while(take(','));}if(!take(')'))throw Error('close');return {kind:'call',name:id.v,args};}if(id.v==='TRUE'||id.v==='FALSE')return {kind:'literal',value:id.v==='TRUE'};if(!normalizeRef(id.v))return {kind:'literal',value:'#NAME?'};if(take(':')){const end=take('name');if(!end||!normalizeRef(end.v))throw Error('range');return {kind:'range',from:id.v,to:end.v};}return {kind:'cell',ref:id.v};}if(take('(')){const value=compare();if(!take(')'))throw Error('close');return value;}throw Error('expression');}finally{depth--;}}
 function power(){const left=atom();return take('^')?{kind:'binary',op:'^',left,right:unary()}:left;}
 function unary(){if(take('+'))return {kind:'unary',op:'+',value:unary()};if(take('-'))return {kind:'unary',op:'-',value:unary()};return power();}
 const binary=(next,operators)=>()=>{let left=next();while(operators.includes(peek()?.t)){const op=tokens[position++].t;left={kind:'binary',op,left,right:next()};}return left;};
 const multiply=binary(unary,['*','/']),sum=binary(multiply,['+','-']),concat=binary(sum,['&']),compare=binary(concat,['=','<>','<','>','<=','>=']);const result=compare();if(position!==tokens.length)throw Error('tail');return result;
}
const numeric=v=>typeof v==='boolean'?+v:typeof v==='number'?v:typeof v==='string'&&(v.trim()===''||Number.isFinite(Number(v)))?Number(v):null;
const truth=v=>typeof v==='string'?v.toLowerCase()==='true'||!!numeric(v):!!v;
const flat=values=>values.flat(Infinity);
export function evaluateCell(cells,ref,stack=new Set(),context={remaining:50000,cache:new Map()}){
 if(--context.remaining<=0)return '#LIMIT!';const key=normalizeRef(ref);if(!key)return '#REF!';if(stack.has(key))return '#CYCLE!';if(stack.size>=128)return '#LIMIT!';if(context.cache.has(key))return context.cache.get(key);const raw=String(cells?.[key]??'');if(!raw.startsWith('='))return raw;const next=new Set(stack);next.add(key);const value=evaluateFormula(raw.slice(1),cells,next,context);context.cache.set(key,value);return value;
}
export function evaluateFormula(source,cells={},stack=new Set(),context={remaining:50000,cache:new Map()}){
 let ast;try{ast=parse(String(source));}catch(e){return e.message.includes('limit')?'#LIMIT!':'#ERROR!';}let budget=20000;
 function evaluate(node){if(--budget<=0||--context.remaining<=0)return '#LIMIT!';if(node.kind==='literal')return node.value;if(node.kind==='cell')return evaluateCell(cells,node.ref,stack,context);if(node.kind==='range'){try{return expandRange(node.from,node.to).map(ref=>evaluateCell(cells,ref,stack,context));}catch{return '#LIMIT!';}}
  if(node.kind==='unary'){const v=evaluate(node.value);if(error(v))return v;const n=numeric(v);return n===null?'#VALUE!':node.op==='-'?-n:n;}
  if(node.kind==='binary'){const left=evaluate(node.left),right=evaluate(node.right);if(error(left))return left;if(error(right))return right;if(Array.isArray(left)||Array.isArray(right))return '#VALUE!';if(node.op==='&')return String(left)+String(right);if(['=','<>','<','>','<=','>='].includes(node.op)){const a=numeric(left),b=numeric(right),x=a!==null&&b!==null?a:String(left).toLowerCase(),y=a!==null&&b!==null?b:String(right).toLowerCase();return node.op==='='?x===y:node.op==='<>'?x!==y:node.op==='<'?x<y:node.op==='>'?x>y:node.op==='<='?x<=y:x>=y;}const a=numeric(left),b=numeric(right);if(a===null||b===null)return '#VALUE!';if(node.op==='/'&&b===0)return '#DIV/0!';return node.op==='+'?a+b:node.op==='-'?a-b:node.op==='*'?a*b:node.op==='/'?a/b:Math.pow(a,b);}
  const args=node.args;
  if(node.name==='IF'){if(args.length<2||args.length>3)return '#VALUE!';const condition=evaluate(args[0]);if(error(condition))return condition;return truth(condition)?evaluate(args[1]):args[2]?evaluate(args[2]):false;}
  if(node.name==='IFERROR'){if(args.length!==2)return '#VALUE!';const value=evaluate(args[0]);return error(value)?evaluate(args[1]):value;}
  const values=flat(args.map(evaluate)),failure=values.find(error);if(failure)return failure;const nums=values.filter(v=>v!==''&&numeric(v)!==null).map(numeric),one=()=>values.length===1,first=numeric(values[0]);
  switch(node.name){
   case 'SUM':return nums.reduce((a,b)=>a+b,0);
   case 'AVERAGE':return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:'#DIV/0!';
   case 'MIN':return nums.length?Math.min(...nums):0;
   case 'MAX':return nums.length?Math.max(...nums):0;
   case 'COUNT':return nums.length;
   case 'COUNTA':return values.filter(v=>v!=='').length;
   case 'ABS':return one()&&first!==null?Math.abs(first):'#VALUE!';
   case 'ROUND':{const places=numeric(values[1]??0);if(values.length>2||first===null||places===null||!Number.isInteger(places)||Math.abs(places)>12)return '#VALUE!';const factor=10**places;return Math.sign(first)*Math.round((Math.abs(first)+Number.EPSILON)*factor)/factor;}
   case 'AND':return values.every(truth);
   case 'OR':return values.some(truth);
   case 'NOT':return one()?!truth(values[0]):'#VALUE!';
   case 'CONCAT':case 'CONCATENATE':return values.map(String).join('');
   case 'LEN':return one()?String(values[0]).length:'#VALUE!';
   case 'LOWER':return one()?String(values[0]).toLowerCase():'#VALUE!';
   case 'UPPER':return one()?String(values[0]).toUpperCase():'#VALUE!';
   case 'TRIM':return one()?String(values[0]).trim().replace(/\s+/g,' '):'#VALUE!';
   default:return '#NAME?';
  }
 }
 try{const value=evaluate(ast);if(Array.isArray(value))return '#VALUE!';return typeof value==='number'&&!Number.isFinite(value)?'#NUM!':value;}catch{return '#LIMIT!';}
}
export function displayValue(cells,ref){const value=evaluateCell(cells,ref);if(typeof value==='boolean')return value?'TRUE':'FALSE';if(typeof value==='number')return Number.isInteger(value)?String(value):String(Math.round(value*1e8)/1e8);return value;}
