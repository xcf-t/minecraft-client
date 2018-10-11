"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InstallationProgress {
    constructor(stepCallback, progressCallback) {
        this.stepCallback = stepCallback;
        this.progressCallback = progressCallback;
    }
    call(progress) {
        if (this.progressCallback)
            this.progressCallback(progress);
    }
    step(currentStep) {
        if (this.stepCallback)
            this.stepCallback(currentStep);
        this.call(0);
    }
    static callback(step, progress) {
        return new InstallationProgress(step, progress);
    }
}
exports.InstallationProgress = InstallationProgress;
//# sourceMappingURL=InstallationProgress.js.map