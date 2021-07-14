import { useCallback, useState } from "react";

type StepProps<S extends string, State extends unknown> = {
  transitionTo(nextStep: S, args: State);
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
};

function useSteps<S extends string, State extends unknown>({
  initialStep,
  transitions,
  components,
}: {
  initialStep: S;

  readonly transitions: {
    from: S;
    to: S;
    guard: (args: State) => boolean;
  }[];

  components: {
    [key in S]: React.FunctionComponent<StepProps<S, State>>;
  };
}): {
  Step: React.FunctionComponent<StepProps<S, State>>;
  transitionTo: (nextStep: S, state: State) => void;
} {
  const [currentStep, setCurrentStep] = useState<S>(initialStep);

  const validateTransition = (from: S, to: S, state: State): boolean => {
    const isTransitionValid = transitions
      .filter((t) => t.from === from && t.to === to)
      .map((t) => t.guard(state))
      .some((v) => v === true);

    return isTransitionValid;
  };

  const transitionTo = useCallback(
    (nextStep: S, state: State) => {
      const canTransition = validateTransition(currentStep, nextStep, state);

      if (canTransition) {
        setCurrentStep(nextStep);
      }
    },
    [currentStep]
  );

  const Step: React.FunctionComponent<StepProps<S, State>> =
    components[currentStep];

  return {
    Step,
    transitionTo,
  };
}

export { useSteps, StepProps };
