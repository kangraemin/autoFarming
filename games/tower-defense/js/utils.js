// Shared utility functions

/**
 * Returns the base tower type string (e.g. 'arrow', 'cannon').
 * Works for both normal and fused towers.
 */
function getTowerBaseType(tower) {
  return tower.fusedSpec ? tower.fusedSpec.baseType : tower.type;
}
