"use client";
import { useState } from 'react';
import Link from 'next/link';
const goals = [
 {id:'vender-mais',title:'Quero vender mais',desc:'Atrair contactos e melhorar a conversão.',href:'/solucoes/vender-mais'},
 {id:'automatizar',title:'Quero automatizar',desc:'Reduzir tarefas repetitivas e ligar sistemas.',href:'/solucoes/automatizar'},
 {id:'escalar-ia',title:'Quero escalar com IA',desc:'Acelerar o atendimento e organizar conhecimento.',href:'/solucoes/escalar-ia'},
 {id:'software',title:'Preciso de software à medida',desc:'Criar uma aplicação adaptada à operação.',href:'/servicos/software'}
];
export default function QuickDiagnostic() {
 const [goal,setGoal] = useState(''); const [size,setSize] = useState(''); const [result,setResult] = useState(false);
 const chosen = goals.find(g=>g.id===goal);
 return <div className="diagnostic-card" id="diagnostico"><h2 className="diagnostic-title">Qual é a prioridade do seu negócio?</h2><p className="diagnostic-subtitle mb-5">Duas respostas para encontrar um ponto de partida.</p>
 <form onSubmit={e=>{e.preventDefault();setResult(true);}} className="form-fields">
 <fieldset><legend className="form-label">1. O que pretende melhorar?</legend><div className="diagnostic-options">{goals.map(g=><label key={g.id} className="diagnostic-option"><input type="radio" name="goal" required value={g.id} checked={goal===g.id} onChange={()=>{setGoal(g.id);setResult(false);}}/><span><span className="diagnostic-option-title block">{g.title}</span><span className="diagnostic-option-desc">{g.desc}</span></span></label>)}</div></fieldset>
 <div><label className="form-label" htmlFor="team-size">2. Quantas pessoas tem a equipa?</label><select id="team-size" className="form-select" required value={size} onChange={e=>{setSize(e.target.value);setResult(false);}}><option value="">Selecione</option><option>1–5 pessoas</option><option>6–20 pessoas</option><option>Mais de 20 pessoas</option></select></div>
 <button className="btn-primary" type="submit">Ver recomendação</button>
 </form>
 {result && chosen && <div role="status" className="mt-6 border-t border-border pt-5"><h3 className="font-bold mb-2">O seu ponto de partida</h3><p className="text-sm mb-4">{chosen.desc} Para uma equipa de {size.toLowerCase()}, o próximo passo é mapear o processo e definir uma primeira implementação.</p><Link href={chosen.href} className="text-primary underline block mb-4">Explorar esta solução</Link><Link className="btn-primary" href={'/contacto?objetivo='+goal+'&equipa='+encodeURIComponent(size)+'&origem=diagnostico'}>Pedir um plano para a minha empresa</Link></div>}
 </div>;
}
