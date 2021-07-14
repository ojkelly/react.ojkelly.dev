/* eslint-disable react/prop-types */

import React, { useState } from "react";
import {
  render,
  screen,
  fireEvent,
  configure,
  act,
} from "@testing-library/react";

import { useSteps, StepProps } from "./usesteps";

configure({ testIdAttribute: "data-test-id" });

describe("useSteps", () => {
  test("Linear progression", async () => {
    type Steps = "one" | "two" | "three" | "four";
    type State = { user: { userID: string } };
    type StepComponent = React.FunctionComponent<StepProps<Steps, State>>;
    const testIds = {
      app: "app",
      step: "step",
      next: "next",
    } as const;

    const StepOne: StepComponent = ({ transitionTo, state }) => (
      <div>
        <div data-test-id={testIds.step}>Step One</div>
        <button
          data-test-id={testIds.next}
          onClick={() => {
            transitionTo("two", state);
          }}
        >
          Next
        </button>
      </div>
    );

    const StepTwo: StepComponent = ({ transitionTo, state }) => (
      <div>
        <div data-test-id={testIds.step}>Step Two</div>
        <button
          data-test-id={testIds.next}
          onClick={() => transitionTo("three", state)}
        >
          Next
        </button>
      </div>
    );

    const StepThree: StepComponent = ({ transitionTo, state }) => (
      <div>
        <div data-test-id={testIds.step}>Step Three</div>
        <button
          data-test-id={testIds.next}
          onClick={() => transitionTo("four", state)}
        >
          Next
        </button>
      </div>
    );

    const StepFour: StepComponent = ({ transitionTo, state }) => (
      <div>
        <div data-test-id={testIds.step}>Step Four</div>
        <button
          data-test-id={testIds.next}
          onClick={() => transitionTo("one", state)}
        >
          Next
        </button>
      </div>
    );

    const Journey = (): React.ReactElement => {
      const [state, setState] = useState<State>({
        user: { userID: "test" },
      });

      const { Step, transitionTo } = useSteps<Steps, State>({
        initialStep: "one",
        transitions: [
          {
            from: "one",
            to: "two",
            guard: (state) => state.user.userID === "test",
          },
          {
            from: "two",
            to: "three",
            guard: (state) => state.user.userID === "test",
          },
          {
            from: "three",
            to: "four",
            guard: (state) => state.user.userID === "test",
          },
          {
            from: "four",
            to: "one",
            guard: (state) => state.user.userID === "test",
          },
        ],
        components: {
          one: StepOne,
          two: StepTwo,
          three: StepThree,
          four: StepFour,
        },
      });

      return (
        <div data-test-id={testIds.app}>
          <Step transitionTo={transitionTo} state={state} setState={setState} />
        </div>
      );
    };

    render(<Journey />);

    const app = await screen.findAllByTestId(testIds.step);

    expect(app).not.toBeNull();

    expect(screen.getByTestId(testIds.step)).toHaveTextContent("Step One");

    act(() => {
      fireEvent.click(screen.getByTestId(testIds.next));
    });

    expect(screen.getByTestId(testIds.step)).toHaveTextContent("Step Two");

    act(() => {
      fireEvent.click(screen.getByTestId(testIds.next));
    });

    expect(screen.getByTestId(testIds.step)).toHaveTextContent("Step Three");

    act(() => {
      fireEvent.click(screen.getByTestId(testIds.next));
    });

    expect(screen.getByTestId(testIds.step)).toHaveTextContent("Step Four");

    act(() => {
      fireEvent.click(screen.getByTestId(testIds.next));
    });

    expect(screen.getByTestId(testIds.step)).toHaveTextContent("Step One");
  });
});
