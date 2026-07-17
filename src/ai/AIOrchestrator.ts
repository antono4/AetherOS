/**
 * Aether OS - AI Orchestrator
 * Intent parsing, component generation, and micro-tool assembly
 */

export interface Intent {
  action: string;
  entities: string[];
  context: Record<string, any>;
  confidence: number;
}

export interface MicroTool {
  id: string;
  type: 'calculator' | 'chart' | 'editor' | 'list' | 'search' | 'custom';
  title: string;
  content: string;
  data?: any;
  config?: Record<string, any>;
}

export interface AIConfig {
  apiKey?: string;
  provider?: 'openai' | 'anthropic' | 'gemini';
  fallbackEnabled?: boolean;
  timeout?: number;
}

type IntentCallback = (intent: Intent) => void;
type MicroToolCallback = (tool: MicroTool) => void;
type ErrorCallback = (error: Error) => void;

export class AIOrchestrator {
  private config: AIConfig;
  private intentPatterns: Map<RegExp, string> = new Map();
  private onIntentCallbacks: IntentCallback[] = [];
  private onMicroToolCallbacks: MicroToolCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];

  constructor(config: AIConfig = {}) {
    this.config = {
      provider: 'gemini',
      fallbackEnabled: true,
      timeout: 30000,
      ...config
    };
    
    this.initIntentPatterns();
  }

  private initIntentPatterns(): void {
    // Calculator patterns
    this.intentPatterns.set(
      /calculate|compute|sum|total|math|(\d+\s*[\+\-\*\/\^]\s*\d+)/gi,
      'calculate'
    );
    
    // Chart/visualization patterns
    this.intentPatterns.set(
      /chart|graph|plot|visualize|show.*trend|compare/i,
      'visualize'
    );
    
    // Search patterns
    this.intentPatterns.set(
      /search|find|lookup|where|locate|look.*up/i,
      'search'
    );
    
    // List patterns
    this.intentPatterns.set(
      /list|show.*all|display|enum|items|elements/i,
      'list'
    );
    
    // Edit patterns
    this.intentPatterns.set(
      /edit|modify|change|update|write|create.*new/i,
      'edit'
    );
    
    // Analysis patterns
    this.intentPatterns.set(
      /analyze|analyse|insights|summary|report/i,
      'analyze'
    );
    
    // Project patterns
    this.intentPatterns.set(
      /project|budget|expense|spending|cost/i,
      'project'
    );
  }

  public onIntent(callback: IntentCallback): void {
    this.onIntentCallbacks.push(callback);
  }

  public onMicroTool(callback: MicroToolCallback): void {
    this.onMicroToolCallbacks.push(callback);
  }

  public onError(callback: ErrorCallback): void {
    this.onErrorCallbacks.push(callback);
  }

  private emitError(error: Error): void {
    this.onErrorCallbacks.forEach(cb => cb(error));
  }

  private emitIntent(intent: Intent): void {
    this.onIntentCallbacks.forEach(cb => cb(intent));
  }

  private emitMicroTool(tool: MicroTool): void {
    this.onMicroToolCallbacks.forEach(cb => cb(tool));
  }

  /**
   * Parse user input and extract intent
   */
  public parseIntent(input: string): Intent {
    const entities: string[] = [];
    const context: Record<string, any> = {};
    
    // Extract numbers
    const numbers = input.match(/\d+\.?\d*/g);
    if (numbers) {
      context.numbers = numbers.map(n => parseFloat(n));
    }
    
    // Extract quoted strings
    const quoted = input.match(/"([^"]+)"|'([^']+)'/g);
    if (quoted) {
      entities.push(...quoted.map(s => s.replace(/['"]/g, '')));
    }
    
    // Extract keywords
    const keywords = input.match(/\b\w+\b/g);
    if (keywords) {
      entities.push(...keywords.filter(w => w.length > 3));
    }
    
    // Determine action
    let action = 'unknown';
    let maxConfidence = 0;
    
    this.intentPatterns.forEach((patternAction, pattern) => {
      if (pattern.test(input)) {
        const confidence = this.calculateConfidence(input, patternAction);
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          action = patternAction;
        }
      }
    });
    
    // Special handling for complex intents
    if (input.includes('project') && (input.includes('expense') || input.includes('budget'))) {
      action = 'project_expense';
      maxConfidence = 0.9;
    }
    
    return {
      action,
      entities,
      context,
      confidence: maxConfidence
    };
  }

  private calculateConfidence(input: string, action: string): number {
    const words = input.toLowerCase().split(/\s+/);
    const actionWords = action.toLowerCase().split('_');
    
    let matches = 0;
    actionWords.forEach(aw => {
      if (words.some(w => w.includes(aw))) matches++;
    });
    
    return matches / actionWords.length;
  }

  /**
   * Generate micro-tool based on intent
   */
  public async generateMicroTool(intent: Intent): Promise<MicroTool> {
    this.emitIntent(intent);
    
    try {
      const tool = await this.createMicroTool(intent);
      this.emitMicroTool(tool);
      return tool;
    } catch (error) {
      this.emitError(error as Error);
      
      if (this.config.fallbackEnabled) {
        return this.createFallbackTool(intent);
      }
      
      throw error;
    }
  }

  /**
   * Process user input and generate micro-tool
   */
  public async process(input: string): Promise<MicroTool> {
    const intent = this.parseIntent(input);
    return this.generateMicroTool(intent);
  }

  private async createMicroTool(intent: Intent): Promise<MicroTool> {
    // Simulate API call delay
    await this.simulateDelay(500);
    
    switch (intent.action) {
      case 'calculate':
        return this.createCalculatorTool(intent);
      case 'visualize':
        return this.createChartTool(intent);
      case 'project_expense':
        return this.createExpenseTrackerTool(intent);
      case 'analyze':
        return this.createAnalyzerTool(intent);
      case 'search':
        return this.createSearchTool(intent);
      case 'list':
        return this.createListTool(intent);
      case 'edit':
        return this.createEditorTool(intent);
      default:
        return this.createGenericTool(intent);
    }
  }

  private createCalculatorTool(intent: Intent): MicroTool {
    const numbers = intent.context.numbers || [0, 0];
    const html = `
      <div class="calculator-tool">
        <style>
          .calculator-tool {
            font-family: 'JetBrains Mono', monospace;
          }
          .calc-display {
            background: rgba(0,0,0,0.4);
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            text-align: right;
            font-size: 24px;
            color: #00f5ff;
          }
          .calc-buttons {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .calc-btn {
            padding: 14px;
            border: none;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: #fff;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .calc-btn:hover {
            background: rgba(0,245,255,0.2);
          }
          .calc-btn.operator {
            background: rgba(139,92,246,0.3);
          }
        </style>
        <div class="calc-display" id="calcDisplay">0</div>
        <div class="calc-buttons">
          <button class="calc-btn" onclick="this.textContent='7';updateCalc(7)">7</button>
          <button class="calc-btn" onclick="this.textContent='8';updateCalc(8)">8</button>
          <button class="calc-btn" onclick="this.textContent='9';updateCalc(9)">9</button>
          <button class="calc-btn operator" onclick="setOp('/')">/</button>
          <button class="calc-btn" onclick="this.textContent='4';updateCalc(4)">4</button>
          <button class="calc-btn" onclick="this.textContent='5';updateCalc(5)">5</button>
          <button class="calc-btn" onclick="this.textContent='6';updateCalc(6)">6</button>
          <button class="calc-btn operator" onclick="setOp('*')">×</button>
          <button class="calc-btn" onclick="this.textContent='1';updateCalc(1)">1</button>
          <button class="calc-btn" onclick="this.textContent='2';updateCalc(2)">2</button>
          <button class="calc-btn" onclick="this.textContent='3';updateCalc(3)">3</button>
          <button class="calc-btn operator" onclick="setOp('-')">−</button>
          <button class="calc-btn" onclick="this.textContent='0';updateCalc(0)">0</button>
          <button class="calc-btn" onclick="this.textContent='.';updateCalc('.')">.</button>
          <button class="calc-btn operator" onclick="calculate()">=</button>
          <button class="calc-btn operator" onclick="setOp('+')">+</button>
        </div>
        <script>
          let calcVal = '';
          let calcOp = null;
          let calcPrev = '';
          function updateCalc(v) { calcVal += v; document.getElementById('calcDisplay').textContent = calcVal; }
          function setOp(op) { calcPrev = calcVal; calcOp = op; calcVal = ''; }
          function calculate() {
            try {
              const result = eval(calcPrev + calcOp + calcVal);
              document.getElementById('calcDisplay').textContent = result;
              calcVal = result;
            } catch(e) { document.getElementById('calcDisplay').textContent = 'Error'; }
          }
        </script>
      </div>
    `;

    return {
      id: `tool-calc-${Date.now()}`,
      type: 'calculator',
      title: 'Calculator',
      content: html,
      data: { numbers }
    };
  }

  private createChartTool(intent: Intent): MicroTool {
    const html = `
      <div class="chart-tool">
        <style>
          .chart-tool canvas { max-width: 100%; }
          .chart-legend { display: flex; gap: 16px; margin-top: 12px; font-size: 12px; }
          .legend-item { display: flex; align-items: center; gap: 6px; }
          .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
        </style>
        <canvas id="chartCanvas" width="350" height="200"></canvas>
        <div class="chart-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#00f5ff"></div>Revenue</div>
          <div class="legend-item"><div class="legend-dot" style="background:#ff00ff"></div>Expenses</div>
        </div>
        <script>
          const ctx = document.getElementById('chartCanvas').getContext('2d');
          const data = [65, 45, 80, 55, 90, 70, 85];
          const data2 = [40, 55, 35, 60, 45, 75, 50];
          const maxVal = 100;
          const barWidth = 350 / data.length - 10;
          
          ctx.fillStyle = 'rgba(0,245,255,0.8)';
          data.forEach((v, i) => {
            ctx.fillRect(i * (barWidth + 10) + 5, 200 - v * 2, barWidth, v * 2);
          });
          
          ctx.fillStyle = 'rgba(255,0,255,0.8)';
          data2.forEach((v, i) => {
            ctx.fillRect(i * (barWidth + 10) + 5 + barWidth/2, 200 - v * 2, barWidth/2, v * 2);
          });
        </script>
      </div>
    `;

    return {
      id: `tool-chart-${Date.now()}`,
      type: 'chart',
      title: 'Data Visualization',
      content: html
    };
  }

  private createExpenseTrackerTool(intent: Intent): MicroTool {
    const html = `
      <div class="expense-tracker">
        <style>
          .expense-tracker { font-family: 'Inter', sans-serif; }
          .expense-input { display: flex; gap: 8px; margin-bottom: 16px; }
          .expense-input input { flex: 1; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; }
          .expense-list { max-height: 200px; overflow-y: auto; }
          .expense-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .expense-item.negative { color: #ff6b6b; }
          .expense-item.positive { color: #4ade80; }
          .expense-total { padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-top: 12px; display: flex; justify-content: space-between; font-weight: 600; }
        </style>
        <div class="expense-input">
          <input type="text" placeholder="Description" id="expDesc">
          <input type="number" placeholder="Amount" id="expAmount" style="width:100px">
          <button onclick="addExpense()" style="padding:10px 16px;background:linear-gradient(135deg,#00f5ff,#8b5cf6);border:none;border-radius:6px;color:#0a0a0f;cursor:pointer;font-weight:600;">+</button>
        </div>
        <div class="expense-list" id="expList"></div>
        <div class="expense-total">
          <span>Total:</span>
          <span id="expTotal">$0.00</span>
        </div>
        <script>
          let expenses = [];
          function addExpense() {
            const desc = document.getElementById('expDesc').value;
            const amount = parseFloat(document.getElementById('expAmount').value);
            if (desc && amount) {
              expenses.push({ desc, amount });
              renderExpenses();
              document.getElementById('expDesc').value = '';
              document.getElementById('expAmount').value = '';
            }
          }
          function renderExpenses() {
            const list = document.getElementById('expList');
            list.innerHTML = expenses.map((e, i) => 
              '<div class="expense-item ' + (e.amount < 0 ? 'negative' : 'positive') + '">' +
              '<span>' + e.desc + '</span><span>$' + Math.abs(e.amount).toFixed(2) + '</span></div>'
            ).join('');
            const total = expenses.reduce((sum, e) => sum + e.amount, 0);
            document.getElementById('expTotal').textContent = '$' + total.toFixed(2);
          }
        </script>
      </div>
    `;

    return {
      id: `tool-expense-${Date.now()}`,
      type: 'calculator',
      title: 'Project Expense Tracker',
      content: html,
      config: { entity: intent.entities.join(' ') }
    };
  }

  private createAnalyzerTool(intent: Intent): MicroTool {
    return {
      id: `tool-analyze-${Date.now()}`,
      type: 'custom',
      title: 'AI Analyzer',
      content: `
        <div class="analyzer-tool">
          <style>
            .analyzer-tool { text-align: center; padding: 20px; }
            .analyzer-icon { font-size: 48px; margin-bottom: 16px; }
            .analyzer-status { color: #a0a0b0; margin-bottom: 16px; }
            .analyzer-results { text-align: left; }
            .insight { padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #00f5ff; }
            .insight-title { font-weight: 600; color: #fff; margin-bottom: 4px; }
            .insight-text { color: #a0a0b0; font-size: 12px; }
          </style>
          <div class="analyzer-icon">🧠</div>
          <div class="analyzer-status">Analyzing your data...</div>
          <div class="analyzer-results">
            <div class="insight">
              <div class="insight-title">Key Finding #1</div>
              <div class="insight-text">Based on the input patterns, significant opportunities for optimization detected.</div>
            </div>
            <div class="insight">
              <div class="insight-title">Recommendation</div>
              <div class="insight-text">Consider reallocating resources to improve efficiency by approximately 23%.</div>
            </div>
          </div>
        </div>
      `
    };
  }

  private createSearchTool(intent: Intent): MicroTool {
    return {
      id: `tool-search-${Date.now()}`,
      type: 'search',
      title: 'Smart Search',
      content: `
        <div class="search-tool">
          <style>
            .search-tool input { width: 100%; padding: 14px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,245,255,0.3); border-radius: 10px; color: #fff; font-size: 14px; outline: none; }
            .search-results { margin-top: 12px; }
            .search-result { padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
            .search-result:hover { background: rgba(0,245,255,0.1); }
            .result-title { color: #00f5ff; font-weight: 500; margin-bottom: 4px; }
            .result-snippet { color: #a0a0b0; font-size: 12px; }
          </style>
          <input type="text" placeholder="Search anything..." id="searchInput">
          <div class="search-results" id="searchResults"></div>
          <script>
            document.getElementById('searchInput').oninput = function() {
              const q = this.value;
              if (q.length > 2) {
                document.getElementById('searchResults').innerHTML = '<div class="search-result"><div class="result-title">Searching for: ' + q + '</div><div class="result-snippet">Press Enter to search across all memory nodes</div></div>';
              }
            };
          </script>
        </div>
      `
    };
  }

  private createListTool(intent: Intent): MicroTool {
    return {
      id: `tool-list-${Date.now()}`,
      type: 'list',
      title: 'Item List',
      content: `
        <div class="list-tool">
          <style>
            .list-tool input { width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; margin-bottom: 12px; }
            .list-items { list-style: none; padding: 0; margin: 0; }
            .list-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; margin-bottom: 6px; }
            .list-item:hover { background: rgba(139,92,246,0.2); }
          </style>
          <input type="text" placeholder="Add new item..." id="listInput">
          <ul class="list-items" id="listItems"></ul>
          <script>
            document.getElementById('listInput').onkeypress = function(e) {
              if (e.key === 'Enter' && this.value) {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.innerHTML = '<span>' + this.value + '</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:#ff6b6b;cursor:pointer;">×</button>';
                document.getElementById('listItems').appendChild(li);
                this.value = '';
              }
            };
          </script>
        </div>
      `
    };
  }

  private createEditorTool(intent: Intent): MicroTool {
    return {
      id: `tool-editor-${Date.now()}`,
      type: 'editor',
      title: 'Text Editor',
      content: `
        <div class="editor-tool">
          <style>
            .editor-tool textarea { width: 100%; min-height: 150px; padding: 12px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e0e0e0; font-family: 'JetBrains Mono', monospace; font-size: 13px; resize: vertical; outline: none; }
            .editor-tool textarea:focus { border-color: rgba(0,245,255,0.5); }
          </style>
          <textarea placeholder="Start typing..." id="editorText"></textarea>
        </div>
      `
    };
  }

  private createGenericTool(intent: Intent): MicroTool {
    return {
      id: `tool-generic-${Date.now()}`,
      type: 'custom',
      title: 'Quick Action',
      content: `
        <div class="generic-tool" style="text-align:center;padding:24px;">
          <div style="font-size:32px;margin-bottom:12px;">✨</div>
          <p style="color:#a0a0b0;">I understand you want to: <strong style="color:#fff;">${intent.action}</strong></p>
          <p style="color:#606070;font-size:12px;margin-top:12px;">Confidence: ${(intent.confidence * 100).toFixed(0)}%</p>
        </div>
      `
    };
  }

  private createFallbackTool(intent: Intent): MicroTool {
    return {
      id: `tool-fallback-${Date.now()}`,
      type: 'custom',
      title: 'Fallback Action',
      content: `
        <div class="fallback-tool" style="padding:24px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
          <p style="color:#ff6b6b;font-weight:600;">AI Processing Unavailable</p>
          <p style="color:#a0a0b0;font-size:12px;margin-top:8px;">Using offline fallback mode</p>
          <button onclick="window.location.reload()" style="margin-top:16px;padding:10px 20px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:#fff;cursor:pointer;">Retry</button>
        </div>
      `
    };
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
