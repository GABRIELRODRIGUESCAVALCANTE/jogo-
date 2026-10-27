-- Estrela do Sertão — esquema do PostgreSQL (versão 16 ou mais nova).
-- Pode rodar várias vezes: só cria o que ainda não existe.

create table if not exists contas (
  id          bigserial primary key,
  email       text not null,
  nome        text not null check (char_length(nome) between 1 and 16),
  senha_hash  text not null,                       -- scrypt$sal$hash, nunca a senha
  criada_em   timestamptz not null default now()
);
create unique index if not exists contas_email_unico on contas (lower(email));

-- progresso do jogador (fases, cordéis, conquistas, visual...) guardado como JSON
create table if not exists progresso (
  conta_id       bigint primary key references contas(id) on delete cascade,
  dados          jsonb not null default '{}'::jsonb,
  atualizado_em  timestamptz not null default now()
);

-- melhor tempo de cada conta por fase e dificuldade
create table if not exists recordes (
  conta_id       bigint not null references contas(id) on delete cascade,
  fase           smallint not null check (fase between 1 and 4),
  dificuldade    text not null check (dificuldade in ('facil','normal','dificil')),
  personagem     text not null check (char_length(personagem) <= 16),
  chapeu         text check (char_length(chapeu) <= 16),
  tempo          real not null check (tempo between 15 and 36000),
  registrado_em  timestamptz not null default now(),
  primary key (conta_id, fase, dificuldade)
);
create index if not exists recordes_ranking on recordes (fase, dificuldade, tempo);
