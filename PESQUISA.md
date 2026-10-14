**ESCOLA TÉCNICA ESTADUAL DE CAMPO LIMPO PAULISTA — ETECAMP**

**ENSINO MÉDIO TÉCNICO — 3º AI**

&nbsp;

[José André]
[Victor Gustavo dos Santos]
[Vinicius Coelho]

&nbsp;

# AUTENTICAÇÃO, AUTORIZAÇÃO E JWT: PESQUISA ORIENTADA PARA A API SEGURA DE CHAMADOS DE SUPORTE

&nbsp;

Pesquisa referente à Parte 1 da Atividade Avaliativa "API Segura", do 4º bimestre, desenvolvida pelo grupo do tema 5 (Chamados de suporte).

&nbsp;

Professor: Marcelo Macrino dos Santos

&nbsp;

**Campo Limpo Paulista**
**2026**

---

## SUMÁRIO

1. INTRODUÇÃO
2. DESENVOLVIMENTO
   - 2.1 Fundamentos
   - 2.2 JWT
   - 2.3 Segurança na prática
3. CONSIDERAÇÕES FINAIS
4. DECLARAÇÃO DE FERRAMENTAS UTILIZADAS

REFERÊNCIAS

---

## 1 INTRODUÇÃO

Toda aplicação que possui usuários precisa responder a duas perguntas: quem é a pessoa que está fazendo a requisição e o que ela tem permissão para fazer. Neste trabalho, o grupo pesquisou os conceitos de autenticação, autorização e JSON Web Token (JWT) e os relacionou com a API desenvolvida, cujo tema é um sistema de chamados de suporte. Nesse sistema, o usuário comum (perfil USER) abre e acompanha os próprios chamados, enquanto o administrador (perfil ADMIN) enxerga todos os chamados e pode fechá-los.

A API foi construída com Node.js, Express 5, Prisma ORM 7 e SQLite, utilizando as bibliotecas `jsonwebtoken` e `bcryptjs`. As respostas a seguir seguem as 12 perguntas orientadas pela atividade e foram fundamentadas em fontes oficiais, listadas nas Referências.

## 2 DESENVOLVIMENTO

### 2.1 Fundamentos

#### 2.1.1 Autenticação × autorização

Autenticação é o processo de confirmar a identidade de quem faz a requisição, isto é, responder "quem é você?". Na API do grupo, isso ocorre no `POST /auth/login`, que confere e-mail e senha, e no middleware `autenticar`, que valida o token enviado nas rotas protegidas. Autorização, por sua vez, define o que uma identidade já conhecida pode fazer. Na API, ocorre quando um USER tenta acessar `GET /users`, rota exclusiva de ADMIN, ou quando tenta alterar o chamado de outra pessoa.

Quando a autenticação falha (token ausente, mal formatado, inválido ou expirado), a API devolve o status 401 (Unauthorized), pois o servidor não conseguiu identificar o cliente. Quando a autorização falha, devolve 403 (Forbidden), porque a identidade é conhecida, mas o servidor se recusa a atender ao pedido (MDN WEB DOCS, s.d.).

#### 2.1.2 Stateful × stateless

No modelo com sessão no servidor (stateful), como o `$_SESSION` do PHP, o servidor guarda os dados do login em memória ou em banco, e o navegador envia apenas um identificador da sessão. A vantagem é o controle total: o servidor pode encerrar uma sessão a qualquer momento. A desvantagem é que ele precisa armazenar e consultar o estado de cada sessão, o que complica o crescimento do sistema.

No modelo com token (stateless), o próprio token carrega as informações do usuário e é assinado, de modo que o servidor não precisa guardar nada para validá-lo. A vantagem é a simplicidade e a facilidade de escalar. A desvantagem é que um token já emitido continua válido até expirar, o que dificulta o encerramento imediato de um acesso (OWASP, s.d.c). A API do grupo adota o modelo com token.

#### 2.1.3 Hash × criptografia × encoding

Hash é uma função de mão única: transforma um dado em um resumo de tamanho fixo e não permite recuperar o original. Criptografia é reversível, mas só por quem possui a chave. Encoding (como o Base64) apenas muda a representação do dado e é reversível por qualquer pessoa, pois não usa segredo algum.

Para senhas, usa-se hash, porque o sistema nunca precisa saber a senha original, apenas conferir se a informada gera o mesmo resultado. No JWT, o header e o payload usam encoding Base64url, ou seja, qualquer um pode lê-los; a proteção contra alteração vem da assinatura (JONES; BRADLEY; SAKIMURA, 2015).

#### 2.1.4 bcrypt e salt

MD5 e SHA-256 foram projetados para serem rápidos, e essa velocidade favorece o atacante, que consegue testar bilhões de senhas por segundo. O bcrypt é um algoritmo propositalmente lento e configurável, o que encarece os ataques de força bruta. O OWASP o aceita para armazenamento de senhas e indica um fator de trabalho mínimo de 10, preferindo o Argon2id quando possível (OWASP, s.d.a).

O "custo" (no projeto, 10) define quanto trabalho o algoritmo realiza: cada aumento de uma unidade dobra o tempo de cálculo. O salt é um valor aleatório gerado a cada senha e embutido no próprio hash. Por isso, dois usuários com a mesma senha têm hashes diferentes e uma tabela pré-calculada de hashes (rainbow table) deixa de funcionar. O OWASP também alerta que o bcrypt considera apenas os primeiros 72 bytes da senha, limite que a API valida no cadastro (OWASP, s.d.a).

### 2.2 JWT

#### 2.2.1 Estrutura

Um JWT é formado por três partes separadas por ponto: o header, que informa o tipo do token e o algoritmo de assinatura; o payload, que contém as informações (claims) sobre o usuário e a validade; e a signature, calculada a partir das duas primeiras com uma chave secreta (JONES; BRADLEY; SAKIMURA, 2015). Header e payload ficam codificados em Base64url, e por isso podem ser lidos no jwt.io.

> O token gerado no login do usuário ana@suporte.com foi decodificado no jwt.io, resultando em:

Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "role": "USER", "iat": 1792009626, "exp": 1792013226, "sub": "2" }

#### 2.2.2 Claims

O claim `sub` (subject) identifica o sujeito do token, que no projeto é o id do usuário. O `iat` (issued at) registra o momento em que o token foi emitido. O `exp` (expiration time) define o instante a partir do qual o token não pode mais ser aceito (JONES; BRADLEY; SAKIMURA, 2015).

O grupo colocou no token apenas `sub`, `role`, `iat` e `exp`. O `role` permite que o middleware `autorizar` decida o acesso sem consultar o banco a cada requisição, e o `exp` limita o tempo de uso. Não devem ir no payload senhas, hashes ou dados pessoais sensíveis, pois qualquer pessoa consegue decodificar o conteúdo do token. A assinatura garante integridade, mas não sigilo.

#### 2.2.3 Assinatura

O token é assinado com HMAC-SHA256 (HS256) usando a `JWT_SECRET`, que só o servidor conhece. Se um usuário trocar `"role": "USER"` por `"ADMIN"` no payload, a assinatura deixa de corresponder ao conteúdo e o `jwt.verify()` rejeita o token. Para gerar uma assinatura válida, seria necessário conhecer a chave secreta.

Segundo a documentação do pacote, o `jwt.decode()` apenas lê o conteúdo do token sem verificar a assinatura, e por isso não deve ser usado para decidir acesso. O `jwt.verify()` confere a assinatura e também a validade (`exp`), lançando erro quando algo está incorreto (AUTH0, s.d.). Por isso o projeto usa `verify` dentro de um `try/catch` e fixa o algoritmo aceito em HS256, medida também recomendada pelo OWASP para evitar tokens com algoritmo trocado ou "none" (OWASP, s.d.c).

#### 2.2.4 Validade e logout

Como o JWT é stateless, o servidor não guarda uma lista de tokens ativos. Assim, depois de um logout, o token continua válido até o `exp`, e se o perfil do usuário for alterado (por exemplo, de USER para ADMIN), o token antigo continua carregando o perfil antigo até que o usuário faça login de novo. Revogar um token antes do prazo exige mecanismos adicionais, como uma lista de tokens bloqueados mantida no servidor (OWASP, s.d.c).

O refresh token é uma solução para equilibrar segurança e comodidade: o access token tem vida curta (por exemplo, 15 minutos) e é acompanhado de um refresh token de vida longa, guardado com mais cuidado, usado apenas para pedir um novo access token. Se um access token vazar, o prejuízo é limitado pelo curto prazo. O projeto do grupo não implementa refresh token e usa um único token com validade definida em `JWT_EXPIRES_IN` (1 hora).

### 2.3 Segurança na prática

#### 2.3.1 Onde guardar o token

No `localStorage`, o token fica acessível por qualquer JavaScript da página, de modo que uma falha de XSS (Cross-Site Scripting, em que um atacante injeta script na página) permite roubá-lo. Em um cookie com a flag `HttpOnly`, o JavaScript não consegue ler o valor, o que reduz esse risco; porém, como o navegador envia cookies automaticamente, surge a exposição ao CSRF (Cross-Site Request Forgery, em que um site malicioso faz o navegador do usuário enviar uma requisição sem que ele perceba). Esse risco é mitigado com atributos como `SameSite` (OWASP, s.d.c).

A API do grupo recebe o token pelo cabeçalho `Authorization: Bearer <token>`, que o navegador não envia sozinho, e por isso não depende de cookies. A escolha de onde guardar o token cabe a quem desenvolver o front-end.

#### 2.3.2 Chave secreta

A `JWT_SECRET` fica no arquivo `.env` para não ser escrita no código-fonte nem enviada ao repositório, já que o `.env` está no `.gitignore` e o repositório contém apenas o `.env.example`, sem valores reais. Dessa forma, a chave pode mudar entre ambientes (desenvolvimento e produção) sem alterar o código.

Se a chave vazar no GitHub, qualquer pessoa pode fabricar tokens válidos com `"role": "ADMIN"` e acessar a API como administrador, sem precisar de senha. Nesse caso, a chave precisa ser trocada imediatamente, o que invalida todos os tokens já emitidos.

#### 2.3.3 RBAC e dono do recurso

O RBAC (Role-Based Access Control) controla o acesso pelo perfil do usuário: o que um USER pode fazer é diferente do que um ADMIN pode. O controle por dono vai além e verifica se aquele recurso específico pertence a quem faz a requisição.

No código do grupo, o RBAC aparece no middleware `autorizar` (`src/middlewares/autorizar.js`), usado em `src/routes/users.routes.js` para exigir o perfil ADMIN. O controle por dono aparece na função `buscarComPermissao` (`src/controllers/chamados.controller.js`), que compara o `donoId` do chamado com o id extraído do token e só permite a operação ao dono ou a um ADMIN. O id do dono nunca vem do corpo da requisição.

#### 2.3.4 OWASP

Foram analisadas duas recomendações do OWASP Cheat Sheet Series:

**a) Mensagens de erro genéricas no login.** O OWASP recomenda que a resposta de falha não revele se o erro foi no usuário ou na senha, para não ajudar atacantes a descobrir contas existentes (OWASP, s.d.b). O projeto segue essa recomendação: o login devolve "E-mail ou senha inválidos." em ambos os casos e compara a senha com um hash falso quando o e-mail não existe, para manter o tempo de resposta semelhante.

**b) Armazenamento de senhas com algoritmo adequado.** O OWASP orienta usar algoritmos próprios para senhas, com salt e fator de trabalho adequado, sendo o Argon2id a primeira escolha e o bcrypt aceitável com custo mínimo de 10 (OWASP, s.d.a). O projeto usa bcrypt com custo 10, portanto atende ao mínimo, embora o Argon2id fosse a opção preferida.

Em um ponto o projeto não acompanha totalmente o OWASP: o tamanho mínimo de senha exigido pela atividade é de 6 caracteres, e o OWASP sugere um mínimo maior (OWASP, s.d.b). Em produção, o grupo aumentaria esse limite.

## 3 CONSIDERAÇÕES FINAIS

A pesquisa permitiu compreender que autenticação e autorização são etapas diferentes, com respostas diferentes (401 e 403), e que o JWT é prático por ser stateless, mas exige cuidados: chave secreta protegida, validade curta, algoritmo fixado e nenhum dado sensível no payload. Aplicar esses conceitos na API de chamados de suporte mostrou, na prática, a importância de separar os middlewares `autenticar` e `autorizar` e de obter o dono do recurso a partir do token, nunca do corpo da requisição.

## 4 DECLARAÇÃO DE FERRAMENTAS UTILIZADAS

 Para a elaboração do código e do rascunho deste documento, o grupo utilizou o assistente de inteligência artificial Claude (Anthropic) como apoio. O conteúdo foi revisado pelo grupo e confrontado com as fontes listadas nas Referências.

---

## REFERÊNCIAS

AUTH0. **jsonwebtoken**: an implementation of JSON Web Tokens. [*S. l.*]: npm, [s.d.]. Disponível em: https://www.npmjs.com/package/jsonwebtoken. Acesso em: 14 out. 2026.

JONES, M.; BRADLEY, J.; SAKIMURA, N. **RFC 7519**: JSON Web Token (JWT). [*S. l.*]: IETF, 2015. Disponível em: https://datatracker.ietf.org/doc/html/rfc7519. Acesso em: 14 out. 2026.

MDN WEB DOCS. **HTTP response status codes**. [*S. l.*]: Mozilla, [s.d.]. Disponível em: https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status. Acesso em: 14 out. 2026.

OWASP. **Password Storage Cheat Sheet**. [*S. l.*]: OWASP Foundation, [s.d.a]. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html. Acesso em: 14 out. 2026.

OWASP. **Authentication Cheat Sheet**. [*S. l.*]: OWASP Foundation, [s.d.b]. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html. Acesso em: 14 out. 2026.

OWASP. **JSON Web Token Cheat Sheet for Java**. [*S. l.*]: OWASP Foundation, [s.d.c]. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html. Acesso em: 14 out. 2026.
