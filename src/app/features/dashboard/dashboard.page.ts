import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Painel administrativo</p>
          <h1 class="page-title">Dados mínimos para o WhatsApp virar pedido</h1>
          <p class="page-description">
            Cadastre empresa, unidade e catálogo na ordem abaixo para o backend validar mensagens com segurança.
          </p>
        </div>
      </header>

      <section class="card">
        <div class="section-heading">
          <div>
            <h2>Fluxo recomendado</h2>
            <p>Comece pelo contexto do negócio e avance para o catálogo da unidade.</p>
          </div>
        </div>

        <ol class="flow-list">
          <li><strong>Empresas</strong><span>Cadastre o tenant que será usado nas telas operacionais.</span></li>
          <li><strong>Unidades</strong><span>Vincule uma unidade à empresa e mantenha telefone/endereço.</span></li>
          <li><strong>Produtos</strong><span>Crie itens com código persistido, preço base e disponibilidade.</span></li>
          <li><strong>Ingredientes e opções</strong><span>Cadastre os itens que ajudam o backend a validar alterações do pedido.</span></li>
          <li><strong>Composição</strong><span>Relacione cada produto aos ingredientes removíveis e adicionais aplicáveis.</span></li>
        </ol>
      </section>
    </section>
  `
})
export class DashboardPage {}
