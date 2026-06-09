import { InputState } from './types';

// A single mutable input snapshot shared between the input sources (on-screen
// touch controls, keyboard on web) and the game loop. Mutating in place avoids
// per-frame allocation and React re-renders on the hot path.
export const input: InputState = {
  steer: 0,
  throttle: 0,
  brake: 0,
  nitro: false,
  stunt: false,
};

export const resetInput = (): void => {
  input.steer = 0;
  input.throttle = 0;
  input.brake = 0;
  input.nitro = false;
  input.stunt = false;
};

// Camera toggle is edge-triggered, so it lives outside the continuous InputState.
let cameraToggleRequested = false;
export const requestCameraToggle = (): void => {
  cameraToggleRequested = true;
};
export const consumeCameraToggle = (): boolean => {
  if (cameraToggleRequested) {
    cameraToggleRequested = false;
    return true;
  }
  return false;
};
