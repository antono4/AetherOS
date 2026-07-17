/**
 * Aether OS - Glassmorphism UI Components
 * Liquid Node Panels with Dark Glassmorphism Design
 */

export interface PanelConfig {
  id: string;
  title?: string;
  content?: string;
  width?: number;
  height?: number;
  position?: { x: number; y: number };
  color?: string;
  opacity?: number;
  closable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
}

export class LiquidPanel {
  public id: string;
  public element: HTMLElement;
  public header: HTMLElement;
  public content: HTMLElement;
  
  private isDragging: boolean = false;
  private isResizing: boolean = false;
  private startPos: { x: number; y: number } = { x: 0, y: 0 };
  private startSize: { w: number; h: number } = { w: 0, h: 0 };
  private onCloseCallback?: () => void;

  constructor(config: PanelConfig) {
    this.id = config.id;
    
    this.element = document.createElement('div');
    this.element.className = 'liquid-panel';
    this.element.id = `panel-${config.id}`;
    this.element.style.cssText = `
      position: fixed;
      left: ${config.position?.x || 100}px;
      top: ${config.position?.y || 100}px;
      width: ${config.width || 400}px;
      min-height: ${config.height || 200}px;
      background: rgba(18, 18, 26, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      overflow: hidden;
      z-index: 1000;
      animation: panelAppear 0.3s ease-out;
      transform-origin: top left;
    `;

    // Header
    this.header = document.createElement('div');
    this.header.className = 'panel-header';
    this.header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      cursor: ${config.draggable !== false ? 'move' : 'default'};
      user-select: none;
    `;

    const titleEl = document.createElement('h3');
    titleEl.textContent = config.title || 'Panel';
    titleEl.style.cssText = `
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.5px;
    `;

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 8px;';

    if (config.closable !== false) {
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        width: 24px;
        height: 24px;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: #a0a0b0;
        border-radius: 6px;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        transition: all 0.2s;
      `;
      closeBtn.onmouseenter = () => {
        closeBtn.style.background = 'rgba(255, 82, 82, 0.3)';
        closeBtn.style.color = '#fff';
      };
      closeBtn.onmouseleave = () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        closeBtn.style.color = '#a0a0b0';
      };
      closeBtn.onclick = () => this.close();
      controls.appendChild(closeBtn);
    }

    this.header.appendChild(titleEl);
    this.header.appendChild(controls);

    // Content
    this.content = document.createElement('div');
    this.content.className = 'panel-content';
    this.content.innerHTML = config.content || '';
    this.content.style.cssText = `
      padding: 16px;
      color: #e0e0e0;
      font-size: 13px;
      line-height: 1.6;
      max-height: 400px;
      overflow-y: auto;
    `;

    // Resize handle
    if (config.resizable !== false) {
      const resizeHandle = document.createElement('div');
      resizeHandle.style.cssText = `
        position: absolute;
        right: 0;
        bottom: 0;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 50%, rgba(0, 245, 255, 0.3) 50%);
        border-radius: 0 0 16px 0;
      `;
      this.element.appendChild(resizeHandle);
      this.initResize(resizeHandle);
    }

    this.element.appendChild(this.header);
    this.element.appendChild(this.content);

    if (config.draggable !== false) {
      this.initDrag();
    }

    // Glow effect
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      height: 1px;
      background: linear-gradient(90deg, 
        transparent, 
        rgba(0, 245, 255, 0.5), 
        rgba(139, 92, 246, 0.5), 
        rgba(255, 0, 255, 0.5), 
        transparent
      );
      pointer-events: none;
    `;
    this.element.appendChild(glow);
  }

  private initDrag(): void {
    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      
      this.isDragging = true;
      this.startPos = { x: e.clientX, y: e.clientY };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      
      const dx = e.clientX - this.startPos.x;
      const dy = e.clientY - this.startPos.y;
      
      const newX = this.element.offsetLeft + dx;
      const newY = this.element.offsetTop + dy;
      
      this.element.style.left = `${newX}px`;
      this.element.style.top = `${newY}px`;
      
      this.startPos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    this.header.addEventListener('mousedown', onMouseDown);
  }

  private initResize(handle: HTMLElement): void {
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      this.isResizing = true;
      this.startSize = { 
        w: this.element.offsetWidth, 
        h: this.element.offsetHeight 
      };
      this.startPos = { x: e.clientX, y: e.clientY };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isResizing) return;
      
      const dx = e.clientX - this.startPos.x;
      const dy = e.clientY - this.startPos.y;
      
      const newW = Math.max(200, this.startSize.w + dx);
      const newH = Math.max(100, this.startSize.h + dy);
      
      this.element.style.width = `${newW}px`;
      this.element.style.height = `${newH}px`;
    };

    const onMouseUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    handle.addEventListener('mousedown', onMouseDown);
  }

  public setContent(html: string): void {
    this.content.innerHTML = html;
  }

  public appendContent(element: HTMLElement): void {
    this.content.appendChild(element);
  }

  public setTitle(title: string): void {
    const titleEl = this.header.querySelector('h3');
    if (titleEl) titleEl.textContent = title;
  }

  public show(): void {
    this.element.style.display = 'block';
    this.element.style.animation = 'panelAppear 0.3s ease-out';
  }

  public hide(): void {
    this.element.style.display = 'none';
  }

  public close(): void {
    this.element.style.animation = 'panelDisappear 0.3s ease-out';
    setTimeout(() => {
      this.element.remove();
      if (this.onCloseCallback) this.onCloseCallback();
    }, 300);
  }

  public onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }

  public focus(): void {
    // Bring to front
    const panels = document.querySelectorAll('.liquid-panel');
    panels.forEach(p => (p as HTMLElement).style.zIndex = '999');
    this.element.style.zIndex = '1000';
    
    // Add focus glow
    this.element.style.boxShadow = `
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 0 30px rgba(0, 245, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `;
  }

  public mount(container?: HTMLElement): void {
    (container || document.body).appendChild(this.element);
  }
}

// Button Component
export class GlassButton {
  public element: HTMLButtonElement;

  constructor(config: {
    text: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    onClick?: () => void;
  }) {
    const variants = {
      primary: `
        background: linear-gradient(135deg, #00f5ff 0%, #8b5cf6 100%);
        color: #0a0a0f;
        border: none;
      `,
      secondary: `
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.1);
      `,
      ghost: `
        background: transparent;
        color: #a0a0b0;
        border: 1px solid rgba(255, 255, 255, 0.1);
      `
    };

    const sizes = {
      small: 'padding: 6px 12px; font-size: 12px;',
      medium: 'padding: 10px 20px; font-size: 14px;',
      large: 'padding: 14px 28px; font-size: 16px;'
    };

    this.element = document.createElement('button');
    this.element.textContent = config.text;
    this.element.style.cssText = `
      ${variants[config.variant || 'secondary']}
      ${sizes[config.size || 'medium']}
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    `;

    this.element.onmouseenter = () => {
      this.element.style.transform = 'translateY(-2px)';
      this.element.style.boxShadow = '0 4px 20px rgba(0, 245, 255, 0.3)';
    };

    this.element.onmouseleave = () => {
      this.element.style.transform = 'translateY(0)';
      this.element.style.boxShadow = 'none';
    };

    if (config.onClick) {
      this.element.onclick = config.onClick;
    }
  }

  public mount(container: HTMLElement): void {
    container.appendChild(this.element);
  }
}

// Input Component
export class GlassInput {
  public element: HTMLInputElement;

  constructor(config: {
    placeholder?: string;
    type?: string;
    value?: string;
    onInput?: (value: string) => void;
  }) {
    this.element = document.createElement('input');
    this.element.type = config.type || 'text';
    this.element.placeholder = config.placeholder || '';
    this.element.value = config.value || '';
    this.element.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
      backdrop-filter: blur(10px);
    `;

    this.element.onfocus = () => {
      this.element.style.borderColor = 'rgba(0, 245, 255, 0.5)';
      this.element.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.2)';
    };

    this.element.onblur = () => {
      this.element.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      this.element.style.boxShadow = 'none';
    };

    if (config.onInput) {
      this.element.oninput = () => config.onInput!(this.element.value);
    }
  }

  public getValue(): string {
    return this.element.value;
  }

  public setValue(value: string): void {
    this.element.value = value;
  }

  public mount(container: HTMLElement): void {
    container.appendChild(this.element);
  }
}

// Card Component
export class GlassCard {
  public element: HTMLElement;

  constructor(config: {
    title?: string;
    content?: string;
    icon?: string;
    onClick?: () => void;
  }) {
    this.element = document.createElement('div');
    this.element.style.cssText = `
      background: rgba(26, 26, 37, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s ease;
      cursor: ${config.onClick ? 'pointer' : 'default'};
    `;

    if (config.icon) {
      const icon = document.createElement('div');
      icon.textContent = config.icon;
      icon.style.cssText = `
        font-size: 32px;
        margin-bottom: 16px;
      `;
      this.element.appendChild(icon);
    }

    if (config.title) {
      const title = document.createElement('h4');
      title.textContent = config.title;
      title.style.cssText = `
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 600;
        color: #fff;
      `;
      this.element.appendChild(title);
    }

    if (config.content) {
      const content = document.createElement('p');
      content.textContent = config.content;
      content.style.cssText = `
        margin: 0;
        color: #a0a0b0;
        font-size: 13px;
        line-height: 1.5;
      `;
      this.element.appendChild(content);
    }

    if (config.onClick) {
      this.element.onclick = config.onClick;
      
      this.element.onmouseenter = () => {
        this.element.style.transform = 'translateY(-4px)';
        this.element.style.borderColor = 'rgba(0, 245, 255, 0.3)';
        this.element.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3)';
      };

      this.element.onmouseleave = () => {
        this.element.style.transform = 'translateY(0)';
        this.element.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        this.element.style.boxShadow = 'none';
      };
    }
  }

  public mount(container: HTMLElement): void {
    container.appendChild(this.element);
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes panelAppear {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  @keyframes panelDisappear {
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to {
      opacity: 0;
      transform: scale(0.9) translateY(20px);
    }
  }
  
  .panel-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .panel-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  
  .panel-content::-webkit-scrollbar-thumb {
    background: rgba(0, 245, 255, 0.3);
    border-radius: 3px;
  }
  
  .panel-content::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 245, 255, 0.5);
  }
`;
document.head.appendChild(style);
