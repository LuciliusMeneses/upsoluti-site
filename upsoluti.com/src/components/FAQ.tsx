const items=[
 {question:'Como começa a implementação?',answer:'Começamos por analisar o seu objetivo e os processos atuais. Depois definimos o âmbito, as entregas e os critérios de validação antes de implementar.'},
 {question:'É necessário ter uma equipa técnica?',answer:'Podemos acompanhar a implementação e a manutenção. As responsabilidades e o nível de suporte são definidos na proposta.'},
 {question:'Como são tratados os dados da empresa?',answer:'A arquitetura, os acessos e as integrações são definidos em função dos dados e dos requisitos do projeto. O alojamento e os fornecedores são alinhados antes da implementação.'},
 {question:'Quanto custa e quanto tempo demora?',answer:'Depende do âmbito e das integrações. Após o diagnóstico, apresentamos uma proposta com entregas, calendário e custos de implementação e manutenção separados.'}
];
export default function FAQ(){return <section className="faq"><div className="container-main"><div className="faq-header"><h2 className="pillars-title">Dúvidas frequentes</h2></div><div className="faq-list">{items.map(item=><details key={item.question} className="faq-item"><summary className="faq-question">{item.question}</summary><div className="faq-answer-content">{item.answer}</div></details>)}</div></div></section>}
