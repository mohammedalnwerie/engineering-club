// Silent Sound Engine (Peaceful, distraction-free UX)
class SoundEngine {
  public toggleMute(): boolean { return true; }
  public getMuted(): boolean { return true; }
  public playClick() {}
  public playHover() {}
  public playSuccess() {}
  public playError() {}
  public playTyping() {}
  public playModalOpen() {}
}

export const sound = new SoundEngine();
