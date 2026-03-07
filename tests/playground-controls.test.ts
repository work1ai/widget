import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockWebSocket } from '../playground/mock-ws.ts';

// Import to register the custom element
import '../playground/controls.ts';
import type { PlaygroundControls } from '../playground/controls.ts';

/**
 * Create a mock widget element that stubs setAttribute, style.setProperty, etc.
 */
function createMockWidget() {
  const el = document.createElement('div');

  // Spy on setAttribute / removeAttribute
  const setAttrSpy = vi.spyOn(el, 'setAttribute');
  const removeAttrSpy = vi.spyOn(el, 'removeAttribute');

  // Spy on style.setProperty / style.removeProperty
  const setPropSpy = vi.spyOn(el.style, 'setProperty');
  const removePropSpy = vi.spyOn(el.style, 'removeProperty');

  // Add widget-specific properties
  (el as any)._wsConstructor = MockWebSocket;
  (el as any).handleNewConversation = vi.fn();

  return {
    el: el as any,
    setAttribute: setAttrSpy,
    removeAttribute: removeAttrSpy,
    setProperty: setPropSpy,
    removeProperty: removePropSpy,
    handleNewConversation: (el as any).handleNewConversation,
  };
}

/**
 * Helper to query inside shadow DOM.
 */
function shadowQuery(controls: PlaygroundControls, selector: string): HTMLElement | null {
  return controls.shadowRoot!.querySelector(selector);
}

function shadowQueryAll(controls: PlaygroundControls, selector: string): NodeListOf<HTMLElement> {
  return controls.shadowRoot!.querySelectorAll(selector);
}

describe('PlaygroundControls', () => {
  let controls: PlaygroundControls;
  let mock: ReturnType<typeof createMockWidget>;

  beforeEach(async () => {
    mock = createMockWidget();
    controls = document.createElement('playground-controls') as PlaygroundControls;
    controls.widgetEl = mock.el;
    document.body.appendChild(controls);
    await controls.updateComplete;
  });

  afterEach(() => {
    controls.remove();
    vi.restoreAllMocks();
    MockWebSocket.instance = null;
  });

  // --- CTRL-01: Theme Colors ---

  describe('Theme Colors (CTRL-01)', () => {
    it('should set --w1-accent-color on widget via style.setProperty', async () => {
      const colorInputs = shadowQueryAll(controls, 'input[type="color"]');
      expect(colorInputs.length).toBeGreaterThanOrEqual(2);

      // First color input is --w1-accent-color
      const accentInput = colorInputs[0] as HTMLInputElement;
      accentInput.value = '#ff0000';
      accentInput.dispatchEvent(new Event('input', { bubbles: true }));
      await controls.updateComplete;

      expect(mock.setProperty).toHaveBeenCalledWith('--w1-accent-color', '#ff0000');
    });

    it('should set --w1-panel-bg on widget via style.setProperty', async () => {
      const colorInputs = shadowQueryAll(controls, 'input[type="color"]');

      // Second color input is --w1-panel-bg
      const panelBgInput = colorInputs[1] as HTMLInputElement;
      panelBgInput.value = '#222222';
      panelBgInput.dispatchEvent(new Event('input', { bubbles: true }));
      await controls.updateComplete;

      expect(mock.setProperty).toHaveBeenCalledWith('--w1-panel-bg', '#222222');
    });
  });

  // --- CTRL-02: Theme Position ---

  describe('Theme Position (CTRL-02)', () => {
    it('should set position attribute to bottom-left when radio selected', async () => {
      const radios = shadowQueryAll(controls, 'input[type="radio"][name="position"]');
      const bottomLeftRadio = Array.from(radios).find(
        (r) => (r as HTMLInputElement).value === 'bottom-left'
      ) as HTMLInputElement;
      expect(bottomLeftRadio).toBeTruthy();

      bottomLeftRadio.click();
      await controls.updateComplete;

      expect(mock.setAttribute).toHaveBeenCalledWith('position', 'bottom-left');
    });
  });

  // --- CTRL-03: Theme Dimensions ---

  describe('Theme Dimensions (CTRL-03)', () => {
    it('should set width attribute on widget when slider changes', async () => {
      const rangeInputs = shadowQueryAll(controls, 'input[type="range"]');
      // First range is width
      const widthSlider = rangeInputs[0] as HTMLInputElement;

      // We need to use the native value setter to trigger Lit's .value binding
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!;
      nativeInputValueSetter.call(widthSlider, '400');
      widthSlider.dispatchEvent(new Event('input', { bubbles: true }));
      await controls.updateComplete;

      expect(mock.setAttribute).toHaveBeenCalledWith('width', '400px');
    });

    it('should set height attribute on widget when slider changes', async () => {
      const rangeInputs = shadowQueryAll(controls, 'input[type="range"]');
      // Second range is height
      const heightSlider = rangeInputs[1] as HTMLInputElement;

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!;
      nativeInputValueSetter.call(heightSlider, '600');
      heightSlider.dispatchEvent(new Event('input', { bubbles: true }));
      await controls.updateComplete;

      expect(mock.setAttribute).toHaveBeenCalledWith('height', '600px');
    });
  });

  // --- CTRL-04: Bubble Icon ---

  describe('Bubble Icon (CTRL-04)', () => {
    it('should set bubble-icon attribute on widget when text input changes', async () => {
      // The bubble icon input is a text input with placeholder containing "help-circle"
      const textInputs = shadowQueryAll(controls, 'input[type="text"]');
      const bubbleInput = Array.from(textInputs).find(
        (el) => (el as HTMLInputElement).placeholder?.includes('help-circle')
      ) as HTMLInputElement;
      expect(bubbleInput).toBeTruthy();

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!;
      nativeInputValueSetter.call(bubbleInput, 'bot');
      bubbleInput.dispatchEvent(new Event('input', { bubbles: true }));
      await controls.updateComplete;

      expect(mock.setAttribute).toHaveBeenCalledWith('bubble-icon', 'bot');
    });
  });

  // --- CONN-02: Connection Toggle ---

  describe('Connection Toggle (CONN-02)', () => {
    it('should set _wsConstructor to undefined and call handleNewConversation when switching to real mode', async () => {
      // Controls start in mock mode. The checkbox is checked = real mode.
      const toggleCheckbox = shadowQuery(controls, '.toggle-switch input[type="checkbox"]') as HTMLInputElement;
      expect(toggleCheckbox).toBeTruthy();

      // Click to toggle to real mode
      toggleCheckbox.click();
      await controls.updateComplete;

      expect(mock.el._wsConstructor).toBeUndefined();
      expect(mock.handleNewConversation).toHaveBeenCalled();
    });

    it('should set _wsConstructor to MockWebSocket when switching back to mock mode', async () => {
      // First switch to real
      const toggleCheckbox = shadowQuery(controls, '.toggle-switch input[type="checkbox"]') as HTMLInputElement;
      toggleCheckbox.click();
      await controls.updateComplete;

      mock.handleNewConversation.mockClear();

      // Switch back to mock
      toggleCheckbox.click();
      await controls.updateComplete;

      expect(mock.el._wsConstructor).toBe(MockWebSocket);
      expect(mock.handleNewConversation).toHaveBeenCalled();
    });
  });

  // --- CONN-01: WebSocket URL ---

  describe('WebSocket URL (CONN-01)', () => {
    it('should set server-url attribute when URL entered in real mode', async () => {
      // Switch to real mode first
      const toggleCheckbox = shadowQuery(controls, '.toggle-switch input[type="checkbox"]') as HTMLInputElement;
      toggleCheckbox.click();
      await controls.updateComplete;

      mock.setAttribute.mockClear();

      // Find URL text input (visible only in real mode)
      const urlInput = shadowQuery(controls, '.url-input input[type="text"]') as HTMLInputElement;
      expect(urlInput).toBeTruthy();

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!;
      nativeInputValueSetter.call(urlInput, 'ws://localhost:9090');
      urlInput.dispatchEvent(new Event('change', { bubbles: true }));
      await controls.updateComplete;

      expect(mock.setAttribute).toHaveBeenCalledWith('server-url', 'ws://localhost:9090');
    });
  });

  // --- MOCK-06: Scenario Buttons ---

  describe('Scenario Buttons (MOCK-06)', () => {
    it('should call triggerScenario with correct name when scenario buttons clicked', async () => {
      // Set up MockWebSocket.instance with triggerScenario spy
      const mockInstance = { triggerScenario: vi.fn() } as any;
      MockWebSocket.instance = mockInstance;

      const scenarioButtons = shadowQueryAll(controls, '.scenario-btn');
      expect(scenarioButtons.length).toBe(6);

      const expectedScenarios = [
        'greeting',
        'long-markdown',
        'error-protocol',
        'error-rejected',
        'error-disconnect',
        'session-end',
      ];

      for (let i = 0; i < expectedScenarios.length; i++) {
        mockInstance.triggerScenario.mockClear();
        scenarioButtons[i].click();
        expect(mockInstance.triggerScenario).toHaveBeenCalledWith(expectedScenarios[i]);
      }
    });
  });

  // --- Scenario Disabled State ---

  describe('Scenario Disabled State', () => {
    it('should disable scenario buttons when mockMode is false', async () => {
      // Switch to real mode to disable scenarios
      controls.mockMode = false;
      await controls.updateComplete;

      const scenarioButtons = shadowQueryAll(controls, '.scenario-btn');
      for (const btn of Array.from(scenarioButtons)) {
        expect((btn as HTMLButtonElement).disabled).toBe(true);
      }
    });
  });

  // --- Connection Status ---

  describe('Connection Status', () => {
    it('should update connectionStatus to connected on w1-connected event', async () => {
      controls.setupWidgetListeners();

      mock.el.dispatchEvent(new CustomEvent('w1-connected'));
      expect(controls.connectionStatus).toBe('connected');
    });

    it('should update connectionStatus to disconnected on w1-disconnected event', async () => {
      controls.setupWidgetListeners();

      mock.el.dispatchEvent(new CustomEvent('w1-disconnected'));
      expect(controls.connectionStatus).toBe('disconnected');
    });
  });

  // --- Theme Reset ---

  describe('Theme Reset', () => {
    it('should remove CSS custom properties and attributes when reset clicked', async () => {
      // First set a color to have something to reset
      const colorInputs = shadowQueryAll(controls, 'input[type="color"]');
      (colorInputs[0] as HTMLInputElement).value = '#ff0000';
      colorInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      await controls.updateComplete;

      mock.removeProperty.mockClear();
      mock.removeAttribute.mockClear();

      // Click reset button
      const resetBtn = shadowQuery(controls, '.reset-btn') as HTMLButtonElement;
      expect(resetBtn).toBeTruthy();
      resetBtn.click();
      await controls.updateComplete;

      // Should have removed all 10 CSS custom properties
      expect(mock.removeProperty).toHaveBeenCalledWith('--w1-accent-color');
      expect(mock.removeProperty).toHaveBeenCalledWith('--w1-panel-bg');

      // Should have removed position, width, height, bubble-icon attributes
      expect(mock.removeAttribute).toHaveBeenCalledWith('position');
      expect(mock.removeAttribute).toHaveBeenCalledWith('width');
      expect(mock.removeAttribute).toHaveBeenCalledWith('height');
      expect(mock.removeAttribute).toHaveBeenCalledWith('bubble-icon');
    });
  });
});
