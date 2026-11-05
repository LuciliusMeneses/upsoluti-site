# Cadastro manual de empresas na plataforma

2026-11-05. Pedido do usuário: cadastro manual na plataforma, permitindo criar conta do proprietário ou vincular uma existente. Escopo: botão Nova empresa em Empresas e assinaturas, empresa/unidade/região/plano/proprietário, provisionamento privilegiado com auditoria e idempotência. Sem atribuir vínculo operacional ao operador global, inventar cobrança ou enviar e-mails.

Nova conta usa senha inicial definida pelo administrador e acesso liberado administrativamente, sem alegar verificação da caixa de e-mail. Conta existente deve ter acesso confirmado. A criação Auth e a transação empresarial são serviços separados: registrar solicitação antes da criação Auth e retomar com a mesma chave, sem apagar usuário diante de resultado incerto. Senha nunca vai ao banco de negócio, metadados ou logs; somente Auth recebe a senha. Fingerprint HMAC de solicitação no servidor protege repetição alterada.

Critérios: privilégio global no servidor, negativa para owner comum/anônimo, validação, isolamento, empresa/unidade/assinatura/vínculo inicial transacionais, plano/snapshot/limites, repetição/conflito, nova conta e conta existente, falhas parciais, campos bloqueados durante gravação e UI quatro larguras/PT-BR/PT-PT. Publicação é checkpoint separado após validação local.
