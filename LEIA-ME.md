# Barbearia — Sistema de Agendamentos

## O que está incluso
- `index.html` — estrutura do sistema
- `style.css` — visual/design
- `app.js` — toda a lógica e integração com Supabase
- `LEIA-ME.md` — este arquivo

---

## Como rodar o sistema

### Opção 1 — Testar no computador (rápido)
Basta abrir o arquivo `index.html` diretamente no navegador (Chrome, Edge, etc).

### Opção 2 — Colocar online grátis (recomendado)
1. Crie uma conta em https://vercel.com com seu GitHub
2. Faça upload da pasta no GitHub
3. Conecte o repositório no Vercel
4. O sistema fica disponível com um link público

---

## Configuração do Supabase (já feita)
As chaves já estão configuradas no arquivo `app.js`:
- SUPABASE_URL: sua URL do projeto
- SUPABASE_KEY: sua chave pública

---

## Próximos passos opcionais

### Email automático (Resend)
Para ativar os emails de confirmação e lembrete:
1. Crie conta em https://resend.com
2. Pegue sua API Key
3. No Supabase vá em "Edge Functions" e crie uma função chamada `enviar-email`
4. Me peça o código da função que eu forneço pronto

### Lembrete automático (1 dia antes)
No Supabase vá em "Database" → "Extensions" → ative o `pg_cron`.
Depois me peça o SQL para agendar o lembrete diário.

---

## Funcionalidades do sistema

### Tela do cliente — Agendar
- Escolhe serviço (carregado do banco)
- Escolhe data no calendário
- Vê horários disponíveis (ocupados aparecem riscados)
- Preenche nome, email e telefone
- Recebe confirmação na tela

### Tela do cliente — Meus agendamentos
- Login só com telefone
- Vê próximos agendamentos e histórico
- Pode remarcar ou cancelar

### Painel do barbeiro
- Vê agendamentos dos próximos 7 dias
- Métricas: total, confirmados, pendentes
- Pode confirmar ou cancelar agendamentos

---

## Serviços cadastrados no banco
| Serviço | Preço | Duração |
|---|---|---|
| Corte | R$ 35,00 | 30 min |
| Barba | R$ 25,00 | 20 min |
| Corte + Barba | R$ 55,00 | 45 min |
| Hidratação | R$ 40,00 | 30 min |

Para adicionar ou editar serviços, vá em Supabase → Table Editor → tabela `servicos`.
