const toolGroupIds = {
  default: 'ecg-default',
};

function initToolGroups(toolNames, Enums, toolGroupService, commandsManager, servicesManager) {
  const tools = {
    active: [
      {
        toolName: toolNames.WindowLevel,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }, { numTouchPoints: 2 }],
      },
      {
        toolName: toolNames.StackScroll,
        bindings: [{ mouseButton: Enums.MouseBindings.Wheel }, { numTouchPoints: 3 }],
      },
    ],
    passive: [
      { toolName: toolNames.Length },
      { toolName: toolNames.Bidirectional },
      { toolName: toolNames.ArrowAnnotate },
      { toolName: toolNames.EllipticalROI },
      { toolName: toolNames.RectangleROI },
      { toolName: toolNames.CircleROI },
      { toolName: toolNames.Angle },
      { toolName: toolNames.Probe },
      { toolName: toolNames.StackScroll },
      { toolName: toolNames.Magnify },
    ],
    enabled: [],
    disabled: [],
  };

  const toolGroupId = toolGroupIds.default;

  toolGroupService.createToolGroupAndAddTools(toolGroupId, tools);
}

export default initToolGroups;
export { toolGroupIds };
