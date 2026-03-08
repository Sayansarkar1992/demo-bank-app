async function fetchWithAuth(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeaders()
    }
  });

  if (res.status === 401) {
    window.location.href = '/login.html';
    throw new Error('Unauthorized');
  }

  return res;
}

class InvestmentPill extends HTMLElement {
  static get observedAttributes() {
    return ['label', 'value'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const label = this.getAttribute('label') || '-';
    const value = this.getAttribute('value') || '-';
    this.shadowRoot.innerHTML = `
      <style>
        .pill {
          display: inline-flex;
          gap: 6px;
          padding: 4px 8px;
          border: 1px solid #d0daef;
          border-radius: 999px;
          background: #f4f7ff;
          font-size: 12px;
          margin-right: 6px;
          margin-bottom: 6px;
        }
        .label { color: #5f6778; }
        .value { font-weight: 600; color: #1f2a44; }
      </style>
      <span class="pill" data-testid="investment-pill-${label.toLowerCase().replace(/\s+/g, '-')}">
        <span class="label">${label}:</span>
        <span class="value">${value}</span>
      </span>
    `;
  }
}

class InvestmentProjectionWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.option = null;
  }

  set data(value) {
    this.option = value;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  async runProjection() {
    if (!this.option) return;
    const amountInput = this.shadowRoot.getElementById('amount');
    const yearsInput = this.shadowRoot.getElementById('years');
    const output = this.shadowRoot.getElementById('output');
    const amount = Number(amountInput.value);
    const years = Number(yearsInput.value);

    const res = await fetchWithAuth('/api/investments/calculator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        annualRatePct: this.option.expectedAnnualReturnPct,
        years
      })
    });

    const data = await res.json();
    if (!res.ok) {
      output.textContent = data.message || 'Unable to calculate.';
      output.className = 'output error';
      return;
    }

    output.textContent = `Projected: INR ${data.projection.projectedValue} | Gain: INR ${data.projection.projectedGain}`;
    output.className = 'output success';
  }

  render() {
    if (!this.shadowRoot) return;

    const defaultAmount = this.option ? this.option.minAmount : 1000;

    this.shadowRoot.innerHTML = `
      <style>
        .box {
          margin-top: 10px;
          padding: 10px;
          border: 1px solid #d5dff3;
          border-radius: 8px;
          background: #fbfdff;
        }
        .row {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 8px;
          align-items: end;
        }
        label {
          display: block;
          font-size: 12px;
          color: #667085;
          margin-bottom: 4px;
        }
        input {
          width: 100%;
          padding: 7px;
          border: 1px solid #cfd9ef;
          border-radius: 6px;
          font-size: 13px;
        }
        button {
          padding: 8px 10px;
          border: 0;
          border-radius: 6px;
          background: #0a66c2;
          color: #fff;
          cursor: pointer;
          white-space: nowrap;
        }
        .output {
          margin-top: 8px;
          font-size: 12px;
        }
        .success { color: #0f5132; }
        .error { color: #842029; }
      </style>
      <div class="box" data-testid="projection-widget">
        <div class="row">
          <div>
            <label>Amount</label>
            <input id="amount" type="number" value="${defaultAmount}" min="1" />
          </div>
          <div>
            <label>Years</label>
            <input id="years" type="number" value="3" min="1" max="40" />
          </div>
          <button id="calcBtn" type="button" data-testid="projection-calculate">Project</button>
        </div>
        <div id="output" class="output"></div>
      </div>
    `;

    this.shadowRoot.getElementById('calcBtn').addEventListener('click', () => {
      this.runProjection();
    });
  }
}

class InvestmentOptionCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.option = null;
  }

  set data(value) {
    this.option = value;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this.option) {
      this.shadowRoot.innerHTML = '';
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        .card {
          border: 1px solid #d7def0;
          border-radius: 10px;
          padding: 12px;
          background: #fff;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
        }
        h3 {
          margin: 0 0 4px;
          font-size: 16px;
        }
        .meta {
          color: #667085;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
          font-size: 13px;
        }
        .k { color: #667085; }
        .v { font-weight: 600; }
      </style>
      <article class="card" data-testid="investment-card-${this.option.id}">
        <h3>${this.option.name}</h3>
        <div class="meta">${this.option.type}</div>
        <investment-pill label="Risk" value="${this.option.risk}"></investment-pill>
        <investment-pill label="Expected Return" value="${this.option.expectedAnnualReturnPct}%"></investment-pill>
        <div class="grid">
          <div>
            <div class="k">Min Amount</div>
            <div class="v">INR ${this.option.minAmount}</div>
          </div>
          <div>
            <div class="k">Lock-in</div>
            <div class="v">${this.option.lockInMonths} months</div>
          </div>
          <div>
            <div class="k">Liquidity</div>
            <div class="v">${this.option.liquidity}</div>
          </div>
          <div>
            <div class="k">Tax</div>
            <div class="v">${this.option.taxTreatment}</div>
          </div>
        </div>
        <investment-projection-widget></investment-projection-widget>
      </article>
    `;

    const projection = this.shadowRoot.querySelector('investment-projection-widget');
    projection.data = this.option;
  }
}

class InvestmentApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    const valid = await ensureLoggedIn(true);
    if (!valid) return;
    this.renderShell();
    await this.loadData();
  }

  renderShell() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background: #f4f7fc;
          color: #101828;
          font-family: Arial, sans-serif;
        }
        .container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 14px;
        }
        .panel {
          background: #fff;
          border: 1px solid #d8dfef;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 12px;
        }
        .head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        h1, h2 { margin: 0 0 10px; }
        .muted { color: #667085; font-size: 13px; }
        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #cfd7ea;
          background: #eef3ff;
          text-decoration: none;
          color: #1b3558;
          font-size: 13px;
          cursor: pointer;
        }
        .btn.primary {
          border: 0;
          background: #0a66c2;
          color: #fff;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 10px;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }
        .metric {
          border: 1px solid #d6deee;
          border-radius: 8px;
          padding: 10px;
          background: #fbfcff;
        }
        .metric .k { color: #667085; font-size: 12px; }
        .metric .v { font-size: 16px; font-weight: 700; margin-top: 3px; }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .table th, .table td {
          border: 1px solid #d6dfef;
          padding: 8px;
          text-align: left;
        }
      </style>
      <div class="container" data-testid="investment-shadow-root">
        <section class="panel">
          <div class="head">
            <div>
              <h1>Investment</h1>
              <div class="muted">Realistic investment options rendered fully in Shadow DOM (with nested shadow widgets).</div>
            </div>
            <div class="actions">
              <a class="btn" href="/home.html">Back to Home</a>
              <button id="logoutBtn" class="btn primary" type="button">Logout</button>
            </div>
          </div>
        </section>

        <section class="panel" data-testid="investment-portfolio-panel">
          <h2>Portfolio Snapshot</h2>
          <div class="metrics" id="portfolioMetrics"></div>
          <table class="table" id="holdingsTable">
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Type</th>
                <th>Units</th>
                <th>Invested</th>
                <th>Current Value</th>
              </tr>
            </thead>
            <tbody id="holdingsBody"></tbody>
          </table>
        </section>

        <section class="panel" data-testid="investment-options-panel">
          <h2>Investment Options</h2>
          <div id="optionsGrid" class="grid"></div>
        </section>
      </div>
    `;

    this.shadowRoot.getElementById('logoutBtn').addEventListener('click', () => {
      clearSession();
      window.location.href = '/login.html';
    });
  }

  renderPortfolio(portfolio) {
    const metrics = [
      { k: 'Invested Amount', v: `INR ${portfolio.investedAmount}` },
      { k: 'Current Value', v: `INR ${portfolio.currentValue}` },
      { k: 'Profit / Loss', v: `INR ${portfolio.profitLoss}` },
      { k: 'XIRR', v: `${portfolio.xirrPct}%` }
    ];

    this.shadowRoot.getElementById('portfolioMetrics').innerHTML = metrics
      .map((item) => `<div class="metric"><div class="k">${item.k}</div><div class="v">${item.v}</div></div>`)
      .join('');

    this.shadowRoot.getElementById('holdingsBody').innerHTML = portfolio.holdings
      .map(
        (h) => `
        <tr data-testid="holding-${h.instrument.toLowerCase().replace(/\s+/g, '-')}">
          <td>${h.instrument}</td>
          <td>${h.type}</td>
          <td>${h.units}</td>
          <td>${h.invested}</td>
          <td>${h.currentValue}</td>
        </tr>
      `
      )
      .join('');
  }

  renderOptions(options) {
    const grid = this.shadowRoot.getElementById('optionsGrid');
    grid.innerHTML = '';
    options.forEach((option) => {
      const card = document.createElement('investment-option-card');
      card.data = option;
      grid.appendChild(card);
    });
  }

  async loadData() {
    const [portfolioRes, optionsRes] = await Promise.all([
      fetchWithAuth('/api/investments/portfolio'),
      fetchWithAuth('/api/investments/options')
    ]);

    const portfolio = await portfolioRes.json();
    const options = await optionsRes.json();

    this.renderPortfolio(portfolio);
    this.renderOptions(options.options || []);
  }
}

if (!customElements.get('investment-pill')) {
  customElements.define('investment-pill', InvestmentPill);
}

if (!customElements.get('investment-projection-widget')) {
  customElements.define('investment-projection-widget', InvestmentProjectionWidget);
}

if (!customElements.get('investment-option-card')) {
  customElements.define('investment-option-card', InvestmentOptionCard);
}

if (!customElements.get('investment-app')) {
  customElements.define('investment-app', InvestmentApp);
}
