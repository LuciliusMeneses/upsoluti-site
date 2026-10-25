# Avisos de formulários por e-mail

Os formulários de contacto e proposta continuam a enviar o cadastro ao CRM.
Após o aceite do CRM, o servidor tenta enviar um aviso à equipa via SMTP Titan.
Não é enviado e-mail ao visitante. Responder ao aviso usa o e-mail do visitante.

No projeto Vercel **upsoluti.com**, ambiente **Production**, configure:

| Variável | Valor |
| --- | --- |
| CONTACT_EMAIL_ENABLED | true |
| CONTACT_SMTP_USER | contacto@upsoluti.com |
| CONTACT_NOTIFICATION_TO | contacto@upsoluti.com |
| CONTACT_SMTP_PASSWORD | Senha da conta Titan, inserida diretamente na Vercel |

SMTP fixo `smtp.titan.email:465`, com TLS e validação de certificado padrão.
Não prefixe estas variáveis com NEXT_PUBLIC_. Não grave a senha no código,
documentação, chat ou logs. Alterações de variáveis exigem novo deploy.
Os registros DNS de e-mail existentes (MX/SPF/DKIM/DMARC) são preservados.

## Validação e limites

- Os testes simulam SMTP; o aceite real do servidor precisa de um envio sintético.
- Falha no CRM impede o aviso e continua retornando erro ao visitante.
- Falha SMTP não desfaz cadastro já aceite; o formulário confirma o recebimento
  pelo CRM. Logs usam apenas `[contact] email notification failed` e eventId.
- Há deduplicação em memória de até 24h e partilha de pedidos concorrentes na
  mesma instância. Message-ID estável não garante deduplicação entre instâncias.
- Não há fila persistente ou reenvio automático dos avisos que falharam. Para
  entrega com retentativas duráveis, é necessário implementar uma outbox no CRM.
- Aceite SMTP não comprova chegada à caixa de entrada. Verifique também spam.
- Esta integração cobre `/api/contact` (contacto e proposta); não altera o chat.

Fonte: https://suporte.hostgator.com.br/hc/pt-br/articles/30813560087571-Como-enviar-e-receber-e-mails-Titan-por-aplicativos-externos
