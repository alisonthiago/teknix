const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const React = require('react')
function player(content, slides = false) {
  const states = []; let cursor = 0; let effects = []; const timers = []
  const hooks = { useRef: () => ({current:null}), useState(value) { const slot = cursor++; if (!(slot in states)) states[slot] = value; return [states[slot], next => {states[slot] = typeof next === 'function' ? next(states[slot]) : next}] }, useEffect(fn) { effects.push(fn) } }
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../src/components/page-widgets/WidgetCarousel.tsx'), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText
  new Function('require','exports','window',code)(name => name === 'react' ? hooks : name === 'lucide-react' ? {ChevronLeft:()=>null,ChevronRight:()=>null} : require(name), exports, {setInterval:fn => {timers.push(fn); return timers.length}, clearInterval:()=>{}})
  return {timers, render(){cursor=0;effects=[];const tree=exports.default({content,slides});for(const effect of effects) effect();return tree}}
}
function all(node, predicate) { if (!node || typeof node !== 'object') return []; return (predicate(node)?[node]:[]).concat(React.Children.toArray(node.props?.children).flatMap(child=>all(child,predicate))) }
const buttons = tree => all(tree, node=>node.type==='button')
test('navigation advances and stops at the last visible group',()=>{
 const p=player({images:['a','b','c'],slides_to_show:2,infinite:false});let tree=p.render();buttons(tree).find(b=>b.props['aria-label']==='Próximo slide').props.onClick();tree=p.render();assert.equal(buttons(tree).find(b=>b.props['aria-label']==='Próximo slide').props.disabled,true);assert.equal(all(tree,n=>n.type==='article')[0].props['aria-hidden'],true)
})
test('infinite navigation wraps around',()=>{
 const p=player({images:['a','b'],slides_to_show:1,infinite:true});let tree=p.render();buttons(tree).find(b=>b.props['aria-label']==='Slide anterior').props.onClick();tree=p.render();assert.equal(all(tree,n=>n.type==='article')[1].props['aria-hidden'],false)
})
test('no navigation setting removes arrows and pagination',()=>{
 assert.equal(buttons(player({images:['a','b'],slides_to_show:1,navigation:'none'}).render()).length,0)
})
test('slides preserve authored content and button destinations',()=>{
 const tree=player({slides:[{title:'Título',button_text:'Conhecer',button_link:'/produto'}]},true).render();assert.equal(all(tree,n=>n.type==='h3')[0].props.children,'Título');assert.equal(all(tree,n=>n.type==='a')[0].props.href,'/produto')
})
test('autoplay starts when enabled and pauses on hover',()=>{
 const p=player({images:['a','b'],slides_to_show:1,autoplay:true});const tree=p.render();assert.equal(p.timers.length,1);tree.props.onMouseEnter();p.render();assert.equal(p.timers.length,1)
})
