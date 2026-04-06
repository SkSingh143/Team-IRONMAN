// src/components/canvas/Toolbar.jsx
import useUIStore from '../../store/uiStore';
import '../../styles/canvas.css';

const PRESET_COLORS = [
  '#FFFFFF', '#FF6B6B', '#FFA94D', '#FFD43B',
  '#69DB7C', '#4DABF7', '#9775FA', '#F783AC',
  '#868E96', '#20C997', '#339AF0', '#E64980',
];

const SIZES = [1, 2, 3, 5, 8, 12];

export default function Toolbar() {
  const { activeTool, activeColor, lineWidth, setTool, setColor, setLineWidth } = useUIStore();

  return (
    <div className="canvas-toolbar" id="canvas-toolbar">
      {/* Tool Selection */}
      <div className="toolbar-section">
        <div className="toolbar-section-label">Tool</div>
        <div className="tool-group">
          <button
            className={`tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
            id="tool-pen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
            </svg>
          </button>
          <button
            className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
            id="tool-eraser"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.8 1.4c.8-.8 2-.8 2.8 0L21.2 5c.8.8.8 2 0 2.8L10 19" />
            </svg>
          </button>
        </div>
      </div>

      {/* Color Palette */}
      <div className="toolbar-section">
        <div className="toolbar-section-label">Color</div>
        <div className="color-grid">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              className={`color-swatch ${activeColor === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>
        <div className="color-custom">
          <input
            type="color"
            value={activeColor}
            onChange={(e) => setColor(e.target.value)}
            className="color-input"
            title="Custom color"
            id="custom-color-input"
          />
          <span className="color-hex">{activeColor}</span>
        </div>
      </div>

      {/* Stroke Size */}
      <div className="toolbar-section">
        <div className="toolbar-section-label">Size</div>
        <div className="size-group">
          {SIZES.map(s => (
            <button
              key={s}
              className={`size-btn ${lineWidth === s ? 'active' : ''}`}
              onClick={() => setLineWidth(s)}
              title={`${s}px`}
            >
              <span
                className="size-preview"
                style={{
                  width: Math.min(s * 2.5, 24) + 'px',
                  height: Math.min(s * 2.5, 24) + 'px',
                }}
              />
            </button>
          ))}
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="size-slider"
          id="line-width-slider"
        />
      </div>
    </div>
  );
}
