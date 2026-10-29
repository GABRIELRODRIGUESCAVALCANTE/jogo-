'use strict';
/* Estrela do Sertão — API de contas, progresso na nuvem e ranking mundial, sobre PostgreSQL.
   Variáveis de ambiente:
     DATABASE_URL   endereço do PostgreSQL (obrigatório)
     SEGREDO_TOKEN  segredo para assinar os tokens de sessão (obrigatório em produção, 32+ caracteres)
     ORIGENS        endereços que podem chamar a API, separados por vírgula (ex.: https://usuario.github.io)
     PORT           porta HTTP (padrão 8787)
     PGSSL=1        conexão com o banco por SSL (bancos hospedados costumam exigir) */
const http = require('node:http');
const crypto = require('node:crypto');
const { Pool } = require('pg');
const { mesclarProgresso } = require('./mesclar');

const TOTAL_FASES = 4;
const FASE_DESAFIO = 5;          // o Desafio dos Chefes tem recorde e ranking como se fosse a fase 5
const DIFICULDADES = ['facil','normal','dificil'];
const PERSONAGENS = ['ze','luzia','tiao','rosa','calango','mandacaru','carcara','raio'];
const DIAS_TOKEN = 30;
const { TEMPO_MINIMO } = require('./regras');
const FOLGA_RELOGIO = 5;     // segundos de diferença aceitos entre o relógio do jogo e o do servidor
const DIAS_PARTIDA = 30;     // partidas mais velhas que isso não valem mais

/* ---------- senhas e tokens ---------- */
function hashSenha(senha){
  const sal = crypto.randomBytes(16);
  const hash = crypto.scryptSync(senha, sal, 64, { N:16384, r:8, p:1 });
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`;
}
function confereSenha(senha, guardado){
  const [tipo, sal, hash] = String(guardado).split('$');
  if(tipo!=='scrypt' || !sal || !hash) return false;
  const calc = crypto.scryptSync(senha, Buffer.from(sal,'hex'), 64, { N:16384, r:8, p:1 });
  const esperado = Buffer.from(hash,'hex');
  return esperado.length===calc.length && crypto.timingSafeEqual(esperado, calc);
}
const b64 = b => Buffer.from(b).toString('base64url');
function assinar(segredo, conteudo){ return crypto.createHmac('sha256', segredo).update(conteudo).digest('base64url'); }
function criarToken(segredo, contaId){
  const corpo = b64(JSON.stringify({ id:contaId, exp:Date.now()+DIAS_TOKEN*864e5 }));
  return `${corpo}.${assinar(segredo, corpo)}`;
}
function lerToken(segredo, token){
  const [corpo, assinatura] = String(token||'').split('.');
  if(!corpo || !assinatura) return null;
  const certa = assinar(segredo, corpo);
  if(certa.length!==assinatura.length || !crypto.timingSafeEqual(Buffer.from(certa), Buffer.from(assinatura))) return null;
  try{ const d = JSON.parse(Buffer.from(corpo,'base64url').toString()); return d.exp>Date.now() && Number.isInteger(d.id) ? d.id : null; }catch(e){ return null; }
}

/* ---------- validação ---------- */
const emailValido = e => typeof e==='string' && e.length<=200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const nomeLimpo = n => typeof n==='string' ? n.trim().replace(/\s+/g,' ') : '';

class ErroApi extends Error { constructor(status, codigo){ super(codigo); this.status=status; this.codigo=codigo; } }

/* ---------- servidor ---------- */
function criarServidor({ pool, segredo, origens=['*'] }){
  const tentativas = new Map();   // limite de logins e cadastros por IP: 20 a cada 10 minutos
  function limitar(ip){
    const agora = Date.now(), lista = (tentativas.get(ip)||[]).filter(t=>agora-t<600000);
    if(lista.length>=20) throw new ErroApi(429,'muitas_tentativas');
    lista.push(agora); tentativas.set(ip, lista);
  }
  async function lerCorpo(req){
    let tamanho=0; const partes=[];
    for await (const parte of req){ tamanho+=parte.length; if(tamanho>65536) throw new ErroApi(413,'dados_invalidos'); partes.push(parte); }
    if(!partes.length) return {};
    try{ return JSON.parse(Buffer.concat(partes).toString()); }catch(e){ throw new ErroApi(400,'dados_invalidos'); }
  }
  const contaDoPedido = req => lerToken(segredo, (req.headers.authorization||'').replace(/^Bearer /,''));
  function exigirConta(req){ const id=contaDoPedido(req); if(!id) throw new ErroApi(401,'nao_autorizado'); return id; }
  const resposta = (conta, token) => ({ token, conta:{ id:conta.id, nome:conta.nome, email:conta.email } });

  const rotas = {
    'GET /api/saude': async()=>({ ok:true }),

    'POST /api/contas': async(req, ip)=>{
      limitar(ip);
      const c = await lerCorpo(req);
      return criarConta(c.email, c.senha, nomeLimpo(c.nome));
    },
    'POST /api/sessoes': async(req, ip)=>{
      limitar(ip);
      const { email, senha } = await lerCorpo(req);
      if(!emailValido(email) || typeof senha!=='string') throw new ErroApi(401,'login_invalido');
      const { rows } = await pool.query('select id, nome, email, senha_hash from contas where lower(email)=lower($1)', [email]);
      if(!rows[0] || !confereSenha(senha, rows[0].senha_hash)) throw new ErroApi(401,'login_invalido');
      return resposta(rows[0], criarToken(segredo, Number(rows[0].id)));
    },
    'DELETE /api/contas': async(req)=>{
      const id = exigirConta(req);
      await pool.query('delete from contas where id=$1', [id]);
      return null;
    },

    'GET /api/progresso': async(req)=>{
      const id = exigirConta(req);
      const { rows } = await pool.query('select dados, atualizado_em from progresso where conta_id=$1', [id]);
      return rows[0] ? { dados:rows[0].dados, atualizado:rows[0].atualizado_em } : { dados:null, atualizado:null };
    },
    // junta com o que já está guardado (outro aparelho pode ter jogado offline) e devolve o resultado
    'PUT /api/progresso': async(req)=>{
      const id = exigirConta(req), { dados } = await lerCorpo(req);
      if(!dados || typeof dados!=='object' || Array.isArray(dados) || JSON.stringify(dados).length>32768) throw new ErroApi(400,'dados_invalidos');
      const cliente = await pool.connect();
      try{
        await cliente.query('begin');
        await cliente.query('insert into progresso (conta_id) values ($1) on conflict do nothing', [id]);
        const atual = (await cliente.query('select dados from progresso where conta_id=$1 for update', [id])).rows[0].dados;
        const junto = mesclarProgresso(dados, atual||{});
        if(JSON.stringify(junto).length>32768) throw new ErroApi(400,'dados_invalidos');
        const { rows } = await cliente.query('update progresso set dados=$2, atualizado_em=now() where conta_id=$1 returning atualizado_em', [id, junto]);
        await cliente.query('commit');
        return { dados:junto, atualizado:rows[0].atualizado_em };
      }catch(e){ await cliente.query('rollback'); throw e; }
      finally{ cliente.release(); }
    },

    'POST /api/partidas': async(req)=>{
      const id = exigirConta(req), r = await lerCorpo(req), fase = Number(r.fase);
      if(!Number.isInteger(fase) || fase<1 || fase>FASE_DESAFIO || !DIFICULDADES.includes(r.dificuldade)) throw new ErroApi(400,'dados_invalidos');
      await pool.query(`delete from partidas where conta_id=$1 and iniciada_em < now() - interval '${DIAS_PARTIDA} days'`, [id]);
      const { rows } = await pool.query('insert into partidas (conta_id, fase, dificuldade) values ($1,$2,$3) returning id', [id, fase, r.dificuldade]);
      return { partida:String(rows[0].id) };
    },

    'POST /api/recordes': async(req)=>{
      const id = exigirConta(req), r = await lerCorpo(req);
      const fase = Number(r.fase), tempo = Number(r.tempo);
      if(!Number.isInteger(fase) || fase<1 || fase>FASE_DESAFIO || !DIFICULDADES.includes(r.dificuldade) || !PERSONAGENS.includes(r.personagem)
        || !(tempo>=1 && tempo<=36000) || (r.chapeu!=null && (typeof r.chapeu!=='string' || r.chapeu.length>16))) throw new ErroApi(400,'dados_invalidos');
      if(tempo<TEMPO_MINIMO[fase]) throw new ErroApi(400,'tempo_impossivel');
      // a partida precisa ter começado no servidor há pelo menos esse tempo; cada partida vale um recorde só
      const { rows:[partida] } = await pool.query(
        `delete from partidas where id=$1 and conta_id=$2 and fase=$3 and dificuldade=$4
           and iniciada_em > now() - interval '${DIAS_PARTIDA} days'
         returning extract(epoch from now()-iniciada_em) as decorrido`, [/^\d{1,18}$/.test(String(r.partida)) ? String(r.partida) : '0', id, fase, r.dificuldade]);
      if(!partida) throw new ErroApi(400,'partida_invalida');
      if(tempo > Number(partida.decorrido)+FOLGA_RELOGIO) throw new ErroApi(400,'tempo_impossivel');
      // guarda só se for o melhor tempo dessa conta nessa fase e dificuldade
      const { rows } = await pool.query(
        `insert into recordes (conta_id, fase, dificuldade, personagem, chapeu, tempo) values ($1,$2,$3,$4,$5,$6)
         on conflict (conta_id, fase, dificuldade) do update
           set tempo=excluded.tempo, personagem=excluded.personagem, chapeu=excluded.chapeu, registrado_em=now()
           where excluded.tempo < recordes.tempo
         returning tempo`, [id, fase, r.dificuldade, r.personagem, r.chapeu||null, tempo]);
      if(rows[0]) return { tempo:rows[0].tempo, novo:true };
      const atual = await pool.query('select tempo from recordes where conta_id=$1 and fase=$2 and dificuldade=$3', [id, fase, r.dificuldade]);
      return { tempo:atual.rows[0].tempo, novo:false };
    },
    'GET /api/ranking': async(req)=>{
      const url = new URL(req.url, 'http://x'), fase = url.searchParams.get('fase'), dificuldade = url.searchParams.get('dificuldade');
      if(!DIFICULDADES.includes(dificuldade) || !(fase==='jornada' || /^[1-5]$/.test(fase||''))) throw new ErroApi(400,'dados_invalidos');
      const eu = contaDoPedido(req);
      const { rows } = fase==='jornada'
        ? await pool.query(
            `select c.id, c.nome, sum(r.tempo) as tempo,
                    (array_agg(r.personagem order by r.fase desc))[1] as personagem, (array_agg(r.chapeu order by r.fase desc))[1] as chapeu
               from recordes r join contas c on c.id=r.conta_id
              where r.dificuldade=$1 and r.fase<=$2 group by c.id, c.nome having count(*)=$2 order by tempo asc limit 10`, [dificuldade, TOTAL_FASES])
        : await pool.query(
            `select c.id, c.nome, r.tempo, r.personagem, r.chapeu from recordes r join contas c on c.id=r.conta_id
              where r.fase=$1 and r.dificuldade=$2 order by r.tempo asc, r.registrado_em asc limit 10`, [Number(fase), dificuldade]);
      return { linhas: rows.map(l=>({ nome:l.nome, personagem:l.personagem, chapeu:l.chapeu, tempo:Number(l.tempo), eu:eu!==null && Number(l.id)===eu })) };
    },
  };

  async function criarConta(email, senha, nome){
    if(!emailValido(email)) throw new ErroApi(400,'email_invalido');
    if(typeof senha!=='string' || senha.length<6 || senha.length>200) throw new ErroApi(400,'senha_curta');
    if(!nome || nome.length>16) throw new ErroApi(400,'nome_invalido');
    try{
      const { rows } = await pool.query('insert into contas (email, nome, senha_hash) values ($1,$2,$3) returning id, nome, email', [email.trim(), nome, hashSenha(senha)]);
      return resposta(rows[0], criarToken(segredo, Number(rows[0].id)));
    }catch(e){ if(e.code==='23505') throw new ErroApi(409,'email_em_uso'); throw e; }
  }

  function cors(req, res){
    const origem = req.headers.origin;
    if(origens.includes('*')) res.setHeader('Access-Control-Allow-Origin','*');
    else if(origem && origens.includes(origem)){ res.setHeader('Access-Control-Allow-Origin', origem); res.setHeader('Vary','Origin'); }
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age','86400');
  }
  return http.createServer(async(req, res)=>{
    cors(req, res);
    if(req.method==='OPTIONS'){ res.writeHead(204); return res.end(); }
    const rota = rotas[`${req.method} ${req.url.split('?')[0]}`];
    const ip = (req.headers['x-forwarded-for']||'').split(',')[0].trim() || req.socket.remoteAddress;
    try{
      if(!rota) throw new ErroApi(404,'nao_encontrado');
      const dados = await rota(req, ip);
      if(dados===null){ res.writeHead(204); return res.end(); }
      res.writeHead(200, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(dados));
    }catch(e){
      const status = e instanceof ErroApi ? e.status : 500;
      if(status===500) console.error(e);
      res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify({ erro: e instanceof ErroApi ? e.codigo : 'erro_interno' }));
    }
  });
}

module.exports = { criarServidor, hashSenha, confereSenha, criarToken, lerToken };

if(require.main===module){
  if(!process.env.DATABASE_URL){ console.error('Defina DATABASE_URL.'); process.exit(1); }
  const segredo = process.env.SEGREDO_TOKEN;
  if(!segredo || segredo.length<32){
    if(process.env.NODE_ENV==='production'){ console.error('Defina SEGREDO_TOKEN com pelo menos 32 caracteres.'); process.exit(1); }
    console.warn('Aviso: usando um segredo de desenvolvimento. Defina SEGREDO_TOKEN em produção.');
  }
  const pool = new Pool({ connectionString:process.env.DATABASE_URL, ssl:process.env.PGSSL==='1' ? true : undefined });
  const origens = (process.env.ORIGENS||'*').split(',').map(s=>s.trim()).filter(Boolean);
  const porta = Number(process.env.PORT)||8787;
  criarServidor({ pool, segredo: segredo || 'segredo-de-desenvolvimento-nao-use-em-producao', origens })
    .listen(porta, ()=>console.log(`API do Estrela do Sertão na porta ${porta}`));
}
