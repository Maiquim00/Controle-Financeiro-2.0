# Configuração do Supabase

O app usa Supabase Auth para autenticação por e-mail e senha e a tabela `public.transacoes` para os dados financeiros. Senhas são tratadas pelo Auth; não são armazenadas pela aplicação. A chave usada no navegador deve ser somente a chave pública `publishable` (ou a chave legada `anon`). Nunca coloque `service_role` ou outra chave secreta em arquivos publicados.

## Preparar o projeto

1. Crie um projeto no Supabase e copie a Project URL e a chave **Publishable** (`sb_publishable_`) em **Project Settings > API Keys**. A chave legada `anon` também é aceita. Não use `service_role` nem `sb_secret_` no navegador.
2. No **SQL Editor**, execute todo o conteúdo de `supabase-schema.sql`. A tabela ativa RLS e limita leitura, inclusão, alteração e remoção ao `user_id` da sessão autenticada.
3. Em **Authentication > URL Configuration**, defina o Site URL como `https://maiquim00.github.io/Controle-Financeiro-2.0/`.
4. Adicione às Redirect URLs `https://maiquim00.github.io/Controle-Financeiro-2.0/**`, `http://127.0.0.1:5500/**` e `http://localhost:5500/**`. Se o Live Server usar outra porta, adicione também os endereços locais com essa porta.
5. Em **Authentication > Providers**, mantenha Email habilitado. Se a confirmação de e-mail estiver ativa, o cadastro pedirá que a pessoa confirme o endereço antes de entrar.

## Testar localmente com Live Server

1. Abra a pasta `controle-financeiro-site` no VS Code.
2. Instale a extensão Live Server, caso ainda não esteja instalada.
3. Abra `auth.html`, clique com o botão direito e escolha **Open with Live Server**. Use `index.html` apenas para conferir que o dashboard redireciona quando não há sessão.
4. Acesse pelo endereço HTTP do Live Server, não por `file://`; os módulos ES e o cliente Supabase precisam ser carregados por um servidor. O SDK vem do jsDelivr, então o navegador precisa de acesso à internet.

## Conectar o site

`supabase-config.js` fornece a Project URL e a chave publicável ao cliente. A exportação atual se chama `SUPABASE_ANON_KEY` por compatibilidade, embora seu valor possa usar o formato `sb_publishable_`; os dois nomes são aceitos pelo cliente. Não substitua as credenciais existentes sem conferir os valores do seu projeto. Nunca inclua chaves `service_role` ou `sb_secret_` no Front-End.

O dashboard redireciona sessões não autenticadas para `auth.html`. Os dados só são lidos e gravados na tabela Supabase depois do login. A segurança por usuário é aplicada no banco pelas políticas RLS, não apenas por filtros da interface.

As transações que existiam no `localStorage` antes desta integração não são enviadas automaticamente ao Supabase.