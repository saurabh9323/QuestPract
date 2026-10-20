import {parse} from 'acorn';
import {generate} from 'astring';

// AST-driven source transformation. Unsupported constructs fail closed instead of
// running uninstrumented. Generated helper names cannot appear in learner code.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;
export function instrument(code:string):string {
  if(code.length>10000)throw new Error('Code limit: 10,000 characters.');
  const ast:Node=parse(code,{ecmaVersion:2022,locations:true});
  const fail=(n:Node,message:string):never=>{throw new Error(`Line ${n.loc?.start.line||1}: ${message}`)};
  const names=new Set(['Math','Infinity','NaN','undefined','Map','Set','Number','String','Boolean','parseInt','parseFloat','isNaN','isFinite']);
  function bindings(n:Node){
    if(!n||typeof n!=='object')return;
    if(n.type==='VariableDeclarator'&&n.id.type==='Identifier')names.add(n.id.name);
    if(n.type==='FunctionDeclaration'){names.add(n.id.name);n.params.forEach((p:Node)=>{if(p.type==='Identifier')names.add(p.name)})}
    for(const [k,v] of Object.entries(n))if(!['loc','start','end'].includes(k)){
      if(Array.isArray(v))v.forEach(bindings);else if(v&&typeof v==='object')bindings(v);
    }
  }
  bindings(ast);
  function check(n:Node){
    if(!n||typeof n!=='object')return;
    if(n.type==='Identifier'&&(/^__/.test(n.name)||['eval','Function','globalThis','self','window','fetch','importScripts','postMessage','Worker','WebSocket'].includes(n.name)))fail(n,'This identifier is not available in the playground.');
    if(n.type==='Literal'&&(n.regex||typeof n.value==='bigint'))fail(n,'Regular expressions and BigInt are not supported yet.');
    for(const [k,v] of Object.entries(n))if(!['loc','start','end'].includes(k)){
      if(Array.isArray(v))v.forEach(check);else if(v&&typeof v==='object')check(v);
    }
  }
  check(ast);
  if(ast.body.some((n:Node)=>n.type!=='FunctionDeclaration')||!ast.body.some((n:Node)=>n.id?.name==='solve'))throw new Error('Define function solve(...). Top-level code must contain function declarations only.');
  const q=(s:string)=>JSON.stringify(s);
  const line=(n:Node)=>n.loc.start.line;
  const label=(n:Node)=>q(code.slice(n.start,n.end).slice(0,100));
  const key=(n:Node)=>n.computed?expr(n.property):q(n.property.name);
  const getterMap=(names:string[])=>`{${names.map(name=>`${q(name)}:()=>${name}`).join(',')}}`;
  function expr(n:Node):string {
    switch(n.type){
      case 'Literal':return generate(n);
      case 'Identifier':
        if(!names.has(n.name))return fail(n,`Unknown variable ${n.name}. Browser and worker APIs are unavailable.`);
        return n.name;
      case 'ArrayExpression':
        if(n.elements.some((x:Node)=>!x||x.type==='SpreadElement'))return fail(n,'Sparse arrays and spread are not supported.');
        return `[${n.elements.map(expr).join(',')}]`;
      case 'ObjectExpression':return fail(n,'Object literals are planned for a later renderer phase. Use arrays, Map or Set.');
      case 'MemberExpression':
        if(n.optional)return fail(n,'Optional chaining is not supported yet.');
        return `__get(${expr(n.object)},${key(n)},${line(n)},${label(n)})`;
      case 'BinaryExpression': {
        if(['in','instanceof'].includes(n.operator))return fail(n,'This operator is not supported yet.');
        const value=`(${expr(n.left)} ${n.operator} ${expr(n.right)})`;
        return ['<','>','<=','>=','==','!=','===','!=='].includes(n.operator)?`__value(${line(n)},"compare",${label(n)},${value})`:value;
      }
      case 'LogicalExpression':return `(${expr(n.left)} ${n.operator} ${expr(n.right)})`;
      case 'UnaryExpression':
        if(!['!','-','+','~','typeof','void'].includes(n.operator))return fail(n,'This unary operation is not supported.');
        return `(${n.operator} ${expr(n.argument)})`;
      case 'ConditionalExpression':return `(${expr(n.test)}?${expr(n.consequent)}:${expr(n.alternate)})`;
      case 'AssignmentExpression':
        if(['&&=','||=','??='].includes(n.operator))return fail(n,'Logical assignment is not supported yet.');
        if(n.left.type==='Identifier')return `__op(${line(n)},"write",${label(n.left)},()=>(${n.left.name} ${n.operator} ${expr(n.right)}))`;
        if(n.left.type==='MemberExpression'&&n.operator==='=')return `__set(${expr(n.left.object)},${key(n.left)},${expr(n.right)},${line(n)},${label(n.left)})`;
        return fail(n,'Use plain array[index] = value; compound array writes are not supported yet.');
      case 'UpdateExpression':
        if(n.argument.type!=='Identifier')return fail(n,'Use a variable for ++/--; assign array elements explicitly.');
        return `__op(${line(n)},"write",${label(n.argument)},()=>(${n.prefix?n.operator:''}${n.argument.name}${n.prefix?'':n.operator}))`;
      case 'CallExpression':
        if(n.optional||n.arguments.some((a:Node)=>a.type==='SpreadElement'))return fail(n,'Optional/spread calls are not supported.');
        if(n.callee.type==='MemberExpression')return `__method(${expr(n.callee.object)},${key(n.callee)},[${n.arguments.map(expr)}],${line(n)},${label(n.callee)})`;
        if(n.callee.type!=='Identifier')return fail(n,'Call a named function or a supported collection method.');
        return `__call(${expr(n.callee)},[${n.arguments.map(expr)}],${line(n)},${label(n.callee)})`;
      case 'NewExpression':
        if(!['Map','Set'].includes(n.callee.name)||n.arguments.length)return fail(n,'Only new Map() and new Set() are supported.');
        return `__value(${line(n)},"call",${q(n.callee.name)},new ${n.callee.name}())`;
      default:return fail(n,`${n.type} is not supported in Phase 1.`);
    }
  }
  function declarations(n:Node):string {
    return n.declarations.map((d:Node)=>{
      if(d.id.type!=='Identifier')return fail(d,'Use simple variable names; destructuring is not supported yet.');
      return `${n.kind} ${d.id.name}${d.init?'='+expr(d.init):''};__value(${line(d)},"write",${q(d.id.name)},${d.id.name});`;
    }).join('\n');
  }
  function block(body:Node[],prefix=''):string {
    const names=body.filter(n=>n.type==='VariableDeclaration').flatMap(n=>n.declarations.map((d:Node)=>d.id.name)).filter(Boolean);
    // Getter closures share the lexical scope of the declarations. TDZ values
    // are represented explicitly until initialized. finally balances break/return.
    return `{try{__scope(${getterMap(names)});${prefix}\n${body.map(stmt).join('\n')}}finally{__unscope();}}`;
  }
  function stmt(n:Node):string {
    switch(n.type){
      case 'BlockStatement':return block(n.body);
      case 'VariableDeclaration':return declarations(n);
      case 'ExpressionStatement':return `${expr(n.expression)};`;
      case 'ReturnStatement':return `return __value(${line(n)},"return","return",${n.argument?expr(n.argument):'undefined'});`;
      case 'IfStatement':return `if(__test(${expr(n.test)},${line(n.test)}))${asBlock(n.consequent)}${n.alternate?'else '+asBlock(n.alternate):''}`;
      case 'WhileStatement':return `while(__test(${expr(n.test)},${line(n.test)}))${asBlock(n.body)}`;
      case 'ForStatement': {
        const init=n.init?(n.init.type==='VariableDeclaration'?declarations(n.init):expr(n.init)+';'):'';
        const names=n.init?.type==='VariableDeclaration'?n.init.declarations.map((d:Node)=>d.id.name):[];
        return `{try{__scope(${getterMap(names)});${init}while(__test(${n.test?expr(n.test):'true'},${line(n)})){${stmt(n.body)}${n.update?expr(n.update)+';':''}}}finally{__unscope();}}`;
      }
      case 'BreakStatement':if(n.label)return fail(n,'Labeled breaks are unsupported.');return 'break;';
      case 'EmptyStatement':return ';';
      case 'FunctionDeclaration': {
        if(n.async||n.generator||n.params.some((p:Node)=>p.type!=='Identifier'))return fail(n,'Use synchronous named functions with simple parameters.');
        const vars:string[]=[];
        function findVars(node:Node){
          if(!node||typeof node!=='object'||node.type==='FunctionDeclaration')return;
          if(node.type==='VariableDeclaration'&&node.kind==='var')node.declarations.forEach((d:Node)=>{if(d.id.type==='Identifier')vars.push(d.id.name)});
          for(const [k,v] of Object.entries(node))if(!['loc','start','end'].includes(k)){if(Array.isArray(v))v.forEach(findVars);else if(v&&typeof v==='object')findVars(v)}
        }
        findVars(n.body);
        return `function ${n.id.name}(${n.params.map((p:Node)=>p.name)}){__enter(${q(n.id.name)},${getterMap([...new Set([...n.params.map((p:Node)=>p.name),...vars])])},${line(n)});try${stmt(n.body)}finally{__leave();}}`;
      }
      default:return fail(n,`${n.type} is not supported in Phase 1 (including continue, async and callbacks).`);
    }
  }
  function asBlock(n:Node){return n.type==='BlockStatement'?stmt(n):`{${stmt(n)}}`}
  return ast.body.map(stmt).join('\n')+'\nreturn solve(...__args);';
}
