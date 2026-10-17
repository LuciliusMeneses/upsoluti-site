export type DiagramVariant = 'growth' | 'automation' | 'intelligence';
export function diagramForGoal(goal: string): DiagramVariant {
  return goal === 'escalar-ia' ? 'intelligence' : goal === 'vender-mais' ? 'growth' : 'automation';
}
export const diagramCopy = {
  growth: { title: 'Do interesse à oportunidade', subtitle: 'Estratégia ligada ao acompanhamento comercial', caption: 'Um percurso de aquisição ligado ao acompanhamento comercial.', description: 'Percurso comercial entre descoberta, interesse e conversa, com as etapas ligadas por uma curva de progressão.' },
  automation: { title: 'Um processo que flui', subtitle: 'Integração com validação em cada etapa', caption: 'A informação passa pela validação antes de chegar à ação.', description: 'Fluxo de informação entre uma entrada, regras de validação e uma ação, com ligações entre cada etapa.' },
  intelligence: { title: 'Conhecimento com contexto', subtitle: 'Fontes relevantes. Supervisão humana.', caption: 'Fontes e contexto apoiam o assistente, com passagem para a equipa.', description: 'Assistente ligado a fontes de conhecimento, perguntas, contexto e equipa, com supervisão humana.' },
};
