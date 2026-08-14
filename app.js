// ============================================================
//  CONFIGURAÇÃO — substitua pelos seus valores do Supabase
// ============================================================
const SUPABASE_URL = 'https://gjqmufgqkdcengursevi.supabase.co'
const SUPABASE_KEY = 'sb_publishable_a0OQA0T0LGcvipxLgEv4eg_ZBx_uI3R'
// Projeto Supabase: gjqmufgqkdcengursevi

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_KEY)

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let estado = {
  servico: null,
  dataObj: null,
  dataStr: '',
  horario: null,
  clienteId: null,
  clienteNome: '',
  clienteTel: '',
  mesAtual: new Date()
}

// Horários padrão do barbeiro
const HORARIOS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00']

// ============================================================
//  NAVEGAÇÃO
// ============================================================
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => irTela(btn.dataset.screen))
})

function irTela(tela) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
  document.getElementById('screen-' + tela).classList.add('active')
  const navBtn = document.querySelector(`.nav-btn[data-screen="${tela}"]`)
  if (navBtn) navBtn.classList.add('active')
}

// ============================================================
//  TELA AGENDAR — PASSO 1: SERVIÇOS
// ============================================================
async function carregarServicos() {
  const { data, error } = await db.from('servicos').select('*').eq('ativo', true).order('preco')
  if (error || !data) return

  const grid = document.getElementById('lista-servicos')
  grid.innerHTML = ''
  data.forEach(s => {
    const card = document.createElement('div')
    card.className = 'service-card'
    card.dataset.id = s.id
    card.innerHTML = `
      <div class="s-nome">${s.nome}</div>
      <div class="s-info">R$ ${Number(s.preco).toFixed(2).replace('.',',')} · ${s.duracao_min} min</div>
    `
    card.addEventListener('click', () => {
      document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'))
      card.classList.add('selected')
      estado.servico = s
      document.getElementById('erro-servico').style.display = 'none'
    })
    grid.appendChild(card)
  })
}

function irPasso(n) {
  if (n === 2) {
    if (!estado.servico) {
      document.getElementById('erro-servico').style.display = 'block'
      return
    }
  }
  if (n === 3) {
    if (!estado.dataStr) {
      alert('Selecione uma data.')
      return
    }
    if (!estado.horario) {
      document.getElementById('erro-slot').style.display = 'block'
      return
    }
    // montar resumo
    const d = new Date(estado.dataStr + 'T00:00:00')
    const dataFmt = d.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'long' })
    document.getElementById('resumo-agendamento').innerHTML = `
      <span>✂️ <strong>${estado.servico.nome}</strong></span>
      <span>📅 <strong>${dataFmt} às ${estado.horario}</strong></span>
      <span>💰 <strong>R$ ${Number(estado.servico.preco).toFixed(2).replace('.',',')}</strong></span>
    `
  }
  document.querySelectorAll('.passo').forEach(p => p.classList.remove('active'))
  document.getElementById('passo-' + n).classList.add('active')
}

// ============================================================
//  CALENDÁRIO
// ============================================================
function renderCalendario() {
  const mes = estado.mesAtual
  const hoje = new Date()
  hoje.setHours(0,0,0,0)

  const label = mes.toLocaleDateString('pt-BR', { month:'long', year:'numeric' })
  document.getElementById('mes-label').textContent = label.charAt(0).toUpperCase() + label.slice(1)

  const grid = document.getElementById('cal-grid')
  grid.innerHTML = ''

  const primeiroDia = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0)

  for (let i = 0; i < primeiroDia.getDay(); i++) {
    const vazio = document.createElement('div')
    vazio.className = 'cal-dia vazio'
    grid.appendChild(vazio)
  }

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const data = new Date(mes.getFullYear(), mes.getMonth(), d)
    const div = document.createElement('div')
    div.className = 'cal-dia'
    div.textContent = d

    const passado = data < hoje
    const domingo = data.getDay() === 0
    const dataStr = `${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

    if (passado || domingo) {
      div.classList.add('passado')
    } else {
      if (data.toDateString() === hoje.toDateString()) div.classList.add('hoje')
      if (estado.dataStr === dataStr) div.classList.add('selected')
      div.addEventListener('click', () => selecionarData(dataStr, div))
    }
    grid.appendChild(div)
  }
}

function mudarMes(dir) {
  estado.mesAtual = new Date(estado.mesAtual.getFullYear(), estado.mesAtual.getMonth() + dir, 1)
  renderCalendario()
}

async function selecionarData(dataStr, el) {
  document.querySelectorAll('.cal-dia').forEach(d => d.classList.remove('selected'))
  el.classList.add('selected')
  estado.dataStr = dataStr
  estado.horario = null

  // buscar horários ocupados
  const inicio = dataStr + 'T00:00:00'
  const fim = dataStr + 'T23:59:59'
  const { data: agendados } = await db
    .from('agendamentos')
    .select('data_hora')
    .gte('data_hora', inicio)
    .lte('data_hora', fim)
    .in('status', ['pendente','confirmado'])

  const ocupados = (agendados || []).map(a => a.data_hora.substring(11,16))

  const d = new Date(dataStr + 'T00:00:00')
  const dataFmt = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })
  document.getElementById('slots-titulo').textContent = `Horários disponíveis — ${dataFmt}`

  const lista = document.getElementById('lista-slots')
  lista.innerHTML = ''
  HORARIOS.forEach(h => {
    const slot = document.createElement('div')
    slot.className = 'slot' + (ocupados.includes(h) ? ' ocupado' : '')
    slot.textContent = h
    if (!ocupados.includes(h)) {
      slot.addEventListener('click', () => {
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'))
        slot.classList.add('selected')
        estado.horario = h
        document.getElementById('erro-slot').style.display = 'none'
      })
    }
    lista.appendChild(slot)
  })

  document.getElementById('slots-section').style.display = 'block'
}

// ============================================================
//  CONFIRMAR AGENDAMENTO
// ============================================================
async function confirmarAgendamento() {
  const nome = document.getElementById('input-nome').value.trim()
  const email = document.getElementById('input-email').value.trim()
  const tel = document.getElementById('input-tel').value.trim()

  let ok = true
  document.getElementById('erro-nome').style.display = nome ? 'none' : 'block'; if (!nome) ok = false
  document.getElementById('erro-email').style.display = (email && email.includes('@')) ? 'none' : 'block'; if (!email || !email.includes('@')) ok = false
  document.getElementById('erro-tel').style.display = (tel.length >= 8) ? 'none' : 'block'; if (tel.length < 8) ok = false
  if (!ok) return

  const btn = document.getElementById('btn-confirmar')
  btn.disabled = true
  btn.textContent = 'Salvando...'

  try {
    // upsert cliente pelo telefone
    let { data: clientes } = await db.from('clientes').select('id').eq('telefone', tel).limit(1)
    let clienteId

    if (clientes && clientes.length > 0) {
      clienteId = clientes[0].id
      await db.from('clientes').update({ nome, email }).eq('id', clienteId)
    } else {
      const { data: novo, error } = await db.from('clientes').insert({ nome, email, telefone: tel }).select('id').single()
      if (error) throw error
      clienteId = novo.id
    }

    // criar agendamento
    const dataHora = `${estado.dataStr}T${estado.horario}:00`
    const { error: errAg } = await db.from('agendamentos').insert({
      cliente_id: clienteId,
      servico_id: estado.servico.id,
      data_hora: dataHora,
      status: 'pendente'
    })
    if (errAg) throw errAg

    estado.clienteId = clienteId
    estado.clienteNome = nome
    estado.clienteTel = tel

    // montar preview do email
    const d = new Date(estado.dataStr + 'T00:00:00')
    const dataFmt = d.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'long' })
    document.getElementById('email-preview').innerHTML = `
      <strong>Para:</strong> ${email}<br>
      <strong>Assunto:</strong> Agendamento confirmado — Barbearia do Carlos<br><br>
      Olá <strong>${nome}</strong>! Seu agendamento foi confirmado para <strong>${dataFmt} às ${estado.horario}</strong>.<br>
      Serviço: ${estado.servico.nome} · R$ ${Number(estado.servico.preco).toFixed(2).replace('.',',')}.<br>
      <small style="color:#6b6560">Um lembrete será enviado 1 dia antes.</small>
    `
    irPasso(4)
  } catch (e) {
    alert('Erro ao salvar agendamento. Tente novamente.')
    console.error(e)
  } finally {
    btn.disabled = false
    btn.textContent = 'Confirmar agendamento'
  }
}

function novoAgendamento() {
  estado.servico = null
  estado.dataStr = ''
  estado.horario = null
  document.getElementById('input-nome').value = ''
  document.getElementById('input-email').value = ''
  document.getElementById('input-tel').value = ''
  document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'))
  document.getElementById('slots-section').style.display = 'none'
  irPasso(1)
}

// ============================================================
//  MEUS AGENDAMENTOS
// ============================================================
async function buscarMeusAgendamentos() {
  const tel = document.getElementById('login-tel').value.trim()
  const erro = document.getElementById('erro-login')
  if (tel.length < 8) { erro.style.display = 'block'; return }
  erro.style.display = 'none'

  const { data: clientes } = await db.from('clientes').select('*').eq('telefone', tel).limit(1)
  if (!clientes || clientes.length === 0) {
    erro.textContent = 'Telefone não encontrado. Verifique o número ou faça um agendamento.'
    erro.style.display = 'block'
    return
  }
  const cliente = clientes[0]

  // buscar agendamentos com serviço
  const { data: ags } = await db
    .from('agendamentos')
    .select('*, servicos(nome, preco, duracao_min)')
    .eq('cliente_id', cliente.id)
    .order('data_hora', { ascending: false })

  const agora = new Date()
  const proximos = (ags || []).filter(a => new Date(a.data_hora) >= agora)
  const historico = (ags || []).filter(a => new Date(a.data_hora) < agora)

  // avatar
  const iniciais = cliente.nome.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
  document.getElementById('client-avatar').textContent = iniciais
  document.getElementById('client-name').textContent = cliente.nome
  document.getElementById('client-phone').textContent = tel

  // renderizar listas
  renderListaAgendamentos('lista-proximos', proximos, false)
  renderListaAgendamentos('lista-historico', historico, true)

  document.getElementById('meus-login').style.display = 'none'
  document.getElementById('meus-lista').style.display = 'block'
}

function renderListaAgendamentos(containerId, lista, passado) {
  const el = document.getElementById(containerId)
  if (!lista.length) {
    el.innerHTML = `<p class="empty-msg">${passado ? 'Nenhum histórico ainda.' : 'Nenhum agendamento futuro.'}</p>`
    return
  }
  el.innerHTML = ''
  lista.forEach(ag => {
    const d = new Date(ag.data_hora)
    const dataFmt = d.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'long' })
    const hora = d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
    const badge = passado
      ? '<span class="badge badge-cinza">Concluído</span>'
      : (ag.status === 'confirmado'
        ? '<span class="badge badge-verde">Confirmado</span>'
        : '<span class="badge badge-amarelo">Pendente</span>')

    const card = document.createElement('div')
    card.className = 'appt-card' + (passado ? ' passado' : '')
    card.dataset.id = ag.id
    card.innerHTML = `
      <div class="appt-card-header">
        <div>
          <div class="appt-data">📅 ${dataFmt} · ${hora}</div>
          <div class="appt-local">Barbearia do Carlos</div>
        </div>
        ${badge}
      </div>
      <div class="appt-card-body">
        <div class="appt-servico">✂️ ${ag.servicos.nome} · ${ag.servicos.duracao_min} min</div>
        <div class="appt-preco">R$ ${Number(ag.servicos.preco).toFixed(2).replace('.',',')}</div>
      </div>
      ${!passado ? `
      <div class="appt-actions">
        <button class="btn-appt" onclick="abrirRemarcar('${ag.id}', this)">📆 Remarcar</button>
        <button class="btn-appt btn-appt-danger" onclick="abrirCancelar('${ag.id}', this)">✕ Cancelar</button>
      </div>
      <div class="cancel-box" id="cancel-${ag.id}" style="display:none">
        <p>⚠️ Confirma o cancelamento de ${dataFmt} às ${hora}?</p>
        <div class="cancel-box-btns">
          <button style="background:#fff;border:1px solid #e2ddd6;color:#6b6560;border-radius:8px" onclick="fecharCancelar('${ag.id}')">Não, voltar</button>
          <button style="background:#fdf0f0;border:1px solid #e8a0a0;color:#8b1a1a;border-radius:8px" onclick="cancelarAgendamento('${ag.id}')">Sim, cancelar</button>
        </div>
      </div>
      <div id="remarcar-${ag.id}" style="display:none;margin-top:10px;background:#f8f7f5;border-radius:10px;padding:12px;">
        <p style="font-size:13px;color:#6b6560;margin-bottom:8px;">Escolha um novo horário para ${dataFmt}:</p>
        <div class="slot-grid" id="slots-remarcar-${ag.id}"></div>
        <button class="btn-primary" style="margin-top:6px" onclick="confirmarRemarcar('${ag.id}', '${ag.data_hora.substring(0,10)}')">Confirmar novo horário</button>
      </div>
      ` : ''}
    `
    el.appendChild(card)
  })
}

function abrirCancelar(id) {
  document.getElementById('cancel-' + id).style.display = 'block'
  const remarcar = document.getElementById('remarcar-' + id)
  if (remarcar) remarcar.style.display = 'none'
}
function fecharCancelar(id) { document.getElementById('cancel-' + id).style.display = 'none' }

async function cancelarAgendamento(id) {
  await db.from('agendamentos').update({ status: 'cancelado' }).eq('id', id)
  document.getElementById('cancel-' + id).closest('.appt-card').remove()
  fecharCancelar(id)
}

async function abrirRemarcar(id, btn) {
  const box = document.getElementById('remarcar-' + id)
  if (box.style.display === 'block') { box.style.display = 'none'; return }
  document.getElementById('cancel-' + id).style.display = 'none'

  // pegar data do agendamento atual
  const { data: ag } = await db.from('agendamentos').select('data_hora').eq('id', id).single()
  const dataStr = ag.data_hora.substring(0,10)

  const { data: agendados } = await db
    .from('agendamentos')
    .select('data_hora')
    .gte('data_hora', dataStr + 'T00:00:00')
    .lte('data_hora', dataStr + 'T23:59:59')
    .in('status', ['pendente','confirmado'])
    .neq('id', id)

  const ocupados = (agendados || []).map(a => a.data_hora.substring(11,16))
  const lista = document.getElementById('slots-remarcar-' + id)
  lista.innerHTML = ''

  HORARIOS.forEach(h => {
    const slot = document.createElement('div')
    slot.className = 'slot' + (ocupados.includes(h) ? ' ocupado' : '')
    slot.textContent = h
    if (!ocupados.includes(h)) {
      slot.addEventListener('click', () => {
        lista.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'))
        slot.classList.add('selected')
      })
    }
    lista.appendChild(slot)
  })
  box.style.display = 'block'
}

async function confirmarRemarcar(id, dataStr) {
  const lista = document.getElementById('slots-remarcar-' + id)
  const selected = lista.querySelector('.slot.selected')
  if (!selected) { alert('Selecione um horário.'); return }

  const novaHora = `${dataStr}T${selected.textContent}:00`
  await db.from('agendamentos').update({ data_hora: novaHora, status: 'pendente' }).eq('id', id)
  document.getElementById('remarcar-' + id).style.display = 'none'
  alert(`Remarcado para ${selected.textContent}. Você receberá um email de confirmação.`)
  buscarMeusAgendamentos()
}

function sairMeus() {
  document.getElementById('meus-login').style.display = 'block'
  document.getElementById('meus-lista').style.display = 'none'
  document.getElementById('login-tel').value = ''
}

// Painel do barbeiro movido para barbeiro.html

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
carregarServicos()
renderCalendario()
