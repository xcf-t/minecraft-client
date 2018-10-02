export declare type StepCallback = () => void;
export declare type ProgressCallback = (progress: number) => void;
export declare class InstallationProgress {
    stepCallback: StepCallback;
    progressCallback: ProgressCallback;
    private constructor();
    call(progress: number): void;
    step(): void;
    static callback(step?: StepCallback, progress?: ProgressCallback): InstallationProgress;
}
