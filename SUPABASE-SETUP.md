# Configuração do Supabase

O app usa Supabase Auth para autenticação por e-mail e senha e a tabela `public.transacoes` para os dados financeiros. Senhas são tratadas pelo Auth; não são armazenadas pela aplicação. A chave usada no navegador deve ser somente a chave pública `publishable` (ou a chave legada `anon`). Nunca coloque `service_role` ou outra chave secreta em arquivos publicados.

## Preparar o projeto

1. Crie um projeto no Supabase e copie a Project URL e a chave **Publishable** (`sb_publishable_`) em **Project Settings > API Keys**. A chave legada `anon` também é aceita. Não use `service_role` nem `sb_secret_` no navegador.
2. No **SQL Editor**, execute todo o conteúdo de `supabase-schema.sql`. A tabela ativa RLS e limita leitura, inclusão, alteração e remoção ao `user_id` da sessão autenticada.
3. Em **Authentication > URL Configuration**, defina o Site URL como `https://maiquim00.github.io/Controle-Financeiro-2.0/`.
4. Adicione às Redirect URLs `https://maiquim00.github.io/Controle-Financeiro-2.0/**`.
5. Em **Authentication > Providers**, mantenha Email habilitado. Se a confirmação de e-mail estiver ativa, o cadastro pedirá que a pessoa confirme o endereço antes de entrar.

## Conectar o site

Edite `supabase-config.js` e substitua os valores de exemplo por `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. Se sua configuração existente usa `SUPABASE_ANON_KEY`, ela continua compatível. Esses valores são usados no navegador; nunca inclua chaves `service_role` ou `sb_secret_` no repositório.

O dashboard redireciona sessões não autenticadas para `auth.html`. Os dados só são lidos e gravados na tabela Supabase depois do login. A segurança por usuário é aplicada no banco pelas políticas RLS, não apenas por filtros da interface.

As transações que existiam no `localStorage` antes desta integração não são enviadas automaticamente ao Supabase.