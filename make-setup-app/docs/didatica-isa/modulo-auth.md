# Módulo: Autenticação Segura & LGPD

Olá, Isa! Bem-vinda ao módulo de Autenticação Segura.
Neste material, vamos entender os bastidores de como protegemos os usuários do MoonFinance. 
A área de segurança (AppSec) é uma das mais importantes de um software, pois um erro aqui pode comprometer milhares de pessoas e empresas. 

Vamos aos conceitos práticos!

---

## 1. Por que NUNCA guardamos senhas em texto puro?

Imagine que o banco de dados do MoonFinance foi vazado (ninguém quer isso, mas trabalhamos com a pior hipótese!). Se as senhas estivessem salvas como "minhasenha123", o invasor teria acesso instantâneo a todas as contas. Pior: como as pessoas reutilizam senhas, o invasor também tentaria usar esse e-mail e senha no e-mail pessoal, redes sociais ou banco do cliente.

### A Solução: Hashes e Salts
Nós usamos a função `password_hash()` do PHP (que usa o algoritmo **Bcrypt** ou **Argon2**).
- **O que é um Hash?** É uma via de mão única. A senha "minhasenha123" vira algo como `$2y$10$wI/nQh...`. Não é possível pegar esse hash e "descriptografar" de volta para a senha.
- **O que é o Salt?** É um tempero aleatório adicionado à senha antes de gerar o hash. Se dois usuários tiverem a senha "123456", os hashes gerados serão completamente diferentes. Isso impede ataques de tabelas pré-computadas (Rainbow Tables).

Para verificar, usamos `password_verify($senhaDigitada, $hashSalvo)`, que faz a matemática por baixo dos panos para garantir a igualdade sem nunca revelar a senha.

---

## 2. O que são Timing Attacks (Ataques de Tempo)?

O *Timing Attack* é quando um invasor descobre informações preciosas medindo o **tempo de resposta** do nosso servidor.

**O cenário inseguro:**
Se alguém tenta fazer login com o e-mail `inexistente@email.com` e nosso código diz "E-mail não encontrado" instantaneamente (0.01 segundos).
Se depois ele tenta `priscila@moonfinanceme.com.br` e nosso código encontra o e-mail, vai até a validação da senha com o `password_verify` (que demora 0.20 segundos por ser um algoritmo pesado propositalmente). 

**A Brecha:**
Mesmo que a mensagem de erro final seja genérica ("Credenciais inválidas"), o invasor usará um robô para medir o tempo:
- Demorou 0.01s = E-mail NÃO existe na plataforma.
- Demorou 0.20s = E-mail EXISTE (eu só errei a senha).

A partir daí, ele pode descobrir quais e-mails estão cadastrados no MoonFinance e focar o ataque de força bruta apenas neles!

**A nossa solução:**
No `LoginController.php`, se o e-mail não existir no banco, nós não pulamos a etapa do hash! Nós rodamos o `password_verify()` em um hash falso criado por nós mesmos. Assim, independentemente do e-mail existir ou não, o tempo de resposta da nossa API sempre será aproximadamente o mesmo!

---

## 3. A LGPD e a "Pseudonimização"

A Lei Geral de Proteção de Dados (LGPD) diz que Logs de Auditoria do sistema também são dados sensíveis. Se nós guardamos logs como:
`[2026-08-26] IP 192.168.0.1 - priscila@moonfinanceme.com.br tentou fazer login 5x e falhou.`
Nós estamos espalhando informações pessoalmente identificáveis (PII) nas nossas tabelas de logs.

Se quisermos bloquear alguém por "Força Bruta" (várias tentativas erradas), nós precisamos contar essas tentativas no banco, mas como fazer isso sem salvar o e-mail?

**A Solução: Hash Pseudonimizado (O Segredo)**
Nós pegamos o E-mail e geramos um `hash_hmac('sha256')` usando um `SECRET_SALT` que só a nossa aplicação conhece.
O e-mail `priscila@moonfinanceme.com.br` vira algo como `anon_usr_7x9f2a89`.
Se alguém tentar invadir a conta da Priscila amanhã, o E-mail vai gerar exatamente esse mesmo `anon_usr_7x9f2a89` e nós saberemos que ele já tentou 5 vezes, bloqueando-o.

**Por que isso atende à LGPD?**
Se um desenvolvedor Júnior acessar o banco de logs, ele verá que `anon_usr_7x9f2a89` errou a senha 5 vezes, mas ele **NÃO SABERÁ** que esse código pertence à Priscila, pois ele não tem a chave secreta e o e-mail real não está escrito no log!

Legal, né? A segurança está nos detalhes! 🚀
