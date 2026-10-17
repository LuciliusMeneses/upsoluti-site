# UPsoluti — sistema de design

Fonte de verdade: src/app/globals.css, bloco @theme do Tailwind v4.

- Marca: #A326D7; interação: #8B1DB8; fundo escuro: #460068.
- Superfícies: #F6F9FB, #FFFFFF, #F3EDF8 e #EDE5F3.
- Texto: #121D2F e #536376; sobre fundo escuro: branco e #CBD5E1.
- Inter local quando disponível, com fallback para fontes do sistema; sem pedidos externos de fontes; títulos fluidos; espaçamento base de 8 px.
- Container máximo de 1280 px; navegação compacta abaixo de 1200 px.
- Foco visível, teclado, erros acessíveis e movimento reduzido.
- Conteúdo em português de Portugal. Métricas exigem comprovação.

## Home

Estilos específicos em src/app/home.css, delimitados por .ai-home. Quatro secções: hero, soluções, processo e contacto. Fundo #101019, painéis #171621, acento #D49CF4. Ilustrações abstratas de IA e conexões, sem métricas ou estados fictícios. Diagnóstico recolhível; formulário inicial com quatro campos. Serviços e formulário completo nas páginas internas.

### Prioridade do hero

Manter a composição inspirada em https://growthclick.co/: título centralizado amplo, destaque de cor, fundo escuro com brilho, elementos laterais e dois botões arredondados. Não substituir por um slogan curto ou aplicar ao hero os ajustes de redução de conteúdo dos blocos inferiores. Identidade e textos são da UPsoluti.

## Páginas internas

Estilos em src/app/inner.css, delimitados por .inner-page. PageHeader e InnerUI partilham hierarquia, cards, etapas, FAQ e CTA. Fundo #101019, painéis #171621 e acento #D49CF4. Conteúdo organizado por necessidade, âmbito e processo. Não publicar garantias de posição SEO, ausência de erros de IA ou métricas de projetos sem validação. O hero da home mantém a sua composição independente.

## Movimento

SVGs conceptuais em AnimatedDiagram, com pausa individual, suspensão fora da área visível e respeito por prefers-reduced-motion. Sem métricas ou dados simulados apresentados como reais. Cards entram uma vez ao aparecer, com destaque ao hover e foco; sem movimento contínuo em formulários ou no hero.

### Cabeçalhos internos e legendas

HeroBackground acrescenta gráficos decorativos em movimento atrás dos cabeçalhos internos, com máscara para preservar a leitura. Pausa individual, suspensão fora da área visível e movimento reduzido são partilhados por useMotionState. As legendas dos diagramas explicam estratégia, validação e supervisão, sem reivindicar métricas ou resultados inexistentes. O hero da home permanece independente.

Os fundos dos cabeçalhos não apresentam botão de pausa, conforme preferência do utilizador. Mantêm movimento reduzido e suspensão fora da área visível. Os controlos dos diagramas de conteúdo são independentes.
