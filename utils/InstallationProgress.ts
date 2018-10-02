export declare type StepCallback = () => void;
export declare type ProgressCallback = (progress: number) => void;

export class InstallationProgress {

    stepCallback: StepCallback;
    progressCallback: ProgressCallback;

    private constructor(stepCallback: StepCallback, progressCallback: ProgressCallback) {
        this.stepCallback = stepCallback;
        this.progressCallback = progressCallback;
    }

    public call(progress: number): void {
        if(this.progressCallback)
            this.progressCallback(progress);
    }

    public step(): void {
        if(this.stepCallback)
            this.stepCallback();
        this.call(0);
    }

    public static callback(step?: StepCallback, progress?: ProgressCallback): InstallationProgress {
        return new InstallationProgress(step, progress);
    }

}